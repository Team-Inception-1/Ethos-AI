"""
Provider selection for the AI Counselor System (Module 5.18, Issue #24 / K-23).

Selects `GeminiCounselorLLM` when `GEMINI_API_KEY` is present in configuration;
otherwise defaults to `FakeCounselorProvider` for deterministic offline testing and local dev.
"""
from __future__ import annotations

from app.config import Settings, get_settings
from fastapi import HTTPException
from .counselor_base import CounselorLLM
from .fake_counselor_provider import FakeCounselorProvider
from .gemini_counselor_provider import GeminiCounselorLLM

_cached_default: CounselorLLM | None = None


def get_counselor_llm(settings: Settings | None = None) -> CounselorLLM:
    """Return the configured counselor provider.

    Caches the instance process-wide when called with no arguments.
    """
    global _cached_default

    if settings is not None:
        return _build(settings)

    if _cached_default is None:
        _cached_default = _build(get_settings())
    return _cached_default


def _build(settings: Settings) -> CounselorLLM:
    if settings.llm_configured and settings.gemini_api_key:
        return GeminiCounselorLLM(api_key=settings.gemini_api_key, model=settings.gemini_model)
    if settings.deterministic_allowed:
        return FakeCounselorProvider()
    raise HTTPException(status_code=503, detail="AI provider is not configured.")
