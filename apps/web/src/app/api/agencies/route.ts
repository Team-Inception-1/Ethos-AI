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

    const agencies = await prisma.agency.findMany({
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
    });

    return Response.json(
      {
        agencies: agencies.map((agency) => ({
          ...agency,
          feeMinPoisha: agency.feeMinPoisha.toString(),
          feeMaxPoisha: agency.feeMaxPoisha.toString(),
          feeMin: Number(agency.feeMinPoisha) / 100,
          feeMax: Number(agency.feeMaxPoisha) / 100,
          pricingServices: agency.pricingServices.map((p) => ({
            ...p,
            amountPoisha: p.amountPoisha.toString(),
            amountBdt: Number(p.amountPoisha) / 100,
          })),
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
