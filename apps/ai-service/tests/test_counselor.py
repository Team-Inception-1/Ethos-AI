"""
Unit and API integration tests for the AI Counselor feature (Module 5.18 & 5.11).
Tests run 100% offline without requiring external API keys.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import (
    ChatMessageRole,
    CounselorChatMessage,
    CounselorChatRequest,
    CounselorEvaluationRequest,
    FlagSeverity,
    UniversityTier,
)
from app.services.counselor_engine import (
    effective_ielts_band,
    evaluate_counselor_profile,
    normalize_gpa,
)
from app.services.counselor_knowledge import convert_to_bdt_lakh


client = TestClient(app)


def test_normalize_gpa():
    assert normalize_gpa(5.0, 5.0) == 4.0
    assert normalize_gpa(4.0, 5.0) == 3.2
    assert normalize_gpa(3.5, 4.0) == 3.5
    assert normalize_gpa(4.5, 4.0) == 4.0  # capped


def test_effective_ielts_band():
    req_ielts = CounselorEvaluationRequest(
        gpa=3.5, budget_yearly_bdt_lakh=20.0, ielts_score=7.5
    )
    assert effective_ielts_band(req_ielts) == 7.5

    req_pte = CounselorEvaluationRequest(
        gpa=3.5, budget_yearly_bdt_lakh=20.0, pte_score=68
    )
    assert effective_ielts_band(req_pte) == 7.0

    req_duolingo = CounselorEvaluationRequest(
        gpa=3.5, budget_yearly_bdt_lakh=20.0, duolingo_score=115
    )
    assert effective_ielts_band(req_duolingo) == 6.5

    req_none = CounselorEvaluationRequest(
        gpa=3.5, budget_yearly_bdt_lakh=20.0
    )
    assert effective_ielts_band(req_none) == 6.0


def test_currency_conversion():
    bdt_lakh = convert_to_bdt_lakh(10000.0, "EUR")
    assert bdt_lakh > 0
    # 10,000 EUR * 133 = 1,330,000 BDT = 13.3 Lakh
    assert pytest.approx(bdt_lakh, 0.1) == 13.3


def test_evaluate_counselor_profile_balanced():
    req = CounselorEvaluationRequest(
        current_degree="bachelor",
        gpa=3.4,
        max_gpa=4.0,
        ielts_score=6.5,
        budget_yearly_bdt_lakh=25.0,
        target_countries=["Germany", "UK", "USA"],
        target_field="Computer Science",
        study_gap_years=1,
        preferred_intake="Fall 2026",
        has_work_experience=False,
    )
    res = evaluate_counselor_profile(req)

    assert len(res.recommendations) > 0
    assert res.dream_count >= 1
    assert res.target_count >= 1
    assert res.safe_count >= 1

    # Check that tiers have logical admission chance ranges
    for r in res.recommendations:
        if r.tier == UniversityTier.DREAM:
            assert r.admission_chance_percent <= 40
        elif r.tier == UniversityTier.SAFE:
            assert r.admission_chance_percent >= 75
        elif r.tier == UniversityTier.TARGET:
            assert 40 <= r.admission_chance_percent <= 80

    assert len(res.roadmap) == 6
    assert res.visa_assessment.readiness_score >= 60


def test_evaluate_counselor_profile_study_gap_risk():
    req = CounselorEvaluationRequest(
        current_degree="bachelor",
        gpa=3.0,
        max_gpa=4.0,
        ielts_score=6.0,
        budget_yearly_bdt_lakh=15.0,
        target_countries=["Germany", "Australia"],
        study_gap_years=4,
        has_work_experience=False,
    )
    res = evaluate_counselor_profile(req)

    # Danger flag for study gap without employment
    danger_flags = [f for f in res.visa_assessment.risk_flags if f.severity == FlagSeverity.DANGER]
    assert len(danger_flags) >= 1
    assert "study gap" in danger_flags[0].title.lower() or "গ্যাপ" in danger_flags[0].title
    assert res.visa_assessment.readiness_score < 70


def test_api_evaluate_endpoint():
    payload = {
        "current_degree": "bachelor",
        "gpa": 3.6,
        "max_gpa": 4.0,
        "ielts_score": 7.0,
        "budget_yearly_bdt_lakh": 30.0,
        "target_countries": ["UK", "Canada"],
        "target_field": "Software Engineering",
        "study_gap_years": 0,
        "preferred_intake": "Fall 2026",
        "language": "en",
    }
    response = client.post("/api/ai/counselor/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert "visa_assessment" in data
    assert "roadmap" in data
    assert data["profile_summary"]["normalized_gpa"] == 3.6


def test_scholarship_and_moi_filters():
    req = CounselorEvaluationRequest(
        current_degree="bachelor",
        gpa=3.5,
        budget_yearly_bdt_lakh=20.0,
        scholarship_priority=True,
        moi_only=True,
    )
    res = evaluate_counselor_profile(req)
    assert len(res.recommendations) > 0
    # Top recommendations should accept MOI or offer scholarships
    top = res.recommendations[0]
    assert top.scholarship_info is not None or top.accepts_moi is True


def test_api_chat_english():
    payload = {
        "messages": [
            {"role": "user", "content": "How much bank balance is required for Germany student visa?"}
        ],
        "profile_context": {
            "gpa": 3.2,
            "max_gpa": 4.0,
            "budget_yearly_bdt_lakh": 18.0,
            "study_gap_years": 1,
        },
        "language": "en",
    }
    response = client.post("/api/ai/counselor/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["detected_language"] == "en"
    assert "11,904" in data["reply"] or "blocked account" in data["reply"].lower()
    assert len(data["suggested_queries"]) >= 1


def test_api_chat_bangla():
    payload = {
        "messages": [
            {"role": "user", "content": "জার্মানিতে পড়ার খরচ কেমন আর ব্লকড অ্যাকাউন্টে কত টাকা লাগে?"}
        ],
        "profile_context": {
            "gpa": 3.2,
            "max_gpa": 4.0,
            "budget_yearly_bdt_lakh": 18.0,
            "study_gap_years": 1,
        },
        "language": "bn",
    }
    response = client.post("/api/ai/counselor/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["detected_language"] == "bn"
    assert "ব্লকড" in data["reply"] or "ইউরো" in data["reply"]
    assert len(data["suggested_queries"]) >= 1


def test_api_countries_endpoint():
    response = client.get("/api/ai/counselor/countries")
    assert response.status_code == 200
    data = response.json()
    assert "countries" in data
    assert "Germany" in data["countries"]
    assert "UK" in data["countries"]
