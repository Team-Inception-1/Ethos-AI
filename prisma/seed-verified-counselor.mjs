import { PrismaClient } from '@prisma/client';

const ADMIN_ID = 'usr-admin-01';

const benchmarks = [
  { id: 'counselor-benchmark-canada', country: 'Canada', countryCode: 'CA', flagEmoji: '🇨🇦', currency: 'CAD', exchangeRateBdt: 87,
    livingCostMonthlyPoishaMin: 11000000n, livingCostMonthlyPoishaMax: 18000000n, blockedAccountOrGicPoisha: 180000000n,
    requirementType: 'GIC', visaFeePoisha: 1300000n, healthInsuranceYearlyPoisha: 8000000n,
    officialGovUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html', officialGovSourceTitle: 'Government of Canada — Study permits',
    keyRequirements: ['Letter of acceptance', 'Proof of funds', 'Study permit'] },
  { id: 'counselor-benchmark-germany', country: 'Germany', countryCode: 'DE', flagEmoji: '🇩🇪', currency: 'EUR', exchangeRateBdt: 135,
    livingCostMonthlyPoishaMin: 10500000n, livingCostMonthlyPoishaMax: 15000000n, blockedAccountOrGicPoisha: 160000000n,
    requirementType: 'BLOCKED_ACCOUNT', visaFeePoisha: 1100000n, healthInsuranceYearlyPoisha: 16000000n,
    officialGovUrl: 'https://www.auswaertiges-amt.de/en/visa-service', officialGovSourceTitle: 'German Federal Foreign Office — Visa information',
    keyRequirements: ['University admission', 'Blocked-account evidence', 'Health insurance'] },
  { id: 'counselor-benchmark-uk', country: 'UK', countryCode: 'GB', flagEmoji: '🇬🇧', currency: 'GBP', exchangeRateBdt: 155,
    livingCostMonthlyPoishaMin: 15000000n, livingCostMonthlyPoishaMax: 23000000n, blockedAccountOrGicPoisha: 200000000n,
    requirementType: 'MAINTENANCE_FUNDS', visaFeePoisha: 8000000n, healthInsuranceYearlyPoisha: 12000000n,
    officialGovUrl: 'https://www.gov.uk/student-visa', officialGovSourceTitle: 'UK Government — Student visa',
    keyRequirements: ['CAS from a licensed sponsor', 'Maintenance funds', 'English proficiency'] },
  { id: 'counselor-benchmark-usa', country: 'USA', countryCode: 'US', flagEmoji: '🇺🇸', currency: 'USD', exchangeRateBdt: 122,
    livingCostMonthlyPoishaMin: 14000000n, livingCostMonthlyPoishaMax: 24000000n, blockedAccountOrGicPoisha: 220000000n,
    requirementType: 'BANK_SOLVENCY', visaFeePoisha: 6500000n, healthInsuranceYearlyPoisha: 18000000n,
    officialGovUrl: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html', officialGovSourceTitle: 'U.S. Department of State — Student visa',
    keyRequirements: ['Form I-20', 'SEVIS payment', 'Financial evidence'] },
  { id: 'counselor-benchmark-australia', country: 'Australia', countryCode: 'AU', flagEmoji: '🇦🇺', currency: 'AUD', exchangeRateBdt: 80,
    livingCostMonthlyPoishaMin: 14000000n, livingCostMonthlyPoishaMax: 22000000n, blockedAccountOrGicPoisha: 210000000n,
    requirementType: 'BANK_SOLVENCY', visaFeePoisha: 13500000n, healthInsuranceYearlyPoisha: 15000000n,
    officialGovUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', officialGovSourceTitle: 'Australian Home Affairs — Student visa',
    keyRequirements: ['Confirmation of enrolment', 'Financial capacity', 'Overseas student health cover'] },
];

