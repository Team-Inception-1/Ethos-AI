import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';

export async function GET(request: Request) {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;

  const url = new URL(request.url);
  const query = (url.searchParams.get('query') ?? '').trim();
  const country = (url.searchParams.get('country') ?? '').trim();
  const requestedLimit = Number(url.searchParams.get('limit') ?? 12);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(30, requestedLimit)) : 12;

  const catalogs = await prisma.universityCourseCatalog.findMany({
    where: {
      status: 'VERIFIED',
      isVerified: true,
      verifiedByAdminId: { not: null },
      submittedByAgencyId: { not: null },
      submittedByAgency: { licenseStatus: 'VERIFIED' },
      benchmark: { isVerified: true, verifiedByAdminId: { not: null } },
      ...(country ? { country: { equals: country, mode: 'insensitive' as const } } : {}),
    },
    include: { submittedByAgency: true },
    orderBy: [{ country: 'asc' }, { universityName: 'asc' }],
    take: 100,
  });

  const queryWords = query.toLowerCase().split(/\W+/).filter((word) => word.length > 1);
  const matchingCatalogs = queryWords.length
    ? catalogs.filter((catalog) => {
        const searchable = `${catalog.universityName} ${catalog.programName} ${catalog.country} ${catalog.city} ${catalog.fieldTags.join(' ')}`.toLowerCase();
        return queryWords.some((word) => searchable.includes(word));
      })
    : catalogs;
  const selectedCatalogs = (matchingCatalogs.length ? matchingCatalogs : catalogs).slice(0, limit);

  const results = selectedCatalogs.map((catalog) => ({
    id: catalog.id,
    name: catalog.programName,
    title: `${catalog.degreeLevel} program · Admin verified`,
    university: catalog.universityName,
    department: catalog.programName,
    country: catalog.country,
    tier: 'Agency submitted / Admin verified',
    lab_name: `${catalog.universityName} verified catalog`,
    lab_url: catalog.officialCatalogUrl,
    email: '',
    google_scholar_url: catalog.officialCatalogUrl,
    primary_domain: catalog.fieldTags[0] ?? catalog.programName,
    research_interests: catalog.fieldTags.length ? catalog.fieldTags : [catalog.programName],
    active_funding_indicator: Boolean(catalog.scholarshipInfo),
    funding_sources: catalog.scholarshipInfo ? [catalog.scholarshipInfo] : [],
    accepting_students: true,
    recent_publications: [{
      title: `${catalog.officialSourceTitle} · Submitted by ${catalog.submittedByAgency?.name ?? 'verified agency'}`,
      year: catalog.lastAuditedAt.getUTCFullYear(),
      venue: 'Ethos verified catalog',
      link: catalog.officialCatalogUrl,
      summary: `Agency-submitted and administrator-verified on ${catalog.lastAuditedAt.toISOString().slice(0, 10)}.`,
    }],
    lab_location: catalog.city,
  }));

  return Response.json({
    data: {
      total: results.length,
      query,
      results,
      source: 'verified_neon_catalog',
      verification: 'Agency submitted and administrator verified',
    },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
