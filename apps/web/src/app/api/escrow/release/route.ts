import { z } from 'zod';
import { requireRole } from '@/lib/auth/authorization';
import { transitionEscrow } from '@/lib/payments/service';
import { paymentJson, paymentErrorResponse, requirePaymentRequest } from '@/lib/payments/http';
import { PaymentError } from '@/lib/payments/errors';
import { prisma } from '@/lib/prisma';
import { formatPoishaToBDT } from '@/lib/escrowStateMachine';
import { sendNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT', 'ADMIN']);
    if (authorization.response) return authorization.response;
    requirePaymentRequest(request);
    const body = z.object({
      milestoneId: z.string().min(1).max(200),
      note: z.string().trim().max(2000).optional(),
    }).parse(await request.json());

    const milestone = await prisma.milestone.findUnique({
      where: { id: body.milestoneId },
      include: {
        application: {
          include: {
            agency: { select: { id: true, ownerUserId: true, name: true } },
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!milestone) {
      throw new PaymentError('NOT_FOUND', 'Milestone not found.', 404);
    }

    // --- STUDENT ROLE: Initiate Release Request (Admin Verification Gate) ---
    if (authorization.user.role === 'STUDENT') {
      if (milestone.application.studentId !== authorization.user.id) {
        throw new PaymentError('FORBIDDEN', 'You can only request release for your own applications.', 403);
      }
      if (milestone.status !== 'HELD') {
        throw new PaymentError('INVALID_STATE', 'Only milestones held in escrow can be requested for release.', 400);
      }

      const releaseNote = body.note?.trim() || 'Milestone criteria verified and authorized by student.';
      const updated = await prisma.milestone.update({
        where: { id: body.milestoneId },
        data: {
          releaseRequested: true,
          releaseRequestedAt: new Date(),
          releaseNote,
        },
      });

      // Notify Agency Owner
      if (milestone.application?.agency?.ownerUserId) {
        await sendNotification({
          userId: milestone.application.agency.ownerUserId,
          type: 'ESCROW',
          title: 'Escrow Release Requested',
          message: `Student ${milestone.application.student.name} authorized release of ${formatPoishaToBDT(milestone.amountPoisha)} for milestone "${milestone.name}". Awaiting admin verification.`,
          entityType: 'ESCROW',
          entityId: '/agency/dashboard',
        });
      }

      // Notify Platform Admins
      try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
        for (const admin of admins) {
          await sendNotification({
            userId: admin.id,
            type: 'ESCROW',
            title: 'Escrow Release Verification Required',
            message: `Student requested release of ${formatPoishaToBDT(milestone.amountPoisha)} for milestone "${milestone.name}" (${milestone.application.agency.name}). Please verify criteria in Admin Panel.`,
            entityType: 'ESCROW',
            entityId: '/admin?tab=releases',
          });
        }
      } catch {
        // Non-blocking notification dispatch
      }

      return paymentJson({
        success: true,
        status: 'HELD',
        releaseRequested: true,
        message: 'Escrow release requested. An admin will verify the completion criteria before funds are disbursed to the agency.',
        milestone: {
          ...updated,
          amountPoisha: updated.amountPoisha.toString(),
        },
      });
    }

    // --- ADMIN ROLE: Verify & Execute Release ---
    const result = await transitionEscrow(body.milestoneId, 'RELEASED', authorization.user, body.note);

    await prisma.milestone.update({
      where: { id: body.milestoneId },
      data: { releaseRequested: false },
    });

    if (milestone.application?.agency?.ownerUserId) {
      await sendNotification({
        userId: milestone.application.agency.ownerUserId,
        type: 'ESCROW',
        title: 'Escrow Funds Released',
        message: `Payment of ${formatPoishaToBDT(milestone.amountPoisha)} for milestone "${milestone.name}" has been verified by admin and released to your agency.`,
        entityType: 'ESCROW',
        entityId: '/agency/dashboard',
      });
    }

    if (milestone.application?.studentId) {
      await sendNotification({
        userId: milestone.application.studentId,
        type: 'ESCROW',
        title: 'Escrow Release Approved',
        message: `Admin verified and approved escrow release of ${formatPoishaToBDT(milestone.amountPoisha)} for milestone "${milestone.name}" to ${milestone.application.agency.name}.`,
        entityType: 'ESCROW',
        entityId: '/dashboard/payments',
      });
    }

    return paymentJson(result);
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
