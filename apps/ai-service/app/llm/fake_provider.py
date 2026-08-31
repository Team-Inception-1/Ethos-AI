"""
Deterministic fake `AgreementLLM` used in unit tests (and as a safe local-dev
fallback when no API key is configured) so the DoD for #16 is fully testable
without live network access or a paid API key.

This is intentionally simple, rule-based extraction — good enough to exercise
the full request/response pipeline and the hidden-fee/ambiguous-refund flag
logic in `AgreementAnalysisService`, without pretending to be a real LLM.
"""
from __future__ import annotations

import re

from app.schemas import ClauseType, ExtractedClause
from .base import AgreementLLM

_FEE_RE = re.compile(r"(?:tk|৳|bdt)\s?([\d,]+)", re.IGNORECASE)

# Order matters: checked top-to-bottom, first match wins. REFUND/CANCELLATION/
# LIABILITY are checked before FEE because sentences like "the Student shall
# receive a 50% refund of the service fee" contain fee-ish words but are
# conceptually refund clauses, not fee clauses.
_KEYWORDS: dict[ClauseType, list[str]] = {
    ClauseType.REFUND: ["refund", "reimburse", "money back"],
    ClauseType.LIABILITY: ["liable", "liability", "responsible", "indemnif"],
    ClauseType.CANCELLATION: ["cancel", "termination", "terminate"],
    ClauseType.FEE: ["fee", "charge", "payment", "cost"],
}


class FakeAgreementLLM(AgreementLLM):
    """Splits text into sentences and classifies each by keyword match."""

    name = "fake"

    async def extract_clauses(self, agreement_text: str, *, language: str = "en") -> list[ExtractedClause]:
        if not agreement_text or not agreement_text.strip():
            return []

        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", agreement_text) if s.strip()]
        clauses: list[ExtractedClause] = []

        for sentence in sentences:
            lowered = sentence.lower()
            matched_type: ClauseType | None = None
            for clause_type, keywords in _KEYWORDS.items():
                if any(kw in lowered for kw in keywords):
                    matched_type = clause_type
                    break
            if matched_type is None:
                continue

            amount_poisha = None
            m = _FEE_RE.search(sentence)
            if m:
                taka = int(m.group(1).replace(",", ""))
                amount_poisha = taka * 100

            clauses.append(
                ExtractedClause(
                    clause_type=matched_type,
                    quote=sentence,
                    amount_poisha=amount_poisha,
                    summary_en=f"[{matched_type.value}] {sentence[:120]}",
                )
            )

        return clauses
