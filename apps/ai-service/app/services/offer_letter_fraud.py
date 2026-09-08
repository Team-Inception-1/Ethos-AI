"""
Core Offer Letter Fraud Detection and Structural Analysis Engine.

Module 5.8 (Issue #22 / K-21).
Performs deterministic structural validation, sender domain verification,
predatory language scanning, timeline consistency checks, and produces
an explainable 0–100 risk score and verdict.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from app.schemas import (
    AnalyzeOfferLetterResponse,
    FlagSeverity,
    OfferLetterFlag,
    OfferLetterVerdict,
)
from app.services.text_extraction import normalize_text
from app.services.university_domain_registry import (
    extract_domain_from_email,
    find_expected_domain_for_university,
    validate_sender_domain,
    VERIFIED_UNIVERSITY_DOMAINS,
)

logger = logging.getLogger(__name__)

# --- Verdict Thresholds (Centralized) ---
GENUINE_MAX_SCORE = 25
SUSPICIOUS_MAX_SCORE = 65


# --- Predatory / Fraud Language Patterns ---
_VISA_GUARANTEE_PATTERNS = [
    r"\b100\s?%\s?(?:visa\s?guarantee|guaranteed\s?visa)\b",
    r"\bguaranteed\s?(?:embassy|visa)\s?approval\b",
    r"\bembassy\s?interview\s?waived\s?guaranteed\b",
    r"\bguaranteed\s?visa\s?issuance\b",
    r"\bvisa\s?is\s?100\s?%\s?confirmed\b",
]
_VISA_GUARANTEE_RE = re.compile("|".join(_VISA_GUARANTEE_PATTERNS), re.IGNORECASE)

_UNOFFICIAL_PAYMENT_PATTERNS = [
    r"\btransfer\s?(?:money|fees?|funds?)\s?to\s?(?:personal|agent'?s?)\s?(?:account|bkash|nagad|bank)\b",
    r"\bpay\s?cash\s?(?:directly\s?to|only\s?to)\s?(?:agent|consultant|representative)\b",
    r"\bwestern\s?union\s?(?:transfer|payment)\s?only\b",
    r"\bpersonal\s?bkash\s?number\b",
    r"\bpersonal\s?nagad\s?number\b",
    r"\bcrypto(?:currency)?\s?(?:payment|wallet|usdt|bitcoin)\b",
    r"\badvance\s?cash\s?deposit\s?without\s?receipt\b",
]
_UNOFFICIAL_PAYMENT_RE = re.compile("|".join(_UNOFFICIAL_PAYMENT_PATTERNS), re.IGNORECASE)

_PROCEDURAL_BYPASS_PATTERNS = [
    r"\bno\s?ielts\s?required\s?guaranteed\s?admission\b",
    r"\bbackdoor\s?(?:admission|entry|seat)\b",
    r"\bbypass(?:ing)?\s?(?:official\s?portal|embassy\s?rules)\b",
    r"\bfake\s?experience\s?certificate\s?provided\b",
]
_PROCEDURAL_BYPASS_RE = re.compile("|".join(_PROCEDURAL_BYPASS_PATTERNS), re.IGNORECASE)

# --- Structural Regex Patterns ---
_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
_CANDIDATE_NAME_RE = re.compile(
    r"(?:dear\s+(?:mr\.?|ms\.?|mrs\.?|applicant|student)?\s*([a-zA-Z\s.]{2,40})|"
    r"(?:candidate|student|applicant)\s*name\s*[:\-]\s*([a-zA-Z\s.]{2,40})|"
    r"(?:name\s*of\s*student)\s*[:\-]\s*([a-zA-Z\s.]{2,40})|"
    r"(?:we\s+are\s+pleased\s+to\s+offer\s+admission\s+to)\s+([a-zA-Z\s.]{2,40}))",
    re.IGNORECASE,
)
_PROGRAM_RE = re.compile(
    r"(?:program|course|degree|major|field\s*of\s*study)\s*[:\-]\s*([^\n,]{3,60})|"
    r"(?:bachelor|master|doctor|b\.?sc|m\.?sc|b\.?a|m\.?a|b\.?b\.?a|m\.?b\.?a|ph\.?d|diploma)\s+(?:of|in)\s+([^\n,]{3,60})",
    re.IGNORECASE,
)
_SIGNATORY_RE = re.compile(
    r"\b(?:dean\s+of\s+admissions?|director\s+of\s+admissions?|registrar|"
    r"admissions?\s+officer|head\s+of\s+admissions?|authorized\s+signatory|"
    r"vice[- ]chancellor|provost|principal)\b",
    re.IGNORECASE,
)
_DATE_PATTERNS = [
    r"\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b",
    r"\b((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4})\b",
    r"\b(\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4})\b",
]
_DATE_RE = re.compile("|".join(_DATE_PATTERNS), re.IGNORECASE)


@dataclass
class ExtractedOfferMetadata:
    university_name: str | None = None
    candidate_name: str | None = None
    program_name: str | None = None
    sender_email: str | None = None
    signatory_title: str | None = None
    has_contact_info: bool = False
    dates_found: list[str] = field(default_factory=list)


class OfferLetterFraudDetector:
    """Analyzes normalized offer letter text and metadata for signs of forgery."""

    def analyze(
        self,
        text: str,
        sender_email: str | None = None,
        expected_university: str | None = None,
    ) -> AnalyzeOfferLetterResponse:
        normalized = normalize_text(text)
        metadata = self._extract_metadata(normalized, sender_email, expected_university)

        flags: list[OfferLetterFlag] = []
        total_risk_points = 0

        # 1. Language & Predatory Claim Checks
        lang_flags = self._check_predatory_language(normalized)
        flags.extend(lang_flags)
        total_risk_points += sum(f.points for f in lang_flags)

        # 2. Domain & Sender Authenticity Checks
        domain_to_check = sender_email or metadata.sender_email
        uni_to_check = expected_university or metadata.university_name
        domain_res = validate_sender_domain(domain_to_check, expected_university=uni_to_check)
        flags.extend(domain_res.flags)
        total_risk_points += domain_res.risk_points

        # 3. Structural & Template Completeness Checks
        struct_flags = self._check_structural_integrity(metadata, normalized)
        flags.extend(struct_flags)
        total_risk_points += sum(f.points for f in struct_flags)

        # 4. Timeline Consistency Checks
        timeline_flags = self._check_timeline_consistency(metadata, normalized)
        flags.extend(timeline_flags)
        total_risk_points += sum(f.points for f in timeline_flags)

        # 5. Deterministic Risk Score Bounding (0 <= riskScore <= 100)
        bounded_score = min(100, max(0, total_risk_points))

        # 6. Verdict Assignment
        if bounded_score <= GENUINE_MAX_SCORE:
            verdict = OfferLetterVerdict.GENUINE
        elif bounded_score <= SUSPICIOUS_MAX_SCORE:
            verdict = OfferLetterVerdict.SUSPICIOUS
        else:
            verdict = OfferLetterVerdict.FAKE

        return AnalyzeOfferLetterResponse(
            riskScore=bounded_score,
            verdict=verdict,
            flags=flags,
        )

    def _extract_metadata(
        self,
        text: str,
        sender_email: str | None = None,
        expected_university: str | None = None,
    ) -> ExtractedOfferMetadata:
        # Detect university name from text or dictionary
        detected_uni = expected_university
        if not detected_uni:
            text_lower = text.lower()
            for uni_name in VERIFIED_UNIVERSITY_DOMAINS:
                if uni_name in text_lower:
                    detected_uni = uni_name.title()
                    break

        # Detect sender email from document text if not provided
        detected_email = sender_email
        if not detected_email:
            emails = _EMAIL_RE.findall(text)
            if emails:
                detected_email = emails[0]

        # Candidate name
        candidate_match = _CANDIDATE_NAME_RE.search(text)
        candidate_name = None
        if candidate_match:
            for group in candidate_match.groups():
                if group and group.strip():
                    candidate_name = group.strip()
                    break

        # Program / degree
        program_match = _PROGRAM_RE.search(text)
        program_name = None
        if program_match:
            for group in program_match.groups():
                if group and group.strip():
                    program_name = group.strip()
                    break

        # Signatory
        signatory_match = _SIGNATORY_RE.search(text)
        signatory_title = signatory_match.group(0) if signatory_match else None

        # Contact info presence
        has_contact = bool(_EMAIL_RE.search(text) or re.search(r"\b(?:tel|phone|website|www\.|campus|address)\b", text, re.I))

        # Dates
        dates = [m.group(0) for m in _DATE_RE.finditer(text)]

        return ExtractedOfferMetadata(
            university_name=detected_uni,
            candidate_name=candidate_name,
            program_name=program_name,
            sender_email=detected_email,
            signatory_title=signatory_title,
            has_contact_info=has_contact,
            dates_found=dates,
        )

    def _check_predatory_language(self, text: str) -> list[OfferLetterFlag]:
        flags: list[OfferLetterFlag] = []

        # Visa guarantee
        if _VISA_GUARANTEE_RE.search(text):
            flags.append(
                OfferLetterFlag(
                    code="VISA_GUARANTEE_CLAIM",
                    message="Document promises unconditional visa approval or embassy waiver, which legitimate universities never claim.",
                    severity=FlagSeverity.DANGER,
                    points=35,
                )
            )

        # Unofficial payment
        if _UNOFFICIAL_PAYMENT_RE.search(text):
            flags.append(
                OfferLetterFlag(
                    code="UNOFFICIAL_PAYMENT_DEMAND",
                    message="Document instructs payment to personal bank accounts, mobile financial services, or cash rather than official institutional portals.",
                    severity=FlagSeverity.DANGER,
                    points=35,
                )
            )

        # Procedural bypass
        if _PROCEDURAL_BYPASS_RE.search(text):
            flags.append(
                OfferLetterFlag(
                    code="PROCEDURAL_BYPASS_CLAIM",
                    message="Document claims to bypass standard admission or visa compliance protocols.",
                    severity=FlagSeverity.DANGER,
                    points=30,
                )
            )

        return flags

    def _check_structural_integrity(
        self,
        metadata: ExtractedOfferMetadata,
        text: str,
    ) -> list[OfferLetterFlag]:
        flags: list[OfferLetterFlag] = []

        # 1. Candidate Identification
        if not metadata.candidate_name and not re.search(r"\b(?:student\s*id|application\s*no|id\s*number)\s*[:\-]\s*\w+", text, re.I):
            flags.append(
                OfferLetterFlag(
                    code="MISSING_CANDIDATE_INFO",
                    message="No student name, candidate identifier, or application reference found in the letter.",
                    severity=FlagSeverity.WARNING,
                    points=20,
                )
            )

        # 2. Degree / Program details
        if not metadata.program_name and not re.search(r"\b(?:bachelor|master|undergraduate|postgraduate|phd|diploma|faculty|course)\b", text, re.I):
            flags.append(
                OfferLetterFlag(
                    code="MISSING_PROGRAM_DETAILS",
                    message="No academic degree, program, or major course of study specified in the offer.",
                    severity=FlagSeverity.WARNING,
                    points=20,
                )
            )

        # 3. Authorized Signatory
        if not metadata.signatory_title:
            flags.append(
                OfferLetterFlag(
                    code="MISSING_SIGNATORY",
                    message="Missing authorized institutional signatory (e.g. Dean of Admissions, Registrar, Director).",
                    severity=FlagSeverity.WARNING,
                    points=20,
                )
            )

        # 4. Intake / Start Date
        if not metadata.dates_found and not re.search(r"\b(?:fall|spring|summer|winter|intake|semester|session|orientation)\s+\d{4}\b", text, re.I):
            flags.append(
                OfferLetterFlag(
                    code="MISSING_INTAKE_DATE",
                    message="Missing academic intake semester or program commencement date.",
                    severity=FlagSeverity.WARNING,
                    points=15,
                )
            )

        # 5. Official contact info
        if not metadata.has_contact_info:
            flags.append(
                OfferLetterFlag(
                    code="MISSING_CONTACT_INFO",
                    message="Missing official institutional contact information (email, phone, or campus address).",
                    severity=FlagSeverity.WARNING,
                    points=10,
                )
            )

        return flags

    def _check_timeline_consistency(
        self,
        metadata: ExtractedOfferMetadata,
        text: str,
    ) -> list[OfferLetterFlag]:
        flags: list[OfferLetterFlag] = []

        # Look for explicit issue date vs start date
        issue_match = re.search(r"(?:issue\s*date|dated|date\s*of\s*issue)\s*[:\-]\s*([^\n,;]{4,30})", text, re.I)
        start_match = re.search(r"(?:start\s*date|commencement\s*date|orientation\s*date|classes\s*begin)\s*[:\-]\s*([^\n,;]{4,30})", text, re.I)

        if issue_match and start_match:
            issue_str = issue_match.group(1).strip()
            start_str = start_match.group(1).strip()
            issue_dt = self._parse_date(issue_str)
            start_dt = self._parse_date(start_str)

            if issue_dt and start_dt:
                # Start date before issue date is a clear inconsistency
                if start_dt < issue_dt:
                    flags.append(
                        OfferLetterFlag(
                            code="TIMELINE_INCONSISTENCY",
                            message=f"Program commencement date ({start_str}) occurs before document issue date ({issue_str}).",
                            severity=FlagSeverity.WARNING,
                            points=25,
                        )
                    )

        # Check for year numbers in the far past or absurd future
        years = [int(y) for y in re.findall(r"\b(19\d\d|20\d\d)\b", text)]
        current_year = datetime.now().year
        for y in years:
            if y < 2015 or y > current_year + 5:
                flags.append(
                    OfferLetterFlag(
                        code="SUSPICIOUS_DATE_YEAR",
                        message=f"Document references unusual or inconsistent calendar year ({y}).",
                        severity=FlagSeverity.WARNING,
                        points=15,
                    )
                )
                break

        return flags

    def _parse_date(self, date_str: str) -> datetime | None:
        formats = [
            "%d/%m/%Y",
            "%m/%d/%Y",
            "%d-%m-%Y",
            "%Y-%m-%d",
            "%B %d, %Y",
            "%b %d, %Y",
            "%d %B %Y",
            "%d %b %Y",
            "%B %d %Y",
            "%b %d %Y",
        ]
        cleaned = re.sub(r"[,.]", "", date_str.strip())
        for fmt in formats:
            try:
                return datetime.strptime(cleaned, fmt.replace(",", "").replace(".", ""))
            except ValueError:
                continue
        return None
