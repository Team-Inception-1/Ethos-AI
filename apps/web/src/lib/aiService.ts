/**
 * Client for the Ethos AI microservice (`apps/ai-service`, FastAPI).
 *
 * Wires the frontend to the live endpoints delivered by:
 *   - Issue #16 (K-17): Module 5.9 Smart Agreement Analyzer
 *   - Issue #23 (K-22): Module 5.10 Scam Alert System
 * per Issue #25 (K-24)'s objective — no mocked AI response data.
 *
 * Base URL is `NEXT_PUBLIC_AI_SERVICE_URL` — must be reachable from the
 * BROWSER (this file runs client-side), not just from the Next.js server.
 */

const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL?.replace(/\/$/, '') ||
  (typeof window !== 'undefined' && window.location.hostname
    ? `http://${window.location.hostname}:8001`
    : 'http://localhost:8001');

export class AiServiceError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AiServiceError';
    this.status = status;
  }
}

async function parseErrorDetail(resp: Response): Promise<string> {
  try {
    const body = await resp.json();
    if (typeof body?.detail === 'string') return body.detail;
    if (Array.isArray(body?.detail)) {
      // FastAPI/pydantic 422 validation errors: [{ loc, msg, type }, ...]
      return body.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('; ') || resp.statusText;
    }
    return resp.statusText;
  } catch {
    return resp.statusText || `HTTP ${resp.status}`;
  }
}

export type FlagSeverity = 'info' | 'warning' | 'danger';

// ---------------------------------------------------------------------------
// Module 5.8 — Fake Document Detection (#22 / K-21)
// ---------------------------------------------------------------------------

export type OfferLetterVerdict = 'genuine' | 'suspicious' | 'fake';

export interface OfferLetterFlag {
  code: string;
  message: string;
  severity: FlagSeverity;
  points: number;
}

export interface AnalyzeOfferLetterResponse {
  riskScore: number;
  verdict: OfferLetterVerdict;
  flags: OfferLetterFlag[];
}

/** POST /api/ai/analyze-offer-letter — multipart file upload (PDF/image/.txt). */
export async function analyzeOfferLetterFile(
  file: File,
  opts: { senderEmail?: string; expectedUniversity?: string } = {}
): Promise<AnalyzeOfferLetterResponse> {
  const form = new FormData();
  form.append('file', file);
  if (opts.senderEmail) form.append('sender_email', opts.senderEmail);
  if (opts.expectedUniversity) form.append('expected_university', opts.expectedUniversity);

  const resp = await fetch(`${AI_SERVICE_URL}/api/ai/analyze-offer-letter`, {
    method: 'POST',
    body: form,
  });

  if (!resp.ok) {
    throw new AiServiceError(await parseErrorDetail(resp), resp.status);
  }
  return resp.json();
}

