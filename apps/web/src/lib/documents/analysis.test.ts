import { describe, expect, it } from 'vitest';
import { normalizeDocumentAnalysis } from './analysis';
describe('AI document response contracts', () => {
  it('normalizes actual offer-letter flags and riskScore', () => {
    expect(normalizeDocumentAnalysis('OFFER_LETTER', { riskScore: 65, verdict: 'suspicious', flags: [{message: 'Sender mismatch', code: 'sender'}] })).toMatchObject({riskScore: 65, flags: ['Sender mismatch']});
  });
  it('explicitly maps agreement verdicts without inventing a model score', () => {
    expect(normalizeDocumentAnalysis('SIGNED_AGREEMENT', {verdict: 'high_risk', flags: [{message_en: 'No refund'}]})).toMatchObject({riskScore: 100, flags: ['No refund'], modelVersion: 'agreement-verdict-mapping-v1'});
  });
  it('rejects invalid and unsupported responses', () => {
    expect(() => normalizeDocumentAnalysis('OFFER_LETTER', {risk_score: 1, flags: [], verdict: 'clear'})).toThrow();
    expect(() => normalizeDocumentAnalysis('PASSPORT', {})).toThrow();
  });
});
