"""
API-level tests for the /api/ai/analyze-agreement* endpoints and /health.

Uses FastAPI's TestClient (via httpx) against the real app, with the LLM
dependency overridden to the deterministic FakeAgreementLLM so these run
offline and deterministically in CI.
"""
from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from app.llm.fake_provider import FakeAgreementLLM
from app.main import app
from app.routers.agreement import get_analysis_service
from app.services.agreement_analysis import AgreementAnalysisService
from tests.conftest import load_fixture


@pytest.fixture(autouse=True)
def override_llm():
    app.dependency_overrides[get_analysis_service] = lambda: AgreementAnalysisService(
        llm=FakeAgreementLLM()
    )
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "ethos-ai-service"
    assert "llm_configured" in body


def test_analyze_agreement_text_endpoint_happy_path(client):
    payload = {
        "agreement_text": load_fixture("hidden_fee_agreement.txt"),
        "declared_pricing": [
            {
                "service_name": "Application package",
                "amount_poisha": 6500000,
                "when_charged": "on_signup",
                "refundable": False,
            }
        ],
        "language": "en",
    }
    resp = client.post("/api/ai/analyze-agreement/text", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["model_used"] == "fake"
    assert body["verdict"] == "high_risk"
    assert any(f["tag"] == "Hidden Fee" for f in body["flags"])


def test_analyze_agreement_text_rejects_empty_text(client):
    resp = client.post(
        "/api/ai/analyze-agreement/text",
        json={"agreement_text": "", "declared_pricing": []},
    )
    # min_length=1 on the schema -> 422 from pydantic validation
    assert resp.status_code == 422


def test_analyze_agreement_file_upload_txt(client):
    content = load_fixture("clean_agreement.txt").encode("utf-8")
    resp = client.post(
        "/api/ai/analyze-agreement",
        files={"file": ("agreement.txt", content, "text/plain")},
        data={
            "declared_pricing": json.dumps(
                [
                    {
                        "service_name": "Application package",
                        "amount_poisha": 6500000,
                        "when_charged": "on_signup",
                        "refundable": True,
                    }
                ]
            ),
            "language": "en",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["clauses"]) > 0
    assert body["verdict"] in {"clear", "needs_review", "high_risk"}


def test_analyze_agreement_file_upload_rejects_unsupported_extension(client):
    resp = client.post(
        "/api/ai/analyze-agreement",
        files={"file": ("agreement.docx", b"whatever", "application/msword")},
    )
    assert resp.status_code == 415


def test_analyze_agreement_file_upload_rejects_invalid_declared_pricing_json(client):
    resp = client.post(
        "/api/ai/analyze-agreement",
        files={"file": ("agreement.txt", b"Some text.", "text/plain")},
        data={"declared_pricing": "{not valid json"},
    )
    assert resp.status_code == 422


def test_analyze_agreement_file_upload_empty_file_returns_422(client):
    resp = client.post(
        "/api/ai/analyze-agreement",
        files={"file": ("agreement.txt", b"   ", "text/plain")},
    )
    assert resp.status_code == 422
