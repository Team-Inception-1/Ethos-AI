"""
Router for Module 5.10 — Scam Alert System (Issue #23).

Three entry points:
  - `POST /api/ai/scan-content`
        Scans free text (marketing copy, chat message, agreement text) and
        returns `{ flags[], severity }` — the DoD's core contract. If
        `agency_id` is provided, any flags found are also folded into that
        agency's rolling risk score as a 'scan' event.
  - `GET  /api/ai/agencies/{agency_id}/risk-score`
        Returns the agency's current rolling `AgencyRiskScore`, for display
        on the Directory/Agency profile UI (#25's frontend wiring job).
  - `POST /api/ai/agencies/{agency_id}/risk-events`
        Lets the core Node API push in complaint / review-sentiment events
        (data this service never stores directly — see
        ETHOS_AI_CONTEXT.md §10) so they contribute to the same rolling score
        alongside scan-based events.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends

from app.llm.scam_factory import get_scam_llm
from app.schemas import (
    AgencyRiskScore,
    FlagSeverity,
    RecordRiskEventRequest,
    ScanContentRequest,
    ScanContentResponse,
)
from app.services.agency_risk_store import AgencyRiskStore, get_agency_risk_store
from app.services.scam_classifier import ScamClassifierService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["scam-alert"])

# How much a single scan-triggered risk event should move an agency's score,
# by the scan's overall severity. Danger-level content (e.g. "100% visa
# guarantee") should swing the score hard; info-level flags barely move it.
_SCAN_SEVERITY_WEIGHT: dict[FlagSeverity, float] = {
    FlagSeverity.INFO: 10.0,
    FlagSeverity.WARNING: 45.0,
    FlagSeverity.DANGER: 85.0,
}


def get_classifier_service() -> ScamClassifierService:
    return ScamClassifierService(llm=get_scam_llm())


def get_risk_store() -> AgencyRiskStore:
    return get_agency_risk_store()


@router.post("/scan-content", response_model=ScanContentResponse)
async def scan_content(
    payload: ScanContentRequest,
    service: ScamClassifierService = Depends(get_classifier_service),
    store: AgencyRiskStore = Depends(get_risk_store),
) -> ScanContentResponse:
    result = await service.scan(payload.text, language=payload.language)

    if payload.agency_id and result.flags:
        tags = ", ".join(f.tag for f in result.flags[:5])
        store.record_event(
            agency_id=payload.agency_id,
            source="scan",
            weight=_SCAN_SEVERITY_WEIGHT[result.severity],
            reason=f"Content scan ({payload.source}) flagged: {tags}",
        )

    return result


@router.get("/agencies/{agency_id}/risk-score", response_model=AgencyRiskScore)
async def get_agency_risk_score(
    agency_id: str,
    store: AgencyRiskStore = Depends(get_risk_store),
) -> AgencyRiskScore:
    return store.get_score(agency_id)


@router.post("/agencies/{agency_id}/risk-events", response_model=AgencyRiskScore)
async def record_agency_risk_event(
    agency_id: str,
    payload: RecordRiskEventRequest,
    store: AgencyRiskStore = Depends(get_risk_store),
) -> AgencyRiskScore:
    return store.record_event(
        agency_id=agency_id,
        source=payload.source,
        weight=payload.weight,
        reason=payload.reason,
    )
