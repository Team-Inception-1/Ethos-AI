"""
Provider selection for the Scam Alert System (Module 5.10, Issue #23).

Mirrors `app/llm/factory.py` (#16) exactly: real Gemini calls require
`GEMINI_API_KEY` (the same key already used by the Agreement Analyzer — one
key configures both modules); if it's not set, we fall back to the
deterministic `FakeScamLLM` so the service still boots and the API contract
stays testable end-to-end without a paid key.
"""
from __future__ import annotations

from app.config import Settings, get_settings
from fastapi import HTTPException

from .fake_scam_provider import FakeScamLLM
from .gemini_scam_provider import GeminiScamLLM
from .scam_base import ScamLLM

_cached_default: ScamLLM | None = None


def get_scam_llm(settings: Settings | None = None) -> ScamLLM:
    """Return the configured provider.

    When called with no arguments (the FastAPI dependency-injection path),
    the instance is cached process-wide. Pass an explicit `settings` (as
    tests do) to bypass the cache and get a fresh instance for that config.
    """
    global _cached_default

    if settings is not None:
        return _build(settings)

    if _cached_default is None:
        _cached_default = _build(get_settings())
    return _cached_default


def _build(settings: Settings) -> ScamLLM:
    if settings.llm_configured and settings.gemini_api_key:
        return GeminiScamLLM(api_key=settings.gemini_api_key, model=settings.gemini_model)
    if settings.deterministic_allowed:
        return FakeScamLLM()
    raise HTTPException(status_code=503, detail="AI provider is not configured.")
