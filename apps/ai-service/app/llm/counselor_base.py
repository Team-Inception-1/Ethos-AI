"""
Abstract base class for the AI Counselor LLM provider.

Provides conversational study-abroad advising for Bangladeshi students and parents,
supporting multilingual reasoning (English & Bangla) and context-aware counseling.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas import CounselorChatMessage, CounselorEvaluationRequest


class CounselorLLMError(RuntimeError):
    """Raised when the LLM provider fails or produces unusable output."""


class CounselorLLM(ABC):
    """Abstract interface for conversational counselor providers."""

    name: str = "abstract"

    @abstractmethod
    async def chat(
        self,
        messages: list[CounselorChatMessage],
        profile_context: CounselorEvaluationRequest | None = None,
        language: str = "auto",
    ) -> tuple[str, list[str], str, list[dict] | None]:
        """Runs conversational counseling over the message history with profile context.

        Returns:
            Tuple of (reply_text, suggested_follow_up_questions, detected_language, citations)
        """
        raise NotImplementedError

    @abstractmethod
    async def audit_sop(
        self,
        sop_text: str,
        target_university: str | None = None,
        target_country: str | None = None,
        target_program: str | None = None,
        profile_context: CounselorEvaluationRequest | None = None,
        language: str = "en",
    ) -> dict:
        """Audits a Statement of Purpose draft against the student's profile.

        Returns:
            Dict matching SOPAuditResponse schema fields.
        """
        raise NotImplementedError
