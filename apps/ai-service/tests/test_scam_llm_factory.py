from __future__ import annotations

import pytest

from app.llm.fake_scam_provider import FakeScamLLM
from app.llm.gemini_scam_provider import GeminiScamLLM
from app.llm.scam_base import ScamLLMError
from app.llm.scam_factory import get_scam_llm


def test_scam_factory_falls_back_to_fake_when_no_key(settings_no_key):
    llm = get_scam_llm(settings_no_key)
    assert isinstance(llm, FakeScamLLM)
    assert llm.name == "fake"


def test_scam_factory_returns_gemini_when_key_configured(settings_with_key):
    llm = get_scam_llm(settings_with_key)
    assert isinstance(llm, GeminiScamLLM)
    assert llm.name == "gemini"


def test_gemini_scam_provider_rejects_empty_key():
    with pytest.raises(ScamLLMError):
        GeminiScamLLM(api_key="")
