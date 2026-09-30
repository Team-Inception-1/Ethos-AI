"""
API integration tests for /api/ai/analyze-offer-letter endpoints (Module 5.8 / K-21).
"""
from __future__ import annotations

import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import OfferLetterVerdict
from app.services.vision_ocr import extract_text_google_vision_sync


@pytest.fixture
def client() -> TestClient:
    return TestClient(app, headers={"Authorization": "Bearer offline-test-token"})


def generate_sample_pdf(text_lines: list[str]) -> bytes:
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas

        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=letter)
        y = 750
        for line in text_lines:
            c.drawString(50, y, line)
            y -= 25
        c.save()
        return buf.getvalue()
    except Exception:
        # Minimal valid PDF binary fallback
        stream_content = "BT /F1 12 Tf 50 750 Td (" + " ".join(text_lines) + ") Tj ET"
        stream_bytes = stream_content.encode("latin-1")
        return (
            b"%PDF-1.4\n"
            b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
            b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
            b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
            b"4 0 obj << /Length " + str(len(stream_bytes)).encode("latin-1") + b" >> stream\n"
            + stream_bytes + b"\nendstream\nendobj\n"
            b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
            b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000240 00000 n \n0000000330 00000 n \n"
            b"trailer << /Root 1 0 R /Size 6 >>\nstartxref\n400\n%%EOF"
        )


def test_analyze_offer_letter_text_endpoint_genuine(client: TestClient):
    payload = {
        "text": """
        UNIVERSITY OF OXFORD
        Wellington Square, Oxford OX1 2JD, United Kingdom
        Email: graduate.admissions@ox.ac.uk | Website: www.ox.ac.uk

        OFFER OF ADMISSION
        Date of Issue: 10 January 2026
        Dear Sudiip Paul,
        We are pleased to offer you admission to the Master of Science in Software Engineering
        commencing on 01 October 2026.
        Signed,
        Professor Eleanor Wright, Dean of Admissions
        """,
        "sender_email": "graduate.admissions@ox.ac.uk",
        "expected_university": "University of Oxford",
    }
    resp = client.post("/api/ai/analyze-offer-letter/text", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["riskScore"] <= 25
    assert data["verdict"] == "genuine"
    assert isinstance(data["flags"], list)


def test_analyze_offer_letter_text_endpoint_empty_text_returns_422(client: TestClient):
    resp = client.post("/api/ai/analyze-offer-letter/text", json={"text": "   "})
    assert resp.status_code == 422


def test_analyze_offer_letter_file_upload_pdf(client: TestClient):
    pdf_bytes = generate_sample_pdf([
        "UNITED INTERNATIONAL UNIVERSITY",
        "Madani Avenue, Dhaka 1212, Bangladesh",
        "Email: admissions@uiu.ac.bd | Tel: +880 9604-848848",
        "OFFICIAL ADMISSION LETTER",
        "Date of Issue: 20 May 2026",
        "Dear Sourav Ghosh,",
        "We are pleased to offer you admission to Bachelor of Science in CSE",
        "Commencement Date: 15 October 2026",
        "Authorized Signatory: Registrar, United International University",
    ])

    resp = client.post(
        "/api/ai/analyze-offer-letter",
        files={"file": ("offer_letter.pdf", pdf_bytes, "application/pdf")},
        data={
            "sender_email": "admissions@uiu.ac.bd",
            "expected_university": "United International University",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["riskScore"] <= 25
    assert data["verdict"] == "genuine"


def test_analyze_offer_letter_file_upload_txt(client: TestClient):
    fake_doc = (
        "OFFER LETTER\n"
        "100% Visa Guarantee! Pay cash to agent personal bkash number.\n"
        "Issue Date: 01/01/2026\n"
        "Start Date: 01/01/2023\n"
        "Email: harvard@gmail.com\n"
    ).encode("utf-8")

    resp = client.post(
        "/api/ai/analyze-offer-letter",
        files={"file": ("offer.txt", fake_doc, "text/plain")},
        data={
            "sender_email": "harvard@gmail.com",
            "expected_university": "Harvard University",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["riskScore"] >= 66
    assert data["verdict"] == "fake"


def test_analyze_offer_letter_unsupported_file_extension(client: TestClient):
    resp = client.post(
        "/api/ai/analyze-offer-letter",
        files={"file": ("offer.docx", b"some docx content", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert resp.status_code == 415


def test_analyze_offer_letter_empty_file(client: TestClient):
    resp = client.post(
        "/api/ai/analyze-offer-letter",
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert resp.status_code == 422


def test_analyze_offer_letter_file_too_large(client: TestClient):
    # 21 MB content
    large_bytes = b"0" * (21 * 1024 * 1024)
    resp = client.post(
        "/api/ai/analyze-offer-letter",
        files={"file": ("huge.pdf", large_bytes, "application/pdf")},
    )
    assert resp.status_code == 413


def test_google_vision_fallback_without_credentials_returns_none():
    res = extract_text_google_vision_sync(b"fake image bytes", api_key=None)
    assert res is None
