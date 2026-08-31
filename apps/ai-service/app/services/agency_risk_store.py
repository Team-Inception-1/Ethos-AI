"""
Rolling per-agency risk score store (Module 5.10, Issue #23).

Per the DoD: "Rolling `riskScore` computed per agency and exposed via the
core API for display on the public agency profile." Combines flagged
content (from `POST /api/ai/scan-content`) with complaint history and
review sentiment (pushed in by the core Node API via
`POST /api/ai/agencies/{agency_id}/risk-events` — those two sources live in
the core Node DB, not here; see ETHOS_AI_CONTEXT.md §10 on keeping AI logic
isolated behind a clean internal API).

Storage: in-memory, process-local. This is intentionally simple for a course
project — good enough to make the DoD's contract fully real and testable
end-to-end today. When #14's Prisma schema lands, swap this class's internals
for a DB-backed implementation without changing its public method signatures
(`record_event` / `get_score`), so callers (the router) never need to change.

Scoring model: risk_score is a decayed weighted rollup, capped at [0, 100].
Each event nudges the score toward its own weight rather than simply summing,
so:
  - one severe event (weight near 100) moves the score sharply,
  - many small events accumulate gradually,
  - the score can also recover downward over time as an agency's more recent
    events are cleaner (not implemented as literal time-decay here — kept as
    a simple exponential moving average, which is standard for this kind of
    rolling trust score and easy to reason about / unit test).
"""
from __future__ import annotations

import threading
from datetime import datetime, timezone

from app.schemas import AgencyRiskEvent, AgencyRiskScore

# How strongly each new event pulls the rolling score toward its own weight.
# 0.35 means a single new event closes ~35% of the gap to its weight — a few
# similar events in a row will dominate the score without one outlier event
# permanently pinning it.
_EMA_ALPHA = 0.35

# Only the N most recent events are kept per agency (memory bound + the
# `AgencyRiskScore.recent_events` field is meant for a short audit trail on
# the UI, not full history).
_MAX_RECENT_EVENTS = 20


class AgencyRiskStore:
    """Thread-safe in-memory store of rolling risk scores, keyed by agency_id."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._scores: dict[str, float] = {}
        self._flag_counts: dict[str, int] = {}
        self._events: dict[str, list[AgencyRiskEvent]] = {}

    def record_event(self, agency_id: str, source: str, weight: float, reason: str) -> AgencyRiskScore:
        """Fold one new risk event into `agency_id`'s rolling score and return
        the updated `AgencyRiskScore`."""
        event = AgencyRiskEvent(source=source, weight=weight, reason=reason)

        with self._lock:
            previous = self._scores.get(agency_id, 0.0)
            updated = previous + _EMA_ALPHA * (weight - previous)
            updated = max(0.0, min(100.0, updated))
            self._scores[agency_id] = updated
            self._flag_counts[agency_id] = self._flag_counts.get(agency_id, 0) + 1

            events = self._events.setdefault(agency_id, [])
            events.append(event)
            del events[:-_MAX_RECENT_EVENTS]  # keep only the most recent N

            return AgencyRiskScore(
                agency_id=agency_id,
                risk_score=round(updated, 2),
                flag_count=self._flag_counts[agency_id],
                last_updated=datetime.now(timezone.utc),
                recent_events=list(events),
            )

    def get_score(self, agency_id: str) -> AgencyRiskScore:
        """Return `agency_id`'s current score. Agencies with no recorded
        events yet default to a clean 0/100 score rather than an error —
        every agency should be displayable on the Directory even before any
        scan has ever run against it."""
        with self._lock:
            return AgencyRiskScore(
                agency_id=agency_id,
                risk_score=round(self._scores.get(agency_id, 0.0), 2),
                flag_count=self._flag_counts.get(agency_id, 0),
                last_updated=datetime.now(timezone.utc),
                recent_events=list(self._events.get(agency_id, [])),
            )


# Process-wide singleton — mirrors the `_cached_default` pattern in
# `app/llm/factory.py`. A course-project-scale FastAPI service runs as a
# single process, so this is sufficient; a DB-backed store (see module
# docstring) would remove the need for this singleton entirely.
_default_store: AgencyRiskStore | None = None


def get_agency_risk_store() -> AgencyRiskStore:
    global _default_store
    if _default_store is None:
        _default_store = AgencyRiskStore()
    return _default_store