/** POST /api/ai/analyze-offer-letter/text — JSON body, raw offer letter text. */
export async function analyzeOfferLetterText(
  text: string,
  opts: { senderEmail?: string; expectedUniversity?: string } = {}
): Promise<AnalyzeOfferLetterResponse> {
  const resp = await fetch(`${AI_SERVICE_URL}/api/ai/analyze-offer-letter/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      sender_email: opts.senderEmail ?? null,
      expected_university: opts.expectedUniversity ?? null,
    }),
  });

  if (!resp.ok) {
    throw new AiServiceError(await parseErrorDetail(resp), resp.status);
  }
  return resp.json();
}

// ---------------------------------------------------------------------------
// Module 5.9 — Smart Agreement Analyzer (#16)
// ---------------------------------------------------------------------------

export type ClauseType = 'fee' | 'refund' | 'cancellation' | 'liability' | 'other';

export interface DeclaredFee {
  service_name: string;
  amount_poisha: number;
  when_charged: string;
  refundable: boolean;
  conditions?: string | null;
}

export interface ExtractedClause {
  clause_type: ClauseType;
  quote: string;
  amount_poisha: number | null;
  summary_en: string;
}

export interface ClauseFlag {
  tag: string;
  severity: FlagSeverity;
  clause_type: ClauseType;
  message_en: string;
  related_quote?: string | null;
  amount_poisha?: number | null;
}

export interface AnalyzeAgreementResponse {
  clauses: ExtractedClause[];
  flags: ClauseFlag[];
  verdict: 'clear' | 'needs_review' | 'high_risk';
  model_used: string;
  truncated: boolean;
}

/** POST /api/ai/analyze-agreement — multipart file upload (PDF/image/.txt). */
export async function analyzeAgreementFile(
  file: File,
  opts: { declaredPricing?: DeclaredFee[]; language?: string } = {}
): Promise<AnalyzeAgreementResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('declared_pricing', JSON.stringify(opts.declaredPricing ?? []));
  form.append('language', opts.language ?? 'en');

  const resp = await fetch(`${AI_SERVICE_URL}/api/ai/analyze-agreement`, {
    method: 'POST',
    body: form,
  });

  if (!resp.ok) {
    throw new AiServiceError(await parseErrorDetail(resp), resp.status);
  }
  return resp.json();
}

/** POST /api/ai/analyze-agreement/text — JSON body, raw agreement text. */
export async function analyzeAgreementText(
  agreementText: string,
  opts: { declaredPricing?: DeclaredFee[]; language?: string } = {}
): Promise<AnalyzeAgreementResponse> {
  const resp = await fetch(`${AI_SERVICE_URL}/api/ai/analyze-agreement/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agreement_text: agreementText,
      declared_pricing: opts.declaredPricing ?? [],
      language: opts.language ?? 'en',
    }),
  });

  if (!resp.ok) {
    throw new AiServiceError(await parseErrorDetail(resp), resp.status);
  }
  return resp.json();
}

// ---------------------------------------------------------------------------
// Module 5.10 — Scam Alert System (#23)
// ---------------------------------------------------------------------------

export type ScamCategory =
  | 'guarantee_claim'
  | 'urgency_pressure'
  | 'unverifiable_credential'
  | 'payment_pressure'
  | 'other';

export type ScamFlagSource = 'rule' | 'llm';

export interface ScamFlag {
  tag: string;
  category: ScamCategory;
  severity: FlagSeverity;
  source: ScamFlagSource;
  matched_text: string;
  message_en: string;
}

export interface ScanContentResponse {
  flags: ScamFlag[];
  severity: FlagSeverity;
  model_used: string;
}

