import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { identifier, platformError, success, toBdt } from '@/lib/platform/http';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    const { type, id } = z.object({ type: z.enum(['benchmark', 'catalog']), id: identifier })
      .parse(Object.fromEntries(new URL(request.url).searchParams));
    const record = type === 'benchmark'
      ? await prisma.countryCostBenchmark.findUnique({ where: { id } })
      : await prisma.universityCourseCatalog.findUnique({ where: { id } });
    if (!record) return apiError('NOT_FOUND', 'Provenance record not found.', 404);
    const isBenchmark = 'officialGovUrl' in record;
    // Arbitrary pages have no stable numeric schema. Never fetch user-supplied URLs
    // from this endpoint or claim the first number on a page verifies a cost.
    return success({ match: null, external: null, needsReview: true,
      stored: isBenchmark ? toBdt(record.blockedAccountOrGicPoisha) : record.annualTuitionLocal,
      sourceUrl: isBenchmark ? record.officialGovUrl : record.officialCatalogUrl,
      currency: isBenchmark ? 'BDT' : record.currency, lastAuditedAt: record.lastAuditedAt,
      explanation: 'Open the official source and manually confirm its amount, currency, effective date, and applicability before approving. Automatic numeric verification is unavailable.',
    });
  } catch (error) { return platformError(error); }
}
