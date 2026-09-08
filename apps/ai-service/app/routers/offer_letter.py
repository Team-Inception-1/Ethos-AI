"""
Router for Module 5.8 — Fake Document Detection (Issue #22 / K-21).

Provides endpoints for analyzing uploaded offer letters (PDFs, images, text)
for indicators of forgery, predatory claims, domain mismatches, and structural omissions.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.config import Settings, get_settings
from app.schemas import (
    AnalyzeOfferLetterResponse,
    AnalyzeOfferLetterTextRequest,
)
from app.services.offer_letter_fraud import OfferLetterFraudDetector
from app.services.text_extraction import UnsupportedFileTypeError, extract_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["offer-letter-fraud"])


def get_fraud_detector() -> OfferLetterFraudDetector:
    return OfferLetterFraudDetector()


@router.post("/analyze-offer-letter/text", response_model=AnalyzeOfferLetterResponse)
async def analyze_offer_letter_text(
    payload: AnalyzeOfferLetterTextRequest,
    detector: OfferLetterFraudDetector = Depends(get_fraud_detector),
) -> AnalyzeOfferLetterResponse:
    """Analyze raw offer letter text directly (useful for testing or direct text input)."""
    if not payload.text.strip():
        raise HTTPException(
            status_code=422,
            detail="Offer letter text cannot be empty.",
        )

    return detector.analyze(
        text=payload.text,
        sender_email=payload.sender_email,
        expected_university=payload.expected_university,
    )


@router.post("/analyze-offer-letter", response_model=AnalyzeOfferLetterResponse)
async def analyze_offer_letter_file(
    file: UploadFile = File(...),
    sender_email: str | None = Form(default=None),
    expected_university: str | None = Form(default=None),
    settings: Settings = Depends(get_settings),
    detector: OfferLetterFraudDetector = Depends(get_fraud_detector),
) -> AnalyzeOfferLetterResponse:
    """Upload an offer letter (PDF / image / text) to perform full OCR & fraud detection."""
    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=422,
            detail="Uploaded file is empty.",
        )

    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {settings.max_upload_bytes // (1024 * 1024)}MB.",
        )

    try:
        text = extract_text(file.filename or "", content, normalize=True)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc

    if not text or not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract any readable text from the uploaded file (empty or unreadable).",
        )

    return detector.analyze(
        text=text,
        sender_email=sender_email,
        expected_university=expected_university,
    )
