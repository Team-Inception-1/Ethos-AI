"""
Provider selection: returns the configured `AgreementLLM` implementation.

Real Gemini calls require `GEMINI_API_KEY`. If it's not set (e.g. local dev
without a key, or CI), we fall back to the deterministic `FakeAgreementLLM`
so the service still boots and the API contract remains testable end-to-end.
The response's `model_used` field always reflects which provider actually ran,
so callers/tests can tell the difference.
"""
from __future__ import annotations

from app.config import Settings, get_settings
from fastapi import HTTPException

from .base import AgreementLLM
from .fake_provider import FakeAgreementLLM
from .gemini_provider import GeminiAgreementLLM

_cached_default: AgreementLLM | None = None


def get_agreement_llm(settings: Settings | None = None) -> AgreementLLM:
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


def _build(settings: Settings) -> AgreementLLM:
    if settings.llm_configured and settings.gemini_api_key:
        return GeminiAgreementLLM(api_key=settings.gemini_api_key, model=settings.gemini_model)
    if settings.deterministic_allowed:
        return FakeAgreementLLM()
    raise HTTPException(status_code=503, detail="AI provider is not configured.")
