"""
Router for Module 5.9 — Smart Agreement Analyzer (Issue #16).

Two entry points into the same analysis pipeline:
  - `POST /api/ai/analyze-agreement`       multipart file upload (PDF/image/txt)
  - `POST /api/ai/analyze-agreement/text`  JSON body with raw text (used by
                                            #25's frontend wiring for pasted
                                            text, and by tests)

Both share `AgreementAnalysisService` so behavior never diverges between paths.
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.config import Settings, get_settings
from app.llm.factory import get_agreement_llm
from app.schemas import AnalyzeAgreementRequest, AnalyzeAgreementResponse, DeclaredFee
from app.services.agreement_analysis import AgreementAnalysisService
from app.services.text_extraction import UnsupportedFileTypeError, extract_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["agreement-analyzer"])


def get_analysis_service() -> AgreementAnalysisService:
    return AgreementAnalysisService(llm=get_agreement_llm())


@router.post("/analyze-agreement/text", response_model=AnalyzeAgreementResponse)
async def analyze_agreement_text(
    payload: AnalyzeAgreementRequest,
    service: AgreementAnalysisService = Depends(get_analysis_service),
) -> AnalyzeAgreementResponse:
    return await service.analyze(
        agreement_text=payload.agreement_text,
        declared_pricing=payload.declared_pricing,
        language=payload.language,
    )


@router.post("/analyze-agreement", response_model=AnalyzeAgreementResponse)
async def analyze_agreement_file(
    file: UploadFile = File(...),
    declared_pricing: str = Form(default="[]", max_length=100_000),
    language: str = Form(default="en", pattern="^(en|bn)$"),
    settings: Settings = Depends(get_settings),
    service: AgreementAnalysisService = Depends(get_analysis_service),
) -> AnalyzeAgreementResponse:
    content = await file.read(settings.max_upload_bytes + 1)

    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File too large (max 20MB).")

    try:
        pricing_raw = json.loads(declared_pricing)
        if not isinstance(pricing_raw, list) or len(pricing_raw) > 200:
            raise ValueError("Expected at most 200 pricing items")
        pricing = [DeclaredFee(**item) for item in pricing_raw]
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Invalid declared_pricing: {exc}") from exc

    try:
        text = extract_text(file.filename or "", content)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from the uploaded file (empty or unreadable).",
        )

    return await service.analyze(agreement_text=text, declared_pricing=pricing, language=language)
