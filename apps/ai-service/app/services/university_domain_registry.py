"""
University Domain Validation and Authenticity Registry.

Evaluates sender email addresses and domains extracted from offer letters or
application headers against official academic domain patterns, free webmail
providers, known spoofing signatures, and an extensible registry of verified
universities.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from urllib.parse import urlparse

from app.schemas import FlagSeverity, OfferLetterFlag

# --- Free webmail domains commonly abused in offer letter fraud ---
FREE_WEBMAIL_DOMAINS: set[str] = {
    "gmail.com",
    "yahoo.com",
    "ymail.com",
    "rocketmail.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "mail.com",
    "email.com",
    "gmx.com",
    "gmx.net",
    "proton.me",
    "protonmail.com",
    "zoho.com",
    "yandex.com",
    "yandex.ru",
    "tutanota.com",
    "tutamail.com",
    "aol.com",
    "rediffmail.com",
}

# --- Known academic TLD suffixes ---
ACADEMIC_TLDS: tuple[str, ...] = (
    ".edu",
    ".ac.uk",
    ".edu.au",
    ".edu.bd",
    ".ac.bd",
    ".edu.ca",
    ".edu.my",
    ".ac.in",
    ".edu.in",
    ".edu.sg",
    ".ac.nz",
    ".edu.nz",
    ".edu.pk",
    ".edu.my",
    ".edu.hk",
    ".ac.za",
    ".ac.jp",
    ".edu.cn",
    ".edu.tw",
)

# --- Verified University Domain Mapping (Name -> Primary Domain) ---
# Extensible registry of top destination and local universities
VERIFIED_UNIVERSITY_DOMAINS: dict[str, str] = {
    # Bangladesh
    "united international university": "uiu.ac.bd",
    "uiu": "uiu.ac.bd",
    "university of dhaka": "du.ac.bd",
    "dhaka university": "du.ac.bd",
    "bangladesh university of engineering and technology": "buet.ac.bd",
    "buet": "buet.ac.bd",
    "north south university": "northsouth.edu",
    "nsu": "northsouth.edu",
    "brac university": "bracu.ac.bd",
    "bracu": "bracu.ac.bd",
    "american international university-bangladesh": "aiub.edu",
    "aiub": "aiub.edu",
    "independent university, bangladesh": "iub.edu.bd",
    "iub": "iub.edu.bd",
    "jahangirnagar university": "juniv.edu",
    "rajshahi university": "ru.ac.bd",

    # United Kingdom
    "university of oxford": "ox.ac.uk",
    "oxford university": "ox.ac.uk",
    "university of cambridge": "cam.ac.uk",
    "cambridge university": "cam.ac.uk",
    "imperial college london": "imperial.ac.uk",
    "university college london": "ucl.ac.uk",
    "ucl": "ucl.ac.uk",
    "king's college london": "kcl.ac.uk",
    "kcl": "kcl.ac.uk",
    "university of manchester": "manchester.ac.uk",
    "university of edinburgh": "ed.ac.uk",
    "university of warwick": "warwick.ac.uk",
    "london school of economics": "lse.ac.uk",
    "lse": "lse.ac.uk",
    "university of bristol": "bristol.ac.uk",
    "university of glasgow": "gla.ac.uk",
    "university of birmingham": "bham.ac.uk",
    "university of leeds": "leeds.ac.uk",
    "university of sheffield": "sheffield.ac.uk",
    "queen mary university of london": "qmul.ac.uk",
    "coventry university": "coventry.ac.uk",
    "university of hertfordshire": "herts.ac.uk",
    "university of greenwich": "gre.ac.uk",

    # United States
    "harvard university": "harvard.edu",
    "massachusetts institute of technology": "mit.edu",
    "mit": "mit.edu",
    "stanford university": "stanford.edu",
    "university of california, berkeley": "berkeley.edu",
    "uc berkeley": "berkeley.edu",
    "columbia university": "columbia.edu",
    "new york university": "nyu.edu",
    "nyu": "nyu.edu",
    "cornell university": "cornell.edu",
    "princeton university": "princeton.edu",
    "yale university": "yale.edu",
    "university of texas at austin": "utexas.edu",
    "university of washington": "washington.edu",
    "university of illinois urbana-champaign": "illinois.edu",
    "purdue university": "purdue.edu",
    "arizona state university": "asu.edu",
    "northeastern university": "northeastern.edu",
    "university of south florida": "usf.edu",
    "university of central florida": "ucf.edu",
    "university of michigan": "umich.edu",

    # Canada
    "university of toronto": "utoronto.ca",
    "utoronto": "utoronto.ca",
    "university of british columbia": "ubc.ca",
    "ubc": "ubc.ca",
    "mcgill university": "mcgill.ca",
    "university of waterloo": "uwaterloo.ca",
    "university of alberta": "ualberta.ca",
    "mcmaster university": "mcmaster.ca",
    "western university": "uwo.ca",
    "university of ottawa": "uottawa.ca",
    "york university": "yorku.ca",
    "concordia university": "concordia.ca",
    "simon fraser university": "sfu.ca",
    "university of windsor": "uwindsor.ca",
    "seneca college": "senecapolytechnic.ca",

    # Australia
    "university of melbourne": "unimelb.edu.au",
    "unimelb": "unimelb.edu.au",
    "university of sydney": "sydney.edu.au",
    "unsw sydney": "unsw.edu.au",
    "university of new south wales": "unsw.edu.au",
    "australian national university": "anu.edu.au",
    "monash university": "monash.edu",
    "university of queensland": "uq.edu.au",
    "university of western australia": "uwa.edu.au",
    "university of adelaide": "adelaide.edu.au",
    "deakin university": "deakin.edu.au",
    "rmit university": "rmit.edu.au",
    "macquarie university": "mq.edu.au",
    "university of wollongong": "uow.edu.au",
    "curtin university": "curtin.edu.au",

    # Germany / Europe / Asia
    "technical university of munich": "tum.de",
    "tum": "tum.de",
    "ludwig maximilian university of munich": "lmu.de",
    "heidelberg university": "uni-heidelberg.de",
    "national university of singapore": "nus.edu.sg",
    "nus": "nus.edu.sg",
    "nanyang technological university": "ntu.edu.sg",
    "ntu": "ntu.edu.sg",
    "universiti malaya": "um.edu.my",
    "universiti teknologi malaysia": "utm.my",
}

# Inverted domain -> canonical university name mapping
_DOMAIN_TO_NAME: dict[str, str] = {domain: name for name, domain in VERIFIED_UNIVERSITY_DOMAINS.items()}

# Common spoofing patterns (e.g., "harvard-admission-office.com", "oxford-portal-uk.net")
_SPOOF_PATTERNS = [
    r"-admission[s]?",
    r"-portal",
    r"-visa(?:-desk)?",
    r"-office",
    r"-official",
    r"-apply",
    r"-intake",
    r"-verify",
    r"-status",
    r"-intl",
    r"-international",
]
_SPOOF_RE = re.compile("|".join(_SPOOF_PATTERNS), re.IGNORECASE)


@dataclass
class DomainValidationResult:
    is_valid: bool
    domain: str | None
    is_free_webmail: bool = False
    is_spoofed: bool = False
    is_academic_tld: bool = False
    is_known_university: bool = False
    matched_university: str | None = None
    flags: list[OfferLetterFlag] = field(default_factory=list)
    risk_points: int = 0


def extract_domain_from_email(email_or_url: str) -> str | None:
    """Extracts a normalized domain name from an email address or URL string."""
    if not email_or_url:
        return None

    cleaned = email_or_url.strip().lower()

    if "@" in cleaned:
        domain_part = cleaned.split("@")[-1].strip()
        return _clean_domain(domain_part)

    if cleaned.startswith(("http://", "https://")):
        parsed = urlparse(cleaned)
        return _clean_domain(parsed.netloc)

    return _clean_domain(cleaned)


def _clean_domain(domain: str) -> str:
    domain = domain.split("/")[0].split(":")[0].strip()
    return domain.lstrip("www.").rstrip(".")


def is_free_webmail(domain: str) -> bool:
    """Checks if the given domain is a recognized public free webmail provider."""
    if not domain:
        return False
    domain = _clean_domain(domain.lower())
    return domain in FREE_WEBMAIL_DOMAINS


def is_academic_domain(domain: str) -> bool:
    """Checks if the domain possesses an official academic Top-Level Domain suffix."""
    if not domain:
        return False
    domain = _clean_domain(domain.lower())
    for tld in ACADEMIC_TLDS:
        if domain.endswith(tld):
            return True
    return False


def is_suspicious_spoofed_domain(domain: str) -> bool:
    """Identifies spoofing tactics where university names are combined with
    words like -admission, -portal, -visa, -official in commercial (.com/.net) TLDs."""
    if not domain:
        return False
    domain = _clean_domain(domain.lower())

    # Academic domains with standard subdomains are usually legitimate
    if is_academic_domain(domain):
        return False

    # Check for suspicious hyphenated keywords in non-academic domains
    if _SPOOF_RE.search(domain):
        return True

    return False


def find_expected_domain_for_university(university_name: str | None) -> str | None:
    """Looks up the known official domain for a given university name string."""
    if not university_name:
        return None
    normalized_name = re.sub(r"[^a-z0-9\s]", "", university_name.lower()).strip()

    # Exact or substring match in registry
    for name, domain in VERIFIED_UNIVERSITY_DOMAINS.items():
        if name in normalized_name or normalized_name in name:
            return domain

    return None


def validate_sender_domain(
    sender_email_or_domain: str | None,
    expected_university: str | None = None,
) -> DomainValidationResult:
    """Validates the sender's email or domain against academic authenticity criteria.

    Calculates deterministic risk points:
      - Free webmail (e.g. @gmail.com): +45 pts (DANGER)
      - Spoofed domain pattern: +35 pts (DANGER)
      - Domain mismatch with known university: +40 pts (DANGER)
      - Unknown non-academic domain (.com/.org without match): +20 pts (WARNING)
      - Valid official academic domain verified: 0 pts (INFO)
    """
    domain = extract_domain_from_email(sender_email_or_domain or "")

    if not domain:
        # No sender domain provided or extracted from document
        return DomainValidationResult(
            is_valid=True,
            domain=None,
            risk_points=0,
            flags=[],
        )

    flags: list[OfferLetterFlag] = []
    risk_points = 0

    # 1. Free Webmail check (Critical fraud indicator for formal university offers)
    if is_free_webmail(domain):
        flags.append(
            OfferLetterFlag(
                code="FREE_WEBMAIL_SENDER",
                message=f"Sender email uses free public webmail (@{domain}) instead of an official institutional domain.",
                severity=FlagSeverity.DANGER,
                points=45,
            )
        )
        return DomainValidationResult(
            is_valid=False,
            domain=domain,
            is_free_webmail=True,
            risk_points=45,
            flags=flags,
        )

    # 2. Suspicious spoofed domain pattern check
    if is_suspicious_spoofed_domain(domain):
        flags.append(
            OfferLetterFlag(
                code="SUSPICIOUS_SPOOFED_DOMAIN",
                message=f"Domain '{domain}' contains suspicious keywords (-admission, -portal, -visa) commonly used in phishing.",
                severity=FlagSeverity.DANGER,
                points=35,
            )
        )
        risk_points += 35

    # 3. Check against known university domain registry
    expected_domain = find_expected_domain_for_university(expected_university)
    is_academic = is_academic_domain(domain)
    is_known = False
    matched_uni = None

    for uni_name, uni_domain in VERIFIED_UNIVERSITY_DOMAINS.items():
        if domain == uni_domain or domain.endswith("." + uni_domain):
            is_known = True
            matched_uni = uni_name
            break

    if expected_domain:
        # We know what domain the university should have
        if domain != expected_domain and not domain.endswith("." + expected_domain):
            flags.append(
                OfferLetterFlag(
                    code="DOMAIN_MISMATCH",
                    message=f"Sender domain '{domain}' does not match official domain '{expected_domain}' for {expected_university}.",
                    severity=FlagSeverity.DANGER,
                    points=40,
                )
            )
            risk_points += 40
        else:
            flags.append(
                OfferLetterFlag(
                    code="OFFICIAL_DOMAIN_VERIFIED",
                    message=f"Verified sender domain '{domain}' matches official registry for {expected_university}.",
                    severity=FlagSeverity.INFO,
                    points=0,
                )
            )
    elif is_known:
        flags.append(
            OfferLetterFlag(
                code="OFFICIAL_DOMAIN_VERIFIED",
                message=f"Sender domain '{domain}' matches verified institution record ({matched_uni}).",
                severity=FlagSeverity.INFO,
                points=0,
            )
        )
    elif is_academic:
        flags.append(
            OfferLetterFlag(
                code="ACADEMIC_TLD_DETECTED",
                message=f"Sender domain '{domain}' uses recognized academic Top-Level Domain.",
                severity=FlagSeverity.INFO,
                points=0,
            )
        )
    else:
        # Non-academic, unrecognized commercial/generic domain claiming to be an offer
        flags.append(
            OfferLetterFlag(
                code="UNVERIFIED_SENDER_DOMAIN",
                message=f"Sender domain '{domain}' is not a recognized academic or university domain.",
                severity=FlagSeverity.WARNING,
                points=20,
            )
        )
        risk_points += 20

    return DomainValidationResult(
        is_valid=risk_points < 30,
        domain=domain,
        is_free_webmail=False,
        is_spoofed=is_suspicious_spoofed_domain(domain),
        is_academic_tld=is_academic,
        is_known_university=is_known,
        matched_university=matched_uni,
        flags=flags,
        risk_points=risk_points,
    )
