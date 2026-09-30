"""
Tests for ScholarFinder & RA/TA Full-Fund Scholarship Suite (FastAPI).
Runs 100% offline without external API keys.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import (
    ColdEmailGenerateRequest,
    InterviewPrepRequest,
    ProfessorProfile,
    ProfessorSearchRequest,
)
from app.services.scholar_engine import (
    audit_email_quality,
    generate_cold_email,
    get_tara_guide,
    prepare_interview,
    search_professors,
)
from app.services.scholar_knowledge import SEED_PROFESSORS

client = TestClient(app, headers={"Authorization": "Bearer offline-test-token"})


def test_seed_professors_structure():
    assert len(SEED_PROFESSORS) >= 5
    for p in SEED_PROFESSORS:
        assert "id" in p
        assert "name" in p
        assert "university" in p
        assert "email" in p
        assert len(p["recent_publications"]) >= 1


def test_search_professors_all():
    req = ProfessorSearchRequest()
    res = search_professors(req)
    assert res.total >= len(SEED_PROFESSORS)
    assert len(res.professors) >= 1
    assert "Computer Science & AI" in res.domains_available
    assert "USA" in res.countries_available


def test_search_professors_by_domain():
    req = ProfessorSearchRequest(domain="Biomedical & Bioinformatics")
    res = search_professors(req)
    assert res.total >= 1
    for p in res.professors:
        assert "Biomedical" in p.primary_domain


def test_search_professors_by_country():
    req = ProfessorSearchRequest(countries=["Canada"])
    res = search_professors(req)
    assert res.total >= 1
    for p in res.professors:
        assert p.country == "Canada"


def test_search_professors_by_query():
    req = ProfessorSearchRequest(query="Stanford")
    res = search_professors(req)
    assert res.total >= 1
    assert any("Stanford" in p.university for p in res.professors)


def test_api_search_endpoint():
    response = client.post("/api/ai/scholar/search", json={"query": "Robotics"})
    assert response.status_code == 200
    data = response.json()
    assert "professors" in data
    assert data["total"] >= 1


def test_api_get_professor_by_id():
    first_id = SEED_PROFESSORS[0]["id"]
    response = client.get(f"/api/ai/scholar/professors/{first_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == first_id

    # 404 test
    notFound = client.get("/api/ai/scholar/professors/non-existent-id-12345")
    assert notFound.status_code == 404


def test_cold_email_generation_and_audit():
    prof = SEED_PROFESSORS[0]
    payload = ColdEmailGenerateRequest(
        professor=ProfessorProfile(
            id=prof["id"],
            name=prof["name"],
            title=prof["title"],
            university=prof["university"],
            department=prof["department"],
            country=prof["country"],
            tier=prof["tier"],
            lab_name=prof["lab_name"],
            lab_url=prof.get("lab_url"),
            email=prof["email"],
            google_scholar_url=prof.get("google_scholar_url"),
            primary_domain=prof["primary_domain"],
            research_interests=prof["research_interests"],
            active_funding_indicator=True,
            funding_sources=prof["funding_sources"],
            accepting_students=True,
            recent_publications=prof["recent_publications"],
        ),
        selected_paper_title=prof["recent_publications"][0]["title"],
        student_name="Tanvir Ahmed",
        student_degree="B.Sc. in Computer Science & Engineering",
        student_institution="BUET",
        student_gpa="3.88",
        student_skills=["PyTorch", "Reinforcement Learning", "CUDA"],
        student_thesis_topic="Vision-based robotic manipulation under domain shift",
        target_degree="PhD",
        target_semester="Fall 2026",
    )

    res = generate_cold_email(payload)
    assert res.initial_email.word_count >= 100
    assert "Dear Professor" in res.initial_email.body
    assert "Tanvir Ahmed" in res.initial_email.body
    assert len(res.subject_line_options) >= 3
    assert "Re:" in res.follow_up_1.subject_line
    assert res.anti_spam_audit.overall_score >= 70
    assert res.anti_spam_audit.verdict in ["Ready to Send", "Needs Refinement"]
    assert len(res.bangla_guidance) > 20


def test_api_generate_email_endpoint():
    prof = SEED_PROFESSORS[1]
    req_json = {
        "professor": prof,
        "selected_paper_title": prof["recent_publications"][0]["title"],
        "student_name": "Sadia Islam",
        "student_degree": "B.Sc. in CSE",
        "student_institution": "Dhaka University",
        "student_gpa": "3.75",
        "student_skills": ["PyTorch", "Adversarial Robustness"],
        "target_degree": "MS with Thesis",
        "target_semester": "Fall 2026",
    }
    response = client.post("/api/ai/scholar/generate-email", json=req_json)
    assert response.status_code == 200
    data = response.json()
    assert "initial_email" in data
    assert "follow_up_1" in data
    assert "anti_spam_audit" in data


def test_interview_prep():
    req = InterviewPrepRequest(
        professor_name="Dr. Chelsea Finn",
        university="Stanford University",
        research_interests=["Robotic Manipulation", "Meta-Learning"],
        recent_paper_title="Generalist Robot Policies via Diffusion and Action Chunking",
        student_skills=["PyTorch", "ROS", "Diffusion Models"],
    )
    res = prepare_interview(req)
    assert len(res.predicted_questions) >= 3
    for q in res.predicted_questions:
        assert q.question
        assert q.why_prof_asks_this
        assert q.strong_answer_strategy


def test_api_guide_endpoint():
    response = client.get("/api/ai/scholar/guide")
    assert response.status_code == 200
    data = response.json()
    assert "countries" in data
    assert len(data["countries"]) >= 4
    assert "USA" in [c["country"] for c in data["countries"]]
    assert "speaking_score_thresholds" in data


def test_cv_parsing_text():
    from app.services.scholar_engine import parse_cv_text
    sample_cv = """
    Towsif Rahman
    Email: towsif.rahman@buet.ac.bd
    Education:
    B.Sc. in Computer Science & Engineering
    Bangladesh University of Engineering and Technology (BUET)
    CGPA: 3.89 / 4.00
    Technical Skills:
    Python, PyTorch, C++, CUDA, ROS, Computer Vision, Deep Learning, Git, Linux
    Undergraduate Thesis:
    Robust Multi-Modal Trajectory Planning for Autonomous Aerial Vehicles
    Publications:
    1. T. Rahman et al., "Low-Latency Visual Odometry on Embedded Drones", IEEE ICRA 2024.
    """
    parsed = parse_cv_text(sample_cv)
    assert parsed.student_name == "Towsif Rahman"
    assert parsed.institution == "BUET"
    assert parsed.gpa == "3.89"
    assert "PyTorch" in parsed.skills
    assert "CUDA" in parsed.skills
    assert parsed.thesis_topic is not None
    assert len(parsed.publications) >= 1


def test_api_parse_cv_text_endpoint():
    payload = {
        "raw_text": "Sadia Anjum\nB.Sc. in CSE, University of Dhaka\nGPA: 3.84\nSkills: PyTorch, NLP, Transformers, Linux\nThesis: Parameter-Efficient Fine-Tuning of Bengali LLMs"
    }
    response = client.post("/api/ai/scholar/parse-cv/text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["parsed_data"]["student_name"] == "Sadia Anjum"
    assert "PyTorch" in data["parsed_data"]["skills"]


def test_profile_matching():
    from app.schemas import CVParsedData
    from app.services.scholar_engine import _to_profile, calculate_profile_match
    cv = CVParsedData(
        student_name="Towsif Rahman",
        degree="B.Sc. in CSE",
        institution="BUET",
        gpa="3.90",
        skills=["PyTorch", "Computer Vision", "ROS", "CUDA"],
        thesis_topic="Visual robot manipulation",
    )
    profs = [_to_profile(p) for p in SEED_PROFESSORS]
    res = calculate_profile_match(cv, profs)
    assert len(res.matches) == len(profs)
    top = res.matches[0]
    assert top.compatibility_score >= 60
    assert len(top.matching_skills) >= 1 or len(top.adjacent_skills) >= 1
    assert top.recommendation_snippet


def test_api_match_profile_endpoint():
    payload = {
        "parsed_cv": {
            "student_name": "Towsif Rahman",
            "degree": "B.Sc. in CSE",
            "institution": "BUET",
            "gpa": "3.88",
            "skills": ["PyTorch", "Computer Vision", "Reinforcement Learning"],
            "thesis_topic": "Robotic manipulation under occlusions",
        }
    }
    response = client.post("/api/ai/scholar/match-profile", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "matches" in data
    assert len(data["matches"]) >= 1
    assert data["top_matched_prof_id"] is not None


def test_paper_deconstruct_endpoint():
    payload = {
        "paper_title": "Generalist Robot Policies via Diffusion and Action Chunking",
        "professor_name": "Dr. Chelsea Finn",
        "student_skills": ["PyTorch", "Diffusion Models", "ROS"],
        "student_thesis": "Mobile manipulation under physical disturbances",
    }
    response = client.post("/api/ai/scholar/deconstruct-paper", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "core_contribution" in data
    assert "unsolved_limitation" in data
    assert "tailored_cold_hook" in data
    assert len(data["tailored_cold_hook"]) > 20
    assert len(data["prep_questions"]) >= 1


def test_paper_deconstruct_is_available_without_offline_demo(monkeypatch):
    """The deterministic paper deconstructor must not be gated as live AI."""
    from app.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("OFFLINE_DEMO", "false")
    monkeypatch.setenv("AI_SERVICE_API_TOKEN", "offline-test-token")
    get_settings.cache_clear()
    try:
        response = client.post(
            "/api/ai/scholar/deconstruct-paper",
            json={
                "paper_title": "Generalist Robot Policies via Diffusion",
                "professor_name": "Dr. Chelsea Finn",
                "student_skills": ["PyTorch"],
            },
        )
        assert response.status_code == 200
        assert response.json()["model_used"] == "Ethos Academic Engine (Paper Deconstructor)"
    finally:
        monkeypatch.setenv("ENVIRONMENT", "test")
        monkeypatch.setenv("OFFLINE_DEMO", "false")
        get_settings.cache_clear()


def test_live_search_endpoint():
    # Test query handling with fallback/live OpenAlex
    payload = {"query": "Robotics and Machine Learning", "limit": 3}
    response = client.post("/api/ai/scholar/live-search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) >= 1
    assert data["source"]


def test_live_search_entity_types():
    # Test institutions entity search
    payload_inst = {"query": "Toronto", "entity_type": "institutions", "limit": 3}
    res_inst = client.post("/api/ai/scholar/live-search", json=payload_inst)
    assert res_inst.status_code == 200
    data_inst = res_inst.json()
    assert len(data_inst["results"]) >= 1

    # Test works entity search
    payload_works = {"query": "Attention Is All You Need", "entity_type": "works", "limit": 3}
    res_works = client.post("/api/ai/scholar/live-search", json=payload_works)
    assert res_works.status_code == 200
    data_works = res_works.json()
    assert len(data_works["results"]) >= 1

    # Test authors entity search
    payload_authors = {"query": "Yoshua Bengio", "entity_type": "authors", "limit": 3}
    res_authors = client.post("/api/ai/scholar/live-search", json=payload_authors)
    assert res_authors.status_code == 200
    data_authors = res_authors.json()
    assert len(data_authors["results"]) >= 1

def test_tara_strategy_endpoint():
    payload = {
        "degree_goal": "PhD",
        "gpa": "3.85",
        "undergrad_major": "Computer Science & Engineering",
        "research_experience": "peer_reviewed",
        "english_test_type": "toefl",
        "speaking_score": 26.0,
        "target_country": "USA",
        "coding_depth": "advanced",
    }
    response = client.post("/api/ai/scholar/tara-strategy", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ra_viability_score"] >= 70
    assert data["ta_viability_score"] >= 70
    assert "RA" in data["primary_recommendation"] or "TA" in data["primary_recommendation"]
    assert data["oral_english_status"] in ["cleared", "borderline", "restricted_ra_only"]
    assert len(data["cold_pitch_paragraph"]) > 20
    assert len(data["action_steps"]) >= 2
    assert len(data["summer_funding_strategy"]) > 20


def test_tara_advisor_endpoint():
    payload = {
        "question": "Can I get full funding for an MS, or is it only for PhDs?",
        "student_context": {"degree_goal": "MS", "major": "CS"},
    }
    response = client.post("/api/ai/scholar/tara-advisor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["answer"]) > 50
    assert len(data["key_takeaway"]) > 10
    assert len(data["suggested_followups"]) >= 1

