#!/usr/bin/env python3
"""
Ethos AI - Comprehensive System Documentation PDF Generator
Renders a publication-grade LaTeX-styled technical specification PDF using ReportLab.
"""

import sys
import os
from typing import Any
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

# --- Output Path ---
OUTPUT_PDF = r"d:\Ethos AI\Ethos-AI\docs\Ethos_AI_Detailed_Documentation.pdf"

# --- Numbered Canvas for Two-Pass Page Counts (Page X of Y) ---
class NumberedCanvas(canvas.Canvas):
    _pageNumber: int

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        start_page_fn = getattr(self, "_startPage", None)
        if callable(start_page_fn):
            start_page_fn()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Skip headers/footers on page 1 (Cover Page)
        if self._pageNumber > 1:
            # Header
            self.drawString(54, 842 - 36, "Ethos AI — Comprehensive System Architecture & Technical Specification")
            self.drawRightString(595 - 54, 842 - 36, "UIU CSE Capstone Project")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(54, 842 - 42, 595 - 54, 842 - 42)

            # Footer
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(54, 46, 595 - 54, 46)
            self.drawString(54, 32, "Confidential & Proprietary — Department of Computer Science & Engineering, UIU")
            self.drawRightString(595 - 54, 32, f"Page {self._pageNumber} of {page_count}")

        self.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # --- Custom Typography Styles ---
    c_primary = colors.HexColor("#1e40af")
    c_dark = colors.HexColor("#0f172a")
    c_emerald = colors.HexColor("#047857")
    c_amber = colors.HexColor("#b45309")
    c_gray_bg = colors.HexColor("#f8fafc")
    c_border = colors.HexColor("#e2e8f0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_dark,
        alignment=1, # Center
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_primary,
        alignment=1,
        spaceAfter=18
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=c_dark,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=c_primary,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
    )

    abstract_style = ParagraphStyle(
        'AbstractText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#334155"),
    )

    story: list[Any] = []

    # =========================================================================
    # COVER / HEADER BLOCK
    # =========================================================================
    story.append(Spacer(1, 15))
    story.append(Paragraph("ETHOS AI", title_style))
    story.append(Paragraph("The Next-Generation Trust & Milestone Escrow Platform for Study-Abroad Consulting", subtitle_style))
    story.append(Paragraph("<b>Comprehensive System Architecture, AI Fraud Detection Pipeline & Technical Specification</b>", ParagraphStyle('SubSub', parent=subtitle_style, fontSize=10, textColor=colors.HexColor("#475569"))))
    story.append(HRFlowable(width="100%", thickness=2, color=c_primary, spaceBefore=4, spaceAfter=14))

    # Meta Table (Institution & Team)
    meta_data = [
        [
            Paragraph("<b>Institution:</b> United International University (UIU)<br/><b>Department:</b> Computer Science & Engineering<br/><b>Project Type:</b> Senior Capstone Project<br/><b>Release Version:</b> v3.2 Production Release", body_style),
            Paragraph("<b>Core Engineering Team:</b><br/>• <b>Tasin (Lead):</b> Architecture, AI/ML, Neon Cloud & Auth<br/>• <b>Sourav:</b> AI/ML, OCR Fraud Engine, AI Counselor<br/>• <b>Sudiip:</b> Backend API, Directory & Compare Engine<br/>• <b>Jannat:</b> QA, Accessibility, WCAG Audit & Manuals<br/>• <b>Taha:</b> Relational Schema, Escrow Ledger, CI/CD", body_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[230, 257])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_gray_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # Abstract Box
    abstract_text = (
        "<b>Executive Abstract:</b> In Bangladesh, an estimated 70,000–90,000 students apply to foreign universities annually without a centralized regulatory safety net. Students and families routinely suffer from predatory 100% upfront fees, hidden contractual traps, forged admission letters, and zero financial recourse upon visa rejection. <b>Ethos AI</b> establishes an institutional-grade trust and payments infrastructure built upon five pillars: (1) an audited consultancy registry with Ministry of Education license tracking, (2) side-by-side transparent fee comparison, (3) a milestone-based escrow payment system with integer-level Poisha precision and SHA-256 cryptographic ledger hashing, (4) dual-engine AI fraud detection (Tesseract OCR offer authenticity scoring and fine-print clause NLP analysis), and (5) a synchronized parent-student guardian monitoring hub. This document serves as the comprehensive architectural and engineering specification."
    )
    t_abstract = Table([[Paragraph(abstract_text, abstract_style)]], colWidths=[487])
    t_abstract.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1.5, c_primary),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_abstract)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 1: PROBLEM DOMAIN & MARKET ANALYSIS
    # =========================================================================
    story.append(Paragraph("1.0 Problem Domain & Market Vulnerabilities", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#94a3b8"), spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph("Study-abroad consulting in Bangladesh has grown into a multi-million-dollar industry characterized by extreme informational asymmetry. Because consulting firms operate largely without mandatory government accreditation, standard consumer rights are unenforced:", body_style))
    
    story.append(Paragraph("• <b>Predatory Upfront Retainers:</b> Traditional agencies demand full non-refundable service fees (BDT 30,000 – BDT 150,000) prior to initiating university contact, placing all financial and immigration risks exclusively on the student.", bullet_style))
    story.append(Paragraph("• <b>Deceptive Acceptance Letters:</b> High rates of falsified admission notices issued by unvetted intermediaries lead to irreversible embassy visa bans and financial ruin.", bullet_style))
    story.append(Paragraph("• <b>Opaque Contractual Traps:</b> Consultation agreements bury forfeiture conditions in fine print, denying refunds even when delays are solely caused by agency negligence.", bullet_style))
    story.append(Paragraph("• <b>Parental Disenfranchisement:</b> Guardians funding the overseas tuition have no digital visibility into the application progress, escrow status, or verified documents.", bullet_style))

    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 2: SYSTEM ARCHITECTURE & DUAL-SERVICE MODEL
    # =========================================================================
    story.append(Paragraph("2.0 System Architecture & Dual-Service Model", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#94a3b8"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("Ethos AI is architected as an asynchronous, decoupled dual-service platform ensuring high throughput, real-time interactivity, and strict security isolation:", body_style))

    arch_data = [
        ["Subsystem", "Technology Stack", "Core Architectural Responsibilities"],
        [
            Paragraph("<b>Web Core</b>", body_style),
            Paragraph("Next.js 16 (Turbopack)<br/>React 19, TypeScript 5.0", body_style),
            Paragraph("Server/Client Components, App Router, authenticated route handlers (/api/*), Neon Auth session management, escrow workflow state machines, Neubrutalist design system.", body_style)
        ],
        [
            Paragraph("<b>AI Microservice</b>", body_style),
            Paragraph("Python 3.12, FastAPI<br/>Uvicorn, Pydantic v2", body_style),
            Paragraph("Asynchronous high-throughput inference service hosting Tesseract OCR, PDF parsing (PyMuPDF), offer letter authenticity scoring, agreement clause extraction, and AI counseling.", body_style)
        ],
        [
            Paragraph("<b>Persistence Layer</b>", body_style),
            Paragraph("Neon Serverless Postgres<br/>Prisma ORM 5.22", body_style),
            Paragraph("17+ relational models with foreign key cascades, unique indexing, connection pooling, and strict schema validation.", body_style)
        ],
        [
            Paragraph("<b>Storage Vault</b>", body_style),
            Paragraph("S3-Compatible Object Store<br/>@aws-sdk/client-s3", body_style),
            Paragraph("Private document storage vault with authenticated streaming proxy (/api/documents/[id]/download), zero public bucket leakage, and malware/MIME validation.", body_style)
        ]
    ]

    t_arch = Table(arch_data, colWidths=[90, 130, 267])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('BACKGROUND', (0,1), (-1,-1), c_gray_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,1), (-1,-1), 6),
        ('BOTTOMPADDING', (0,1), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_arch)

    story.append(Spacer(1, 12))

    # =========================================================================
    # SECTION 3: KEY FEATURE MODULE SPECIFICATIONS
    # =========================================================================
    story.append(Paragraph("3.0 Functional Module Specifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#94a3b8"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("<b>3.1 Identity, RBAC & Guardian Sync (Module 5.1):</b> The platform enforces strict role separation across Student, Parent, Agency, and Admin personas. Parents link directly to student accounts via a cryptographic link code (e.g. <code>ETHOS-STU-8821</code>), granting read-only access to progress bars, verified offer letters, and milestone payments translated into non-technical Bengali summaries.", body_style))

    story.append(Paragraph("<b>3.2 Verified Directory & Side-by-Side Comparison (Modules 5.2–5.4):</b> Consultancies are listed only after government license audits (MOE-BD registration). Students can compare up to 4 agencies simultaneously on visa success rates, transparent fees in BDT, refund turnaround days, and AI-computed risk scores.", body_style))

    story.append(Paragraph("<b>3.3 End-to-End Application Lifecycle (Modules 5.5–5.6):</b> Applications transition through a deterministic seven-stage machine: <code>SUBMITTED</code> &rarr; <code>UNDER_REVIEW</code> &rarr; <code>OFFER_RECEIVED</code> &rarr; <code>PAYMENT_PENDING</code> &rarr; <code>VISA_PROCESSING</code> &rarr; <code>VISA_APPROVED</code> / <code>VISA_REJECTED</code> &rarr; <code>COMPLETED</code>. Each state change logs actor ID, timestamp, and optional audit notes in the <code>StageEvent</code> table.", body_style))

    story.append(Paragraph("<b>3.4 Milestone Escrow Payment System (Module 5.7):</b> Upfront fees are eliminated. Payments are locked in escrow and released incrementally based on verifiable events (e.g. 20% on university application filing, 40% upon verified offer letter issuance, 40% on visa lodging). Integrated gateway adapters support <b>bKash</b>, <b>Nagad</b>, and <b>SSLCOMMERZ</b>.", body_style))

    story.append(Paragraph("<b>3.5 AI Document Fraud & Authenticity Scanner (Module 5.8):</b> Evaluates uploaded admission letters using Tesseract OCR, domain reputation checks, and PDF structural heuristics. The AI microservice computes a 0–100 forgery risk score, flagging mismatched fonts, spoofed university email domains, or suspicious accreditation claims.", body_style))

    story.append(Paragraph("<b>3.6 Smart Agreement Clause Analyzer (Module 5.9):</b> Analyzes consulting contracts to identify hidden fees, non-refundable traps, and unilateral liability disclaimers, generating plain-language risk breakdowns in English and Bengali.", body_style))

    story.append(Paragraph("<b>3.7 AI Study Counselor & Scholar Finder (Modules 5.11–5.13):</b> Matches student profiles (GPA, IELTS score, target destination, and budget) against academic offerings across Canada, the UK, Germany, the USA, and Australia, paired with an automated scholarship discovery engine.", body_style))

    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 4: FINANCIAL INTEGRITY & CRYPTOGRAPHIC LEDGER
    # =========================================================================
    story.append(Paragraph("4.0 Financial Integrity & Cryptographic Ledger", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#94a3b8"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("Ethos AI implements strict engineering controls to prevent financial inaccuracies and ensure auditability:", body_style))

    story.append(Paragraph("<b>1. Poisha-Level Currency Precision:</b> All financial records in the database use 64-bit integer values (<code>BigInt</code>) measured in Poisha (1 BDT = 100 Poisha). Floating-point arithmetic is prohibited across all pricing and ledger computations, eliminating IEEE-754 rounding drift.", body_style))

    story.append(Paragraph("<b>2. Chained Cryptographic Ledger (<code>LedgerEntry</code>):</b> Every financial transaction (<code>HOLD</code>, <code>RELEASE</code>, <code>REFUND</code>, <code>DISPUTE_FREEZE</code>) computes a SHA-256 cryptographic hash chained to the preceding entry:", body_style))

    code_snippet = (
        "txHash = SHA256(\n"
        "    previous_txHash + '|' +\n"
        "    milestone_id    + '|' +\n"
        "    amount_poisha   + '|' +\n"
        "    actor_id        + '|' +\n"
        "    timestamp_iso8601\n"
        ")"
    )
    t_code = Table([[Paragraph(code_snippet.replace('\n', '<br/>'), code_style)]], colWidths=[487])
    t_code.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_code)

    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 5: RELATIONAL DATA MODEL
    # =========================================================================
    story.append(Paragraph("5.0 Relational Data Model (Neon PostgreSQL)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#94a3b8"), spaceBefore=2, spaceAfter=8))

    schema_data = [
        ["Model", "Key Fields", "Description & Cardinality"],
        [
            Paragraph("<b>User</b>", body_style),
            Paragraph("id (UUID), email, passwordHash, role, isVerified", body_style),
            Paragraph("Central identity table supporting STUDENT, PARENT, AGENCY, ADMIN roles.", body_style)
        ],
        [
            Paragraph("<b>StudentProfile</b>", body_style),
            Paragraph("userId, targetCountries, budgetRange, linkCode", body_style),
            Paragraph("1:1 with User. Houses unique guardian sync link code.", body_style)
        ],
        [
            Paragraph("<b>ParentLink</b>", body_style),
            Paragraph("parentId, studentId, isApproved", body_style),
            Paragraph("Many:Many relation tracking verified family linkages.", body_style)
        ],
        [
            Paragraph("<b>Agency</b>", body_style),
            Paragraph("ownerUserId, licenseNo, riskScore, rating, fees", body_style),
            Paragraph("Consultancy profile with audited license & AI risk ratings.", body_style)
        ],
        [
            Paragraph("<b>Application</b>", body_style),
            Paragraph("studentId, agencyId, targetUniversity, stage", body_style),
            Paragraph("Lifecycle entity linking student, agency, documents, and milestones.", body_style)
        ],
        [
            Paragraph("<b>Milestone</b>", body_style),
            Paragraph("applicationId, name, amountPoisha, status", body_style),
            Paragraph("Escrow tranches (PENDING, HELD, RELEASED, DISPUTED, REFUNDED).", body_style)
        ],
        [
            Paragraph("<b>LedgerEntry</b>", body_style),
            Paragraph("milestoneId, type, amountPoisha, txHash", body_style),
            Paragraph("Immutable audit trail with cryptographic SHA-256 verification.", body_style)
        ],
        [
            Paragraph("<b>Document</b>", body_style),
            Paragraph("ownerId, applicationId, storageKey, mimeType", body_style),
            Paragraph("Encrypted vault pointers with private stream downloads.", body_style)
        ]
    ]

    t_schema = Table(schema_data, colWidths=[90, 160, 237])
    t_schema.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BACKGROUND', (0,1), (-1,-1), c_gray_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_schema)

    story.append(Spacer(1, 12))

    # =========================================================================
    # SECTION 6: QUALITY ASSURANCE & VERIFICATION METRICS
    # =========================================================================
    story.append(Paragraph("6.0 Quality Assurance & Empirical Evaluation", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#94a3b8"), spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("The platform enforces continuous quality gates across the application lifecycle:", body_style))

    story.append(Paragraph("• <b>Automated Web Test Suite (Vitest):</b> <b>189 automated integration and unit tests</b> passing with 0 failures across 23 test suites. Key test suites validate multi-role access denial boundaries, Neon Auth password reset token invalidation, private document download isolation, and escrow ledger hash verification.", body_style))

    story.append(Paragraph("• <b>AI Microservice Suite (Pytest):</b> Comprehensive test coverage validating OCR document extraction, clause classifier accuracy, counselor recommendation scoring, and agency risk computations.", body_style))

    story.append(Paragraph("• <b>WCAG 2.1 AA Accessibility:</b> High-contrast Neubrutalist UI design tokens, ARIA role compliance, keyboard navigation, and bilingual localization (English and Bengali).", body_style))

    story.append(Spacer(1, 14))

    # =========================================================================
    # CONCLUSION & SIGN-OFF
    # =========================================================================
    callout_closing = (
        "<b>Summary & Future Outlook:</b> Ethos AI establishes a production-grade benchmark for student financial safety and transparency in emerging education-export markets. Future extensions include direct API webhooks into foreign university admissions portals and integration with Bangladesh Bank's National Payment Switch (NPSB)."
    )
    t_closing = Table([[Paragraph(callout_closing, body_style)]], colWidths=[487])
    t_closing.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1.5, c_emerald),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_closing)

    # Build the Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated documentation PDF at: {OUTPUT_PDF}")


if __name__ == "__main__":
    build_pdf()
