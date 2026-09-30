import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  universityCourseCatalog: { findMany: vi.fn() }, governanceAudit: { findMany: vi.fn() },
  agencyFeeSubmission: { findMany: vi.fn() }, user: { findMany: vi.fn() },
}));
vi.mock('@/lib/auth/authorization', () => ({ requireUser: mocks.requireUser }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks }));
import { POST } from '@/app/api/counselor/recommendations/route';

const request = (origin = 'http://localhost') => new Request('http://localhost/api/counselor/recommendations', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({
    gpa: 3.6, max_gpa: 4, ielts_score: 7, budget_yearly_bdt_lakh: 30,
    target_countries: ['Canada'], target_field: 'Computer Science', study_gap_years: 0,
  }),
});
const benchmark = { id: 'bench', countryCode: 'CA', isVerified: true, verifiedByAdminId: 'admin',
  livingCostMonthlyPoishaMin: BigInt(10000000), livingCostMonthlyPoishaMax: BigInt(12000000), blockedAccountOrGicPoisha: BigInt(180000000),
  officialGovSourceTitle: 'Government source', officialGovUrl: 'https://canada.ca/study', keyRequirements: ['Funds'],
  requirementType: 'GIC', exchangeRateBdt: 87 };
const agency = { id: 'agency', name: 'Verified Agency', licenseNo: 'LICENSE-1', licenseStatus: 'VERIFIED', rating: 4.8,
  successRate: 94, riskScore: 10, feeMinPoisha: BigInt(2000000), feeMaxPoisha: BigInt(5000000), address: 'Dhaka', website: 'https://agency.example',
  owner: { name: 'Agency Owner', email: 'owner@agency.example', phone: '+8801000000000' } };
const catalog = { id: 'catalog', universityName: 'University', country: 'Canada', city: 'Toronto', degreeLevel: 'Master',
  programName: 'M.Sc. Computer Science', annualTuitionLocal: 10000, annualTuitionPoisha: BigInt(87000000), currency: 'CAD',
  minimumGpa: 3.2, minimumIelts: 6.5, maxStudyGapYears: 5, scholarshipInfo: 'Merit award', acceptsMoi: false,
  coopAvailable: true, fieldTags: ['Computer Science'], officialCatalogUrl: 'https://university.example/catalog',
  officialSourceTitle: 'Official catalog', intakeYear: '2026/2027', status: 'VERIFIED', isVerified: true,
  submittedByAgencyId: 'agency', verifiedByAdminId: 'admin', lastAuditedAt: new Date('2026-09-29'), benchmark,
  submittedByAgency: agency };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: 'student', role: 'STUDENT' }, response: null });
  mocks.universityCourseCatalog.findMany.mockResolvedValue([catalog]);
  mocks.governanceAudit.findMany.mockResolvedValue([{ id: 'audit', entityId: 'catalog' }]);
  mocks.agencyFeeSubmission.findMany.mockResolvedValue([{ agencyId: 'agency', country: 'Canada', refundPolicy: 'Refund policy' }]);
  mocks.user.findMany.mockResolvedValue([{ id: 'admin', name: 'Platform Administrator' }]);
});

describe('database-backed counselor', () => {
  it('returns only verified records with agency and admin provenance', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.universityCourseCatalog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      status: 'VERIFIED', isVerified: true, verifiedByAdminId: { not: null }, submittedByAgencyId: { not: null },
    }) }));
    const body = await response.json();
    expect(body).toMatchObject({ data: { data_source: 'verified_database', recommendations: [{
      id: 'catalog', verified_agency: { id: 'agency', licenseNo: 'LICENSE-1' },
      financial_provenance: { auditId: 'audit', verifiedByAdmin: 'Platform Administrator' },
    }] } });
  });

  it('rejects cross-origin requests before database reads', async () => {
    const response = await POST(request('https://attacker.example'));
    expect(response.status).toBe(403);
    expect(mocks.universityCourseCatalog.findMany).not.toHaveBeenCalled();
  });

  it('returns an explicit empty-state error instead of fabricated recommendations', async () => {
    mocks.universityCourseCatalog.findMany.mockResolvedValue([]);
    const response = await POST(request());
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'NO_VERIFIED_MATCHES' } });
  });
});