/** POST /api/ai/scan-content — scan free text for predatory/scam claims. */
export async function scanContent(
  text: string,
  opts: { source?: string; language?: string; agencyId?: string } = {}
): Promise<ScanContentResponse> {
  const resp = await fetch(`${AI_SERVICE_URL}/api/ai/scan-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      source: opts.source ?? 'unknown',
      language: opts.language ?? 'en',
      agency_id: opts.agencyId,
    }),
  });

  if (!resp.ok) {
    throw new AiServiceError(await parseErrorDetail(resp), resp.status);
  }
  return resp.json();
}

export interface AgencyRiskEvent {
  source: string;
  weight: number;
  reason: string;
  occurred_at: string;
}

export interface AgencyRiskScore {
  agency_id: string;
  risk_score: number;
  flag_count: number;
  last_updated: string;
  recent_events: AgencyRiskEvent[];
}

/** GET /api/ai/agencies/{agency_id}/risk-score — rolling risk score for an agency. */
export async function getAgencyRiskScore(agencyId: string): Promise<AgencyRiskScore> {
  const resp = await fetch(
    `${AI_SERVICE_URL}/api/ai/agencies/${encodeURIComponent(agencyId)}/risk-score`
  );
  if (!resp.ok) {
    throw new AiServiceError(await parseErrorDetail(resp), resp.status);
  }
  return resp.json();
}

/**
 * Fetch risk scores for multiple agencies in parallel. Any individual
 * failure falls back to a clean 0-score entry for that agency rather than
 * failing the whole batch — one flaky agency shouldn't blank the whole
 * Directory grid.
 */
export async function getAgencyRiskScores(
  agencyIds: string[]
): Promise<Record<string, AgencyRiskScore>> {
  const results = await Promise.all(
    agencyIds.map(async (id) => {
      try {
        return [id, await getAgencyRiskScore(id)] as const;
      } catch {
        return [
          id,
          {
            agency_id: id,
            risk_score: 0,
            flag_count: 0,
            last_updated: new Date().toISOString(),
            recent_events: [],
          } as AgencyRiskScore,
        ] as const;
      }
    })
  );
  return Object.fromEntries(results);
}

// ---------------------------------------------------------------------------
// Module 5.18 & 5.11 — AI Counselor Chatbot & Bangla Assistant (#24 / K-23)
// ---------------------------------------------------------------------------

export type UniversityTier = 'dream' | 'target' | 'safe';

export interface CounselorEvaluationRequest {
  current_degree?: string;
  gpa: number;
  max_gpa?: number;
  ielts_score?: number | null;
  pte_score?: number | null;
  duolingo_score?: number | null;
  budget_yearly_bdt_lakh: number;
  target_countries?: string[];
  target_field?: string | null;
  study_gap_years?: number;
  preferred_intake?: string | null;
  has_work_experience?: boolean;
  scholarship_priority?: boolean;
  moi_only?: boolean;
  field_category?: string | null;
  language?: 'en' | 'bn';
  enable_live_discovery?: boolean;
}

export interface UniversityRecommendation {
  id: string;
  university_name: string;
  country: string;
  city: string;
  target_programs: string[];
  tier: UniversityTier;
  match_score: number;
  admission_chance_percent: number;
  annual_tuition_bdt_lakh: number;
  annual_living_bdt_lakh: number;
  annual_total_bdt_lakh: number;
  currency_local: string;
  annual_tuition_local: number;
  minimum_gpa: number;
  minimum_ielts: number;
  max_study_gap_years: number;
  matching_reasons: string[];
  caution_notes: string[];
  scholarship_info?: string | null;
  accepts_moi?: boolean;
  coop_available?: boolean;
  field_tags?: string[];
  website_url?: string | null;
  is_live_grounded?: boolean;
  grounding_citations?: GroundingCitation[];
}

export interface VisaRiskFlag {
  severity: FlagSeverity;
  title: string;
  description: string;
  mitigation_tip: string;
}

export interface VisaAssessment {
  readiness_score: number;
  status: 'favorable' | 'moderate_risk' | 'high_scrutiny';
  estimated_solvency_required_bdt_lakh: number;
  solvency_details_by_country: Record<string, string>;
  risk_flags: VisaRiskFlag[];
  key_advice: string[];
}

export interface RoadmapMilestone {
  step_number: number;
  month_timeline: string;
  phase_title: string;
  tasks: string[];
  critical_warning: string | null;
}

export interface CounselorEvaluationResponse {
  profile_summary: {
    normalized_gpa: number;
    ielts_equivalent: number;
    budget_bdt_lakh: number;
    study_gap_years: number;
    target_field: string;
    preferred_intake: string;
  };
  recommendations: UniversityRecommendation[];
  visa_assessment: VisaAssessment;
  roadmap: RoadmapMilestone[];
  dream_count: number;
  target_count: number;
  safe_count: number;
  live_discovery_active?: boolean;
}

export interface GroundingCitation {
  title: string;
  url: string;
}

export interface CounselorChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: GroundingCitation[];
}

export interface CounselorChatRequest {
  messages: CounselorChatMessage[];
  profile_context?: CounselorEvaluationRequest | null;
  language?: 'en' | 'bn' | 'auto';
}

export interface CounselorChatResponse {
  reply: string;
  suggested_queries: string[];
  detected_language: string;
  model_used: string;
  citations?: GroundingCitation[];
}

/** POST /api/ai/counselor/evaluate — evaluates student profile with offline client failover. */
export async function evaluateCounselorProfile(
  payload: CounselorEvaluationRequest
): Promise<CounselorEvaluationResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/counselor/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice unreachable, activating zero-downtime offline counselor engine:', err);
  }

  // Graceful offline failover
  const { evaluateOfflineProfile } = await import('./counselorOfflineEngine');
  return evaluateOfflineProfile(payload);
}

/** POST /api/ai/counselor/discover-live — on-demand live Google Search Grounded university discovery */
export async function discoverLiveUniversities(
  payload: CounselorEvaluationRequest
): Promise<CounselorEvaluationResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/counselor/discover-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, enable_live_discovery: true }),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('Live university discovery request failed, falling back to offline evaluator:', err);
  }
  const { evaluateOfflineProfile } = await import('./counselorOfflineEngine');
  return evaluateOfflineProfile(payload);
}

/** POST /api/ai/counselor/chat — conversational counselor with offline client failover. */
export async function sendCounselorChatMessage(
  payload: CounselorChatRequest
): Promise<CounselorChatResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/counselor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice chat unreachable, falling back to offline conversational engine:', err);
  }

  // Graceful offline failover
  const { sendOfflineChatMessage } = await import('./counselorOfflineEngine');
  return sendOfflineChatMessage(payload.messages, payload.profile_context, payload.language || 'en');
}

// ---------------------------------------------------------------------------
// SOP Auditor (AI Counselor Upgrade)
// ---------------------------------------------------------------------------

export type SOPAuditCategory = 'cliche' | 'visa_intent' | 'university_alignment' | 'grammar_tone' | 'structure';

export interface SOPAuditFinding {
  category: SOPAuditCategory;
  severity: FlagSeverity;
  quote: string;
  issue: string;
  suggestion: string;
  paragraph_ref?: string | null;
}

export interface SOPAuditRequest {
  sop_text: string;
  target_university?: string | null;
  target_country?: string | null;
  target_program?: string | null;
  profile_context?: CounselorEvaluationRequest | null;
  language?: 'en' | 'bn';
}

export interface SOPAuditResponse {
  overall_score: number;
  verdict: 'strong' | 'needs_work' | 'weak';
  findings: SOPAuditFinding[];
  cliche_count: number;
  visa_intent_score: number;
  university_alignment_score: number;
  summary: string;
  improved_excerpt?: string | null;
  model_used: string;
}

/** POST /api/ai/counselor/audit-sop — audits an SOP draft with offline failover. */
export async function auditSOP(
  payload: SOPAuditRequest
): Promise<SOPAuditResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/counselor/audit-sop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice SOP audit unreachable, falling back to offline:', err);
  }

  // Graceful offline failover
  const { auditSOPOffline } = await import('./counselorOfflineEngine');
  return auditSOPOffline(payload);
}

/** GET /api/ai/counselor/countries — supported destination countries & visa rules. */
export async function getCounselorSupportedCountries(): Promise<{
  countries: Record<string, unknown>;
}> {
  const resp = await fetch(`${AI_SERVICE_URL}/api/ai/counselor/countries`);
  if (!resp.ok) {
    throw new AiServiceError(await parseErrorDetail(resp), resp.status);
  }
  return resp.json();
}

// ---------------------------------------------------------------------------
// ScholarFinder & RA/TA Full-Fund Scholarship Suite
// ---------------------------------------------------------------------------

export interface ProfessorPublication {
  title: string;
  year: number;
  venue?: string | null;
  link?: string | null;
  summary?: string | null;
}

export interface ProfessorProfile {
  id: string;
  name: string;
  title: string;
  university: string;
  department: string;
  country: string;
  tier: string;
  lab_name: string;
  lab_url?: string | null;
  email: string;
  google_scholar_url?: string | null;
  primary_domain: string;
  research_interests: string[];
  active_funding_indicator: boolean;
  funding_sources: string[];
  accepting_students: boolean;
  recent_publications: ProfessorPublication[];
  h_index?: number | null;
  citations_count?: number | null;
  lab_location?: string | null;
}

export interface ProfessorSearchRequest {
  domain?: string | null;
  sub_topics?: string[];
  countries?: string[];
  university_tiers?: string[];
  accepting_only?: boolean;
  has_active_funding?: boolean;
  query?: string | null;
  page?: number;
  limit?: number;
}

export interface ProfessorSearchResponse {
  total: number;
  page: number;
  limit: number;
  professors: ProfessorProfile[];
  domains_available: string[];
  countries_available: string[];
  tiers_available: string[];
}

export interface ColdEmailVariant {
  subject_line: string;
  body: string;
  word_count: number;
  tone: string;
}

export interface EmailQualityAudit {
  overall_score: number;
  verdict: 'Ready to Send' | 'Needs Refinement' | 'High Spam Risk' | string;
  word_count_status: string;
  strengths: string[];
  cautionary_flags: string[];
  best_send_time_local: string;
}

export interface ColdEmailGenerateRequest {
  professor: ProfessorProfile;
  selected_paper_title: string;
  student_name: string;
  student_degree: string;
  student_institution: string;
  student_gpa: string | number;
  student_skills: string[];
  student_thesis_topic?: string | null;
  target_degree?: string;
  target_semester?: string;
  language?: string;
}

export interface ColdEmailGenerateResponse {
  initial_email: ColdEmailVariant;
  subject_line_options: string[];
  follow_up_1: ColdEmailVariant;
  follow_up_2: ColdEmailVariant;
  anti_spam_audit: EmailQualityAudit;
  bangla_guidance: string;
  model_used: string;
}

export interface InterviewPrepRequest {
  professor_name: string;
  university: string;
  research_interests: string[];
  recent_paper_title: string;
  student_skills: string[];
}

export interface InterviewPrepQuestion {
  question: string;
  why_prof_asks_this: string;
  strong_answer_strategy: string;
  key_terms_to_mention: string[];
}

export interface InterviewPrepResponse {
  professor_name: string;
  university: string;
  predicted_questions: InterviewPrepQuestion[];
  lab_vibe_summary: string;
  recommended_reading: string[];
  model_used: string;
}

export interface TARAGuideItem {
  country: string;
  flag: string;
  ra_overview: string;
  ta_overview: string;
  monthly_stipend_range: string;
  monthly_stipend_bdt_lakh: number;
  tuition_remission: string;
  ta_speaking_score_requirement: string;
  key_deadlines: string;
  pro_tips: string[];
}

export interface TARAGuideResponse {
  countries: TARAGuideItem[];
  speaking_score_thresholds: Record<string, string>;
  grant_cycles_overview: Array<{ mechanism: string; timeline: string }>;
}

/** POST /api/ai/scholar/search — searches faculty with offline failover. */
export async function searchProfessors(
  payload: ProfessorSearchRequest
): Promise<ProfessorSearchResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/scholar/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice scholar search unreachable, falling back to offline:', err);
  }

  const { searchProfessorsOffline } = await import('./scholarOfflineEngine');
  return searchProfessorsOffline(payload);
}

/** POST /api/ai/scholar/generate-email — synthesizes cold email with offline failover. */
export async function generateColdEmail(
  payload: ColdEmailGenerateRequest
): Promise<ColdEmailGenerateResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/scholar/generate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice email generation unreachable, falling back to offline:', err);
  }

  const { generateColdEmailOffline } = await import('./scholarOfflineEngine');
  return generateColdEmailOffline(payload);
}

/** POST /api/ai/scholar/interview-prep — predicts interview questions with offline failover. */
export async function prepareInterview(
  payload: InterviewPrepRequest
): Promise<InterviewPrepResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/scholar/interview-prep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice interview prep unreachable, falling back to offline:', err);
  }

  const { prepareInterviewOffline } = await import('./scholarOfflineEngine');
  return prepareInterviewOffline(payload);
}

/** GET /api/ai/scholar/guide — gets RA/TA funding guide with offline failover. */
export async function getTARAGuide(): Promise<TARAGuideResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/scholar/guide`);
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice funding guide unreachable, falling back to offline:', err);
  }

  const { getTARAGuideOffline } = await import('./scholarOfflineEngine');
  return getTARAGuideOffline();
}

