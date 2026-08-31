"""
Core DoD tests for Issue #16 (K-17): Smart Agreement Analyzer.

Covers, against the deterministic FakeAgreementLLM (no network/API key needed):
  1. Clause extraction into structured JSON across all 4 clause types.
  2. Hidden-charge mismatch detection against declared structured pricing.
  3. Ambiguous / contradictory refund language flagging with plain-language messages.
"""
from __future__ import annotations

import pytest

from app.schemas import ClauseType, DeclaredFee, FlagSeverity
from tests.conftest import load_fixture


@pytest.mark.asyncio
async def test_clean_agreement_extracts_all_clause_types_and_is_clear(analysis_service):
    text = load_fixture("clean_agreement.txt")
    declared = [
        DeclaredFee(
            service_name="Application package",
            amount_poisha=65000 * 100,
            when_charged="on_signup",
            refundable=True,
            conditions="50% refund on Agency-caused rejection",
        )
    ]

    result = await analysis_service.analyze(text, declared_pricing=declared)

    found_types = {c.clause_type for c in result.clauses}
    assert ClauseType.FEE in found_types
    assert ClauseType.REFUND in found_types
    assert ClauseType.CANCELLATION in found_types
    assert ClauseType.LIABILITY in found_types

    # Fee matches declared pricing exactly -> no hidden-fee flag.
    hidden_fee_flags = [f for f in result.flags if f.tag == "Hidden Fee"]
    assert hidden_fee_flags == []
    assert result.model_used == "fake"


@pytest.mark.asyncio
async def test_hidden_fee_not_in_declared_pricing_is_flagged(analysis_service):
    text = load_fixture("hidden_fee_agreement.txt")
    declared = [
        DeclaredFee(
            service_name="Application package",
            amount_poisha=65000 * 100,  # only the 65,000 fee is declared
            when_charged="on_signup",
            refundable=False,
        )
    ]

    result = await analysis_service.analyze(text, declared_pricing=declared)

    hidden_fee_flags = [f for f in result.flags if f.tag == "Hidden Fee"]
    assert len(hidden_fee_flags) == 1
    flag = hidden_fee_flags[0]
    assert flag.severity == FlagSeverity.DANGER
    assert flag.amount_poisha == 5000 * 100
    assert "5,000" in flag.message_en or "5000" in flag.message_en
    assert result.verdict == "high_risk"


@pytest.mark.asyncio
async def test_fee_matching_declared_pricing_within_tolerance_not_flagged(analysis_service):
    text = "The total service fee is Tk 65,000, payable on signing."
    declared = [
        DeclaredFee(
            service_name="Application package",
            amount_poisha=65000 * 100,
            when_charged="on_signup",
            refundable=False,
        )
    ]

    result = await analysis_service.analyze(text, declared_pricing=declared)
    assert [f for f in result.flags if f.tag == "Hidden Fee"] == []


@pytest.mark.asyncio
async def test_no_declared_pricing_flags_every_fee_as_hidden(analysis_service):
    text = "The total service fee is Tk 65,000, payable on signing."
    result = await analysis_service.analyze(text, declared_pricing=[])
    assert len(result.flags) == 1
    assert result.flags[0].tag == "Hidden Fee"


@pytest.mark.asyncio
async def test_ambiguous_refund_language_is_flagged_with_plain_explanation(analysis_service):
    text = load_fixture("ambiguous_refund_agreement.txt")

    result = await analysis_service.analyze(text, declared_pricing=[])

    ambiguous_flags = [f for f in result.flags if f.tag == "Ambiguous Refund"]
    assert len(ambiguous_flags) >= 1
    for flag in ambiguous_flags:
        assert flag.severity == FlagSeverity.WARNING
        assert len(flag.message_en) > 0
        # Must be understandable to a non-lawyer — no legal jargon assertion,
        # but must reference the ambiguity explicitly.
        assert "vague" in flag.message_en.lower() or "specify" in flag.message_en.lower()


@pytest.mark.asyncio
async def test_contradictory_refund_percentages_are_flagged(analysis_service):
    text = load_fixture("ambiguous_refund_agreement.txt")  # contains both 50% and 20%

    result = await analysis_service.analyze(text, declared_pricing=[])

    contradiction_flags = [f for f in result.flags if f.tag == "Contradictory Refund Terms"]
    assert len(contradiction_flags) == 1
    assert contradiction_flags[0].severity == FlagSeverity.DANGER
    assert "50%" in contradiction_flags[0].message_en
    assert "20%" in contradiction_flags[0].message_en


@pytest.mark.asyncio
async def test_verdict_escalates_with_severity(analysis_service):
    clear = await analysis_service.analyze("No fees or refunds mentioned at all.", declared_pricing=[])
    assert clear.verdict == "clear"

    ambiguous_only = await analysis_service.analyze(
        "A partial refund may be issued at the Agency's discretion.", declared_pricing=[]
    )
    assert ambiguous_only.verdict == "needs_review"

    hidden_fee = await analysis_service.analyze(
        "The total service fee is Tk 65,000.", declared_pricing=[]
    )
    assert hidden_fee.verdict == "high_risk"


@pytest.mark.asyncio
async def test_empty_agreement_text_returns_no_clauses_and_clear_verdict(analysis_service):
    result = await analysis_service.analyze("", declared_pricing=[])
    assert result.clauses == []
    assert result.flags == []
    assert result.verdict == "clear"
