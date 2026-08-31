from __future__ import annotations

from app.llm.factory import get_agreement_llm
from app.llm.fake_provider import FakeAgreementLLM
from app.llm.gemini_provider import GeminiAgreementLLM


def test_factory_falls_back_to_fake_when_no_key(settings_no_key):
    llm = get_agreement_llm(settings_no_key)
    assert isinstance(llm, FakeAgreementLLM)
    assert llm.name == "fake"


def test_factory_returns_gemini_when_key_configured(settings_with_key):
    llm = get_agreement_llm(settings_with_key)
    assert isinstance(llm, GeminiAgreementLLM)
    assert llm.name == "gemini"


def test_gemini_provider_rejects_empty_key():
    import pytest
    from app.llm.base import LLMError

    with pytest.raises(LLMError):
        GeminiAgreementLLM(api_key="")
