"""
Core DoD tests for Issue #23 (K-22): Scam Alert Risk Classifier.

Covers, against the deterministic FakeScamLLM (no network/API key needed):
  1. Rule-based flags always present for known predatory phrases.
  2. LLM-escalation flags additionally present for subtler language the
     rule tier doesn't cover.
  3. Overall `severity` correctly reflects the highest flag severity.
  4. Graceful degradation when the LLM tier fails.
"""
from __future__ import annotations

import pytest

from app.llm.scam_base import ScamLLM, ScamLLMError
from app.schemas import FlagSeverity, ScamFlag, ScamFlagSource
from tests.conftest import load_fixture


@pytest.mark.asyncio
async def test_scam_marketing_copy_produces_rule_flags(scam_classifier_service):
    text = load_fixture("scam_marketing_copy.txt")
    result = await scam_classifier_service.scan(text)

    assert len(result.flags) >= 3
    assert any(f.source == ScamFlagSource.RULE for f in result.flags)
    assert result.severity == FlagSeverity.DANGER
    assert result.model_used == "fake"


@pytest.mark.asyncio
async def test_clean_marketing_copy_produces_no_flags(scam_classifier_service):
    text = load_fixture("clean_marketing_copy.txt")
    result = await scam_classifier_service.scan(text)

    assert result.flags == []
    assert result.severity == FlagSeverity.INFO


@pytest.mark.asyncio
async def test_llm_tier_catches_phrasing_rules_miss(scam_classifier_service):
    text = "Just wire the money to my cousin's account and trust me, it'll be fine."
    result = await scam_classifier_service.scan(text)

    llm_flags = [f for f in result.flags if f.source == ScamFlagSource.LLM]
    assert len(llm_flags) >= 1
    assert result.severity == FlagSeverity.DANGER  # 'wire the money' is DANGER


@pytest.mark.asyncio
async def test_empty_text_returns_no_flags_and_info_severity(scam_classifier_service):
    result = await scam_classifier_service.scan("")
    assert result.flags == []
    assert result.severity == FlagSeverity.INFO


@pytest.mark.asyncio
async def test_severity_escalates_to_highest_flag_severity(scam_classifier_service):
    # "Act now" alone is INFO-only under the rule tier.
    result = await scam_classifier_service.scan("Act now, don't miss out on this opportunity.")
    assert result.severity == FlagSeverity.INFO
    assert len(result.flags) >= 1


class _FailingScamLLM(ScamLLM):
    name = "failing-fake"

    async def classify(self, text: str, *, language: str = "en") -> list[ScamFlag]:
        raise ScamLLMError("simulated provider outage")


@pytest.mark.asyncio
async def test_degrades_gracefully_when_llm_tier_fails():
    from app.services.scam_classifier import ScamClassifierService

    service = ScamClassifierService(llm=_FailingScamLLM())
    text = load_fixture("scam_marketing_copy.txt")

    # Should not raise, and should still return the rule-based flags.
    result = await service.scan(text)
    assert len(result.flags) >= 3
    assert all(f.source == ScamFlagSource.RULE for f in result.flags)
    assert result.model_used == "failing-fake"