// ---------------------------------------------------------------------------
// Elite AI Superpowers: CV Parsing, Matchmaker, Paper Deconstruction, OpenAlex
// ---------------------------------------------------------------------------

export interface CVParsedData {
  student_name: string;
  email?: string | null;
  degree: string;
  institution: string;
  gpa: string;
  skills: string[];
  thesis_topic?: string | null;
  publications: string[];
}

export interface CVParseResponse {
  success: boolean;
  parsed_data: CVParsedData;
  raw_char_count: number;
  model_used: string;
}

export interface ProfessorMatchScore {
  professor_id: string;
  professor_name: string;
  university: string;
  compatibility_score: number;
  matching_skills: string[];
  adjacent_skills: string[];
  skill_gaps: string[];
  recommendation_snippet: string;
}

export interface ProfileMatchRequest {
  parsed_cv: CVParsedData;
  professor_id?: string | null;
  professors?: ProfessorProfile[] | null;
}

export interface ProfileMatchResponse {
  matches: ProfessorMatchScore[];
  top_matched_prof_id?: string | null;
  average_score: number;
}

export interface PaperDeconstructRequest {
  paper_title: string;
  professor_name: string;
  student_skills?: string[];
  student_thesis?: string | null;
  abstract_or_summary?: string | null;
}

