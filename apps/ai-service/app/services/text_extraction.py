"""
Extracts and normalizes raw text from uploaded documents (offer letters, agreements).

Supports:
  - `.txt`, `.md` — read directly
  - `.pdf` — try embedded text first (pypdf); if a page has no extractable
    text (i.e. it's a scanned image), fall back to Tesseract OCR (pdf2image + tesseract).
    If Tesseract fails or produces unusable output, fall back to Google Vision OCR if configured.
  - image types (`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.tiff`) — Tesseract OCR directly
    with Google Vision fallback.
"""
from __future__ import annotations

import io
import logging
import re
from typing import Any
import unicodedata

logger = logging.getLogger(__name__)

_TEXT_EXTENSIONS = {".txt", ".md"}
_PDF_EXTENSIONS = {".pdf"}
_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}

SUPPORTED_EXTENSIONS = _TEXT_EXTENSIONS | _PDF_EXTENSIONS | _IMAGE_EXTENSIONS

# Quality threshold: minimum characters of alphabetic/numeric text before considering OCR successful
MIN_OCR_QUALITY_CHARS = 25


class UnsupportedFileTypeError(ValueError):
    pass


def normalize_text(text: str) -> str:
    """Normalizes extracted text while preserving critical document content.

    - Normalizes Unicode characters (NFKC)
    - Normalizes line endings to Unix '\n'
    - Cleans non-breaking / zero-width spaces
    - Collapses repeated horizontal whitespace
    - Removes isolated unprintable OCR artifacts while strictly preserving
      dates, emails, URLs, names, monetary figures ($ / Tk / BDT / £ / €), and punctuation.
    - Limits consecutive blank lines to 2.
    """
    if not text:
        return ""

    # 1. Normalize Unicode composition
    normalized = unicodedata.normalize("NFKC", text)

    # 2. Normalize line endings
    normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")

    # 3. Clean special whitespace (non-breaking spaces, zero-width spaces, soft hyphens)
    normalized = normalized.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "").replace("\xad", "")

    # 4. Collapse repeated horizontal spaces/tabs per line
    lines: list[str] = []
    for line in normalized.split("\n"):
        # Strip unprintable control chars except tabs/newlines
        cleaned_line = "".join(ch for ch in line if ch >= " " or ch in "\t\n")
        cleaned_line = re.sub(r"[ \t]+", " ", cleaned_line).strip()
        lines.append(cleaned_line)

    cleaned_text = "\n".join(lines)

    # 5. Limit excessive blank lines (max 2 consecutive newlines)
    cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text)

    return cleaned_text.strip()


def extract_text(filename: str, content: bytes, normalize: bool = False) -> str:
    """Best-effort text extraction. Never raises for OCR failures on individual
    pages/images — returns whatever text could be recovered (possibly empty).

    If `normalize=True`, applies `normalize_text` before returning.
    """
    ext = _extension(filename)

    if ext in _TEXT_EXTENSIONS:
        raw_text = content.decode("utf-8", errors="replace")
        return normalize_text(raw_text) if normalize else raw_text

    if ext in _PDF_EXTENSIONS:
        raw_text = _extract_pdf_text(content)
        return normalize_text(raw_text) if normalize else raw_text

    if ext in _IMAGE_EXTENSIONS:
        raw_text = _ocr_image_bytes(content)
        return normalize_text(raw_text) if normalize else raw_text

    raise UnsupportedFileTypeError(
        f"Unsupported file type '{ext}'. Supported: {sorted(SUPPORTED_EXTENSIONS)}"
    )


def extract_normalized_text(filename: str, content: bytes) -> str:
    """Convenience helper to extract and normalize text in one step."""
    return extract_text(filename, content, normalize=True)


def _extension(filename: str) -> str:
    name = (filename or "").lower()
    if "." not in name:
        return ""
    return "." + name.rsplit(".", 1)[-1]


def _extract_pdf_text(content: bytes) -> str:
    text_parts: list[str] = []
    needs_ocr = False

    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        for page in reader.pages:
            page_text = (page.extract_text() or "").strip()
            if page_text:
                text_parts.append(page_text)
            else:
                needs_ocr = True
    except Exception:
        logger.exception("pypdf text extraction failed; will attempt full-document OCR / text stream recovery")
        needs_ocr = True
        text_parts = []

    combined_embedded = "\n".join(text_parts).strip()

    # If embedded text is sufficient and no missing pages, return immediately
    if combined_embedded and not needs_ocr:
        return combined_embedded

    # Fallback: OCR the PDF pages (covers scanned documents and pypdf failures)
    ocr_text = _ocr_pdf_bytes(content)
    combined = "\n".join([combined_embedded, ocr_text] if combined_embedded and ocr_text else ([combined_embedded] if combined_embedded else [ocr_text]))
    
    if combined.strip():
        return combined.strip()

    # Direct stream extraction fallback (handles test PDFs when pypdf/tesseract is absent)
    try:
        raw_str = content.decode("latin-1", errors="ignore")
        stream_matches = re.findall(r"\(([^)]+)\)\s*Tj", raw_str)
        if stream_matches:
            return "\n".join(stream_matches).strip()
    except Exception:
        pass

    return ""


def _ocr_pdf_bytes(content: bytes) -> str:
    images: list[Any] = []
    try:
        from pdf2image import convert_from_bytes
        images = convert_from_bytes(content)
    except Exception:
        logger.warning("pdf2image conversion failed (poppler-utils may not be installed or file is corrupt)")

    if not images:
        return ""

    pages_text: list[str] = []
    for img in images:
        page_t = _ocr_pil_image_with_fallback(img)
        if page_t:
            pages_text.append(page_t)

    return "\n".join(pages_text).strip()


def _ocr_image_bytes(content: bytes) -> str:
    try:
        from PIL import Image
        image = Image.open(io.BytesIO(content))
        return _ocr_pil_image_with_fallback(image, raw_bytes=content)
    except Exception:
        logger.exception("Opening image bytes failed")
        # Try direct Google Vision with raw bytes if PIL failed
        from app.services.vision_ocr import extract_text_google_vision_sync
        return extract_text_google_vision_sync(content) or ""


def _ocr_pil_image_with_fallback(image: Any, raw_bytes: bytes | None = None) -> str:
    """Runs Tesseract OCR as the primary engine. If Tesseract fails, is missing,
    or yields insufficient text (< MIN_OCR_QUALITY_CHARS), attempts Google Vision fallback.
    """
    tesseract_text: str = ""
    try:
        import pytesseract
        tesseract_text = str(pytesseract.image_to_string(image) or "")
    except Exception:
        logger.warning("Tesseract OCR execution failed or Tesseract is not installed locally")

    cleaned = tesseract_text.strip()
    if len(re.sub(r"\s+", "", cleaned)) >= MIN_OCR_QUALITY_CHARS:
        return cleaned

    # Attempt Google Vision fallback if Tesseract output is empty or poor
    try:
        from app.services.vision_ocr import extract_text_google_vision_sync

        if raw_bytes is None:
            buf = io.BytesIO()
            image.save(buf, format="PNG")
            raw_bytes = buf.getvalue()

        vision_text = extract_text_google_vision_sync(raw_bytes)
        if vision_text and vision_text.strip():
            logger.info("Successfully recovered text via Google Vision OCR fallback")
            return vision_text.strip()
    except Exception:
        logger.warning("Google Vision fallback attempt failed")

    return cleaned
