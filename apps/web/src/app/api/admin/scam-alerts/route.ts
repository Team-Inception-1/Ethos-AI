import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { identifier, platformError, success } from '@/lib/platform/http';
import { sameOrigin } from '@/lib/auth/registration';

export async function GET() {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    const alerts = await prisma.scamAlert.findMany({ orderBy: { detectedAt: 'desc' }, take: 500 });
    return success({ alerts });
  } catch (error) { return platformError(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const input = z.object({ alertId: identifier, action: z.enum(['FLAG_AGENCY', 'BAN_AGENCY', 'DISMISS', 'RESOLVE']),
      adminNote: z.string().trim().max(10000).optional() }).parse(await request.json());
    const alert = await prisma.$transaction(async tx => {
      const existing = await tx.scamAlert.findUnique({ where: { id: input.alertId } });
      if (!existing) return null;
      if (input.action === 'BAN_AGENCY' && existing.agencyId) {
        await tx.agency.update({ where: { id: existing.agencyId }, data: { licenseStatus: 'REJECTED' } });
      }
      if (input.action === 'FLAG_AGENCY' && existing.agencyId) {
        await tx.agency.update({ where: { id: existing.agencyId }, data: { riskScore: Math.max(existing.riskScore, 75) } });
      }
      const updated = await tx.scamAlert.update({ where: { id: input.alertId }, data: {
        status: input.action === 'DISMISS' ? 'DISMISSED' : input.action === 'FLAG_AGENCY' ? 'FLAGGED' : 'RESOLVED',
        actionTaken: input.action, adminNote: input.adminNote, resolvedByAdminId: auth.user.id,
      } });
      await tx.governanceAudit.create({ data: { actorId: auth.user.id, action: input.action,
        entityType: 'ScamAlert', entityId: input.alertId, details: { note: input.adminNote ?? '' } } });
      return updated;
    });
    if (!alert) return apiError('NOT_FOUND', 'Scam alert not found.', 404);
    return success({ alert, message: 'Scam alert updated.' });
  } catch (error) { return platformError(error); }
}
