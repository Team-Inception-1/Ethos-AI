"""
Unit tests for the rolling per-agency risk score store (Module 5.10, Issue #23).
"""
from __future__ import annotations

from app.services.agency_risk_store import AgencyRiskStore


def test_unknown_agency_defaults_to_clean_score():
    store = AgencyRiskStore()
    score = store.get_score("agt-999")
    assert score.risk_score == 0.0
    assert score.flag_count == 0
    assert score.recent_events == []


def test_single_danger_event_moves_score_up_sharply():
    store = AgencyRiskStore()
    score = store.record_event("agt-001", source="scan", weight=85.0, reason="Detected guarantee claim")
    assert score.risk_score > 0
    assert score.flag_count == 1
    assert len(score.recent_events) == 1
    assert score.recent_events[0].reason == "Detected guarantee claim"


def test_score_stays_within_bounds():
    store = AgencyRiskStore()
    score = None
    for _ in range(50):
        score = store.record_event("agt-002", source="scan", weight=100.0, reason="x")
    assert score is not None
    assert 0.0 <= score.risk_score <= 100.0
    score2 = store.record_event("agt-003", source="scan", weight=0.0, reason="y")
    assert 0.0 <= score2.risk_score <= 100.0


def test_repeated_clean_events_pull_score_toward_zero():
    store = AgencyRiskStore()
    store.record_event("agt-004", source="scan", weight=90.0, reason="bad")
    high = store.get_score("agt-004").risk_score
    score = None
    for _ in range(10):
        score = store.record_event("agt-004", source="scan", weight=0.0, reason="clean scan")
    assert score is not None
    assert score.risk_score < high


def test_events_are_isolated_per_agency():
    store = AgencyRiskStore()
    store.record_event("agt-005", source="scan", weight=90.0, reason="bad")
    other = store.get_score("agt-006")
    assert other.risk_score == 0.0
    assert other.flag_count == 0


def test_recent_events_capped_at_max():
    store = AgencyRiskStore()
    for i in range(30):
        store.record_event("agt-007", source="scan", weight=50.0, reason=f"event-{i}")
    score = store.get_score("agt-007")
    assert score.flag_count == 30
    assert len(score.recent_events) <= 20
    # Most recent events should be retained (not the oldest).
    assert score.recent_events[-1].reason == "event-29"
