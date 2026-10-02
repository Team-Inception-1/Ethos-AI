import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(), getAuthenticatedUser: vi.fn(),
  user: { findMany: vi.fn(), update: vi.fn() },
  agency: { findUnique: vi.fn(), update: vi.fn() },
  agencyFeeSubmission: { findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn() },
  agencyPricing: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  governanceAudit: { create: vi.fn() },
  countryCostBenchmark: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), upsert: vi.fn() },
  countryBenchmarkSubmission: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  universityCourseCatalog: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
}));
vi.mock('@/lib/auth/authorization', () => ({ requireRole: mocks.requireRole, getAuthenticatedUser: mocks.getAuthenticatedUser }));
vi.mock('@/lib/prisma', () => ({ prisma: { ...mocks, $transaction: (fn: (tx: typeof mocks) => unknown) => fn(mocks) } }));

import { POST as createFee } from '@/app/api/agency/fee-submissions/route';
import { POST as reviewFee } from '@/app/api/admin/fee-submissions/route';
import { POST as updateUser } from '@/app/api/admin/users/route';
import { POST as benchmarkPost, GET as benchmarksGet, PATCH as benchmarkPatch } from '@/app/api/provenance/benchmarks/route';
import { POST as catalogPost, GET as catalogsGet } from '@/app/api/provenance/catalogs/route';
import { GET as validateGet } from '@/app/api/provenance/validate/route';

