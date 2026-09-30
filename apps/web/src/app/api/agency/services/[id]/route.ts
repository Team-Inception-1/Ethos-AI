import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { identifier, platformError, success } from '@/lib/platform/http';

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(['AGENCY']);
    if (auth.response) return auth.response;
    const id = identifier.parse((await context.params).id);
    const deleted = await prisma.$transaction(async tx => {
      const result = await tx.agencyPricing.deleteMany({ where: { id, agency: { ownerUserId: auth.user.id } } });
      if (result.count) await tx.governanceAudit.create({ data: { actorId: auth.user.id, action: 'SERVICE_REMOVED',
        entityType: 'AgencyPricing', entityId: id } });
      return result.count;
    });
    if (!deleted) return apiError('NOT_FOUND', 'Service package not found.', 404);
    return success({ deleted: true });
  } catch (error) { return platformError(error); }
}
