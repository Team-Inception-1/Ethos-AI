"""
Extracts raw text from an uploaded agreement file.

Supports:
  - `.txt` — read directly
  - `.pdf` — try embedded text first (pypdf); if a page has no extractable
    text (i.e. it's a scanned image), fall back to OCR (pdf2image + tesseract)
  - image types (`.png`, `.jpg`, `.jpeg`, `.webp`) — OCR directly via tesseract

This mirrors the OCR approach used by the offer-letter fraud detector (#22,
Module 5.8) per ETHOS_AI_CONTEXT.md §3 ("Tesseract self-hosted, fallback
Google Vision API") — Google Vision fallback is out of scope for this issue
and left as a TODO hook for #22's shared OCR utilities once that lands.
"""
from __future__ import annotations

import io
import logging

logger = logging.getLogger(__name__)

_TEXT_EXTENSIONS = {".txt", ".md"}
_PDF_EXTENSIONS = {".pdf"}
_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}

SUPPORTED_EXTENSIONS = _TEXT_EXTENSIONS | _PDF_EXTENSIONS | _IMAGE_EXTENSIONS


class UnsupportedFileTypeError(ValueError):
    pass


def extract_text(filename: str, content: bytes) -> str:
    """Best-effort text extraction. Never raises for OCR failures on individual
    pages/images — returns whatever text could be recovered (possibly empty)."""
    ext = _extension(filename)

    if ext in _TEXT_EXTENSIONS:
        return content.decode("utf-8", errors="replace")

    if ext in _PDF_EXTENSIONS:
        return _extract_pdf_text(content)

    if ext in _IMAGE_EXTENSIONS:
        return _ocr_image_bytes(content)

    raise UnsupportedFileTypeError(
        f"Unsupported file type '{ext}'. Supported: {sorted(SUPPORTED_EXTENSIONS)}"
    )


def _extension(filename: str) -> str:
    name = (filename or "").lower()
    if "." not in name:
        return ""
    return "." + name.rsplit(".", 1)[-1]


def _extract_pdf_text(content: bytes) -> str:
    text_parts: list[str] = []
    needs_ocr_pages: list[int] = []

    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        for i, page in enumerate(reader.pages):
            page_text = (page.extract_text() or "").strip()
            if page_text:
                text_parts.append(page_text)
            else:
                needs_ocr_pages.append(i)
    except Exception:
        logger.exception("pypdf text extraction failed; will attempt full-document OCR")
        needs_ocr_pages = []  # signal: try OCR on the whole doc below
        text_parts = []

    if text_parts and not needs_ocr_pages:
        return "\n".join(text_parts)

    # Fallback: OCR the whole PDF (covers scanned documents and pypdf failures)
    ocr_text = _ocr_pdf_bytes(content)
    combined = "\n".join(text_parts + ([ocr_text] if ocr_text else []))
    return combined.strip()


def _ocr_pdf_bytes(content: bytes) -> str:
    try:
        import pytesseract
        from pdf2image import convert_from_bytes

        images = convert_from_bytes(content)
        pages_text = [pytesseract.image_to_string(img) for img in images]
        return "\n".join(t for t in pages_text if t)
    except Exception:
        logger.exception("OCR fallback for PDF failed")
        return ""


def _ocr_image_bytes(content: bytes) -> str:
    try:
        import pytesseract
        from PIL import Image

        image = Image.open(io.BytesIO(content))
        return pytesseract.image_to_string(image) or ""
    except Exception:
        logger.exception("OCR of image upload failed")
        return ""
