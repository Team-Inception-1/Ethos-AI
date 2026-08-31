"""
Core business logic for the Scam Alert System (Module 5.10, Issue #23).

Two-tier detection strategy per the DoD ("rule-based pre-filter before LLM
escalation"):
  1. Cheap, deterministic regex pre-filter (`scam_rules.scan_with_rules`) —
     always runs, catches the ~14 well-known predatory phrase patterns.
  2. LLM escalation (`ScamLLM.classify`) — catches paraphrased/subtler scam
     language the regexes can't anticipate. Always invoked (not gated on the
     rule pass finding nothing) because a scammer who avoids all 14 known
     phrases is exactly the case the LLM tier exists to catch.

This module has zero FastAPI/HTTP dependencies so it's directly unit-testable,
mirroring `AgreementAnalysisService` (#16).
"""
from __future__ import annotations

from app.llm.scam_base import ScamLLM, ScamLLMError
from app.schemas import FlagSeverity, ScamFlag, ScanContentResponse
from .scam_rules import scan_with_rules

logger_name = __name__

_SEVERITY_RANK = {FlagSeverity.INFO: 0, FlagSeverity.WARNING: 1, FlagSeverity.DANGER: 2}


class ScamClassifierService:
    def __init__(self, llm: ScamLLM) -> None:
        self._llm = llm

    async def scan(self, text: str, *, language: str = "en") -> ScanContentResponse:
        rule_flags = scan_with_rules(text)

        llm_flags: list[ScamFlag] = []
        try:
            llm_flags = await self._llm.classify(text, language=language)
        except ScamLLMError:
            # LLM escalation is a best-effort enhancement on top of the
            # always-on rule pre-filter — if the LLM provider fails (network,
            # quota, bad key), degrade gracefully to rule-only results rather
            # than failing the whole scan. The rule tier alone still satisfies
            # the DoD's core detection guarantee.
            import logging

            logging.getLogger(logger_name).warning(
                "Scam LLM escalation failed; returning rule-based flags only", exc_info=True
            )

        all_flags = self._dedupe(rule_flags + llm_flags)

        return ScanContentResponse(
            flags=all_flags,
            severity=self._overall_severity(all_flags),
            model_used=self._llm.name,
        )

    @staticmethod
    def _dedupe(flags: list[ScamFlag]) -> list[ScamFlag]:
        """Drop LLM flags that just re-report the same matched text as an
        existing rule flag (case-insensitive substring check) — keeps the
        rule tier authoritative for anything it already caught, per the
        Gemini system prompt's instruction not to re-report obvious matches,
        but this is enforced in code too rather than trusting the prompt alone."""
        seen_texts = {f.matched_text.lower() for f in flags if f.source.value == "rule"}
        deduped: list[ScamFlag] = []
        for flag in flags:
            if flag.source.value == "llm" and any(
                flag.matched_text.lower() in seen or seen in flag.matched_text.lower()
                for seen in seen_texts
            ):
                continue
            deduped.append(flag)
        return deduped

    @staticmethod
    def _overall_severity(flags: list[ScamFlag]) -> FlagSeverity:
        if not flags:
            return FlagSeverity.INFO
        return max(flags, key=lambda f: _SEVERITY_RANK[f.severity]).severity
