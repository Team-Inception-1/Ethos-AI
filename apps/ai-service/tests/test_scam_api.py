"""
API-level tests for the /api/ai/scan-content and /api/ai/agencies/* endpoints
(Module 5.10, Issue #23).

Uses FastAPI's TestClient against the real app, with the LLM dependency
overridden to the deterministic FakeScamLLM and a fresh in-memory risk store
per test, so these run offline and deterministically in CI.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.llm.fake_scam_provider import FakeScamLLM
from app.main import app
from app.routers.scam import get_classifier_service, get_risk_store
from app.services.agency_risk_store import AgencyRiskStore
from app.services.scam_classifier import ScamClassifierService
from tests.conftest import load_fixture


@pytest.fixture(autouse=True)
def override_scam_deps():
    fresh_store = AgencyRiskStore()
    app.dependency_overrides[get_classifier_service] = lambda: ScamClassifierService(
        llm=FakeScamLLM()
    )
    app.dependency_overrides[get_risk_store] = lambda: fresh_store
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_scan_content_endpoint_happy_path(client):
    resp = client.post(
        "/api/ai/scan-content",
        json={"text": load_fixture("scam_marketing_copy.txt"), "source": "agency_profile"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["model_used"] == "fake"
    assert body["severity"] == "danger"
    assert len(body["flags"]) >= 3
    assert all({"tag", "category", "severity", "source", "matched_text", "message_en"} <= f.keys()
               for f in body["flags"])


def test_scan_content_endpoint_clean_text(client):
    resp = client.post(
        "/api/ai/scan-content",
        json={"text": load_fixture("clean_marketing_copy.txt")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["flags"] == []
    assert body["severity"] == "info"


def test_scan_content_rejects_empty_text(client):
    resp = client.post("/api/ai/scan-content", json={"text": ""})
    assert resp.status_code == 422


def test_scan_content_with_agency_id_records_risk_event(client):
    scan_resp = client.post(
        "/api/ai/scan-content",
        json={
            "text": load_fixture("scam_marketing_copy.txt"),
            "source": "agency_profile",
            "agency_id": "agt-001",
        },
    )
    assert scan_resp.status_code == 200

    score_resp = client.get("/api/ai/agencies/agt-001/risk-score")
    assert score_resp.status_code == 200
    score_body = score_resp.json()
    assert score_body["agency_id"] == "agt-001"
    assert score_body["risk_score"] > 0
    assert score_body["flag_count"] == 1
    assert len(score_body["recent_events"]) == 1


def test_scan_content_without_agency_id_does_not_record_risk_event(client):
    client.post("/api/ai/scan-content", json={"text": load_fixture("scam_marketing_copy.txt")})
    score_resp = client.get("/api/ai/agencies/some-other-agency/risk-score")
    assert score_resp.json()["flag_count"] == 0


def test_get_risk_score_for_unknown_agency_returns_clean_default(client):
    resp = client.get("/api/ai/agencies/never-scanned/risk-score")
    assert resp.status_code == 200
    body = resp.json()
    assert body["risk_score"] == 0.0
    assert body["flag_count"] == 0


def test_record_risk_event_endpoint_for_complaint(client):
    resp = client.post(
        "/api/ai/agencies/agt-002/risk-events",
        json={"source": "complaint", "weight": 70.0, "reason": "Student complaint: undisclosed fee"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["agency_id"] == "agt-002"
    assert body["risk_score"] > 0
    assert body["flag_count"] == 1
    assert body["recent_events"][0]["source"] == "complaint"


def test_scan_and_manual_risk_events_accumulate_on_same_agency(client):
    client.post(
        "/api/ai/scan-content",
        json={"text": load_fixture("scam_marketing_copy.txt"), "agency_id": "agt-003"},
    )
    client.post(
        "/api/ai/agencies/agt-003/risk-events",
        json={"source": "review_sentiment", "weight": 60.0, "reason": "Negative review trend"},
    )
    score_resp = client.get("/api/ai/agencies/agt-003/risk-score")
    body = score_resp.json()
    assert body["flag_count"] == 2
    assert len(body["recent_events"]) == 2
