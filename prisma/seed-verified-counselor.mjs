import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';

const ADMIN_ID = 'usr-admin-01';
const auditedAt = new Date('2026-09-29T12:00:00Z');

const benchmarks = [
  { id: 'counselor-benchmark-canada', agencyId: 'agt-001', country: 'Canada', countryCode: 'CA', flagEmoji: '🇨🇦', currency: 'CAD', exchangeRateBdt: 87,
    livingCostMonthlyPoishaMin: 11000000n, livingCostMonthlyPoishaMax: 18000000n, blockedAccountOrGicPoisha: 180000000n,
    requirementType: 'GIC', visaFeePoisha: 1300000n, healthInsuranceYearlyPoisha: 8000000n,
    officialGovUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html', officialGovSourceTitle: 'Government of Canada — Study permits',
    keyRequirements: ['Letter of acceptance', 'Proof of funds', 'Study permit'] },
  { id: 'counselor-benchmark-germany', agencyId: 'agt-002', country: 'Germany', countryCode: 'DE', flagEmoji: '🇩🇪', currency: 'EUR', exchangeRateBdt: 135,
    livingCostMonthlyPoishaMin: 10500000n, livingCostMonthlyPoishaMax: 15000000n, blockedAccountOrGicPoisha: 160000000n,
    requirementType: 'BLOCKED_ACCOUNT', visaFeePoisha: 1100000n, healthInsuranceYearlyPoisha: 16000000n,
    officialGovUrl: 'https://www.auswaertiges-amt.de/en/visa-service', officialGovSourceTitle: 'German Federal Foreign Office — Visa information',
    keyRequirements: ['University admission', 'Blocked-account evidence', 'Health insurance'] },
  { id: 'counselor-benchmark-uk', agencyId: 'agt-001', country: 'UK', countryCode: 'GB', flagEmoji: '🇬🇧', currency: 'GBP', exchangeRateBdt: 155,
    livingCostMonthlyPoishaMin: 15000000n, livingCostMonthlyPoishaMax: 23000000n, blockedAccountOrGicPoisha: 200000000n,
    requirementType: 'MAINTENANCE_FUNDS', visaFeePoisha: 8000000n, healthInsuranceYearlyPoisha: 12000000n,
    officialGovUrl: 'https://www.gov.uk/student-visa', officialGovSourceTitle: 'UK Government — Student visa',
    keyRequirements: ['CAS from a licensed sponsor', 'Maintenance funds', 'English proficiency'] },
];

const catalogs = [
  ['ubc-cs', 'counselor-benchmark-canada', 'agt-001', 'University of British Columbia', 'Canada', 'Vancouver', 'M.Sc. in Computer Science', 10500, 'CAD', 91350000n, 3.3, 7.0, 5, 'Graduate research funding and teaching assistantships may be available.', false, true, ['Computer Science', 'AI'], 'https://www.grad.ubc.ca/prospective-students/graduate-degree-programs/master-of-science-computer-science', 'UBC Graduate Studies — Computer Science'],
  ['toronto-miac', 'counselor-benchmark-canada', 'agt-003', 'University of Toronto', 'Canada', 'Toronto', 'M.Sc. in Applied Computing', 36000, 'CAD', 313200000n, 3.3, 7.0, 4, 'Competitive program awards and paid internship opportunities.', false, true, ['Computer Science', 'Applied Computing'], 'https://mscac.utoronto.ca/', 'University of Toronto — MScAC'],
  ['waterloo-dsai', 'counselor-benchmark-canada', 'agt-005', 'University of Waterloo', 'Canada', 'Waterloo', 'Master of Data Science and Artificial Intelligence', 28000, 'CAD', 243600000n, 3.2, 7.0, 5, 'Merit funding varies by faculty and research group.', false, true, ['AI', 'Data Science'], 'https://uwaterloo.ca/graduate-studies-postdoctoral-affairs/future-students/programs', 'University of Waterloo — Graduate programs'],
  ['tum-informatics', 'counselor-benchmark-germany', 'agt-002', 'Technical University of Munich', 'Germany', 'Munich', 'M.Sc. in Informatics', 6000, 'EUR', 81000000n, 3.0, 6.5, 6, 'Deutschlandstipendium and competitive university grants.', true, false, ['Computer Science', 'Informatics'], 'https://www.tum.de/en/studies/degree-programs/detail/informatics-master-of-science-msc', 'TUM — Informatics MSc'],
  ['rwth-sse', 'counselor-benchmark-germany', 'agt-006', 'RWTH Aachen University', 'Germany', 'Aachen', 'M.Sc. in Software Systems Engineering', 0, 'EUR', 0n, 3.0, 6.5, 6, 'Public-university tuition structure; semester contributions still apply.', true, false, ['Software Engineering', 'Computer Science'], 'https://www.rwth-aachen.de/go/id/bass/lidx/1', 'RWTH Aachen — Degree programs'],
  ['manchester-acs', 'counselor-benchmark-uk', 'agt-001', 'University of Manchester', 'UK', 'Manchester', 'M.Sc. Advanced Computer Science', 33500, 'GBP', 519250000n, 3.2, 7.0, 5, 'Global Futures and school-level merit awards may be available.', false, false, ['Computer Science', 'Advanced Computing'], 'https://www.manchester.ac.uk/study/masters/courses/list/', 'University of Manchester — Masters courses'],
].map(([slug, benchmarkId, agencyId, universityName, country, city, programName, annualTuitionLocal, currency, annualTuitionPoisha,
  minimumGpa, minimumIelts, maxStudyGapYears, scholarshipInfo, acceptsMoi, coopAvailable, fieldTags, officialCatalogUrl, officialSourceTitle]) => ({
  id: `counselor-catalog-${slug}`, benchmarkId, submittedByAgencyId: agencyId, universityName, country, city,
  degreeLevel: 'Master', programName, annualTuitionLocal, currency, annualTuitionPoisha, minimumGpa, minimumIelts,
  maxStudyGapYears, scholarshipInfo, acceptsMoi, coopAvailable, fieldTags, officialCatalogUrl, officialSourceTitle, intakeYear: '2026/2027',
}));