const request = (path: string, body: unknown) => new Request(`http://localhost/api/${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'http://localhost' }, body: JSON.stringify(body),
});
const fee = { serviceName: 'Admission', country: 'Canada', amountBdt: 123.45, whenCharged: 'On offer',
  refundable: true, refundPolicy: 'Refund if no offer', proofDocumentUrls: ['https://agency.example/license.pdf'] };
const row = { id: 'fee-1', ...fee, amountPoisha: BigInt(12345), agencyId: 'owned-agency',
  agency: { name: 'Agency' }, status: 'PENDING', createdAt: new Date('2026-01-01') };
const benchmark = { country: 'Canada', countryCode: 'CA', flagEmoji: 'CA', currency: 'CAD', exchangeRateBdt: 90,
  livingCostMonthlyBdtMin: 100000, livingCostMonthlyBdtMax: 200000, blockedAccountOrGicBdt: 2000000,
  visaFeeBdt: 15000, healthInsuranceYearlyBdt: 10000, requirementType: 'GIC',
  officialGovUrl: 'https://canada.ca/study', officialGovSourceTitle: 'Government requirements', keyRequirements: ['Study permit'],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireRole.mockResolvedValue({ user: { id: 'actor', role: 'AGENCY' }, response: null });
  mocks.getAuthenticatedUser.mockResolvedValue(null);
});

describe('durable platform routes', () => {
  it('binds fee creation to the authenticated agency, strips forged approval, and converts exact poisha', async () => {
    mocks.agency.findUnique.mockResolvedValue({ id: 'owned-agency' });
    mocks.agencyFeeSubmission.create.mockResolvedValue(row);
    const response = await createFee(request('agency/fee-submissions', { ...fee, agencyId: 'victim', status: 'VERIFIED' }));
    expect(response.status).toBe(201);
    expect(mocks.agency.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerUserId: 'actor' } }));
    expect(mocks.agencyFeeSubmission.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      agencyId: 'owned-agency', amountPoisha: BigInt(12345), status: 'PENDING',
    }) }));
    expect(await response.json()).toMatchObject({ data: { submission: { amountBdt: 123.45 } } });
  });
  it.each([-1, 1.001, '100', null])('rejects invalid money %s before writes', async amountBdt => {
    const response = await createFee(request('agency/fee-submissions', { ...fee, amountBdt }));
    expect(response.status).toBe(400);
    expect(mocks.agencyFeeSubmission.create).not.toHaveBeenCalled();
  });
  it('does not invent documentary evidence', async () => {
    const response = await createFee(request('agency/fee-submissions', { ...fee, proofDocumentUrls: [] }));
    expect(response.status).toBe(400);
    expect(mocks.agencyFeeSubmission.create).not.toHaveBeenCalled();
  });
  it('approves persisted pricing and records the actual administrator in the transaction', async () => {
    mocks.requireRole.mockResolvedValue({ user: { id: 'admin', role: 'ADMIN' }, response: null });
    mocks.agencyFeeSubmission.updateMany.mockResolvedValue({ count: 1 });
    mocks.agencyFeeSubmission.findUniqueOrThrow.mockResolvedValue({ ...row, status: 'VERIFIED' });
    mocks.agencyPricing.findFirst.mockResolvedValue({ id: 'pricing-1' });
    const response = await reviewFee(request('admin/fee-submissions', { submissionId: 'fee-1', action: 'APPROVED',
      adminFeedback: 'Evidence reviewed', reviewedByAdminId: 'forged' }));
    expect(response.status).toBe(200);
    expect(mocks.agencyPricing.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'pricing-1' },
      data: expect.objectContaining({ amountPoisha: BigInt(12345) }) }));
    expect(mocks.governanceAudit.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actorId: 'admin' }) }));
    expect(await response.json()).toMatchObject({ submission: { status: 'APPROVED' } });
  });
  it('does not re-review an approved fee or alter its published pricing', async () => {
    mocks.agencyFeeSubmission.updateMany.mockResolvedValue({ count: 0 });
    const response = await reviewFee(request('admin/fee-submissions', { submissionId: 'fee-1', action: 'REJECTED', adminFeedback: 'Changed my mind' }));
    expect(response.status).toBe(409);
    expect(mocks.agencyPricing.update).not.toHaveBeenCalled();
    expect(mocks.governanceAudit.create).not.toHaveBeenCalled();
  });
  it('rejects string booleans and unknown roles without user changes', async () => {
    expect((await updateUser(request('admin/users', { userId: 'target', isVerified: 'false' }))).status).toBe(400);
    expect((await updateUser(request('admin/users', { userId: 'target', role: 'SUPERADMIN' }))).status).toBe(400);
    expect(mocks.user.update).not.toHaveBeenCalled();
  });
  it('does not expose database failure details or pretend a failed write succeeded', async () => {
    mocks.agency.findUnique.mockRejectedValueOnce(new Error('postgres://secret-password'));
    const response = await createFee(request('agency/fee-submissions', fee));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('secret-password');
  });
  it('filters public catalog and benchmark reads in the database', async () => {
    mocks.countryCostBenchmark.findMany.mockResolvedValue([]);
    mocks.universityCourseCatalog.findMany.mockResolvedValue([]);
    await benchmarksGet(new Request('http://localhost/api/provenance/benchmarks'));
    await catalogsGet(new Request('http://localhost/api/provenance/catalogs'));
    expect(mocks.countryCostBenchmark.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isVerified: true } }));
    expect(mocks.universityCourseCatalog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ isVerified: true, status: 'VERIFIED' }),
    }));
  });
  it('requires a real verified exchange benchmark instead of fabricating currency conversion', async () => {
    mocks.countryCostBenchmark.findFirst.mockResolvedValue(null);
    const response = await catalogPost(request('provenance/catalogs', { universityName: 'University', country: 'Canada',
      degreeLevel: 'Master', programName: 'Computer Science', annualTuitionLocal: 100, currency: 'CAD',
      officialCatalogUrl: 'https://university.example/fees', officialSourceTitle: 'Fees' }));
    expect(response.status).toBe(409);
    expect(mocks.universityCourseCatalog.create).not.toHaveBeenCalled();
  });
  it('requires a typed boolean on benchmark input and never spreads forged verification', async () => {
    const response = await benchmarkPost(request('provenance/benchmarks', { country: 'Canada', isVerified: true }));
    expect(response.status).toBe(400);
    expect(mocks.countryCostBenchmark.create).not.toHaveBeenCalled();
  });
  it('persists an agency proposal without replacing the published benchmark or trusting forged verification', async () => {
    mocks.countryBenchmarkSubmission.create.mockResolvedValue({ id: 'proposal', createdAt: new Date() });
    const response = await benchmarkPost(request('provenance/benchmarks', { ...benchmark, isVerified: true, submittedById: 'forged' }));
    expect(response.status).toBe(201);
    expect(mocks.countryBenchmarkSubmission.create).toHaveBeenCalledWith({ data: {
      country: 'Canada', payload: benchmark, status: 'PENDING', submittedById: 'actor',
    } });
    expect(mocks.countryCostBenchmark.update).not.toHaveBeenCalled();
    expect(mocks.countryCostBenchmark.upsert).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ benchmark: { isVerified: false, isProposal: true } });
  });
  it('rejects a pending benchmark proposal without changing the published source', async () => {
    mocks.countryBenchmarkSubmission.findUnique.mockResolvedValue({ id: 'proposal', payload: benchmark });
    mocks.countryBenchmarkSubmission.updateMany.mockResolvedValue({ count: 1 });
    const response = await benchmarkPatch(request('provenance/benchmarks', { id: 'proposal', isVerified: false }));
    expect(response.status).toBe(200);
    expect(mocks.countryCostBenchmark.update).not.toHaveBeenCalled();
    expect(mocks.countryBenchmarkSubmission.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'proposal', status: 'PENDING' }, data: expect.objectContaining({ status: 'REJECTED' }),
    }));
  });
  it('publishes a proposal only after acquiring its pending review claim', async () => {
    mocks.countryBenchmarkSubmission.findUnique.mockResolvedValue({ id: 'proposal', payload: benchmark });
    mocks.countryBenchmarkSubmission.updateMany.mockResolvedValue({ count: 1 });
    mocks.countryCostBenchmark.findFirst.mockResolvedValue({ id: 'published' });
    mocks.countryCostBenchmark.update.mockResolvedValue({ ...benchmark, id: 'published', isVerified: true,
      livingCostMonthlyPoishaMin: BigInt(10000000), livingCostMonthlyPoishaMax: BigInt(20000000),
      blockedAccountOrGicPoisha: BigInt(200000000), visaFeePoisha: BigInt(1500000), healthInsuranceYearlyPoisha: BigInt(1000000),
    });
    const response = await benchmarkPatch(request('provenance/benchmarks', { id: 'proposal', isVerified: true }));
    expect(response.status).toBe(200);
    expect(mocks.countryCostBenchmark.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'published' },
      data: expect.objectContaining({ isVerified: true, blockedAccountOrGicPoisha: BigInt(200000000), verifiedByAdminId: 'actor' }),
    }));
    expect(await response.json()).toMatchObject({ benchmark: { id: 'published', blockedAccountOrGicBdt: 2000000 } });
  });
  it('rejects a concurrent or repeated proposal review', async () => {
    mocks.countryBenchmarkSubmission.findUnique.mockResolvedValue({ id: 'proposal', payload: benchmark });
    mocks.countryBenchmarkSubmission.updateMany.mockResolvedValue({ count: 0 });
    const response = await benchmarkPatch(request('provenance/benchmarks', { id: 'proposal', isVerified: true }));
    expect(response.status).toBe(409);
    expect(mocks.countryCostBenchmark.update).not.toHaveBeenCalled();
  });
  it('source validation does not fetch arbitrary stored URLs or assert numeric equivalence', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    mocks.countryCostBenchmark.findUnique.mockResolvedValue({ officialGovUrl: 'http://169.254.169.254/',
      blockedAccountOrGicPoisha: BigInt(10000), lastAuditedAt: new Date() });
    const response = await validateGet(new Request('http://localhost/api/provenance/validate?type=benchmark&id=source'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ match: null, external: null, needsReview: true });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
