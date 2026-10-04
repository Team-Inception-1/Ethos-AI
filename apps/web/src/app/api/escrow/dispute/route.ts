import { z } from 'zod';
import { requireRole } from '@/lib/auth/authorization';
import { transitionEscrow } from '@/lib/payments/service';
import { paymentJson, paymentErrorResponse, requirePaymentRequest } from '@/lib/payments/http';
import { prisma } from '@/lib/prisma';
import { formatPoishaToBDT } from '@/lib/escrowStateMachine';
import { sendNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT']);
    if (authorization.response) return authorization.response;
    requirePaymentRequest(request);
    const body = z.object({ milestoneId: z.string().min(1).max(200), reason: z.string().trim().min(1).max(2000) }).parse(await request.json());
    const result = await transitionEscrow(body.milestoneId, 'DISPUTED', authorization.user, body.reason);

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
        type: 'DISPUTE',
        title: 'Milestone Escrow Disputed',
        message: `Student filed a dispute on milestone "${milestone.name}" (${formatPoishaToBDT(milestone.amountPoisha)}). Reason: ${body.reason}`,
        entityType: 'DISPUTE',
        entityId: '/agency/dashboard',
      });
    }

    return paymentJson(result);
  } catch (error) { return paymentErrorResponse(error); }
}
