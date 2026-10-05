import { POST as pay } from '@/app/api/escrow/pay/route';
import { POST as release } from '@/app/api/escrow/release/route';
import { POST as dispute } from '@/app/api/escrow/dispute/route';
import { requireRole } from '@/lib/auth/authorization';
import { apiError, handleApiError } from '@/lib/api/response';
import { z } from 'zod';
import { sameOrigin } from '@/lib/auth/registration';
import { prisma } from '@/lib/prisma';
import { reconcilePayment } from '@/lib/payments/service';
import { paymentJson } from '@/lib/payments/http';
import { formatPoishaToBDT } from '@/lib/escrowStateMachine';
import { sendNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT', 'ADMIN']);
    if (authorization.response) return authorization.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const body = z.object({
      action: z.enum(['deposit', 'release', 'dispute', 'confirm', 'cancel_release', 'cancel']), milestoneId: z.string().min(1),
      provider: z.enum(['SSLCOMMERZ', 'BKASH', 'NAGAD']).optional(),
      note: z.string().max(2000).optional(), reason: z.string().max(2000).optional(),
    }).parse(await request.json());
    const actionRequest = new Request(request.url, { method: 'POST',
      headers: request.headers, body: JSON.stringify(body) });
    if (body.action === 'deposit') return pay(actionRequest);
    if (body.action === 'release') return release(actionRequest);
    if (body.action === 'dispute') return dispute(actionRequest);
    if (body.action === 'cancel_release') {
      const milestone = await prisma.milestone.findUnique({
        where: { id: body.milestoneId },
        include: { application: true },
      });
      if (!milestone) return apiError('NOT_FOUND', 'Milestone not found.', 404);
      if (authorization.user.role === 'STUDENT' && milestone.application.studentId !== authorization.user.id) {
        return apiError('FORBIDDEN', 'Access denied.', 403);
      }
      await prisma.milestone.update({
        where: { id: body.milestoneId },
        data: { releaseRequested: false },
      });
      return paymentJson({ success: true, message: 'Release request canceled. Funds remain safely in escrow.' });
    }
    if (body.action === 'cancel') {
      const milestone = await prisma.milestone.findUnique({
        where: { id: body.milestoneId },
        include: { application: true },
      });
      if (!milestone) return apiError('NOT_FOUND', 'Milestone not found.', 404);
      if (authorization.user.role === 'STUDENT' && milestone.application.studentId !== authorization.user.id) {
        return apiError('FORBIDDEN', 'Access denied.', 403);
      }
      if (milestone.status !== 'PENDING') {
        return apiError('INVALID_STATE', 'Only pending unpaid milestones can be canceled.', 400);
      }
      await prisma.milestone.delete({ where: { id: body.milestoneId } });
      return paymentJson({ success: true, message: 'Pending milestone canceled successfully.' });
    }
    if (body.action === 'confirm') {
      const attempt = await prisma.paymentAttempt.findFirst({
        where: { milestoneId: body.milestoneId, status: 'INITIATED', expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (!attempt) return apiError('NO_PAYMENT_ATTEMPT', 'No active payment attempt found to confirm.', 404);
      const rawProvider = attempt.provider.replace('SANDBOX_', '');
      const provider = (rawProvider === 'BKASH' || rawProvider === 'NAGAD' || rawProvider === 'SSLCOMMERZ')
        ? rawProvider
        : 'SSLCOMMERZ';
      const result = await reconcilePayment({
        provider,
        providerTxnId: attempt.providerTxnId,
        milestoneId: body.milestoneId,
        amountPoisha: attempt.amountPoisha.toString(),
        currency: 'BDT',
        status: 'VALID',
      });

      if (result.status === 'HELD' && !result.duplicate) {
        const milestone = await prisma.milestone.findUnique({
          where: { id: body.milestoneId },
          include: {
            application: {
              select: {
                studentId: true,
                agency: { select: { ownerUserId: true, name: true } },
              },
            },
          },
        });
        if (milestone) {
          const bdt = formatPoishaToBDT(milestone.amountPoisha);
          await sendNotification({
            userId: authorization.user.id,
            type: 'ESCROW',
            title: 'Escrow Milestone Funded',
            message: `Deposit of ${bdt} for milestone "${milestone.name}" is now safely secured in cryptographic escrow vault.`,
            entityType: 'ESCROW',
            entityId: '/dashboard/payments',
          });
          if (milestone.application?.agency?.ownerUserId) {
            await sendNotification({
              userId: milestone.application.agency.ownerUserId,
              type: 'ESCROW',
              title: 'Student Funded Milestone Escrow',
              message: `Student deposited ${bdt} into escrow for milestone "${milestone.name}". Funds will be held safely until release conditions are met.`,
              entityType: 'ESCROW',
              entityId: '/agency/dashboard',
            });
          }
        }
      }

      return paymentJson(result);
    }
    return apiError('INVALID_ACTION', 'Unsupported escrow action.', 400);
  } catch (error) { return handleApiError(error); }
}
