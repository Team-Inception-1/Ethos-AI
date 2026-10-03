"""
Rolling per-agency risk score store (Module 5.10, Issue #23).

Per the DoD: "Rolling `riskScore` computed per agency and exposed via the
core API for display on the public agency profile." Combines flagged
content (from `POST /api/ai/scan-content`) with complaint history and
review sentiment (pushed in by the core Node API via
`POST /api/ai/agencies/{agency_id}/risk-events` — those two sources live in
the core Node DB, not here; see ETHOS_AI_CONTEXT.md §10 on keeping AI logic
isolated behind a clean internal API).

Production storage uses PostgreSQL transactions and per-agency row locks.
The in-memory implementation is selected only for tests or OFFLINE_DEMO.

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
from uuid import uuid4
from datetime import datetime, timezone
from fastapi import HTTPException
from app.config import get_settings

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


# The store object is cached; production scores and history remain in PostgreSQL.
class PostgresAgencyRiskStore:
    """Durable EMA and audit history, serialized per agency across workers."""

    def __init__(self, database_url: str, connect=None):
        if connect is None:
            import psycopg
            connect = psycopg.connect
        self._connect = connect
        self._database_url = database_url

    def _connection(self):
        return self._connect(self._database_url, connect_timeout=5)

    @staticmethod
    def _score(cursor, agency_id):
        cursor.execute('SELECT "riskScore", "flagCount", "updatedAt" FROM "AgencyRiskState" WHERE "agencyId" = %s', (agency_id,))
        state = cursor.fetchone()
        cursor.execute('SELECT "source", "weight", "reason", "occurredAt" FROM "AgencyRiskEvent" WHERE "agencyId" = %s ORDER BY "occurredAt" DESC, "id" DESC LIMIT 20', (agency_id,))
        events = [AgencyRiskEvent(source=row[0], weight=row[1], reason=row[2], occurred_at=row[3])
                  for row in reversed(cursor.fetchall())]
        return AgencyRiskScore(agency_id=agency_id, risk_score=round(state[0], 2) if state else 0,
                               flag_count=state[1] if state else 0,
                               last_updated=state[2] if state else datetime.now(timezone.utc),
                               recent_events=events)

    def record_event(self, agency_id: str, source: str, weight: float, reason: str) -> AgencyRiskScore:
        event = AgencyRiskEvent(source=source, weight=weight, reason=reason)
        try:
            with self._connection() as connection, connection.cursor() as cursor:
                cursor.execute('INSERT INTO "AgencyRiskState" ("agencyId", "riskScore", "flagCount", "updatedAt") VALUES (%s, 0, 0, NOW()) ON CONFLICT ("agencyId") DO NOTHING', (agency_id,))
                cursor.execute('SELECT "riskScore" FROM "AgencyRiskState" WHERE "agencyId" = %s FOR UPDATE', (agency_id,))
                row = cursor.fetchone()
                previous = row[0] if row else 0.0
                event.occurred_at = datetime.now(timezone.utc)
                updated = max(0.0, min(100.0, previous + _EMA_ALPHA * (weight - previous)))
                cursor.execute('UPDATE "AgencyRiskState" SET "riskScore" = %s, "flagCount" = "flagCount" + 1, "updatedAt" = %s WHERE "agencyId" = %s', (updated, event.occurred_at, agency_id))
                cursor.execute('INSERT INTO "AgencyRiskEvent" ("id", "agencyId", "source", "weight", "reason", "occurredAt") VALUES (%s, %s, %s, %s, %s, %s)', (str(uuid4()), agency_id, source, weight, reason, event.occurred_at))
                return self._score(cursor, agency_id)
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Agency risk storage is unavailable.") from exc

    def get_score(self, agency_id: str) -> AgencyRiskScore:
        try:
            with self._connection() as connection, connection.cursor() as cursor:
                # A single snapshot keeps the count/score and audit trail consistent.
                cursor.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
                return self._score(cursor, agency_id)
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Agency risk storage is unavailable.") from exc


AnyAgencyRiskStore = AgencyRiskStore | PostgresAgencyRiskStore
_default_store: AnyAgencyRiskStore | None = None


def get_agency_risk_store() -> AnyAgencyRiskStore:
    global _default_store
    if _default_store is None:
        settings = get_settings()
        if settings.deterministic_allowed:
            _default_store = AgencyRiskStore()
        elif settings.database_url:
            _default_store = PostgresAgencyRiskStore(settings.database_url)
        else:
            raise HTTPException(status_code=503, detail="Agency risk storage is not configured.")
    return _default_store
