"""
Unit tests for Offer Letter Fraud Detection and University Domain Validation (Module 5.8 / K-21).
"""
from __future__ import annotations

import pytest

from app.schemas import FlagSeverity, OfferLetterVerdict
from app.services.offer_letter_fraud import OfferLetterFraudDetector
from app.services.text_extraction import normalize_text
from app.services.university_domain_registry import (
    extract_domain_from_email,
    is_academic_domain,
    is_free_webmail,
    is_suspicious_spoofed_domain,
    validate_sender_domain,
)


@pytest.fixture
def detector() -> OfferLetterFraudDetector:
    return OfferLetterFraudDetector()


def test_normalize_text_collapses_whitespace_and_preserves_content():
    raw = "  Dear   Applicant: \r\n\r\n\r\n  Tasin  Ahmed \t\t  (ID: 2026-STU-01) \n Tuition: $15,000 \n\n"
    normalized = normalize_text(raw)
    assert "Dear Applicant:" in normalized
    assert "Tasin Ahmed" in normalized
    assert "(ID: 2026-STU-01)" in normalized
    assert "$15,000" in normalized
    assert "\r" not in normalized


def test_extract_domain_from_email():
    assert extract_domain_from_email("admissions@utoronto.ca") == "utoronto.ca"
    assert extract_domain_from_email("info@ox.ac.uk") == "ox.ac.uk"
    assert extract_domain_from_email("https://www.harvard.edu/admissions") == "harvard.edu"
    assert extract_domain_from_email("scammer@gmail.com") == "gmail.com"
    assert extract_domain_from_email("") is None


def test_free_webmail_detection():
    assert is_free_webmail("gmail.com") is True
    assert is_free_webmail("yahoo.com") is True
    assert is_free_webmail("hotmail.com") is True
    assert is_free_webmail("utoronto.ca") is False
    assert is_free_webmail("ox.ac.uk") is False


def test_academic_domain_detection():
    assert is_academic_domain("harvard.edu") is True
    assert is_academic_domain("ox.ac.uk") is True
    assert is_academic_domain("unimelb.edu.au") is True
    assert is_academic_domain("uiu.ac.bd") is True
    assert is_academic_domain("fake-admission.com") is False


def test_suspicious_spoofed_domain_detection():
    assert is_suspicious_spoofed_domain("harvard-admission-office.com") is True
    assert is_suspicious_spoofed_domain("oxford-visa-desk.net") is True
    assert is_suspicious_spoofed_domain("toronto-portal-apply.com") is True
    assert is_suspicious_spoofed_domain("ox.ac.uk") is False
    assert is_suspicious_spoofed_domain("utoronto.ca") is False


def test_validate_sender_domain_free_webmail():
    res = validate_sender_domain("admissions@gmail.com", expected_university="University of Oxford")
    assert res.is_valid is False
    assert res.is_free_webmail is True
    assert res.risk_points == 45
    assert any(f.code == "FREE_WEBMAIL_SENDER" for f in res.flags)


def test_validate_sender_domain_official_match():
    res = validate_sender_domain("admissions@utoronto.ca", expected_university="University of Toronto")
    assert res.is_valid is True
    assert res.risk_points == 0
    assert any(f.code == "OFFICIAL_DOMAIN_VERIFIED" for f in res.flags)


def test_validate_sender_domain_mismatch():
    res = validate_sender_domain("admissions@unrelated-portal.com", expected_university="Harvard University")
    assert res.is_valid is False
    assert res.risk_points >= 40
    assert any(f.code == "DOMAIN_MISMATCH" for f in res.flags)


