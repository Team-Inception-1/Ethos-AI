"""
Rule-based predatory-phrase pre-filter for the Scam Alert System (Module 5.10).

Per Issue #23's DoD: "≥10 rule-based predatory-phrase patterns pre-filter
before LLM escalation." This module is the cheap, deterministic first pass —
regex matching against known scam patterns commonly seen in Bangladeshi
study-abroad consultancy fraud (per ETHOS_AI_CONTEXT.md's problem statement).

Design: each pattern is checked independently (a single sentence can trigger
multiple categories, e.g. a guarantee claim AND urgency pressure in one line).
Patterns are intentionally simple/interpretable — a human reviewer should be
able to read this file and understand exactly why something got flagged,
which matters for a trust & safety feature.
"""
from __future__ import annotations

import re

from app.schemas import FlagSeverity, ScamCategory, ScamFlag, ScamFlagSource

# --- Pattern definitions ----------------------------------------------------
# (tag, category, severity, regex, message_en)
#
# At least 10 patterns required by the DoD — there are 14 here, grouped by
# category, covering the scam patterns most reported in BD study-abroad fraud:
# fake guarantees, high-pressure urgency tactics, fabricated official
# affiliations, and attempts to move payment outside the escrow system.

_PATTERNS: list[tuple[str, ScamCategory, FlagSeverity, str, str]] = [
    # --- Guarantee claims (no legitimate agency can guarantee visa/admission outcomes) ---
    (
        "100% Visa Guarantee",
        ScamCategory.GUARANTEE_CLAIM,
        FlagSeverity.DANGER,
        r"\b100\s?%\s*(visa|admission|acceptance)\s*(guarantee|guaranteed|assured)?\b",
        "No consultancy can legitimately guarantee a visa or admission outcome — decisions are "
        "made solely by the embassy/university. This is a classic red flag phrase used in "
        "study-abroad fraud.",
    ),
    (
        "Guaranteed Admission",
        ScamCategory.GUARANTEE_CLAIM,
        FlagSeverity.DANGER,
        r"\bguaranteed?\s+(admission|acceptance|enrol?ment)\b",
        "Admission decisions are made by universities, not consultancies. Any promise of "
        "'guaranteed admission' should be treated as a warning sign.",
    ),
    (
        "Guaranteed Visa Approval",
        ScamCategory.GUARANTEE_CLAIM,
        FlagSeverity.DANGER,
        r"\bguaranteed?\s+visa\s+(approval|success)\b",
        "Visa approval is decided by the destination country's embassy/immigration authority — "
        "no agency can guarantee this outcome.",
    ),
    (
        "No Visa No Fee (unqualified)",
        ScamCategory.GUARANTEE_CLAIM,
        FlagSeverity.WARNING,
        r"\bno\s+visa,?\s*no\s+fee\b",
        "This claim is sometimes used legitimately, but is also a common phrase in fraudulent "
        "marketing to build false confidence. Verify the exact refund terms in writing.",
    ),
    (
        "Zero Rejection Rate",
        ScamCategory.GUARANTEE_CLAIM,
        FlagSeverity.WARNING,
        r"\b(zero|0)\s?%?\s*rejection\s*rate\b",
        "A claimed 'zero rejection rate' is statistically implausible for any large volume of "
        "applications and is a common exaggeration in predatory marketing.",
    ),
    # --- Urgency / pressure tactics ---
    (
        "Offer Expires Today",
        ScamCategory.URGENCY_PRESSURE,
        FlagSeverity.WARNING,
        r"\b(offer|discount|seat)s?\s+(expires?|ends?)\s+(today|tonight|tomorrow)\b",
        "Artificial urgency ('expires today') is a pressure tactic used to rush decisions before "
        "you can research the agency or consult family. Take time to verify independently.",
    ),
    (
        "Limited Seats Pressure",
        ScamCategory.URGENCY_PRESSURE,
        FlagSeverity.WARNING,
        r"\bonly\s+\d+\s+seats?\s+(left|remaining)\b",
        "'Only X seats left' urgency claims are a common pressure tactic to rush payment before "
        "due diligence.",
    ),
    (
        "Act Now / Don't Miss Out",
        ScamCategory.URGENCY_PRESSURE,
        FlagSeverity.INFO,
        r"\b(act now|don'?t miss (this|out)|hurry\b|last chance)\b",
        "Generic urgency language. Not conclusive on its own, but worth noting alongside other "
        "flags.",
    ),
    (
        "Pay Immediately to Secure Slot",
        ScamCategory.URGENCY_PRESSURE,
        FlagSeverity.WARNING,
        r"\bpay\s+(immediately|now|today)\s+to\s+(secure|confirm|lock)\b",
        "Being pressured to pay immediately to 'secure a slot' — before receiving a formal offer "
        "letter or signed agreement — is a common fraud pattern.",
    ),
    # --- Unverifiable / fabricated official affiliation ---
    (
        "Fake Embassy Affiliation",
        ScamCategory.UNVERIFIABLE_CREDENTIAL,
        FlagSeverity.DANGER,
        r"\b(official|authorized)\s+(partner|representative|agent)\s+of\s+(the\s+)?embassy\b",
        "Consultancies are not embassy representatives. This claim is commonly fabricated to "
        "appear more credible — verify licensing independently with the relevant authority.",
    ),
    (
        "Government Approved (unverified)",
        ScamCategory.UNVERIFIABLE_CREDENTIAL,
        FlagSeverity.WARNING,
        r"\bgovernment[\s-]approved\b",
        "'Government approved' claims should be independently verified — Bangladesh currently "
        "has no mandatory licensing regime for overseas-education agents, so this claim often "
        "cannot be substantiated.",
    ),
    (
        "Direct University Partner (unverified)",
        ScamCategory.UNVERIFIABLE_CREDENTIAL,
        FlagSeverity.INFO,
        r"\b(direct|official)\s+(partner|representative)\s+of\s+[A-Z][\w&.,' -]{2,40}\s+University\b",
        "University-partner claims should be verified directly with the named university's "
        "international office before relying on them.",
    ),
    # --- Payment pressure / escrow bypass ---
    (
        "Cash Only Payment",
        ScamCategory.PAYMENT_PRESSURE,
        FlagSeverity.DANGER,
        r"\bcash\s+only\b",
        "Requests for cash-only payment (no receipt, no traceable transaction, outside escrow) "
        "are a major fraud red flag. Always insist on documented, traceable payment through the "
        "platform's escrow system.",
    ),
    (
        "Pay to Personal Account",
        ScamCategory.PAYMENT_PRESSURE,
        FlagSeverity.DANGER,
        r"\b(pay|transfer|send)\s+to\s+(my|his|her|this)\s+personal\s+(bank\s+)?account\b",
        "Being asked to pay to a personal (not agency/business) bank account bypasses financial "
        "protections and is a strong fraud indicator. Payments should always go through the "
        "escrow system.",
    ),
]


def scan_with_rules(text: str) -> list[ScamFlag]:
    """Run every pattern against `text`. Case-insensitive. Returns one `ScamFlag`
    per matched pattern (a pattern matches at most once, even if the phrase
    repeats in the text — we care about presence, not frequency, at this layer).
    """
    flags: list[ScamFlag] = []
    if not text or not text.strip():
        return flags

    for tag, category, severity, pattern, message in _PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            flags.append(
                ScamFlag(
                    tag=tag,
                    category=category,
                    severity=severity,
                    source=ScamFlagSource.RULE,
                    matched_text=match.group(0),
                    message_en=message,
                )
            )

    return flags


def pattern_count() -> int:
    """Exposed for tests asserting the DoD's '>=10 patterns' requirement
    without hardcoding the number twice."""
    return len(_PATTERNS)
