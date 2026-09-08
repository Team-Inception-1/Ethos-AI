from __future__ import annotations

import pytest

from app.services.text_extraction import UnsupportedFileTypeError, extract_text


def test_extract_text_plain_txt():
    result = extract_text("agreement.txt", b"Hello, this is an agreement.")
    assert result == "Hello, this is an agreement."


def test_extract_text_rejects_unsupported_extension():
    with pytest.raises(UnsupportedFileTypeError):
        extract_text("agreement.docx", b"whatever")


def test_extract_text_pdf_with_embedded_text():
    try:
        from reportlab.pdfgen import canvas
        import io

        buf = io.BytesIO()
        c = canvas.Canvas(buf)
        c.drawString(100, 750, "Total service fee: Tk 65,000.")
        c.drawString(100, 730, "Refund policy: 50% refund if visa rejected.")
        c.save()
        pdf_bytes = buf.getvalue()
    except Exception:
        stream_content = "BT /F1 12 Tf 100 750 Td (Total service fee: Tk 65,000.) Tj 0 -20 Td (Refund policy: 50% refund if visa rejected.) Tj ET"
        stream_bytes = stream_content.encode("latin-1")
        pdf_bytes = (
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

    text = extract_text("agreement.pdf", pdf_bytes)
    assert "65,000" in text
    assert "Refund policy" in text


def test_extract_text_no_extension_raises():
    with pytest.raises(UnsupportedFileTypeError):
        extract_text("noextension", b"data")