def test_genuine_offer_letter_analysis(detector: OfferLetterFraudDetector):
    genuine_text = """
    UNIVERSITY OF TORONTO
    Office of Admissions, 27 King's College Circle, Toronto, ON, Canada
    Email: admissions@utoronto.ca | Website: www.utoronto.ca | Tel: +1 416-978-2190

    OFFICIAL OFFER OF ADMISSION

    Date of Issue: 15 March 2026
    Student Name: Rafiqul Islam
    Application Reference: UOT-2026-88912

    Dear Rafiqul Islam,

    We are pleased to offer you admission to the Bachelor of Science in Computer Science
    program at the University of Toronto for the Fall 2026 academic intake.

    Program Details:
    - Degree: Bachelor of Science (B.Sc) in Computer Science
    - Faculty: Faculty of Arts and Science
    - Commencement Date: 01 September 2026
    - Annual Tuition Fee: CAD $58,000

    Please confirm your acceptance through your official JOIN U of T portal by 01 May 2026.

    Sincerely,
    Dr. Katherine Vance
    Director of International Admissions
    University of Toronto
    """
    resp = detector.analyze(
        text=genuine_text,
        sender_email="admissions@utoronto.ca",
        expected_university="University of Toronto",
    )

    assert resp.riskScore <= 25
    assert resp.verdict == OfferLetterVerdict.GENUINE
    assert not any(f.severity == FlagSeverity.DANGER for f in resp.flags)


def test_suspicious_offer_letter_analysis(detector: OfferLetterFraudDetector):
    # Missing official domain, non-academic domain, missing signatory title
    suspicious_text = """
    GLOBAL CITY COLLEGE
    Admissions Department

    OFFER LETTER
    Date: 10 April 2026
    Candidate Name: Tanvir Hasan

    You have been accepted into the Diploma in Business Studies commencing 15 October 2026.
    Tuition fee is Tk 250,000.

    Contact us at: info@globalcitycollege.org
    """
    resp = detector.analyze(
        text=suspicious_text,
        sender_email="info@globalcitycollege.org",
        expected_university="Global City College",
    )

    assert 26 <= resp.riskScore <= 65
    assert resp.verdict == OfferLetterVerdict.SUSPICIOUS
    assert any(f.code in {"MISSING_SIGNATORY", "UNVERIFIED_SENDER_DOMAIN"} for f in resp.flags)


def test_fake_offer_letter_with_predatory_claims_and_gmail(detector: OfferLetterFraudDetector):
    fake_text = """
    HARVARD UNIVERSITY - OFFICIAL ADMISSION GUARANTEE
    
    Congratulations! We offer you direct admission.
    100% Visa Guarantee! Embassy interview waived guaranteed!
    
    To secure your seat, transfer money to agent's personal bKash number immediately: 01700000000.
    No IELTS required guaranteed admission with backdoor entry.
    
    Issue Date: 20 June 2026
    Start Date: 10 January 2024
    
    Email us: harvard-admission-desk@gmail.com
    """
    resp = detector.analyze(
        text=fake_text,
        sender_email="harvard-admission-desk@gmail.com",
        expected_university="Harvard University",
    )

    assert resp.riskScore >= 66
    assert resp.verdict == OfferLetterVerdict.FAKE
    flag_codes = {f.code for f in resp.flags}
    assert "FREE_WEBMAIL_SENDER" in flag_codes
    assert "VISA_GUARANTEE_CLAIM" in flag_codes
    assert "UNOFFICIAL_PAYMENT_DEMAND" in flag_codes
    assert "TIMELINE_INCONSISTENCY" in flag_codes
    assert "MISSING_CANDIDATE_INFO" in flag_codes or "MISSING_SIGNATORY" in flag_codes


def test_score_bounds_never_exceed_100_or_subzero(detector: OfferLetterFraudDetector):
    super_fake_text = """
    100% visa guarantee guaranteed embassy approval! Pay cash only to agent!
    Western Union transfer only! Backdoor entry!
    Issue Date: 01/01/2026
    Start Date: 01/01/2020
    """
    resp = detector.analyze(
        text=super_fake_text,
        sender_email="fake@gmail.com",
        expected_university="University of Cambridge",
    )
    assert 0 <= resp.riskScore <= 100
    assert resp.riskScore == 100
    assert resp.verdict == OfferLetterVerdict.FAKE
