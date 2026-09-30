"""Tests for the SOP Auditor endpoint (POST /api/ai/counselor/audit-sop)."""
from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

BASE = "http://test"


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url=BASE, headers={"Authorization": "Bearer offline-test-token"}) as ac:
        yield ac


SAMPLE_SOP_WITH_CLICHES = (
    "Since childhood, I have been passionate about computer science. "
    "In this globalized world, technology plays a crucial role. "
    "I want to broaden my horizons by studying at your esteemed university. "
    "After completing my degree, I plan to give back to my country. "
    "I have always wanted to pursue higher education abroad. "
    "My academic journey has been remarkable, and I believe that studying "
    "at this prestigious institution will help me achieve my dream of mine "
    "to become a successful software engineer. I am confident that my skills "
    "and dedication will allow me to excel in the program and contribute "
    "meaningfully to the field of computer science."
)

SAMPLE_SOP_STRONG = (
    "During my third year at United International University, I developed a fraud detection "
    "system using Python and TensorFlow that identified 94% of fake offer letters. This project, "
    "supervised by Professor Rahman, sparked my interest in applying machine learning to real-world "
    "security problems. I am applying to the MSc Computer Science program at Technical University of Munich "
    "specifically because of Professor Dr. Stephan Günnemann's research group on Graph Neural Networks, "
    "which aligns directly with my thesis work on graph-based document verification. My father runs "
    "an IT consultancy firm in Dhaka, and after completing my studies, I plan to return to Bangladesh "
    "to integrate advanced ML techniques into our family business, serving the growing demand for "
    "AI-driven security solutions in South Asian banking. The TUM Data Innovation Lab's industry "
    "partnerships will provide invaluable hands-on experience for this career goal."
)


@pytest.mark.anyio
async def test_audit_sop_basic(client: AsyncClient):
    """POST /audit-sop returns a valid structured response."""
    resp = await client.post(
        "/api/ai/counselor/audit-sop",
        json={"sop_text": SAMPLE_SOP_WITH_CLICHES},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "overall_score" in data
    assert 0 <= data["overall_score"] <= 100
    assert data["verdict"] in ("strong", "needs_work", "weak")
    assert "findings" in data
    assert isinstance(data["findings"], list)
    assert data["cliche_count"] >= 0
    assert 0 <= data["visa_intent_score"] <= 100
    assert 0 <= data["university_alignment_score"] <= 100
    assert "summary" in data
    assert "model_used" in data


@pytest.mark.anyio
async def test_audit_sop_detects_cliches(client: AsyncClient):
    """Cliché-heavy SOP should have cliche_count > 0."""
    resp = await client.post(
        "/api/ai/counselor/audit-sop",
        json={"sop_text": SAMPLE_SOP_WITH_CLICHES},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["cliche_count"] > 0
    cliche_findings = [f for f in data["findings"] if f["category"] == "cliche"]
    assert len(cliche_findings) > 0


@pytest.mark.anyio
async def test_audit_sop_with_profile_context(client: AsyncClient):
    """SOP audit accepts profile context."""
    resp = await client.post(
        "/api/ai/counselor/audit-sop",
        json={
            "sop_text": SAMPLE_SOP_STRONG,
            "target_university": "Technical University of Munich",
            "target_country": "Germany",
            "target_program": "MSc Computer Science",
            "profile_context": {
                "gpa": 3.5,
                "budget_yearly_bdt_lakh": 20.0,
                "target_field": "Computer Science",
            },
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["university_alignment_score"] > 0


@pytest.mark.anyio
async def test_audit_sop_too_short(client: AsyncClient):
    """SOP shorter than 50 chars should be rejected (422)."""
    resp = await client.post(
        "/api/ai/counselor/audit-sop",
        json={"sop_text": "Too short."},
    )
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_audit_sop_university_alignment_low_when_generic(client: AsyncClient):
    """Generic SOP with no university mention should score low on alignment."""
    resp = await client.post(
        "/api/ai/counselor/audit-sop",
        json={
            "sop_text": SAMPLE_SOP_WITH_CLICHES,
            "target_university": "University of Oxford",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["university_alignment_score"] < 50


@pytest.mark.anyio
async def test_chat_includes_citations_field(client: AsyncClient):
    """Chat response should include citations field (even if empty in offline mode)."""
    resp = await client.post(
        "/api/ai/counselor/chat",
        json={
            "messages": [{"role": "user", "content": "How much is the blocked account for Germany?"}],
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "citations" in data
    assert isinstance(data["citations"], list)
