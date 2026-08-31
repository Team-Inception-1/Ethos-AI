"""
LLM provider abstraction for the Smart Agreement Analyzer.

Per ETHOS_AI_CONTEXT.md §10: "LLM-based clause extraction & summarization
(OpenAI/Anthropic/local model — pluggable)". This module defines the
interface; concrete providers (Gemini today, others later) implement it.

The rest of the service (routers, business logic) must depend only on
`AgreementLLM`, never on a concrete provider's SDK types — this keeps the
provider swappable and keeps unit tests fast/deterministic via `FakeAgreementLLM`.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas import ExtractedClause


class LLMError(RuntimeError):
    """Raised when the underlying LLM provider fails or returns unusable output."""


class AgreementLLM(ABC):
    """Abstract clause-extraction provider."""

    name: str = "abstract"

    @abstractmethod
    async def extract_clauses(self, agreement_text: str, *, language: str = "en") -> list[ExtractedClause]:
        """Extract fee/refund/cancellation/liability clauses from raw agreement text.

        Implementations must raise `LLMError` on failure (network error, invalid
        response, missing API key, etc.) rather than letting SDK-specific
        exceptions leak into the service layer.
        """
        raise NotImplementedError