export async function seedVerifiedCounselor(prisma) {
  const admin = await prisma.user.findUnique({ where: { id: ADMIN_ID }, select: { id: true } });
  if (!admin) throw new Error('Seed requires usr-admin-01.');
  const agencyIds = [...new Set([...benchmarks.map(row => row.agencyId), ...catalogs.map(row => row.submittedByAgencyId)])];
  const agencies = await prisma.agency.findMany({ where: { id: { in: agencyIds }, licenseStatus: 'VERIFIED' }, select: { id: true, ownerUserId: true } });
  if (agencies.length !== agencyIds.length) throw new Error('Every catalog submitter must be a verified agency.');
  const agencyById = new Map(agencies.map(row => [row.id, row]));

  for (const { agencyId, ...row } of benchmarks) {
    const payload = { country: row.country, countryCode: row.countryCode, flagEmoji: row.flagEmoji, currency: row.currency,
      exchangeRateBdt: row.exchangeRateBdt, livingCostMonthlyBdtMin: Number(row.livingCostMonthlyPoishaMin / 100n),
      livingCostMonthlyBdtMax: Number(row.livingCostMonthlyPoishaMax / 100n), blockedAccountOrGicBdt: Number(row.blockedAccountOrGicPoisha / 100n),
      visaFeeBdt: Number(row.visaFeePoisha / 100n), healthInsuranceYearlyBdt: Number(row.healthInsuranceYearlyPoisha / 100n),
      requirementType: row.requirementType, officialGovUrl: row.officialGovUrl, officialGovSourceTitle: row.officialGovSourceTitle, keyRequirements: row.keyRequirements };
    await prisma.countryBenchmarkSubmission.upsert({ where: { id: `counselor-proposal-${row.countryCode.toLowerCase()}` }, update: {}, create: {
      id: `counselor-proposal-${row.countryCode.toLowerCase()}`, country: row.country, payload, status: 'VERIFIED',
      submittedById: agencyById.get(agencyId).ownerUserId, reviewedByAdminId: ADMIN_ID, reviewedAt: auditedAt } });
    await prisma.countryCostBenchmark.upsert({ where: { id: row.id }, update: {}, create: { ...row, isVerified: true, verifiedByAdminId: ADMIN_ID, lastAuditedAt: auditedAt } });
  }

  for (const row of catalogs) {
    await prisma.universityCourseCatalog.upsert({ where: { id: row.id }, update: {}, create: { ...row, status: 'VERIFIED', isVerified: true, verifiedByAdminId: ADMIN_ID, lastAuditedAt: auditedAt } });
    await prisma.governanceAudit.upsert({ where: { id: `audit-submit-${row.id}` }, update: {}, create: { id: `audit-submit-${row.id}`,
      actorId: agencyById.get(row.submittedByAgencyId).ownerUserId, action: 'CATALOG_SUBMITTED', entityType: 'UniversityCourseCatalog', entityId: row.id,
      details: { agencyId: row.submittedByAgencyId, source: row.officialCatalogUrl }, createdAt: new Date('2026-09-28T12:00:00Z') } });
    await prisma.governanceAudit.upsert({ where: { id: `audit-verify-${row.id}` }, update: {}, create: { id: `audit-verify-${row.id}`,
      actorId: ADMIN_ID, action: 'CATALOG_VERIFIED', entityType: 'UniversityCourseCatalog', entityId: row.id,
      details: { agencyId: row.submittedByAgencyId, benchmarkId: row.benchmarkId }, createdAt: auditedAt } });
  }

  for (const agencyId of agencyIds) {
    const catalog = catalogs.find(row => row.submittedByAgencyId === agencyId);
    await prisma.agencyFeeSubmission.upsert({ where: { id: `counselor-fee-${agencyId}` }, update: {}, create: {
      id: `counselor-fee-${agencyId}`, agencyId, country: catalog?.country ?? 'Canada', serviceName: 'Verified admission and visa support package',
      amountPoisha: 4500000n, whenCharged: 'Released through application milestones', refundable: true,
      refundPolicy: 'Unreleased escrow milestones are refundable when contracted deliverables are not completed.',
      proofDocumentUrls: ['https://example.com/demo-agency-evidence'], status: 'VERIFIED',
      adminFeedback: 'Evidence reviewed for the project verification workflow.', reviewedByAdminId: ADMIN_ID, reviewedAt: auditedAt } });
  }
  return { benchmarks: benchmarks.length, catalogs: catalogs.length, agencies: agencyIds.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv.includes('--apply')) throw new Error('Refusing to change data without --apply.');
  const prisma = new PrismaClient();
  try { console.log(JSON.stringify(await seedVerifiedCounselor(prisma))); }
  finally { await prisma.$disconnect(); }
}
