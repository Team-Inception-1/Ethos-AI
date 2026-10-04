import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/response';

/** Public directory projection: never expose owner identities or review notes. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : null;

    const where = ids && ids.length > 0
      ? { id: { in: ids } }
      : { licenseStatus: 'VERIFIED' as const };

    const [agencies, riskStates] = await Promise.all([
      prisma.agency.findMany({
        where,
        select: {
          id: true,
          name: true,
          licenseNo: true,
          licenseStatus: true,
          rating: true,
          reviewCount: true,
          countriesServed: true,
          successRate: true,
          riskScore: true,
          feeMinPoisha: true,
          feeMaxPoisha: true,
          address: true,
          website: true,
          description: true,
          pricingServices: {
            select: {
              id: true,
              serviceName: true,
              amountPoisha: true,
              whenCharged: true,
              refundable: true,
              conditions: true,
            },
          },
        },
        orderBy: [{ rating: 'desc' }, { id: 'asc' }],
        take: 500,
      }),
      prisma.agencyRiskState.findMany({
        select: {
          agencyId: true,
          riskScore: true,
          flagCount: true,
          updatedAt: true,
        },
      }).catch(() => []),
    ]);

    const riskStateMap = new Map(riskStates.map((r) => [r.agencyId, r]));

    return Response.json(
      {
        agencies: agencies.map((agency) => {
          const hasReviews = agency.reviewCount > 0;
          const riskState = riskStateMap.get(agency.id);
          const riskScore = riskState?.riskScore ?? agency.riskScore ?? 0;
          const flagCount = riskState?.flagCount ?? (agency.riskScore > 0 ? 1 : 0);
          return {
            ...agency,
            rating: hasReviews ? agency.rating : 0,
            successRate: hasReviews ? agency.successRate : 0,
            riskScore: Math.round(riskScore),
            flagCount,
            lastAssessedAt: riskState?.updatedAt?.toISOString() ?? null,
            feeMinPoisha: agency.feeMinPoisha.toString(),
            feeMaxPoisha: agency.feeMaxPoisha.toString(),
            feeMin: Number(agency.feeMinPoisha) / 100,
            feeMax: Number(agency.feeMaxPoisha) / 100,
            pricingServices: agency.pricingServices.map((p) => ({
              ...p,
              amountPoisha: p.amountPoisha.toString(),
              amountBdt: Number(p.amountPoisha) / 100,
            })),
          };
        }),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
