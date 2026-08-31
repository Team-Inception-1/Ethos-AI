"""
Deterministic fake `ScamLLM` used in unit tests (and as a safe local-dev
fallback when no API key is configured) so the DoD for #23 is fully testable
without live network access or a paid API key.

This simulates the "LLM escalation" tier by catching a small set of
predatory phrasings that are DELIBERATELY NOT covered by the rule-based
pre-filter in `app/services/scam_rules.py` — that keeps the two tiers
distinguishable in tests: rule-only text produces only `source="rule"`
flags, text that also hits these fake-LLM keywords additionally produces
`source="llm"` flags, exactly like the real Gemini provider would for
phrasing the regexes don't anticipate.
"""
from __future__ import annotations

from app.schemas import FlagSeverity, ScamCategory, ScamFlag, ScamFlagSource
from .scam_base import ScamLLM

# (phrase, category, severity, message_en) — intentionally distinct from the
# rule patterns in `scam_rules.py` so unit tests can tell tiers apart.
_KEYWORDS: list[tuple[str, ScamCategory, FlagSeverity, str]] = [
    (
        "trust me",
        ScamCategory.OTHER,
        FlagSeverity.INFO,
        "Vague trust-based reassurance ('trust me') is not a substitute for a written, "
        "verifiable agreement. Ask for documented terms instead.",
    ),
    (
        "wire the money",
        ScamCategory.PAYMENT_PRESSURE,
        FlagSeverity.DANGER,
        "Being asked to wire money outside a documented/escrow payment channel is a "
        "serious fraud risk — there is no recourse if the transfer goes wrong.",
    ),
    (
        "whatsapp only",
        ScamCategory.UNVERIFIABLE_CREDENTIAL,
        FlagSeverity.WARNING,
        "A consultancy that insists on communicating only through informal channels "
        "(e.g. WhatsApp-only, no office address) avoids the accountability a legitimate "
        "agency would have.",
    ),
    (
        "delete this message",
        ScamCategory.OTHER,
        FlagSeverity.DANGER,
        "Being asked to delete a conversation is a strong indicator of an attempt to "
        "avoid leaving evidence. Keep records of all communication with an agency.",
    ),
]


class FakeScamLLM(ScamLLM):
    """Keyword-based stand-in for a real LLM escalation call."""

    name = "fake"

    async def classify(self, text: str, *, language: str = "en") -> list[ScamFlag]:
        if not text or not text.strip():
            return []

        lowered = text.lower()
        flags: list[ScamFlag] = []
        for phrase, category, severity, message in _KEYWORDS:
            idx = lowered.find(phrase)
            if idx == -1:
                continue
            flags.append(
                ScamFlag(
                    tag=f"[LLM] {phrase.title()}",
                    category=category,
                    severity=severity,
                    source=ScamFlagSource.LLM,
                    matched_text=text[idx : idx + len(phrase)],
                    message_en=message,
                )
            )
        return flags
