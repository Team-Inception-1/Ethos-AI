import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { identifier, platformError, success } from '@/lib/platform/http';

export async function GET() {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    const rows = await prisma.agency.findMany({ include: {
      owner: { select: { name: true, email: true, phone: true } }, _count: { select: { pricingServices: true } },
    }, orderBy: { createdAt: 'desc' }, take: 500 });
    const agencies = rows.map(({ feeMinPoisha, feeMaxPoisha, _count, ...row }) => ({ ...row,
      feeMinPoisha: feeMinPoisha.toString(), feeMaxPoisha: feeMaxPoisha.toString(),
      pricingsCount: _count.pricingServices, submittedDocs: [],
    }));
    return success({ agencies });
  } catch (error) { return platformError(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    const input = z.object({ agencyId: identifier, action: z.enum(['VERIFIED', 'REJECTED', 'PENDING', 'SUSPENDED']),
      note: z.string().trim().max(10000).optional() }).parse(await request.json());
    const agency = await prisma.$transaction(async tx => {
      const updated = await tx.agency.update({ where: { id: input.agencyId }, data: { licenseStatus: input.action } });
      await tx.governanceAudit.create({ data: { actorId: auth.user.id, action: `AGENCY_${input.action}`,
        entityType: 'Agency', entityId: updated.id, details: { note: input.note ?? '' } } });
      return { ...updated, feeMinPoisha: updated.feeMinPoisha.toString(), feeMaxPoisha: updated.feeMaxPoisha.toString() };
    });
    return success({ agency, message: 'Agency status updated.' });
  } catch (error) { return platformError(error); }
}
