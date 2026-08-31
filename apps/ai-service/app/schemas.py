"""
Pydantic request/response schemas for:
  - Module 5.9 Smart Agreement Analyzer (Issue #16 / K-17)
  - Module 5.10 Scam Alert System (Issue #23 / K-22)

These are the contract consumed by Issue #25 (K-24): wiring AIToolsPage /
DirectoryPage to live AI calls. `FlagSeverity` is shared across both modules
so the frontend only needs one severity→Badge-variant mapping.

Keep this file dependency-free of any LLM SDK — it should be safe to import
from tests and from the Node core API's generated client without pulling in
google-genai.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class ClauseType(str, Enum):
    FEE = "fee"
    REFUND = "refund"
    CANCELLATION = "cancellation"
    LIABILITY = "liability"
    OTHER = "other"


class FlagSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    DANGER = "danger"


# --- Structured pricing input (mirrors AgencyPricing entity, §6) -----------

class DeclaredFee(BaseModel):
    """One row of the agency's declared/structured pricing (Module 5.4).

    Amounts are integers in poisha (smallest BDT unit) per ETHOS_AI_CONTEXT.md §6.
    """

    service_name: str
    amount_poisha: int = Field(ge=0)
    when_charged: str
    refundable: bool
    conditions: str | None = None


# --- Extracted clause (LLM output, structured) -----------------------------

class ExtractedClause(BaseModel):
    clause_type: ClauseType
    quote: str = Field(description="Verbatim or near-verbatim excerpt from the agreement")
    amount_poisha: int | None = Field(
        default=None, description="Monetary amount mentioned in this clause, if any, in poisha"
    )
    summary_en: str = Field(description="Plain-English one-line summary of the clause")


class ClauseFlag(BaseModel):
    """A problem detected in/around a clause: hidden fee, ambiguous refund, etc."""

    tag: str = Field(description="Short label, e.g. 'Hidden Fee', 'Ambiguous Refund'")
    severity: FlagSeverity
    clause_type: ClauseType
    message_en: str = Field(description="Plain-language explanation for the student/parent")
    related_quote: str | None = None
    amount_poisha: int | None = None


class AnalyzeAgreementRequest(BaseModel):
    """Used only for the text-only JSON path (POST /api/ai/analyze-agreement/text).

    The multipart file-upload path (POST /api/ai/analyze-agreement) accepts the
    same `declared_pricing` as a JSON-encoded form field alongside the file.
    """

    agreement_text: str = Field(min_length=1)
    declared_pricing: list[DeclaredFee] = Field(default_factory=list)
    language: str = Field(default="en", description="Output language for summaries: 'en' or 'bn'")


class AnalyzeAgreementResponse(BaseModel):
    clauses: list[ExtractedClause]
    flags: list[ClauseFlag]
    verdict: str = Field(description="'clear' | 'needs_review' | 'high_risk'")
    model_used: str
    truncated: bool = Field(
        default=False, description="True if input text was truncated before sending to the LLM"
    )


class HealthResponse(BaseModel):
    status: str
    service: str
    llm_configured: bool


# =============================================================================
# Module 5.10 — Scam Alert System (Issue #23 / K-22)
# =============================================================================


class ScamFlagSource(str, Enum):
    """Where a scam flag came from — lets the frontend/audit trail distinguish
    a cheap deterministic rule match from a costlier LLM judgement call."""

    RULE = "rule"
    LLM = "llm"


class ScamCategory(str, Enum):
    GUARANTEE_CLAIM = "guarantee_claim"  # "100% visa guarantee", "guaranteed admission"
    URGENCY_PRESSURE = "urgency_pressure"  # "offer expires today", "act now"
    UNVERIFIABLE_CREDENTIAL = "unverifiable_credential"  # fake govt/embassy affiliation claims
    PAYMENT_PRESSURE = "payment_pressure"  # demanding cash/informal payment, bypassing escrow
    OTHER = "other"


class ScanContentRequest(BaseModel):
    text: str = Field(min_length=1, description="Marketing copy, chat message, or agreement text to scan")
    source: str = Field(
        default="unknown",
        description="Where this text came from, e.g. 'agency_profile', 'chat_message', 'agreement'. "
        "Purely informational — does not change scan behavior.",
    )
    language: str = Field(default="en", description="'en' or 'bn' — affects LLM-escalation output language")
    agency_id: str | None = Field(
        default=None,
        description="If provided, any flags found are also recorded as a rolling risk event "
        "against this agency's `AgencyRiskScore`. Omit for one-off scans (e.g. a student "
        "pasting text into a standalone checker) that shouldn't affect any agency's score.",
    )


class ScamFlag(BaseModel):
    tag: str = Field(description="Short label, e.g. 'Guarantee Claim', 'Payment Pressure'")
    category: ScamCategory
    severity: FlagSeverity
    source: ScamFlagSource
    matched_text: str = Field(description="The exact phrase/sentence that triggered this flag")
    message_en: str = Field(description="Plain-language explanation for the student/parent")


class ScanContentResponse(BaseModel):
    flags: list[ScamFlag]
    severity: FlagSeverity = Field(description="Highest severity across all flags; 'info' if none")
    model_used: str


class AgencyRiskEvent(BaseModel):
    """One contribution to an agency's rolling risk score.

    `ScamAlertRiskStore` accumulates these; `AgencyRiskScore.riskScore` is a
    weighted rollup. Kept simple/in-memory for this course project — see
    `ScamAlertRiskStore` docstring for the swap-to-DB path when #14's Prisma
    schema lands.
    """

    source: str = Field(description="'scan' | 'complaint' | 'review_sentiment'")
    weight: float = Field(ge=0, le=100)
    reason: str
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AgencyRiskScore(BaseModel):
    agency_id: str
    risk_score: float = Field(ge=0, le=100)
    flag_count: int
    last_updated: datetime
    recent_events: list[AgencyRiskEvent] = Field(default_factory=list)


class RecordRiskEventRequest(BaseModel):
    """Lets the core Node API (which owns complaint/review data — see
    ETHOS_AI_CONTEXT.md §10, this service never touches that DB directly)
    push a complaint or review-sentiment event into an agency's rolling
    risk score. `POST /api/ai/scan-content` records 'scan' events itself;
    this endpoint covers the other two sources named in Issue #23's
    objective: 'complaint history and review sentiment'.
    """

    source: str = Field(description="'complaint' | 'review_sentiment' (or 'scan', though that's usually automatic)")
    weight: float = Field(ge=0, le=100, description="How much this single event should move the risk score")
    reason: str = Field(description="Short human-readable reason, e.g. 'Student complaint: undisclosed fee'")
