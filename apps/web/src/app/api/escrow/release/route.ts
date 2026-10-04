import { z } from 'zod';
import { requireRole } from '@/lib/auth/authorization';
import { transitionEscrow } from '@/lib/payments/service';
import { paymentJson, paymentErrorResponse, requirePaymentRequest } from '@/lib/payments/http';
import { prisma } from '@/lib/prisma';
import { formatPoishaToBDT } from '@/lib/escrowStateMachine';
import { sendNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT', 'ADMIN']);
    if (authorization.response) return authorization.response;
    requirePaymentRequest(request);
    const body = z.object({ milestoneId: z.string().min(1).max(200), note: z.string().trim().max(2000).optional() }).parse(await request.json());
    const result = await transitionEscrow(body.milestoneId, 'RELEASED', authorization.user, body.note);

    const milestone = await prisma.milestone.findUnique({
      where: { id: body.milestoneId },
      include: {
        application: {
          select: {
            agency: { select: { ownerUserId: true, name: true } },
            studentId: true,
          },
        },
      },
    });

    if (milestone?.application?.agency?.ownerUserId) {
      await sendNotification({
        userId: milestone.application.agency.ownerUserId,
        type: 'ESCROW',
        title: 'Escrow Funds Released',
        message: `Payment of ${formatPoishaToBDT(milestone.amountPoisha)} for milestone "${milestone.name}" has been released to your agency.`,
        entityType: 'ESCROW',
        entityId: '/agency/dashboard',
      });
    }

    return paymentJson(result);
  } catch (error) { return paymentErrorResponse(error); }
}
