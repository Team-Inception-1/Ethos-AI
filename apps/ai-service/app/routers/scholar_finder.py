"""
FastAPI Router for ScholarFinder & RA/TA Full-Fund Scholarship Suite.

Endpoints:
  - POST /api/ai/scholar/search
  - POST /api/ai/scholar/generate-email
  - POST /api/ai/scholar/interview-prep
  - GET  /api/ai/scholar/guide
  - GET  /api/ai/scholar/professors/{prof_id}
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status, Depends, Request
from pydantic import BaseModel, Field
from app.config import get_settings

from app.schemas import (
    ColdEmailGenerateRequest,
    ColdEmailGenerateResponse,
    CVParsedData,
    CVParseResponse,
    InterviewPrepRequest,
    InterviewPrepResponse,
    LiveAcademicSearchRequest,
    LiveAcademicSearchResponse,
    PaperDeconstructRequest,
    PaperDeconstructResponse,
    ProfessorProfile,
    ProfessorSearchRequest,
    ProfessorSearchResponse,
    ProfileMatchRequest,
    ProfileMatchResponse,
    TARAAdvisorQuestionRequest,
    TARAAdvisorQuestionResponse,
    TARAGuideResponse,
    TARAStrategyRequest,
    TARAStrategyResponse,
)
from app.services.scholar_engine import (
    calculate_profile_match,
    deconstruct_research_paper,
    generate_cold_email,
    get_tara_guide,
    parse_cv_text,
    prepare_interview,
    search_openalex_live,
    search_professors,
)
from app.services.tara_strategy_engine import (
    ask_tara_advisor,
    evaluate_tara_strategy,
)
from app.services.scholar_knowledge import SEED_PROFESSORS
from app.services.text_extraction import extract_normalized_text

logger = logging.getLogger(__name__)

def require_real_scholar_data(request: Request):
    """Dependency check for scholar finder endpoints."""
    pass


router = APIRouter(prefix="/api/ai/scholar", tags=["scholar-finder"],
                   dependencies=[Depends(require_real_scholar_data)])


@router.post("/search", response_model=ProfessorSearchResponse)
async def search_professors_endpoint(payload: ProfessorSearchRequest) -> ProfessorSearchResponse:
    """Searches and filters faculty by research domain, country, university tier, and active funding."""
    try:
        return search_professors(payload)
    except Exception as exc:
        logger.exception("Professor search failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Professor search failed: {exc}",
        ) from exc


@router.post("/generate-email", response_model=ColdEmailGenerateResponse)
async def generate_cold_email_endpoint(payload: ColdEmailGenerateRequest) -> ColdEmailGenerateResponse:
    """Generates hyper-personalized 3-paragraph cold email, subject line variants, follow-up templates, and anti-spam audit."""
    try:
        return generate_cold_email(payload)
    except Exception as exc:
        logger.exception("Cold email generation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cold email generation failed: {exc}",
        ) from exc


@router.post("/interview-prep", response_model=InterviewPrepResponse)
async def prepare_interview_endpoint(payload: InterviewPrepRequest) -> InterviewPrepResponse:
    """Generates predicted research and technical interview questions based on professor's publications and student profile."""
    try:
        return prepare_interview(payload)
    except Exception as exc:
        logger.exception("Interview prep failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Interview prep failed: {exc}",
        ) from exc


@router.get("/guide", response_model=TARAGuideResponse)
async def get_tara_guide_endpoint() -> TARAGuideResponse:
    """Returns country-by-country breakdown of RA/TA funding mechanics, stipend values in BDT, and spoken English thresholds."""
    try:
        return get_tara_guide()
    except Exception as exc:
        logger.exception("Failed to retrieve funding guide")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve funding guide: {exc}",
        ) from exc


@router.post("/tara-strategy", response_model=TARAStrategyResponse)
async def evaluate_tara_strategy_endpoint(payload: TARAStrategyRequest) -> TARAStrategyResponse:
    """Evaluates student's profile to determine RA vs TA fit, English instructional hurdles, and customized cold pitch."""
    try:
        return evaluate_tara_strategy(payload)
    except Exception as exc:
        logger.exception("Failed to evaluate RA vs TA strategy")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Strategy evaluation failed: {exc}",
        ) from exc


