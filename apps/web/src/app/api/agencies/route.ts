import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/response';

/** Public directory projection: never expose owner identities or review notes. */
export async function GET() {
  try {
    const agencies = await prisma.agency.findMany({
      where: { licenseStatus: 'VERIFIED' },
      select: { id: true, name: true, licenseStatus: true, rating: true, reviewCount: true,
        countriesServed: true, successRate: true, feeMinPoisha: true, feeMaxPoisha: true },
      orderBy: [{ rating: 'desc' }, { id: 'asc' }], take: 500,
    });
    return Response.json({ agencies: agencies.map(agency => ({ ...agency,
      feeMinPoisha: agency.feeMinPoisha.toString(), feeMaxPoisha: agency.feeMaxPoisha.toString(),
    })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error); }
}