export interface PaperDeconstructResponse {
  paper_title: string;
  professor_name: string;
  core_contribution: string;
  unsolved_limitation: string;
  methodology_keywords: string[];
  tailored_cold_hook: string;
  prep_questions: string[];
  model_used: string;
}

export interface LiveAcademicSearchRequest {
  query: string;
  country?: string | null;
  limit?: number;
}

export interface LiveAcademicSearchResponse {
  total: number;
  query: string;
  results: ProfessorProfile[];
  source: string;
}

/** POST /api/ai/scholar/parse-cv/file — parses uploaded CV PDF/DOC. */
export async function parseCVFile(file: File): Promise<CVParseResponse> {
  try {
    const form = new FormData();
    form.append('file', file);
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/scholar/parse-cv/file`, {
      method: 'POST',
      body: form,
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice CV parse file unreachable, falling back to offline:', err);
  }

  // If text file, read text directly
  const text = await file.text();
  const { parseCVTextOffline } = await import('./scholarOfflineEngine');
  return parseCVTextOffline(text);
}

/** POST /api/ai/scholar/parse-cv/text — parses raw CV text. */
export async function parseCVText(raw_text: string): Promise<CVParseResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/scholar/parse-cv/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text }),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice CV parse text unreachable, falling back to offline:', err);
  }

  const { parseCVTextOffline } = await import('./scholarOfflineEngine');
  return parseCVTextOffline(raw_text);
}

/** POST /api/ai/scholar/match-profile — computes compatibility match and skill gaps. */
export async function matchProfile(
  payload: ProfileMatchRequest
): Promise<ProfileMatchResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/scholar/match-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice match-profile unreachable, falling back to offline:', err);
  }

  const { calculateProfileMatchOffline } = await import('./scholarOfflineEngine');
  return calculateProfileMatchOffline(payload.parsed_cv, payload.professors ?? undefined);
}

/** POST /api/ai/scholar/deconstruct-paper — deconstructs paper into contribution and hook. */
export async function deconstructPaper(
  payload: PaperDeconstructRequest
): Promise<PaperDeconstructResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/scholar/deconstruct-paper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice deconstruct-paper unreachable, falling back to offline:', err);
  }

  const { deconstructPaperOffline } = await import('./scholarOfflineEngine');
  return deconstructPaperOffline(payload);
}

/** POST /api/ai/scholar/live-search — queries OpenAlex global academic repository. */
export async function liveSearchAcademic(
  payload: LiveAcademicSearchRequest
): Promise<LiveAcademicSearchResponse> {
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/api/ai/scholar/live-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn('AI microservice live-search unreachable, falling back to offline:', err);
  }

  const { searchOpenAlexOffline } = await import('./scholarOfflineEngine');
  return searchOpenAlexOffline(payload.query, payload.limit);
}