const catalogs = [
  { id: 'counselor-catalog-ubc-cs', benchmarkId: 'counselor-benchmark-canada', submittedByAgencyId: 'agt-001', universityName: 'University of British Columbia', country: 'Canada', city: 'Vancouver', degreeLevel: 'Master', programName: 'M.Sc. in Computer Science', annualTuitionLocal: 10500, currency: 'CAD', annualTuitionPoisha: 91350000n, minimumGpa: 3.3, minimumIelts: 7.0, maxStudyGapYears: 5, scholarshipInfo: 'Graduate research funding and teaching assistantships may be available.', acceptsMoi: false, coopAvailable: true, fieldTags: ['Computer Science', 'AI', 'Software Engineering'], officialCatalogUrl: 'https://www.grad.ubc.ca/prospective-students/graduate-degree-programs/master-of-science-computer-science', officialSourceTitle: 'UBC Graduate Studies — Computer Science', intakeYear: '2026/2027' },
  { id: 'counselor-catalog-toronto-miac', benchmarkId: 'counselor-benchmark-canada', submittedByAgencyId: 'agt-003', universityName: 'University of Toronto', country: 'Canada', city: 'Toronto', degreeLevel: 'Master', programName: 'M.Sc. in Applied Computing', annualTuitionLocal: 36000, currency: 'CAD', annualTuitionPoisha: 313200000n, minimumGpa: 3.3, minimumIelts: 7.0, maxStudyGapYears: 4, scholarshipInfo: 'Competitive program awards and paid internship opportunities.', acceptsMoi: false, coopAvailable: true, fieldTags: ['Computer Science', 'Applied Computing', 'Data Science'], officialCatalogUrl: 'https://mscac.utoronto.ca/', officialSourceTitle: 'University of Toronto — MScAC', intakeYear: '2026/2027' },
  { id: 'counselor-catalog-waterloo-mdsai', benchmarkId: 'counselor-benchmark-canada', submittedByAgencyId: 'agt-005', universityName: 'University of Waterloo', country: 'Canada', city: 'Waterloo', degreeLevel: 'Master', programName: 'Master of Data Science and Artificial Intelligence', annualTuitionLocal: 28000, currency: 'CAD', annualTuitionPoisha: 243600000n, minimumGpa: 3.2, minimumIelts: 7.0, maxStudyGapYears: 5, scholarshipInfo: 'Merit funding varies by faculty and research group.', acceptsMoi: false, coopAvailable: true, fieldTags: ['Artificial Intelligence', 'Data Science', 'Computer Science'], officialCatalogUrl: 'https://uwaterloo.ca/graduate-studies-postdoctoral-affairs/future-students/programs', officialSourceTitle: 'University of Waterloo — Graduate programs', intakeYear: '2026/2027' },
  { id: 'counselor-catalog-tum-informatics', benchmarkId: 'counselor-benchmark-germany', submittedByAgencyId: 'agt-002', universityName: 'Technical University of Munich', country: 'Germany', city: 'Munich', degreeLevel: 'Master', programName: 'M.Sc. in Informatics', annualTuitionLocal: 6000, currency: 'EUR', annualTuitionPoisha: 81000000n, minimumGpa: 3.0, minimumIelts: 6.5, maxStudyGapYears: 6, scholarshipInfo: 'Deutschlandstipendium and competitive university grants.', acceptsMoi: true, coopAvailable: false, fieldTags: ['Computer Science', 'Informatics', 'AI'], officialCatalogUrl: 'https://www.tum.de/en/studies/degree-programs/detail/informatics-master-of-science-msc', officialSourceTitle: 'TUM — Informatics MSc', intakeYear: '2026/2027' },
  { id: 'counselor-catalog-rwth-sse', benchmarkId: 'counselor-benchmark-germany', submittedByAgencyId: 'agt-006', universityName: 'RWTH Aachen University', country: 'Germany', city: 'Aachen', degreeLevel: 'Master', programName: 'M.Sc. in Software Systems Engineering', annualTuitionLocal: 0, currency: 'EUR', annualTuitionPoisha: 0n, minimumGpa: 3.0, minimumIelts: 6.5, maxStudyGapYears: 6, scholarshipInfo: 'Public-university tuition structure; semester contributions still apply.', acceptsMoi: true, coopAvailable: false, fieldTags: ['Software Engineering', 'Computer Science', 'Systems'], officialCatalogUrl: 'https://www.rwth-aachen.de/go/id/bass/lidx/1', officialSourceTitle: 'RWTH Aachen — Degree programs', intakeYear: '2026/2027' },
  { id: 'counselor-catalog-manchester-acs', benchmarkId: 'counselor-benchmark-uk', submittedByAgencyId: 'agt-001', universityName: 'University of Manchester', country: 'UK', city: 'Manchester', degreeLevel: 'Master', programName: 'M.Sc. Advanced Computer Science', annualTuitionLocal: 33500, currency: 'GBP', annualTuitionPoisha: 519250000n, minimumGpa: 3.2, minimumIelts: 7.0, maxStudyGapYears: 5, scholarshipInfo: 'Global Futures and school-level merit awards may be available.', acceptsMoi: false, coopAvailable: false, fieldTags: ['Computer Science', 'AI', 'Advanced Computing'], officialCatalogUrl: 'https://www.manchester.ac.uk/study/masters/courses/list/', officialSourceTitle: 'University of Manchester — Masters courses', intakeYear: '2026/2027' },
  { id: 'counselor-catalog-iastate-cs', benchmarkId: 'counselor-benchmark-usa', submittedByAgencyId: 'agt-002', universityName: 'Iowa State University', country: 'USA', city: 'Ames', degreeLevel: 'Master', programName: 'M.S. in Computer Science', annualTuitionLocal: 31000, currency: 'USD', annualTuitionPoisha: 378200000n, minimumGpa: 3.0, minimumIelts: 6.5, maxStudyGapYears: 6, scholarshipInfo: 'Research and teaching assistantships can include stipend and tuition support.', acceptsMoi: false, coopAvailable: false, fieldTags: ['Computer Science', 'Machine Learning', 'Cybersecurity'], officialCatalogUrl: 'https://www.cs.iastate.edu/graduate-program', officialSourceTitle: 'Iowa State — Computer Science graduate program', intakeYear: '2026/2027' },
  { id: 'counselor-catalog-deakin-it', benchmarkId: 'counselor-benchmark-australia', submittedByAgencyId: 'agt-005', universityName: 'Deakin University', country: 'Australia', city: 'Melbourne', degreeLevel: 'Master', programName: 'Master of Information Technology', annualTuitionLocal: 42000, currency: 'AUD', annualTuitionPoisha: 336000000n, minimumGpa: 2.8, minimumIelts: 6.5, maxStudyGapYears: 7, scholarshipInfo: 'International merit scholarships may reduce tuition.', acceptsMoi: true, coopAvailable: true, fieldTags: ['Information Technology', 'Computer Science', 'Cybersecurity'], officialCatalogUrl: 'https://www.deakin.edu.au/course/master-information-technology-international', officialSourceTitle: 'Deakin University — Master of IT', intakeYear: '2026/2027' },
];

