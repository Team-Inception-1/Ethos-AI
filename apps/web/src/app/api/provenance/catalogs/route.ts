import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { catalogDto } from '@/lib/platform/provenance';
import { identifier, moneyBdt, platformError, publicUrl, shortText, success, toPoisha } from '@/lib/platform/http';
import { sameOrigin } from '@/lib/auth/registration';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const query = z.object({ id: identifier.optional(), country: shortText.optional(), university: shortText.optional() })
      .parse(Object.fromEntries(new URL(request.url).searchParams));
    const visibility = user?.role === 'ADMIN' ? {} : { isVerified: true, status: 'VERIFIED' as const };
    const rows = await prisma.universityCourseCatalog.findMany({ where: { ...visibility,
      id: query.id, country: query.country ? { equals: query.country, mode: 'insensitive' } : undefined,
      universityName: query.university ? { contains: query.university, mode: 'insensitive' } : undefined,
    }, include: { benchmark: { select: { countryCode: true } } }, orderBy: { universityName: 'asc' }, take: 500 });
    if (query.id) {
      if (!rows[0]) return apiError('NOT_FOUND', 'Published catalog not found.', 404);
      return success({ catalog: catalogDto(rows[0]) });
    }
    const catalogs = rows.map(catalogDto);
    return success({ catalogs, count: catalogs.length });
  } catch (error) { return platformError(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const { id, ...input } = z.object({ id: identifier.optional(), universityName: shortText, country: shortText,
      degreeLevel: z.enum(['Bachelor', 'Master', 'PhD']), programName: shortText, annualTuitionLocal: moneyBdt,
      currency: z.string().regex(/^[A-Z]{3}$/), officialCatalogUrl: publicUrl, officialSourceTitle: shortText,
      intakeYear: z.string().trim().min(4).max(20).optional(),
    }).parse(await request.json());
    const benchmark = await prisma.countryCostBenchmark.findFirst({ where: {
      country: { equals: input.country, mode: 'insensitive' }, currency: input.currency, isVerified: true,
    } });
    if (!benchmark) return apiError('BENCHMARK_REQUIRED', 'A verified benchmark with matching currency is required.', 409);
    const tuitionBdt = input.annualTuitionLocal * benchmark.exchangeRateBdt;
    if (!Number.isFinite(tuitionBdt) || tuitionBdt > 1_000_000_000) {
      return apiError('INVALID_AMOUNT', 'Converted tuition exceeds the supported amount.', 400);
    }
    const data = { ...input, benchmarkId: benchmark.id, annualTuitionPoisha: toPoisha(tuitionBdt),
      isVerified: true, status: 'VERIFIED' as const, verifiedByAdminId: auth.user.id, lastAuditedAt: new Date() };
    const row = await prisma.$transaction(async tx => {
      const saved = id ? await tx.universityCourseCatalog.update({ where: { id }, data,
        include: { benchmark: { select: { countryCode: true } } } })
        : await tx.universityCourseCatalog.create({ data, include: { benchmark: { select: { countryCode: true } } } });
      await tx.governanceAudit.create({ data: { actorId: auth.user.id, action: 'CATALOG_VERIFIED',
        entityType: 'UniversityCourseCatalog', entityId: saved.id } });
      return saved;
    });
    return success({ catalog: catalogDto(row), message: 'Course catalog saved.' }, id ? 200 : 201);
  } catch (error) { return platformError(error); }
}
export async function DELETE(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const id = identifier.parse(new URL(request.url).searchParams.get('id'));
    await prisma.$transaction(async tx => {
      await tx.universityCourseCatalog.delete({ where: { id } });
      await tx.governanceAudit.create({ data: { actorId: auth.user.id, action: 'CATALOG_DELETED',
        entityType: 'UniversityCourseCatalog', entityId: id } });
    });
    return success({ message: 'Course catalog deleted.' });
  } catch (error) { return platformError(error); }
}
