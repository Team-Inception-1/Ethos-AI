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
  process.env.NEXT_PUBLIC_AI_SERVICE_URL?.replace(/\/$/, '') || 'http://localhost:8001';

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
