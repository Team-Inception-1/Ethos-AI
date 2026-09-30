import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma as db } from '@/lib/prisma';
import { initiatePayment, reconcilePayment, transitionEscrow } from '@/lib/payments/service';

// Explicitly opt in only against the disposable local database. Never load .env.
const enabled = process.env.RUN_DATABASE_TESTS === 'true';
if (enabled) {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (process.env.NODE_ENV !== 'test' || !['localhost', '127.0.0.1', 'postgres'].includes(url.hostname) || url.pathname !== '/ethos_test') {
    throw new Error('Payment tests require NODE_ENV=test and the disposable local ethos_test database.');
  }
}
const prefix = `payment-test-${randomUUID()}`;
const student = { id: `${prefix}-student`, role: 'STUDENT' as const };
const admin = { id: `${prefix}-admin`, role: 'ADMIN' as const };
const ownerId = `${prefix}-owner`;
const agencyId = `${prefix}-agency`;
const applicationId = `${prefix}-application`;
const milestoneIds: string[] = [];
async function fixture() {
  vi.stubEnv('ETHOS_PAYMENT_MODE', 'sandbox'); vi.stubEnv('ETHOS_PAYMENT_SANDBOX_SECRET', 'test-only-payment-secret-at-least-32-characters');
  const id = `${prefix}-${randomUUID()}`; milestoneIds.push(id);
  await db.milestone.create({ data: { id, applicationId, name: 'Test milestone', amountPoisha: BigInt(10000), releaseCondition: 'Test evidence' } });
  return id;
}
function callback(id: string, providerTxnId: string) {
  return { provider: 'BKASH' as const, milestoneId: id, providerTxnId, amountPoisha: '10000', currency: 'BDT' as const, status: 'VALID' as const };
}
describe.skipIf(!enabled)('real PostgreSQL payment atomicity and concurrency', () => {
  beforeAll(async () => {
    await db.user.createMany({ data: [student, admin, { id: ownerId, role: 'AGENCY' as const }].map(user => ({
      ...user, name: 'Payment integration fixture', email: `${user.id}@example.test`, phone: user.id,
    })) });
    await db.agency.create({ data: { id: agencyId, ownerUserId: ownerId, name: 'Payment fixture agency', licenseNo: agencyId, countriesServed: [] } });
    await db.application.create({ data: { id: applicationId, studentId: student.id, agencyId,
      targetCountry: 'Test', targetUniversity: 'Test', targetProgram: 'Test' } });
  });
  afterAll(async () => {
    // Remove only this suite's uniquely named records, in foreign-key order.
    await db.receipt.deleteMany({ where: { ledgerEntry: { milestoneId: { in: milestoneIds } } } });
    await db.ledgerEntry.deleteMany({ where: { milestoneId: { in: milestoneIds } } });
    await db.paymentAttempt.deleteMany({ where: { milestoneId: { in: milestoneIds } } });
    await db.milestone.deleteMany({ where: { id: { in: milestoneIds } } });
    await db.application.deleteMany({ where: { id: applicationId } });
    await db.agency.deleteMany({ where: { id: agencyId } });
    await db.user.deleteMany({ where: { id: { in: [student.id, admin.id, ownerId] } } });
    await db.$disconnect();
  });
  it('serializes parallel initiation and callbacks, then allows only one competing settlement', async () => {
    const id = await fixture();
    const starts = await Promise.all(Array.from({ length: 4 }, () => initiatePayment(id, 'BKASH', student)));
    expect(new Set(starts.map(start => start.payment.providerTxnId)).size).toBe(1);
    expect(await db.paymentAttempt.count({ where: { milestoneId: id } })).toBe(1);
    const signedPayload = callback(id, starts[0].payment.providerTxnId);
    await Promise.all(Array.from({ length: 4 }, () => reconcilePayment(signedPayload)));
    expect(await db.ledgerEntry.count({ where: { milestoneId: id, type: 'HOLD' } })).toBe(1);
    expect(await db.receipt.count({ where: { ledgerEntry: { milestoneId: id } } })).toBe(1);
    const settlements = await Promise.allSettled([
      transitionEscrow(id, 'RELEASED', student, 'Verified'), transitionEscrow(id, 'REFUNDED', admin, 'Approved'),
    ]);
    expect(settlements.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(await db.ledgerEntry.count({ where: { milestoneId: id, type: { in: ['RELEASE', 'REFUND'] } } })).toBe(1);
    expect(await db.receipt.count({ where: { ledgerEntry: { milestoneId: id } } })).toBe(2);
    // Replaying the funding callback after settlement must not reopen the milestone.
    expect(await reconcilePayment(signedPayload)).toMatchObject({ duplicate: true });
    expect(await db.ledgerEntry.count({ where: { milestoneId: id } })).toBe(2);
  });
  it('rolls back attempt, milestone and ledger when receipt persistence fails', async () => {
    const id = await fixture(); const start = await initiatePayment(id, 'BKASH', student);
    const original = db.$transaction.bind(db);
    const failingTransaction = (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) => original(async tx => {
      const wrapped = new Proxy(tx, { get(target, key) {
        if (key === 'receipt') return { create: async () => { throw new Error('Injected receipt persistence failure'); } };
        return Reflect.get(target, key);
      } });
      return operation(wrapped);
    });
    const spy = vi.spyOn(db, '$transaction').mockImplementation(failingTransaction as typeof db.$transaction);
    try {
      await expect(reconcilePayment(callback(id, start.payment.providerTxnId))).rejects.toThrow('Injected receipt');
    } finally { spy.mockRestore(); }
    expect((await db.milestone.findUniqueOrThrow({ where: { id } })).status).toBe('PENDING');
    expect((await db.paymentAttempt.findUniqueOrThrow({ where: { providerTxnId: start.payment.providerTxnId } })).status).toBe('INITIATED');
    expect(await db.ledgerEntry.count({ where: { milestoneId: id } })).toBe(0);
  });
  it('retains failed attempts and permits a new retry without accepting stale success', async () => {
    const id = await fixture(); const first = await initiatePayment(id, 'BKASH', student);
    await reconcilePayment({ ...callback(id, first.payment.providerTxnId), status: 'FAILED' });
    const retry = await initiatePayment(id, 'BKASH', student);
    expect(retry.payment.providerTxnId).not.toBe(first.payment.providerTxnId);
    await expect(reconcilePayment(callback(id, first.payment.providerTxnId))).rejects.toMatchObject({ code: 'PAYMENT_CLOSED' });
    await reconcilePayment(callback(id, retry.payment.providerTxnId));
    expect(await db.paymentAttempt.count({ where: { milestoneId: id } })).toBe(2);
    expect(await db.ledgerEntry.count({ where: { milestoneId: id } })).toBe(1);
  });
});
