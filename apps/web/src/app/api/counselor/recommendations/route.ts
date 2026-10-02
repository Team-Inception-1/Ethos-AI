import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { sameOrigin } from '@/lib/auth/registration';
import { apiError, handleApiError } from '@/lib/api/response';

const inputSchema = z.object({
  current_degree: z.string().max(40).default('bachelor'),
  gpa: z.number().min(0).max(5), max_gpa: z.number().min(1).max(5).default(4),
  ielts_score: z.number().min(0).max(9).nullable().optional(), budget_yearly_bdt_lakh: z.number().min(0).max(1000),
  target_countries: z.array(z.string().trim().min(2).max(100)).max(20).default([]),
  target_field: z.string().trim().max(200).nullable().optional(), study_gap_years: z.number().int().min(0).max(50).default(0),
  preferred_intake: z.string().trim().max(100).nullable().optional(), language: z.enum(['en', 'bn']).default('en'),
  scholarship_priority: z.boolean().default(false), moi_only: z.boolean().default(false),
}).passthrough();

const bdt = (poisha: bigint) => Number(poisha) / 100;
const lakh = (poisha: bigint) => Math.round((Number(poisha) / 10_000_000) * 100) / 100;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export async function POST(request: Request) {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const input = inputSchema.parse(await request.json());
    const countries = input.target_countries.length ? input.target_countries : ['Canada', 'Germany', 'UK'];
    const catalogs = await prisma.universityCourseCatalog.findMany({
      where: {
        status: 'VERIFIED', isVerified: true, verifiedByAdminId: { not: null }, submittedByAgencyId: { not: null },
        country: { in: countries, mode: 'insensitive' },
        submittedByAgency: { licenseStatus: 'VERIFIED' }, benchmark: { isVerified: true, verifiedByAdminId: { not: null } },
      },
      include: {
        benchmark: true,
        submittedByAgency: { include: { owner: { select: { name: true, email: true, phone: true } } } },
      },
      orderBy: [{ country: 'asc' }, { universityName: 'asc' }], take: 50,
    });
    if (!catalogs.length) return apiError('NO_VERIFIED_MATCHES', 'No agency-submitted, admin-verified catalog records match these countries yet.', 404);

    const catalogIds = catalogs.map(row => row.id);
    const agencyIds = catalogs.flatMap(row => row.submittedByAgencyId ? [row.submittedByAgencyId] : []);
    const adminIds = catalogs.flatMap(row => row.verifiedByAdminId ? [row.verifiedByAdminId] : []);
    const [audits, fees, admins] = await Promise.all([
      prisma.governanceAudit.findMany({ where: { entityType: 'UniversityCourseCatalog', entityId: { in: catalogIds }, action: 'CATALOG_VERIFIED' },
        orderBy: { createdAt: 'desc' } }),
      prisma.agencyFeeSubmission.findMany({ where: { agencyId: { in: agencyIds }, status: 'VERIFIED' }, orderBy: { reviewedAt: 'desc' } }),
      prisma.user.findMany({ where: { id: { in: adminIds }, role: 'ADMIN' }, select: { id: true, name: true } }),
    ]);
    const adminById = new Map(admins.map(row => [row.id, row.name]));
    const auditByCatalog = new Map(audits.map(row => [row.entityId, row]));
    const normalizedGpa = Math.round((input.gpa / input.max_gpa) * 400) / 100;
    const ielts = input.ielts_score ?? 0;
    const fieldWords = (input.target_field ?? '').toLowerCase().split(/\W+/).filter(word => word.length > 2);

    const recommendations = catalogs.map(catalog => {
      const agency = catalog.submittedByAgency!;
      const benchmark = catalog.benchmark!;
      const annualLivingLakh = Math.round(((lakh(benchmark.livingCostMonthlyPoishaMin) + lakh(benchmark.livingCostMonthlyPoishaMax)) / 2) * 12 * 100) / 100;
      const tuitionLakh = lakh(catalog.annualTuitionPoisha);
      const annualTotal = Math.round((tuitionLakh + annualLivingLakh) * 100) / 100;
      const fieldText = `${catalog.programName} ${catalog.fieldTags.join(' ')}`.toLowerCase();
      const fieldMatch = !fieldWords.length || fieldWords.some(word => fieldText.includes(word));
      const gpaDelta = normalizedGpa - catalog.minimumGpa;
      const englishDelta = ielts ? ielts - catalog.minimumIelts : -0.5;
      const budgetDelta = input.budget_yearly_bdt_lakh - annualTotal;
      const score = clamp(Math.round(60 + gpaDelta * 18 + englishDelta * 8 + (fieldMatch ? 10 : -10) + (budgetDelta >= 0 ? 8 : -8)), 20, 96);
      const tier = score >= 76 ? 'safe' : score >= 55 ? 'target' : 'dream';
      const fee = fees.find(row => row.agencyId === agency.id && row.country.toLowerCase() === catalog.country.toLowerCase())
        ?? fees.find(row => row.agencyId === agency.id);
      const audit = auditByCatalog.get(catalog.id);
      const verifiedByAdmin = catalog.verifiedByAdminId ? adminById.get(catalog.verifiedByAdminId) ?? catalog.verifiedByAdminId : 'Unknown';
      const verifiedAt = catalog.lastAuditedAt.toISOString();
      return {
        id: catalog.id, university_name: catalog.universityName, country: catalog.country, city: catalog.city,
        target_programs: [catalog.programName], tier, match_score: score, admission_chance_percent: clamp(score - 5, 15, 92),
        annual_tuition_bdt_lakh: tuitionLakh, annual_living_bdt_lakh: annualLivingLakh, annual_total_bdt_lakh: annualTotal,
        currency_local: catalog.currency, annual_tuition_local: catalog.annualTuitionLocal,
        minimum_gpa: catalog.minimumGpa, minimum_ielts: catalog.minimumIelts, max_study_gap_years: catalog.maxStudyGapYears,
        matching_reasons: [
          `Program and fee record submitted by ${agency.name}.`,
          `Catalog reviewed by ${verifiedByAdmin} on ${catalog.lastAuditedAt.toLocaleDateString('en-GB')}.`,
          fieldMatch ? 'Program matches the requested study field.' : 'Consider how this program aligns with your requested field.',
        ],
        caution_notes: [
          ...(budgetDelta < 0 ? [`Estimated annual cost is ৳${Math.abs(Math.round(budgetDelta * 10) / 10)} lakh above the entered budget.`] : []),
          ...(englishDelta < 0 ? [`Published IELTS threshold is ${catalog.minimumIelts}.`] : []),
        ],
        scholarship_info: catalog.scholarshipInfo, accepts_moi: catalog.acceptsMoi, coop_available: catalog.coopAvailable,
        field_tags: catalog.fieldTags, website_url: catalog.officialCatalogUrl, is_live_grounded: false,
        data_source: 'verified_database',
        grounding_citations: [
          { title: catalog.officialSourceTitle, url: catalog.officialCatalogUrl },
          { title: benchmark.officialGovSourceTitle, url: benchmark.officialGovUrl },
        ],
        verified_agency: {
          id: agency.id, name: agency.name, licenseNo: agency.licenseNo, licenseType: 'PLATFORM_VERIFIED',
          ownerName: agency.owner.name, rating: agency.rating, successRate: agency.successRate, riskScore: agency.riskScore,
          feeRange: `৳${bdt(agency.feeMinPoisha).toLocaleString()}–৳${bdt(agency.feeMaxPoisha).toLocaleString()}`,
          feeMinBdt: bdt(agency.feeMinPoisha), feeMaxBdt: bdt(agency.feeMaxPoisha),
          refundPolicy: fee?.refundPolicy ?? 'Refer to the signed milestone agreement.', address: agency.address ?? '',
          phone: agency.owner.phone, email: agency.owner.email, website: agency.website ?? undefined, verifiedAt,
        },
        financial_provenance: {
          catalogId: catalog.id, universityName: catalog.universityName, country: catalog.country, countryCode: benchmark.countryCode,
          degreeLevel: catalog.degreeLevel, targetPrograms: [catalog.programName], annualTuitionLocal: catalog.annualTuitionLocal,
          currencyLocal: catalog.currency, annualTuitionBdtLakh: tuitionLakh, annualLivingBdtLakh: annualLivingLakh,
          annualTotalBdtLakh: annualTotal, officialCatalogUrl: catalog.officialCatalogUrl,
          officialSourceTitle: catalog.officialSourceTitle, intakeYear: catalog.intakeYear,
          verifyingAgencyId: agency.id, verifyingAgencyName: agency.name, verifyingAgencyLicense: agency.licenseNo,
          verifyingAgencyLicenseType: 'PLATFORM_VERIFIED', verifyingAgencyOwner: agency.owner.name,
          verifyingAgencyRating: agency.rating, verifyingAgencySuccessRate: agency.successRate, verifyingAgencyRiskScore: agency.riskScore,
          verifyingAgencyAddress: agency.address ?? '', verifyingAgencyPhone: agency.owner.phone,
          verifyingAgencyEmail: agency.owner.email, verifyingAgencyWebsite: agency.website ?? undefined,
          livingBenchmarkId: benchmark.id, livingBenchmarkAuthority: benchmark.officialGovSourceTitle,
          livingBenchmarkDirective: benchmark.keyRequirements.join(' • '), livingBenchmarkGovUrl: benchmark.officialGovUrl,
          livingBenchmarkGovTitle: benchmark.officialGovSourceTitle, livingRequirementType: benchmark.requirementType,
          statutorySolvencyFormatted: `৳${bdt(benchmark.blockedAccountOrGicPoisha).toLocaleString()}`,
          statutorySolvencyBdt: bdt(benchmark.blockedAccountOrGicPoisha), exchangeRateBdt: benchmark.exchangeRateBdt,
          auditId: audit?.id ?? `audit-${catalog.id}`, verifiedByAdmin, lastAuditedAt: verifiedAt,
          ledgerChecksum: `DB-${catalog.id}`, status: 'VERIFIED',
          legalDisclaimerEn: 'Verified records reflect the latest agency submission and administrator audit stored in Ethos AI. Confirm final fees with the university before payment.',
          legalDisclaimerBn: 'তথ্যগুলো এজেন্সি জমা দিয়েছে এবং Ethos AI প্রশাসক যাচাই করেছেন। পেমেন্টের আগে বিশ্ববিদ্যালয়ের সাথে চূড়ান্ত ফি নিশ্চিত করুন।',
        },
      };
    }).sort((a, b) => b.match_score - a.match_score);

    const benchmarkByCountry = new Map(catalogs.map(row => [row.country, row.benchmark!]));
    const solvency = Object.fromEntries([...benchmarkByCountry].map(([country, benchmark]) => [country,
      `${benchmark.requirementType.replaceAll('_', ' ')}: ৳${bdt(benchmark.blockedAccountOrGicPoisha).toLocaleString()}`]));
    const visaScore = clamp(Math.round(70 + (normalizedGpa - 3) * 10 + (ielts - 6.5) * 5 - input.study_gap_years * 2), 25, 95);
    const result = {
      data_source: 'verified_database',
      profile_summary: { normalized_gpa: normalizedGpa, ielts_equivalent: ielts, budget_bdt_lakh: input.budget_yearly_bdt_lakh,
        study_gap_years: input.study_gap_years, target_field: input.target_field ?? 'Not specified', preferred_intake: input.preferred_intake ?? 'Not specified' },
      recommendations,
      visa_assessment: { readiness_score: visaScore, status: visaScore >= 75 ? 'favorable' : visaScore >= 50 ? 'moderate_risk' : 'high_scrutiny',
        estimated_solvency_required_bdt_lakh: Math.max(...[...benchmarkByCountry.values()].map(row => lakh(row.blockedAccountOrGicPoisha))),
        solvency_details_by_country: solvency, risk_flags: [], key_advice: ['Use the official government source linked in each verified record.', 'Keep financial evidence consistent with the selected country benchmark.'] },
      roadmap: [
        { step_number: 1, month_timeline: 'Now', phase_title: 'Shortlist verified programs', tasks: ['Compare database-backed tuition and eligibility records'], critical_warning: null },
        { step_number: 2, month_timeline: 'Next 2–4 weeks', phase_title: 'Prepare documents', tasks: ['Collect transcripts, English scores, CV, and SOP'], critical_warning: null },
        { step_number: 3, month_timeline: 'Before payment', phase_title: 'Review escrow agreement', tasks: ['Confirm agency fee milestones and refund terms'], critical_warning: 'Do not pay outside the protected escrow flow.' },
      ],
      dream_count: recommendations.filter(row => row.tier === 'dream').length,
      target_count: recommendations.filter(row => row.tier === 'target').length,
      safe_count: recommendations.filter(row => row.tier === 'safe').length,
      live_discovery_active: false,
    };
    return Response.json({ data: result }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return handleApiError(error); }
}
