import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => { vi.resetModules(); vi.stubEnv('NEXT_PUBLIC_OFFLINE_DEMO', 'false'); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it('uses the same-origin authenticated gateway and never invents successful analysis on failure', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ detail: 'Unavailable' }, { status: 503 }));
  vi.stubGlobal('fetch', fetcher);
  const { analyzeOfferLetterText, AiServiceError } = await import('@/lib/aiService');
  await expect(analyzeOfferLetterText('Some offer letter')).rejects.toBeInstanceOf(AiServiceError);
  expect(fetcher).toHaveBeenCalledWith('/api/ai/analyze-offer-letter/text', expect.any(Object));
});

it('does not convert authentication denial into demo output even in explicit demo mode', async () => {
  vi.stubEnv('NEXT_PUBLIC_OFFLINE_DEMO', 'true');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 401 })));
  const { analyzeAgreementText } = await import('@/lib/aiService');
  await expect(analyzeAgreementText('An agreement')).rejects.toMatchObject({ status: 401 });
});

it('reports transport failures when demo mode is disabled', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
  const { parseCVText } = await import('@/lib/aiService');
  await expect(parseCVText('Sample CV')).rejects.toMatchObject({ status: 503 });
});
