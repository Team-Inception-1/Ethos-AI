import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), initiate: vi.fn(), transition: vi.fn(), reconcile: vi.fn() }));
vi.mock('@/lib/auth/authorization', () => ({ requireRole: mocks.authorize }));
vi.mock('@/lib/payments/service', () => ({ initiatePayment: mocks.initiate, transitionEscrow: mocks.transition, reconcilePayment: mocks.reconcile }));
import { POST as pay } from '@/app/api/escrow/pay/route';
import { POST as release } from '@/app/api/escrow/release/route';
import { POST as refund } from '@/app/api/escrow/refund/route';
import { POST as dispute } from '@/app/api/escrow/dispute/route';
import { POST as webhook } from '@/app/api/escrow/webhook/route';
import { POST as action } from '@/app/api/payments/escrow/action/route';
const secret = 'test-only-payment-signing-secret-at-least-32-characters';
const request = (body: unknown, origin = 'http://localhost:3000') => new Request('http://localhost:3000/api/escrow/pay', {
  method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('ETHOS_PAYMENT_MODE', 'sandbox'); vi.stubEnv('ETHOS_PAYMENT_SANDBOX_SECRET', secret);
  mocks.authorize.mockResolvedValue({ user: { id: 'real-student', role: 'STUDENT' }, response: null });
  mocks.initiate.mockResolvedValue({ status: 'INITIATED', payment: { amountPoisha: BigInt(10000) } });
  mocks.transition.mockResolvedValue({ status: 'DISPUTED' }); mocks.reconcile.mockResolvedValue({ success: true, status: 'HELD' });
});
describe('payment route security boundary', () => {
  it.each([pay, release, refund, dispute, action])('rejects unauthenticated callers before parsing malformed bodies', async route => {
    mocks.authorize.mockResolvedValue({ response: Response.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 }) });
    expect((await route(new Request('http://localhost:3000/api/escrow', { method: 'POST', body: '{' }))).status).toBe(401);
    expect(mocks.initiate).not.toHaveBeenCalled(); expect(mocks.transition).not.toHaveBeenCalled();
  });
  it('ignores forged actors/amounts and serializes integer amounts', async () => {
    const response = await pay(request({ milestoneId: 'milestone', provider: 'BKASH', actorId: 'admin', actorRole: 'ADMIN', amountPoisha: '1' }));
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ payment: { amountPoisha: '10000' } });
    expect(mocks.initiate).toHaveBeenCalledWith('milestone', 'BKASH', { id: 'real-student', role: 'STUDENT' });
    expect(mocks.authorize).toHaveBeenCalledWith(['STUDENT']);
  });
  it('rejects instant holds, unknown providers, empty IDs and invalid JSON', async () => {
    for (const body of [{ milestoneId: 'm', simulateInstantHold: true }, { milestoneId: 'm', provider: 'UNKNOWN' }, { milestoneId: '' }]) {
      expect((await pay(request(body))).status).toBe(400);
    }
    expect((await pay(new Request('http://localhost:3000/api/escrow/pay', { method: 'POST',
      headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, body: '{' }))).status).toBe(400);
    expect(mocks.initiate).not.toHaveBeenCalled();
  });
  it('rejects cross-origin and missing-origin mutations, including the action alias', async () => {
    expect((await pay(request({ milestoneId: 'm' }, 'https://attacker.test'))).status).toBe(403);
    expect((await release(request({ milestoneId: 'm' }, ''))).status).toBe(403);
    expect((await action(request({ milestoneId: 'm', action: 'deposit' }, 'https://attacker.test'))).status).toBe(403);
    expect(mocks.initiate).not.toHaveBeenCalled(); expect(mocks.transition).not.toHaveBeenCalled();
  });
  it('requires admin refunds and passes only session identity to mutations', async () => {
    mocks.authorize.mockResolvedValue({ user: { id: 'real-admin', role: 'ADMIN' }, response: null });
    expect((await refund(request({ milestoneId: 'm', reason: 'Evidence reviewed', actorId: 'forged' }))).status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith(['ADMIN']);
    expect(mocks.transition).toHaveBeenCalledWith('m', 'REFUNDED', { id: 'real-admin', role: 'ADMIN' }, 'Evidence reviewed');
  });
  it('never reconciles an unsigned or modified callback', async () => {
    expect((await webhook(request({ providerTxnId: 'forged' }))).status).toBe(401);
    expect(mocks.reconcile).not.toHaveBeenCalled();
  });
  it('accepts a fresh signed callback and denies all callbacks in production', async () => {
    const body = JSON.stringify({ provider: 'BKASH', providerTxnId: 'ee30cd3f-25de-433f-917e-a16c6ad5cac9',
      milestoneId: 'milestone', amountPoisha: '10000', currency: 'BDT', status: 'VALID' });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
    const signed = () => new Request('http://localhost:3000/api/escrow/webhook', { method: 'POST', body,
      headers: { 'x-ethos-timestamp': timestamp, 'x-ethos-signature': signature } });
    expect((await webhook(signed())).status).toBe(200); expect(mocks.reconcile).toHaveBeenCalledOnce();
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('VERCEL_ENV', 'production'); expect((await webhook(signed())).status).toBe(503);
    expect(mocks.reconcile).toHaveBeenCalledOnce();
  });
});
