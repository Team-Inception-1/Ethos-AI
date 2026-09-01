"""
Optional startup seeding for the demo/course-project Directory UI (#25).

`AgencyRiskStore` is in-memory and starts empty — every agency reads as a
clean 0/100 until a real scan or risk-event happens. That's correct
behavior, but it means the Directory page (`apps/web`) would show every
agency at 0 on first load, which doesn't demonstrate the feature.

This module runs a handful of REAL scans (through the actual
`ScamClassifierService` — rule pre-filter + live Gemini escalation, exactly
the same pipeline `POST /api/ai/scan-content` uses) against representative
marketing copy for the six demo agencies already hardcoded in
`DirectoryPage.tsx` (`agt-001` .. `agt-006`). The resulting risk scores are
therefore genuinely computed by the classifier, not fabricated — this is
demo *content*, not a demo *score*.

Safe to skip/fail silently: if this errors (e.g. no LLM configured), the
store just stays empty and every agency displays a clean 0, which is still
a valid, honest state.
"""
from __future__ import annotations

import logging

from app.llm.scam_factory import get_scam_llm
from app.services.agency_risk_store import AgencyRiskStore
from app.services.scam_classifier import ScamClassifierService

logger = logging.getLogger(__name__)

# (agency_id, sample marketing copy). Deliberately mirrors the spread of the
# old hardcoded mock `risk` values in DirectoryPage.tsx — clean copy for the
# verified, well-rated agencies; predatory copy for the one flagged as
# unverified/low-rated in that same mock data — but the actual SCORE below
# comes from running this text through the real classifier, not from
# copying those old numbers.
_DEMO_AGENCY_COPY: list[tuple[str, str]] = [
    (
        "agt-001",
        "Global Edu BD helps students apply to top universities in Canada, the UK, and "
        "Australia. Our transparent service fee is clearly listed on your dashboard before "
        "you sign anything, and all payments go through the platform's secure escrow system.",
    ),
    (
        "agt-002",
        "Dream Abroad Ltd offers personalized counseling for study destinations including "
        "the USA, Germany, and the Netherlands. We provide a detailed cost breakdown up "
        "front and are happy to answer any questions about our refund policy in writing.",
    ),
    (
        "agt-003",
        "EduPath Global specializes in Canada, New Zealand, and Sweden applications. Our "
        "counselors will review your academic background honestly, including cases where "
        "we don't think a particular program is a good fit for you.",
    ),
    (
        "agt-004",
        "Skyline Consultancy — 100% Visa Guarantee for the UK and Ireland! Zero Rejection "
        "Rate this intake. Only 2 seats left — act now and pay cash only to secure your "
        "slot before the offer expires today.",
    ),
    (
        "agt-005",
        "StudyBridge BD has helped hundreds of students reach Canada, Australia, and the "
        "USA. All fees are disclosed up front in a written agreement, with a clear, fixed "
        "refund percentage stated for every scenario.",
    ),
    (
        "agt-006",
        "AbraodX Partners assists with applications to Germany, Sweden, and Finland. We are "
        "government-approved and a direct partner of several universities — happy to share "
        "verification documents for both claims on request.",
    ),
]


async def seed_demo_risk_events(store: AgencyRiskStore) -> None:
    """Run real scans against demo agency copy and record the results.

    Idempotent-ish: safe to call more than once (each call just adds one
    more real scan event per agency, nudging the EMA score slightly — it
    won't corrupt anything), but is intended to run once at service startup.
    """
    classifier = ScamClassifierService(llm=get_scam_llm())

    for agency_id, text in _DEMO_AGENCY_COPY:
        try:
            result = await classifier.scan(text, language="en")
        except Exception:  # pragma: no cover - best-effort demo seeding only
            logger.exception("Demo risk-event seeding failed for %s; skipping", agency_id)
            continue

        if not result.flags:
            continue

        weight = {"info": 10.0, "warning": 45.0, "danger": 85.0}[result.severity.value]
        tags = ", ".join(f.tag for f in result.flags[:5])
        store.record_event(
            agency_id=agency_id,
            source="scan",
            weight=weight,
            reason=f"Content scan (demo seed) flagged: {tags}",
        )

    logger.info("Demo risk-event seeding complete (model=%s)", classifier._llm.name)  # noqa: SLF001
