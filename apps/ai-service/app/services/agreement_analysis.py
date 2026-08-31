"""
Core business logic for the Smart Agreement Analyzer (Module 5.9, Issue #16).

Responsibilities (per ETHOS_AI_CONTEXT.md §5.9):
  1. Extract fee / refund / cancellation / liability clauses from agreement text
     (delegated to an `AgreementLLM`).
  2. Compare extracted fee clauses against the agency's declared structured
     pricing (Module 5.4 / `DeclaredFee`) → flag hidden-charge mismatches.
  3. Flag ambiguous or contradictory refund language with a plain-language
     explanation.

This module has zero FastAPI/HTTP dependencies so it's directly unit-testable.
"""
from __future__ import annotations

import re

from app.llm.base import AgreementLLM
from app.schemas import (
    AnalyzeAgreementResponse,
    ClauseFlag,
    ClauseType,
    DeclaredFee,
    ExtractedClause,
    FlagSeverity,
)

# Fee amounts within this tolerance (in poisha) of a declared fee are treated
# as "the same fee", not a mismatch (covers minor rounding in LLM extraction).
_FEE_MATCH_TOLERANCE_POISHA = 100  # 1 taka

_AMBIGUOUS_REFUND_PATTERNS = [
    r"\bmay\b",
    r"\bat (?:the|our|the agency'?s?) discretion\b",
    r"\breasonable\b",
    r"\bsubject to change\b",
    r"\bprocessing fee[s]?\b(?!.*\d)",  # "processing fees" mentioned with no defined amount
    r"\bcase[- ]by[- ]case\b",
    r"\bpartial refund\b(?!.*\d{1,3}\s?%)",  # "partial refund" without a stated percentage
]
_AMBIGUOUS_REFUND_RE = re.compile("|".join(_AMBIGUOUS_REFUND_PATTERNS), re.IGNORECASE)

_PERCENT_RE = re.compile(r"(\d{1,3})\s?%")


class AgreementAnalysisService:
    def __init__(self, llm: AgreementLLM) -> None:
        self._llm = llm

    async def analyze(
        self,
        agreement_text: str,
        declared_pricing: list[DeclaredFee] | None = None,
        language: str = "en",
    ) -> AnalyzeAgreementResponse:
        declared_pricing = declared_pricing or []

        clauses = await self._llm.extract_clauses(agreement_text, language=language)

        flags: list[ClauseFlag] = []
        flags.extend(self._detect_hidden_fees(clauses, declared_pricing))
        flags.extend(self._detect_ambiguous_or_contradictory_refunds(clauses))

        return AnalyzeAgreementResponse(
            clauses=clauses,
            flags=flags,
            verdict=self._verdict(flags),
            model_used=self._llm.name,
        )

    # -- Hidden fee detection -------------------------------------------------

    def _detect_hidden_fees(
        self, clauses: list[ExtractedClause], declared_pricing: list[DeclaredFee]
    ) -> list[ClauseFlag]:
        flags: list[ClauseFlag] = []
        declared_amounts = [fee.amount_poisha for fee in declared_pricing]

        for clause in clauses:
            if clause.clause_type != ClauseType.FEE or clause.amount_poisha is None:
                continue

            matches_declared = any(
                abs(clause.amount_poisha - declared_amount) <= _FEE_MATCH_TOLERANCE_POISHA
                for declared_amount in declared_amounts
            )

            if not matches_declared:
                taka = clause.amount_poisha / 100
                flags.append(
                    ClauseFlag(
                        tag="Hidden Fee",
                        severity=FlagSeverity.DANGER,
                        clause_type=ClauseType.FEE,
                        message_en=(
                            f"This agreement mentions a charge of ৳{taka:,.2f} that does not "
                            "appear in the agency's declared/structured pricing. Ask the agency "
                            "to explain this charge in writing before signing or paying."
                        ),
                        related_quote=clause.quote,
                        amount_poisha=clause.amount_poisha,
                    )
                )

        return flags

    # -- Ambiguous / contradictory refund detection ---------------------------

    def _detect_ambiguous_or_contradictory_refunds(
        self, clauses: list[ExtractedClause]
    ) -> list[ClauseFlag]:
        flags: list[ClauseFlag] = []
        refund_clauses = [c for c in clauses if c.clause_type == ClauseType.REFUND]

        for clause in refund_clauses:
            if _AMBIGUOUS_REFUND_RE.search(clause.quote):
                flags.append(
                    ClauseFlag(
                        tag="Ambiguous Refund",
                        severity=FlagSeverity.WARNING,
                        clause_type=ClauseType.REFUND,
                        message_en=(
                            "This refund clause uses vague language (e.g. 'at discretion', "
                            "'reasonable', or an undefined fee) instead of a clear, fixed "
                            "condition. Ask the agency to specify exact percentages/amounts "
                            "and conditions in writing."
                        ),
                        related_quote=clause.quote,
                    )
                )

        # Contradiction check: 2+ refund clauses citing different percentages.
        percentages = set()
        for clause in refund_clauses:
            for match in _PERCENT_RE.findall(clause.quote):
                percentages.add(int(match))

        if len(percentages) > 1:
            flags.append(
                ClauseFlag(
                    tag="Contradictory Refund Terms",
                    severity=FlagSeverity.DANGER,
                    clause_type=ClauseType.REFUND,
                    message_en=(
                        "This agreement states different refund percentages "
                        f"({', '.join(f'{p}%' for p in sorted(percentages))}) in different "
                        "clauses. This contradiction should be resolved in writing with the "
                        "agency before signing — it may be used to deny a refund later."
                    ),
                )
            )

        return flags

    @staticmethod
    def _verdict(flags: list[ClauseFlag]) -> str:
        if any(f.severity == FlagSeverity.DANGER for f in flags):
            return "high_risk"
        if any(f.severity == FlagSeverity.WARNING for f in flags):
            return "needs_review"
        return "clear"
