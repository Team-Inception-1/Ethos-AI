"""
Pydantic request/response schemas for the Smart Agreement Analyzer (Module 5.9).

These are the contract consumed by:
  - Issue #25 (K-24): wiring AIToolsPage / DirectoryPage to live AI calls
  - Issue #23 (K-22): scam alert classifier may reuse `ClauseFlag`-style shapes

Keep this file dependency-free of any LLM SDK — it should be safe to import
from tests and from the Node core API's generated client without pulling in
google-genai.
"""
from __future__ import annotations

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
