"""
Optional Google Cloud Vision OCR fallback service.

Used as a fallback when Tesseract OCR fails, is not installed, or produces
sub-threshold output (e.g. heavily noisy/scanned PDFs/images).

Zero-crash guarantee: If credentials/keys are missing or Google Vision fails,
this service logs and gracefully returns None/empty string without crashing.
"""
from __future__ import annotations

import base64
import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

GOOGLE_VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate"


def extract_text_google_vision_sync(
    image_bytes: bytes,
    api_key: str | None = None,
    timeout_seconds: float = 10.0,
) -> str | None:
    """Synchronous Google Cloud Vision OCR text extraction via REST API.

    Returns the extracted text string if successful, or None if Google Vision is
    unconfigured or fails.
    """
    key = api_key or get_settings().google_vision_api_key
    if not key:
        logger.debug("Google Vision API key is not configured; skipping Vision OCR fallback.")
        return None

    try:
        content_b64 = base64.b64encode(image_bytes).decode("utf-8")
        payload = {
            "requests": [
                {
                    "image": {"content": content_b64},
                    "features": [{"type": "TEXT_DETECTION"}],
                }
            ]
        }
        with httpx.Client(timeout=timeout_seconds) as client:
            resp = client.post(
                GOOGLE_VISION_API_URL,
                params={"key": key},
                json=payload,
            )
            if resp.status_code != 200:
                logger.warning(
                    "Google Vision API returned status %d: %s",
                    resp.status_code,
                    resp.text[:200],
                )
                return None

            data: dict[str, Any] = resp.json()
            responses = data.get("responses", [])
            if not responses:
                return None

            full_annotation = responses[0].get("fullTextAnnotation", {})
            text = full_annotation.get("text")
            if text:
                return str(text)

            # Fallback to first textAnnotation if fullTextAnnotation is missing
            text_annotations = responses[0].get("textAnnotations", [])
            if text_annotations:
                return str(text_annotations[0].get("description", ""))

            return None
    except Exception:
        logger.exception("Google Vision OCR fallback call failed")
        return None


async def extract_text_google_vision(
    image_bytes: bytes,
    api_key: str | None = None,
    timeout_seconds: float = 10.0,
) -> str | None:
    """Async Google Cloud Vision OCR text extraction via REST API."""
    key = api_key or get_settings().google_vision_api_key
    if not key:
        return None

    try:
        content_b64 = base64.b64encode(image_bytes).decode("utf-8")
        payload = {
            "requests": [
                {
                    "image": {"content": content_b64},
                    "features": [{"type": "TEXT_DETECTION"}],
                }
            ]
        }
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            resp = await client.post(
                GOOGLE_VISION_API_URL,
                params={"key": key},
                json=payload,
            )
            if resp.status_code != 200:
                logger.warning(
                    "Google Vision API returned status %d: %s",
                    resp.status_code,
                    resp.text[:200],
                )
                return None

            data = resp.json()
            responses = data.get("responses", [])
            if not responses:
                return None

            full_annotation = responses[0].get("fullTextAnnotation", {})
            text = full_annotation.get("text")
            if text:
                return str(text)

            text_annotations = responses[0].get("textAnnotations", [])
            if text_annotations:
                return str(text_annotations[0].get("description", ""))

            return None
    except Exception:
        logger.exception("Async Google Vision OCR fallback call failed")
        return None
