import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireSandbox, verifySandboxCallback } from './sandbox';

const secret = 'test-only-payment-secret-with-at-least-32-characters';
const payload = { provider: 'BKASH', providerTxnId: 'ee30cd3f-25de-433f-917e-a16c6ad5cac9',
  milestoneId: 'milestone', amountPoisha: '10000', currency: 'BDT', status: 'VALID' };
const sign = (body: string, timestamp: string) => createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
beforeEach(() => { vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('ETHOS_PAYMENT_MODE', 'sandbox'); vi.stubEnv('ETHOS_PAYMENT_SANDBOX_SECRET', secret); });

describe('signed sandbox payment callbacks', () => {
  it('verifies the raw payload, including whitespace, against a fresh timestamp', () => {
    const body = JSON.stringify(payload); const timestamp = String(Math.floor(Date.now() / 1000));
    expect(verifySandboxCallback(body, timestamp, sign(body, timestamp))).toEqual(payload);
    expect(() => verifySandboxCallback(body + ' ', timestamp, sign(body, timestamp))).toThrow('signature');
  });
  it('rejects missing, malformed, forged, stale and future signatures', () => {
    const body = JSON.stringify(payload); const timestamp = String(Math.floor(Date.now() / 1000));
    for (const signature of [null, 'bad', '0'.repeat(64)]) {
      expect(() => verifySandboxCallback(body, timestamp, signature)).toThrow('signature');
    }
    for (const offset of [-301, 301]) {
      const stale = String(Number(timestamp) + offset);
      expect(() => verifySandboxCallback(body, stale, sign(body, stale))).toThrow('signature');
    }
  });
  it('rejects invalid currency, amount, status and transaction identifiers even when signed', () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    for (const change of [{ currency: 'USD' }, { amountPoisha: '-1' }, { amountPoisha: '1.5' }, { status: 'SUCCESS' }, { providerTxnId: 'invented' }]) {
      const body = JSON.stringify({ ...payload, ...change });
      expect(() => verifySandboxCallback(body, timestamp, sign(body, timestamp))).toThrow();
    }
  });
  it('never enables sandbox processing in production, live mode or without a secret', () => {
    vi.stubEnv('NODE_ENV', 'production'); expect(() => requireSandbox()).toThrow('not configured');
    vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('ETHOS_PAYMENT_MODE', 'live'); expect(() => requireSandbox()).toThrow('not configured');
    vi.stubEnv('ETHOS_PAYMENT_MODE', 'sandbox'); vi.stubEnv('ETHOS_PAYMENT_SANDBOX_SECRET', ''); expect(() => requireSandbox()).toThrow('not configured');
  });
});
