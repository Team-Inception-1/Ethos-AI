import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { identifier, platformError, success } from '@/lib/platform/http';
import { sameOrigin } from '@/lib/auth/registration';
import { apiError } from '@/lib/api/response';
import { sendNotification } from '@/lib/notifications';

export async function GET() {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    const rows = await prisma.agency.findMany({ include: {
      owner: { select: { name: true, email: true, phone: true } }, _count: { select: { pricingServices: true } },
    }, orderBy: { createdAt: 'desc' }, take: 500 });
    const agencies = rows.map(({ feeMinPoisha, feeMaxPoisha, _count, ...row }) => {
      const hasReviews = row.reviewCount > 0;
      return {
        ...row,
        rating: hasReviews ? row.rating : 0,
        successRate: hasReviews ? row.successRate : 0,
        feeMinPoisha: feeMinPoisha.toString(),
        feeMaxPoisha: feeMaxPoisha.toString(),
        pricingsCount: _count.pricingServices,
        submittedDocs: [],
      };
    });
    return success({ agencies });
  } catch (error) { return platformError(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const input = z.object({ agencyId: identifier, action: z.enum(['VERIFIED', 'REJECTED', 'PENDING', 'SUSPENDED']),
      note: z.string().trim().max(10000).optional() }).parse(await request.json());
    const agency = await prisma.$transaction(async tx => {
      const updated = await tx.agency.update({ where: { id: input.agencyId }, data: { licenseStatus: input.action } });
      await tx.user.update({
        where: { id: updated.ownerUserId },
        data: { isVerified: input.action === 'VERIFIED' },
      });
      await tx.governanceAudit.create({ data: { actorId: auth.user.id, action: `AGENCY_${input.action}`,
        entityType: 'Agency', entityId: updated.id, details: { note: input.note ?? '' } } });
      return { ...updated, feeMinPoisha: updated.feeMinPoisha.toString(), feeMaxPoisha: updated.feeMaxPoisha.toString() };
    });

    const statusMessages: Record<string, { title: string; message: string }> = {
      VERIFIED: {
        title: 'Agency License Verified',
        message: 'Congratulations! Your consultancy license has been verified by platform administrators. Your profile is now publicly visible in the agency directory.',
      },
      REJECTED: {
        title: 'Agency Verification Rejected',
        message: `Your agency verification request was rejected.${input.note ? ` Reason: ${input.note}` : ' Please review your licensing documents and contact support.'}`,
      },
      SUSPENDED: {
        title: 'Agency Account Suspended',
        message: `Your agency profile has been temporarily suspended.${input.note ? ` Reason: ${input.note}` : ''}`,
      },
      PENDING: {
        title: 'Agency Verification Pending',
        message: 'Your agency licensing status has been set to pending review.',
      },
    };

    const notif = statusMessages[input.action];
    if (notif && agency.ownerUserId) {
      await sendNotification({
        userId: agency.ownerUserId,
        type: 'VERIFICATION',
        title: notif.title,
        message: notif.message,
        entityType: 'AGENCY',
        entityId: '/agency/dashboard',
      });
    }

    return success({ agency, message: 'Agency status updated.' });
  } catch (error) { return platformError(error); }
}
