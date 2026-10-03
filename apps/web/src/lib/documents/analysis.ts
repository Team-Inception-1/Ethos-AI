import { z } from 'zod';

const offerResult = z.object({
  riskScore: z.number().min(0).max(100),
  verdict: z.enum(['genuine', 'suspicious', 'fake']),
  flags: z.array(z.object({ message: z.string().max(2000) })).max(100),
});
const agreementResult = z.object({
  verdict: z.enum(['clear', 'needs_review', 'high_risk']),
  flags: z.array(z.object({ message_en: z.string().max(2000) })).max(100),
});

export type VaultDocumentVerdict = 'likely_genuine' | 'needs_review' | 'likely_fake';

const storedVerdictMap: Record<string, VaultDocumentVerdict> = {
  likely_genuine: 'likely_genuine',
  genuine: 'likely_genuine',
  clear: 'likely_genuine',
  needs_review: 'needs_review',
  suspicious: 'needs_review',
  likely_fake: 'likely_fake',
  fake: 'likely_fake',
  high_risk: 'likely_fake',
};

export function normalizeStoredDocumentVerdict(verdict: string | null | undefined): VaultDocumentVerdict | null {
  if (!verdict) return null;
  return storedVerdictMap[verdict] ?? null;
}

export function normalizeDocumentAnalysis(type: string, payload: unknown) {
  if (type === 'OFFER_LETTER') {
    const result = offerResult.parse(payload);
    return { riskScore: result.riskScore, verdict: normalizeStoredDocumentVerdict(result.verdict)!, flags: result.flags.map(flag => flag.message), modelVersion: 'ai-service-offer' };
  }
  if (type !== 'SIGNED_AGREEMENT') throw new Error('Unsupported document analysis.');
  const result = agreementResult.parse(payload);
  // Categorical UI indicator: not a probability returned by the model.
  const riskScore = { clear: 0, needs_review: 50, high_risk: 100 }[result.verdict];
  return { riskScore, verdict: normalizeStoredDocumentVerdict(result.verdict)!, flags: result.flags.map(flag => flag.message_en), modelVersion: 'agreement-verdict-mapping-v1' };
}