export async function seedVerifiedCounselor(prisma) {
  const admin = await prisma.user.findUnique({ where: { id: ADMIN_ID }, select: { id: true } });
  if (!admin) throw new Error('Seed requires usr-admin-01.');
  const agencyIds = [...new Set(catalogs.map(row => row.submittedByAgencyId))];
  const agencies = await prisma.agency.findMany({ where: { id: { in: agencyIds }, licenseStatus: 'VERIFIED' }, select: { id: true, ownerUserId: true } });
  if (agencies.length !== agencyIds.length) throw new Error('Every counselor catalog submitter must be a verified agency.');
  const agencyById = new Map(agencies.map(row => [row.id, row]));

  for (const row of benchmarks) {
    const agencyId = row.country === 'Germany' || row.country === 'USA' ? 'agt-002' : row.country === 'Australia' ? 'agt-005' : 'agt-001';
    const payload = { country: row.country, countryCode: row.countryCode, flagEmoji: row.flagEmoji, currency: row.currency,
      exchangeRateBdt: row.exchangeRateBdt, livingCostMonthlyBdtMin: Number(row.livingCostMonthlyPoishaMin / 100n),
      livingCostMonthlyBdtMax: Number(row.livingCostMonthlyPoishaMax / 100n), blockedAccountOrGicBdt: Number(row.blockedAccountOrGicPoisha / 100n),
      visaFeeBdt: Number(row.visaFeePoisha / 100n), healthInsuranceYearlyBdt: Number(row.healthInsuranceYearlyPoisha / 100n),
      requirementType: row.requirementType, officialGovUrl: row.officialGovUrl, officialGovSourceTitle: row.officialGovSourceTitle,
      keyRequirements: row.keyRequirements };
    await prisma.countryBenchmarkSubmission.upsert({ where: { id: `counselor-proposal-${row.countryCode.toLowerCase()}` }, update: {}, create: {
      id: `counselor-proposal-${row.countryCode.toLowerCase()}`, country: row.country, payload, status: 'VERIFIED',
      submittedById: agencyById.get(agencyId).ownerUserId, reviewedByAdminId: ADMIN_ID, reviewedAt: new Date('2026-09-29T10:00:00Z'),
    } });
    await prisma.countryCostBenchmark.upsert({ where: { id: row.id }, update: {}, create: {
      ...row, isVerified: true, verifiedByAdminId: ADMIN_ID, lastAuditedAt: new Date('2026-09-29T10:00:00Z'),
    } });
  }

  for (const row of catalogs) {
    await prisma.universityCourseCatalog.upsert({ where: { id: row.id }, update: {}, create: {
      ...row, status: 'VERIFIED', isVerified: true, verifiedByAdminId: ADMIN_ID, lastAuditedAt: new Date('2026-09-29T12:00:00Z'),
    } });
    await prisma.governanceAudit.upsert({ where: { id: `audit-submit-${row.id}` }, update: {}, create: {
      id: `audit-submit-${row.id}`, actorId: agencyById.get(row.submittedByAgencyId).ownerUserId,
      action: 'CATALOG_SUBMITTED', entityType: 'UniversityCourseCatalog', entityId: row.id,
      details: { agencyId: row.submittedByAgencyId, source: row.officialCatalogUrl }, createdAt: new Date('2026-09-28T12:00:00Z'),
    } });
    await prisma.governanceAudit.upsert({ where: { id: `audit-verify-${row.id}` }, update: {}, create: {
      id: `audit-verify-${row.id}`, actorId: ADMIN_ID, action: 'CATALOG_VERIFIED', entityType: 'UniversityCourseCatalog', entityId: row.id,
      details: { agencyId: row.submittedByAgencyId, benchmarkId: row.benchmarkId }, createdAt: new Date('2026-09-29T12:00:00Z'),
    } });
  }

  for (const agencyId of agencyIds) {
    const catalog = catalogs.find(row => row.submittedByAgencyId === agencyId);
    await prisma.agencyFeeSubmission.upsert({ where: { id: `counselor-fee-${agencyId}` }, update: {}, create: {
      id: `counselor-fee-${agencyId}`, agencyId, country: catalog.country, serviceName: 'Verified admission and visa support package',
      amountPoisha: 4500000n, whenCharged: 'Released through application milestones', refundable: true,
      refundPolicy: 'Unreleased escrow milestones are refundable when contracted deliverables are not completed.',
      proofDocumentUrls: ['https://example.com/demo-agency-evidence'], status: 'VERIFIED', adminFeedback: 'Demo evidence reviewed for the project verification workflow.',
      reviewedByAdminId: ADMIN_ID, reviewedAt: new Date('2026-09-29T12:00:00Z'),
    } });
  }
  return { benchmarks: benchmarks.length, catalogs: catalogs.length, agencies: agencyIds.length };
}

if (import.meta.url === new URL(`file://${process.argv[1].replaceAll('\\', '/')}`).href) {
  if (!process.argv.includes('--apply')) throw new Error('Refusing to change data without --apply.');
  const prisma = new PrismaClient();
  try { console.log(JSON.stringify(await seedVerifiedCounselor(prisma))); }
  finally { await prisma.$disconnect(); }
}
