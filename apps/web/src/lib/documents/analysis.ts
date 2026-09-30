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
export function normalizeDocumentAnalysis(type: string, payload: unknown) {
  if (type === 'OFFER_LETTER') {
    const result = offerResult.parse(payload);
    return { riskScore: result.riskScore, verdict: result.verdict, flags: result.flags.map(flag => flag.message), modelVersion: 'ai-service-offer' };
  }
  if (type !== 'SIGNED_AGREEMENT') throw new Error('Unsupported document analysis.');
  const result = agreementResult.parse(payload);
  // Categorical UI indicator: not a probability returned by the model.
  const riskScore = { clear: 0, needs_review: 50, high_risk: 100 }[result.verdict];
  return { riskScore, verdict: result.verdict, flags: result.flags.map(flag => flag.message_en), modelVersion: 'agreement-verdict-mapping-v1' };
}
