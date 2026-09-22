"""
Pydantic request/response schemas for:
  - Module 5.9 Smart Agreement Analyzer (Issue #16 / K-17)
  - Module 5.10 Scam Alert System (Issue #23 / K-22)

These are the contract consumed by Issue #25 (K-24): wiring AIToolsPage /
DirectoryPage to live AI calls. `FlagSeverity` is shared across both modules
so the frontend only needs one severity→Badge-variant mapping.

Keep this file dependency-free of any LLM SDK — it should be safe to import
from tests and from the Node core API's generated client without pulling in
google-genai.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class ClauseType(str, Enum):
    FEE = "fee"
    REFUND = "refund"
    CANCELLATION = "cancellation"
    LIABILITY = "liability"
    OTHER = "other"


class FlagSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    DANGER = "danger"


# --- Structured pricing input (mirrors AgencyPricing entity, §6) -----------

class DeclaredFee(BaseModel):
    """One row of the agency's declared/structured pricing (Module 5.4).

    Amounts are integers in poisha (smallest BDT unit) per ETHOS_AI_CONTEXT.md §6.
    """

    service_name: str
    amount_poisha: int = Field(ge=0)
    when_charged: str
    refundable: bool
    conditions: str | None = None


# --- Extracted clause (LLM output, structured) -----------------------------

class ExtractedClause(BaseModel):
    clause_type: ClauseType
    quote: str = Field(description="Verbatim or near-verbatim excerpt from the agreement")
    amount_poisha: int | None = Field(
        default=None, description="Monetary amount mentioned in this clause, if any, in poisha"
    )
    summary_en: str = Field(description="Plain-English one-line summary of the clause")


class ClauseFlag(BaseModel):
    """A problem detected in/around a clause: hidden fee, ambiguous refund, etc."""

    tag: str = Field(description="Short label, e.g. 'Hidden Fee', 'Ambiguous Refund'")
    severity: FlagSeverity
    clause_type: ClauseType
    message_en: str = Field(description="Plain-language explanation for the student/parent")
    related_quote: str | None = None
    amount_poisha: int | None = None


class AnalyzeAgreementRequest(BaseModel):
    """Used only for the text-only JSON path (POST /api/ai/analyze-agreement/text).

    The multipart file-upload path (POST /api/ai/analyze-agreement) accepts the
    same `declared_pricing` as a JSON-encoded form field alongside the file.
    """

    agreement_text: str = Field(min_length=1)
    declared_pricing: list[DeclaredFee] = Field(default_factory=list)
    language: str = Field(default="en", description="Output language for summaries: 'en' or 'bn'")


class AnalyzeAgreementResponse(BaseModel):
    clauses: list[ExtractedClause]
    flags: list[ClauseFlag]
    verdict: str = Field(description="'clear' | 'needs_review' | 'high_risk'")
    model_used: str
    truncated: bool = Field(
        default=False, description="True if input text was truncated before sending to the LLM"
    )


class HealthResponse(BaseModel):
    status: str
    service: str
    llm_configured: bool


# =============================================================================
# Module 5.10 — Scam Alert System (Issue #23 / K-22)
# =============================================================================


class ScamFlagSource(str, Enum):
    """Where a scam flag came from — lets the frontend/audit trail distinguish
    a cheap deterministic rule match from a costlier LLM judgement call."""

    RULE = "rule"
    LLM = "llm"


class ScamCategory(str, Enum):
    GUARANTEE_CLAIM = "guarantee_claim"  # "100% visa guarantee", "guaranteed admission"
    URGENCY_PRESSURE = "urgency_pressure"  # "offer expires today", "act now"
    UNVERIFIABLE_CREDENTIAL = "unverifiable_credential"  # fake govt/embassy affiliation claims
    PAYMENT_PRESSURE = "payment_pressure"  # demanding cash/informal payment, bypassing escrow
    OTHER = "other"


class ScanContentRequest(BaseModel):
    text: str = Field(min_length=1, description="Marketing copy, chat message, or agreement text to scan")
    source: str = Field(
        default="unknown",
        description="Where this text came from, e.g. 'agency_profile', 'chat_message', 'agreement'. "
        "Purely informational — does not change scan behavior.",
    )
    language: str = Field(default="en", description="'en' or 'bn' — affects LLM-escalation output language")
    agency_id: str | None = Field(
        default=None,
        description="If provided, any flags found are also recorded as a rolling risk event "
        "against this agency's `AgencyRiskScore`. Omit for one-off scans (e.g. a student "
        "pasting text into a standalone checker) that shouldn't affect any agency's score.",
    )


class ScamFlag(BaseModel):
    tag: str = Field(description="Short label, e.g. 'Guarantee Claim', 'Payment Pressure'")
    category: ScamCategory
    severity: FlagSeverity
    source: ScamFlagSource
    matched_text: str = Field(description="The exact phrase/sentence that triggered this flag")
    message_en: str = Field(description="Plain-language explanation for the student/parent")


class ScanContentResponse(BaseModel):
    flags: list[ScamFlag]
    severity: FlagSeverity = Field(description="Highest severity across all flags; 'info' if none")
    model_used: str


class AgencyRiskEvent(BaseModel):
    """One contribution to an agency's rolling risk score.

    `ScamAlertRiskStore` accumulates these; `AgencyRiskScore.riskScore` is a
    weighted rollup. Kept simple/in-memory for this course project — see
    `ScamAlertRiskStore` docstring for the swap-to-DB path when #14's Prisma
    schema lands.
    """

    source: str = Field(description="'scan' | 'complaint' | 'review_sentiment'")
    weight: float = Field(ge=0, le=100)
    reason: str
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AgencyRiskScore(BaseModel):
    agency_id: str
    risk_score: float = Field(ge=0, le=100)
    flag_count: int
    last_updated: datetime
    recent_events: list[AgencyRiskEvent] = Field(default_factory=list)


class RecordRiskEventRequest(BaseModel):
    """Lets the core Node API (which owns complaint/review data — see
    ETHOS_AI_CONTEXT.md §10, this service never touches that DB directly)
    push a complaint or review-sentiment event into an agency's rolling
    risk score. `POST /api/ai/scan-content` records 'scan' events itself;
    this endpoint covers the other two sources named in Issue #23's
    objective: 'complaint history and review sentiment'.
    """

    source: str = Field(description="'complaint' | 'review_sentiment' (or 'scan', though that's usually automatic)")
    weight: float = Field(ge=0, le=100, description="How much this single event should move the risk score")
    reason: str = Field(description="Short human-readable reason, e.g. 'Student complaint: undisclosed fee'")


# =============================================================================
# Module 5.8 — Fake Document Detection (Issue #22 / K-21)
# =============================================================================


class OfferLetterVerdict(str, Enum):
    GENUINE = "genuine"
    SUSPICIOUS = "suspicious"
    FAKE = "fake"


class OfferLetterFlag(BaseModel):
    code: str = Field(description="Stable machine-readable error/risk code, e.g. 'DOMAIN_MISMATCH'")
    message: str = Field(description="Plain-language explanation for the student/parent/auditor")
    severity: FlagSeverity = Field(description="Severity badge mapping: info, warning, danger")
    points: int = Field(default=0, ge=0, description="Risk score points contributed by this flag")


class AnalyzeOfferLetterResponse(BaseModel):
    riskScore: int = Field(ge=0, le=100, description="Deterministic risk score bounded between 0 and 100")
    verdict: OfferLetterVerdict = Field(description="'genuine' (0-25) | 'suspicious' (26-65) | 'fake' (66-100)")
    flags: list[OfferLetterFlag] = Field(default_factory=list, description="List of detected fraud indicators")


class AnalyzeOfferLetterTextRequest(BaseModel):
    text: str = Field(min_length=1, description="Raw offer letter text to analyze")
    sender_email: str | None = Field(default=None, description="Sender email from communication or envelope")
    expected_university: str | None = Field(
        default=None, description="University name expected by the student"
    )


# =============================================================================
# Module 5.18 & 5.11 — AI Counselor Chatbot & Bangla Assistant (Issue #24 / K-23)
# =============================================================================


class UniversityTier(str, Enum):
    DREAM = "dream"
    TARGET = "target"
    SAFE = "safe"


class CounselorEvaluationRequest(BaseModel):
    current_degree: str = Field(default="bachelor", description="'hsc' | 'a_level' | 'bachelor' | 'masters'")
    gpa: float = Field(ge=0.0, le=5.0, description="GPA or CGPA (out of 4.0 or 5.0)")
    max_gpa: float = Field(default=4.0, description="4.0 or 5.0")
    ielts_score: float | None = Field(default=None, ge=0.0, le=9.0, description="Overall IELTS band or equivalent")
    pte_score: int | None = Field(default=None, ge=10, le=90, description="PTE Academic score")
    duolingo_score: int | None = Field(default=None, ge=10, le=160, description="Duolingo English Test score")
    budget_yearly_bdt_lakh: float = Field(ge=0.0, description="Max annual budget for tuition + living (in Lakh BDT, e.g. 20.0 = ৳20 Lakh)")
    target_countries: list[str] = Field(default_factory=list, description="e.g. ['UK', 'USA', 'Canada', 'Germany', 'Australia']")
    target_field: str | None = Field(default=None, description="e.g. 'Computer Science', 'Business', 'Public Health'")
    study_gap_years: int = Field(default=0, ge=0, description="Number of years between last degree and now")
    preferred_intake: str | None = Field(default="Fall 2026", description="e.g. 'Fall 2026', 'Spring 2027'")
    has_work_experience: bool = Field(default=False, description="Whether student has relevant job experience during study gap")
    scholarship_priority: bool = Field(default=False, description="Whether to prioritize high scholarships and tuition discounts")
    moi_only: bool = Field(default=False, description="Whether to prioritize institutions accepting Medium of Instruction / Duolingo")
    field_category: str | None = Field(default=None, description="'cs_it' | 'engineering' | 'business' | 'health'")
    language: str = Field(default="en", description="'en' or 'bn'")


class UniversityRecommendation(BaseModel):
    id: str
    university_name: str
    country: str
    city: str
    target_programs: list[str]
    tier: UniversityTier
    match_score: int = Field(ge=0, le=100, description="Suitability score 0-100")
    admission_chance_percent: int = Field(ge=0, le=100, description="Estimated admission odds percentage")
    annual_tuition_bdt_lakh: float
    annual_living_bdt_lakh: float
    annual_total_bdt_lakh: float
    currency_local: str
    annual_tuition_local: float
    minimum_gpa: float
    minimum_ielts: float
    max_study_gap_years: int
    matching_reasons: list[str]
    caution_notes: list[str] = Field(default_factory=list)
    scholarship_info: str | None = None
    accepts_moi: bool = False
    coop_available: bool = False
    field_tags: list[str] = Field(default_factory=list)


class VisaRiskFlag(BaseModel):
    severity: FlagSeverity
    title: str
    description: str
    mitigation_tip: str


class VisaAssessment(BaseModel):
    readiness_score: int = Field(ge=0, le=100, description="0-100 visa readiness index")
    status: str = Field(description="'favorable' | 'moderate_risk' | 'high_scrutiny'")
    estimated_solvency_required_bdt_lakh: float
    solvency_details_by_country: dict[str, str] = Field(default_factory=dict)
    risk_flags: list[VisaRiskFlag] = Field(default_factory=list)
    key_advice: list[str] = Field(default_factory=list)


class RoadmapMilestone(BaseModel):
    step_number: int
    month_timeline: str
    phase_title: str
    tasks: list[str]
    critical_warning: str | None = None


class CounselorEvaluationResponse(BaseModel):
    profile_summary: dict[str, str | float | int]
    recommendations: list[UniversityRecommendation]
    visa_assessment: VisaAssessment
    roadmap: list[RoadmapMilestone]
    dream_count: int
    target_count: int
    safe_count: int


class ChatMessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class CounselorChatMessage(BaseModel):
    role: ChatMessageRole
    content: str


class CounselorChatRequest(BaseModel):
    messages: list[CounselorChatMessage]
    profile_context: CounselorEvaluationRequest | None = None
    language: str = Field(default="auto", description="'en', 'bn', or 'auto'")


class GroundingCitation(BaseModel):
    title: str = Field(description="Title of the cited source")
    url: str = Field(description="URL of the cited source")


class CounselorChatResponse(BaseModel):
    reply: str
    suggested_queries: list[str] = Field(default_factory=list)
    detected_language: str
    model_used: str
    citations: list[GroundingCitation] = Field(default_factory=list, description="Live search grounding citations")


class SOPAuditCategory(str, Enum):
    CLICHE = "cliche"
    VISA_INTENT = "visa_intent"
    UNIVERSITY_ALIGNMENT = "university_alignment"
    GRAMMAR_TONE = "grammar_tone"
    STRUCTURE = "structure"

class SOPAuditFinding(BaseModel):
    category: SOPAuditCategory
    severity: FlagSeverity
    quote: str = Field(description="The problematic excerpt from the SOP")
    issue: str = Field(description="What is wrong with this excerpt")
    suggestion: str = Field(description="Actionable fix suggestion")
    paragraph_ref: str | None = Field(default=None, description="Which paragraph, e.g. 'paragraph 2'")

class SOPAuditRequest(BaseModel):
    sop_text: str = Field(min_length=50, description="The student's SOP draft text")
    target_university: str | None = Field(default=None)
    target_country: str | None = Field(default=None)
    target_program: str | None = Field(default=None)
    profile_context: CounselorEvaluationRequest | None = None
    language: str = Field(default="en", description="'en' or 'bn'")

class SOPAuditResponse(BaseModel):
    overall_score: int = Field(ge=0, le=100, description="Overall SOP quality score 0-100")
    verdict: str = Field(description="'strong' | 'needs_work' | 'weak'")
    findings: list[SOPAuditFinding]
    cliche_count: int = Field(ge=0)
    visa_intent_score: int = Field(ge=0, le=100)
    university_alignment_score: int = Field(ge=0, le=100)
    summary: str = Field(description="2-3 sentence executive summary")
    improved_excerpt: str | None = Field(default=None, description="AI-rewritten version of weakest paragraph")
    model_used: str


# =============================================================================
# Module: ScholarFinder & RA/TA Full-Fund Scholarship Suite
# =============================================================================

class ProfessorPublication(BaseModel):
    title: str
    year: int
    venue: str | None = None
    link: str | None = None
    summary: str | None = None


class ProfessorProfile(BaseModel):
    id: str
    name: str
    title: str
    university: str
    department: str
    country: str
    tier: str
    lab_name: str
    lab_url: str | None = None
    email: str
    google_scholar_url: str | None = None
    primary_domain: str
    research_interests: list[str] = Field(default_factory=list)
    active_funding_indicator: bool = True
    funding_sources: list[str] = Field(default_factory=list)
    accepting_students: bool = True
    recent_publications: list[ProfessorPublication] = Field(default_factory=list)
    h_index: int | None = None
    citations_count: int | None = None
    lab_location: str | None = None


class ProfessorSearchRequest(BaseModel):
    domain: str | None = None
    sub_topics: list[str] = Field(default_factory=list)
    countries: list[str] = Field(default_factory=list)
    university_tiers: list[str] = Field(default_factory=list)
    accepting_only: bool = False
    has_active_funding: bool = False
    query: str | None = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class ProfessorSearchResponse(BaseModel):
    total: int
    page: int
    limit: int
    professors: list[ProfessorProfile]
    domains_available: list[str]
    countries_available: list[str]
    tiers_available: list[str]


class ColdEmailVariant(BaseModel):
    subject_line: str
    body: str
    word_count: int
    tone: str


class ColdEmailGenerateRequest(BaseModel):
    professor: ProfessorProfile
    selected_paper_title: str
    student_name: str
    student_degree: str
    student_institution: str
    student_gpa: str | float
    student_skills: list[str]
    student_thesis_topic: str | None = None
    target_degree: str = "PhD"  # "PhD" or "MS with Thesis"
    target_semester: str = "Fall 2026"
    language: str = "en"


class EmailQualityAudit(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    verdict: str  # "Ready to Send", "Needs Refinement", "High Spam Risk"
    word_count_status: str
    strengths: list[str]
    cautionary_flags: list[str]
    best_send_time_local: str


class ColdEmailGenerateResponse(BaseModel):
    initial_email: ColdEmailVariant
    subject_line_options: list[str]
    follow_up_1: ColdEmailVariant
    follow_up_2: ColdEmailVariant
    anti_spam_audit: EmailQualityAudit
    bangla_guidance: str
    model_used: str


class InterviewPrepRequest(BaseModel):
    professor_name: str
    university: str
    research_interests: list[str]
    recent_paper_title: str
    student_skills: list[str]


class InterviewPrepQuestion(BaseModel):
    question: str
    why_prof_asks_this: str
    strong_answer_strategy: str
    key_terms_to_mention: list[str]


class InterviewPrepResponse(BaseModel):
    professor_name: str
    university: str
    predicted_questions: list[InterviewPrepQuestion]
    lab_vibe_summary: str
    recommended_reading: list[str]
    model_used: str


class TARAGuideItem(BaseModel):
    country: str
    flag: str
    ra_overview: str
    ta_overview: str
    monthly_stipend_range: str
    monthly_stipend_bdt_lakh: float
    tuition_remission: str
    ta_speaking_score_requirement: str
    key_deadlines: str
    pro_tips: list[str]


class TARAGuideResponse(BaseModel):
    countries: list[TARAGuideItem]
    speaking_score_thresholds: dict[str, str]
    grant_cycles_overview: list[dict[str, str]]


# --- 1. AI CV / Resume Parser & Profile Matchmaker --------------------------

class CVParsedData(BaseModel):
    student_name: str
    email: str | None = None
    degree: str
    institution: str
    gpa: str
    skills: list[str] = Field(default_factory=list)
    thesis_topic: str | None = None
    publications: list[str] = Field(default_factory=list)


class CVParseResponse(BaseModel):
    success: bool = True
    parsed_data: CVParsedData
    raw_char_count: int
    model_used: str


class ProfessorMatchScore(BaseModel):
    professor_id: str
    professor_name: str
    university: str
    compatibility_score: int = Field(ge=0, le=100)
    matching_skills: list[str] = Field(default_factory=list)
    adjacent_skills: list[str] = Field(default_factory=list)
    skill_gaps: list[str] = Field(default_factory=list)
    recommendation_snippet: str


class ProfileMatchRequest(BaseModel):
    parsed_cv: CVParsedData
    professor_id: str | None = None
    professors: list[ProfessorProfile] | None = None


class ProfileMatchResponse(BaseModel):
    matches: list[ProfessorMatchScore]
    top_matched_prof_id: str | None = None
    average_score: float = 0.0


# --- 2. AI Research Paper Deconstructor & Hook Generator --------------------

class PaperDeconstructRequest(BaseModel):
    paper_title: str
    professor_name: str
    student_skills: list[str] = Field(default_factory=list)
    student_thesis: str | None = None
    abstract_or_summary: str | None = None


class PaperDeconstructResponse(BaseModel):
    paper_title: str
    professor_name: str
    core_contribution: str
    unsolved_limitation: str
    methodology_keywords: list[str] = Field(default_factory=list)
    tailored_cold_hook: str
    prep_questions: list[str] = Field(default_factory=list)
    model_used: str


# --- 6. Live OpenAlex Global Academic Deep Fetcher -------------------------

class LiveAcademicSearchRequest(BaseModel):
    query: str = Field(min_length=2, description="Search term, e.g. 'Neuromorphic computing' or 'Perovskite solar'")
    country: str | None = None
    limit: int = Field(default=10, ge=1, le=25)


class LiveAcademicSearchResponse(BaseModel):
    total: int
    query: str
    results: list[ProfessorProfile]
    source: str = "OpenAlex Global Index"




