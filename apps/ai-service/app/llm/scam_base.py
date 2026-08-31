"""
LLM provider abstraction for the Scam Alert System (Module 5.10, Issue #23).

Separate interface from `AgreementLLM` (Module 5.9) — different task, different
output shape — but follows the same pattern: abstract base + pluggable
concrete providers + a deterministic fake for offline tests, so behavior is
never accidentally coupled to a specific vendor SDK.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas import ScamFlag


class ScamLLMError(RuntimeError):
    """Raised when the underlying LLM provider fails or returns unusable output."""


class ScamLLM(ABC):
    """Abstract LLM-escalation classifier for predatory-content detection.

    Called only on text that has ALREADY passed (or been ambiguous under) the
    rule-based pre-filter — see `app/services/scam_rules.py` — so this is the
    "smart but expensive" second pass, not the first line of defense.
    """

    name: str = "abstract"

    @abstractmethod
    async def classify(self, text: str, *, language: str = "en") -> list[ScamFlag]:
        """Return any additional scam/predatory-content flags the LLM finds
        beyond what the rule-based pre-filter already caught.

        Implementations must raise `ScamLLMError` on failure rather than
        letting SDK-specific exceptions leak into the service layer.
        """
        raise NotImplementedError