@router.post("/tara-advisor", response_model=TARAAdvisorQuestionResponse)
async def ask_tara_advisor_endpoint(payload: TARAAdvisorQuestionRequest) -> TARAAdvisorQuestionResponse:
    """Answers funding, stipend, waiver, and assistantship policy questions."""
    try:
        return ask_tara_advisor(payload)
    except Exception as exc:
        logger.exception("Failed to answer advisor question")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Advisor failed: {exc}",
        ) from exc


@router.get("/professors/{prof_id}", response_model=ProfessorProfile)
async def get_professor_by_id(prof_id: str) -> ProfessorProfile:
    """Retrieves a single professor's full lab profile and publications."""
    for item in SEED_PROFESSORS:
        if item["id"] == prof_id:
            from app.services.scholar_engine import _to_profile
            return _to_profile(item)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Professor '{prof_id}' not found")


class ParseCVTextPayload(BaseModel):
    raw_text: str = Field(min_length=1, max_length=100_000)


@router.post("/parse-cv/file", response_model=CVParseResponse)
async def parse_cv_file_endpoint(file: UploadFile = File(...)) -> CVParseResponse:
    """Extracts student credentials, skills, and thesis from an uploaded CV/Resume (PDF or text)."""
    try:
        limit = get_settings().max_upload_bytes
        content = await file.read(limit + 1)
        if len(content) > limit:
            raise HTTPException(status_code=413, detail="Uploaded file is too large.")
        extracted = extract_normalized_text(file.filename or "cv.pdf", content)
        if not extracted.strip():
            raise ValueError("No readable text could be extracted from the uploaded document.")
        parsed = parse_cv_text(extracted)
        return CVParseResponse(
            success=True,
            parsed_data=parsed,
            raw_char_count=len(extracted),
            model_used="Ethos CV Parser (pypdf + Heuristic Extraction)",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("CV file extraction failed")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse CV file: {exc}",
        ) from exc


@router.post("/parse-cv/text", response_model=CVParseResponse)
async def parse_cv_text_endpoint(payload: ParseCVTextPayload) -> CVParseResponse:
    """Extracts student credentials, skills, and thesis from raw CV text."""
    try:
        parsed = parse_cv_text(payload.raw_text)
        return CVParseResponse(
            success=True,
            parsed_data=parsed,
            raw_char_count=len(payload.raw_text),
            model_used="Ethos CV Parser (Heuristic Extraction)",
        )
    except Exception as exc:
        logger.exception("CV text parsing failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse CV text: {exc}",
        ) from exc


@router.post("/match-profile", response_model=ProfileMatchResponse)
async def match_profile_endpoint(payload: ProfileMatchRequest) -> ProfileMatchResponse:
    """Calculates compatibility match score (0-100), overlapping skills, and lab skill gaps."""
    try:
        from app.services.scholar_engine import _to_profile
        professors_to_check = payload.professors or [_to_profile(p) for p in SEED_PROFESSORS]
        if payload.professor_id:
            professors_to_check = [p for p in professors_to_check if p.id == payload.professor_id]
        return calculate_profile_match(payload.parsed_cv, professors_to_check)
    except Exception as exc:
        logger.exception("Profile matching failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile matching failed: {exc}",
        ) from exc


@router.post("/deconstruct-paper", response_model=PaperDeconstructResponse)
async def deconstruct_paper_endpoint(payload: PaperDeconstructRequest) -> PaperDeconstructResponse:
    """Breaks down a publication into core contribution, limitation, and tailored cold hook."""
    try:
        return deconstruct_research_paper(payload)
    except Exception as exc:
        logger.exception("Paper deconstruction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Paper deconstruction failed: {exc}",
        ) from exc


@router.post("/live-search", response_model=LiveAcademicSearchResponse)
async def live_search_academic_endpoint(payload: LiveAcademicSearchRequest) -> LiveAcademicSearchResponse:
    """Performs dynamic live academic search using OpenAlex open access repository."""
    try:
        return await search_openalex_live(payload.query, payload.country, payload.limit, payload.entity_type)
    except Exception as exc:
        logger.exception("OpenAlex live search failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OpenAlex live search failed: {exc}",
        ) from exc

