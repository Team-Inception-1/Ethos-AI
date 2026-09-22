"""
Router for Module 5.18 & 5.11 — AI Counselor Chatbot & Bangla Assistant (Issue #24 / K-23).

Endpoints:
  - `POST /api/ai/counselor/evaluate`
        Evaluates a student's academic profile and budget, classifies universities into
        Dream / Target / Safe tiers, assesses visa & solvency feasibility, and returns
        a milestone roadmap.
  - `POST /api/ai/counselor/chat`
        Conversational counselor supporting multi-turn chat in English or Bangla,
        taking optional student profile context into account.
  - `GET  /api/ai/counselor/countries`
        Returns list of supported destination countries with key visa & solvency parameters.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.llm.counselor_base import CounselorLLM, CounselorLLMError
from app.llm.counselor_factory import get_counselor_llm
from app.schemas import (
    CounselorChatRequest,
    CounselorChatResponse,
    CounselorEvaluationRequest,
    CounselorEvaluationResponse,
    SOPAuditRequest,
    SOPAuditResponse,
    GroundingCitation,
)
from app.services.counselor_engine import (
    evaluate_counselor_profile,
    evaluate_counselor_profile_with_live,
)
from app.services.counselor_knowledge import COUNTRY_VISA_RULES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai/counselor", tags=["counselor"])


def get_counselor_provider() -> CounselorLLM:
    return get_counselor_llm()


@router.post("/evaluate", response_model=CounselorEvaluationResponse)
async def evaluate_profile(
    payload: CounselorEvaluationRequest,
) -> CounselorEvaluationResponse:
    """Evaluates a student profile and returns categorized university matches,

    admission chance percentages, financial proof requirements, and roadmap.
    Supports optional live web discovery via Google Search Grounding.
    """
    try:
        if payload.enable_live_discovery:
            return await evaluate_counselor_profile_with_live(payload)
        return evaluate_counselor_profile(payload)
    except Exception as exc:
        logger.exception("Profile evaluation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate student profile: {exc}",
        ) from exc


@router.post("/discover-live", response_model=CounselorEvaluationResponse)
async def discover_live(
    payload: CounselorEvaluationRequest,
) -> CounselorEvaluationResponse:
    """Discovers real-time universities matching the student's profile via live Google Search Grounding."""
    try:
        req = payload.model_copy(update={"enable_live_discovery": True})
        return await evaluate_counselor_profile_with_live(req)
    except Exception as exc:
        logger.exception("Live university discovery failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Live university discovery failed: {exc}",
        ) from exc


@router.post("/chat", response_model=CounselorChatResponse)
async def chat_counselor(
    payload: CounselorChatRequest,
    llm: CounselorLLM = Depends(get_counselor_provider),
) -> CounselorChatResponse:
    try:
        result = await llm.chat(
            messages=payload.messages,
            profile_context=payload.profile_context,
            language=payload.language,
        )
        reply, suggestions, lang = result[0], result[1], result[2]
        raw_citations = result[3] if len(result) > 3 else None
        
        citations = []
        if raw_citations:
            citations = [GroundingCitation(title=c["title"], url=c["url"]) for c in raw_citations]
        
        return CounselorChatResponse(
            reply=reply,
            suggested_queries=suggestions,
            detected_language=lang,
            model_used=llm.name,
            citations=citations,
        )
    except CounselorLLMError as exc:
        logger.error(f"Counselor LLM error: {exc}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Counselor LLM provider error: {exc}") from exc
    except Exception as exc:
        logger.exception("Unexpected counselor chat failure")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Chat processing failed: {exc}") from exc

@router.post("/audit-sop", response_model=SOPAuditResponse)
async def audit_sop(
    payload: SOPAuditRequest,
    llm: CounselorLLM = Depends(get_counselor_provider),
) -> SOPAuditResponse:
    """Audits a Statement of Purpose draft against the student's profile."""
    try:
        result = await llm.audit_sop(
            sop_text=payload.sop_text,
            target_university=payload.target_university,
            target_country=payload.target_country,
            target_program=payload.target_program,
            profile_context=payload.profile_context,
            language=payload.language,
        )
        return SOPAuditResponse(**result)
    except CounselorLLMError as exc:
        logger.error(f"SOP audit LLM error: {exc}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"SOP audit LLM error: {exc}") from exc
    except Exception as exc:
        logger.exception("Unexpected SOP audit failure")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"SOP audit failed: {exc}") from exc


@router.get("/countries")
async def list_supported_countries() -> dict[str, Any]:
    """Returns supported study-abroad destination countries and financial parameters."""
    return {"countries": COUNTRY_VISA_RULES}
