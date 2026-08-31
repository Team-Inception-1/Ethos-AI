"""
Unit tests for the rule-based predatory-phrase pre-filter (Module 5.10,
Issue #23).

Covers the DoD's "≥10 rule-based predatory-phrase patterns" requirement and
verifies each pattern actually fires on a representative phrase.
"""
from __future__ import annotations

from app.schemas import FlagSeverity, ScamCategory, ScamFlagSource
from app.services.scam_rules import pattern_count, scan_with_rules


def test_pattern_count_meets_dod_minimum():
    assert pattern_count() >= 10


def test_empty_text_returns_no_flags():
    assert scan_with_rules("") == []
    assert scan_with_rules("   ") == []


def test_clean_text_returns_no_flags():
    text = (
        "We charge a transparent service fee of Tk 65,000, payable through the "
        "platform's escrow system, with a detailed breakdown provided before you sign."
    )
    assert scan_with_rules(text) == []


def test_all_rule_flags_are_source_rule():
    text = "We offer a 100% Visa Guarantee and a Zero Rejection Rate."
    flags = scan_with_rules(text)
    assert len(flags) >= 2
    assert all(f.source == ScamFlagSource.RULE for f in flags)


def test_guarantee_claim_patterns_detected():
    cases = [
        "We offer a 100% Visa Guarantee for every applicant.",
        "This package comes with Guaranteed Admission to top universities.",
        "We provide Guaranteed Visa Approval within 2 weeks.",
        "No Visa No Fee — sign up today.",
        "Our agency has a Zero Rejection Rate.",
    ]
    for text in cases:
        flags = scan_with_rules(text)
        assert len(flags) >= 1, f"expected a flag for: {text}"
        assert any(f.category == ScamCategory.GUARANTEE_CLAIM for f in flags), text


def test_urgency_pressure_patterns_detected():
    cases = [
        "This offer expires today, don't wait!",
        "Only 3 seats left for this intake.",
        "Act now before it's too late.",
        "Pay immediately to secure your slot in the program.",
    ]
    for text in cases:
        flags = scan_with_rules(text)
        assert any(f.category == ScamCategory.URGENCY_PRESSURE for f in flags), text


def test_unverifiable_credential_patterns_detected():
    cases = [
        "We are the official partner of the Embassy in Dhaka.",
        "Our agency is Government-approved for overseas placements.",
        "We are the Direct Partner of Oxford University.",
    ]
    for text in cases:
        flags = scan_with_rules(text)
        assert any(f.category == ScamCategory.UNVERIFIABLE_CREDENTIAL for f in flags), text


def test_payment_pressure_patterns_detected():
    cases = [
        "For this transaction, please pay Cash Only.",
        "Please transfer to my personal bank account for faster processing.",
    ]
    for text in cases:
        flags = scan_with_rules(text)
        assert any(f.category == ScamCategory.PAYMENT_PRESSURE for f in flags), text
        assert any(f.severity == FlagSeverity.DANGER for f in flags), text


def test_pattern_matches_at_most_once_even_if_phrase_repeats():
    text = "100% Visa Guarantee! We really mean it — 100% Visa Guarantee, guaranteed!"
    flags = scan_with_rules(text)
    guarantee_flags = [f for f in flags if f.tag == "100% Visa Guarantee"]
    assert len(guarantee_flags) == 1
