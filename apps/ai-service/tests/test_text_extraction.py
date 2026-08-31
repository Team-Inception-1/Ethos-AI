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
    from reportlab.pdfgen import canvas
    import io

    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(100, 750, "Total service fee: Tk 65,000.")
    c.drawString(100, 730, "Refund policy: 50% refund if visa rejected.")
    c.save()
    pdf_bytes = buf.getvalue()

    text = extract_text("agreement.pdf", pdf_bytes)
    assert "65,000" in text
    assert "Refund policy" in text


def test_extract_text_no_extension_raises():
    with pytest.raises(UnsupportedFileTypeError):
        extract_text("noextension", b"data")
