import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { transitionEscrow } from '@/lib/payments/service';
import { paymentJson, paymentErrorResponse, requirePaymentRequest } from '@/lib/payments/http';
import { formatPoishaToBDT, poishaToBdt } from '@/lib/escrowStateMachine';
import { apiError } from '@/lib/api/response';
import { sendNotification } from '@/lib/notifications';

export async function GET() {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;

    const pendingReleases = await prisma.milestone.findMany({
      where: {
        status: 'HELD',
        releaseRequested: true,
      },
      include: {
        application: {
          include: {
            student: { select: { id: true, name: true, email: true, phone: true } },
            agency: { select: { id: true, name: true, licenseNo: true, ownerUserId: true } },
          },
        },
        ledgerEntries: {
          where: { type: 'HOLD' },
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { releaseRequestedAt: 'desc' },
      take: 100,
    });

    return paymentJson({
      success: true,
      releases: pendingReleases.map((m) => ({
        id: m.id,
        milestoneId: m.id,
        applicationId: m.applicationId,
        milestoneName: m.name,
        orderIndex: m.orderIndex,
        releaseCondition: m.releaseCondition,
        amountPoisha: m.amountPoisha.toString(),
        amountBDT: poishaToBdt(m.amountPoisha),
        amountFormatted: formatPoishaToBDT(m.amountPoisha),
        status: m.status,
        releaseRequested: m.releaseRequested,
        releaseRequestedAt: m.releaseRequestedAt?.toISOString() ?? m.updatedAt.toISOString(),
        releaseNote: m.releaseNote ?? 'Student requested escrow release',
        student: m.application.student,
        agency: m.application.agency,
        application: {
          targetUniversity: m.application.targetUniversity,
          targetProgram: m.application.targetProgram,
          targetCountry: m.application.targetCountry,
        },
        heldAt: m.ledgerEntries[0]?.timestamp?.toISOString() ?? m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    requirePaymentRequest(request);

    const body = z
      .object({
        milestoneId: z.string().min(1).max(200),
        action: z.enum(['APPROVE', 'REJECT']),
        note: z.string().trim().max(2000).optional(),
      })
      .parse(await request.json());

    const milestone = await prisma.milestone.findUnique({
      where: { id: body.milestoneId },
      include: {
        application: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            agency: { select: { id: true, name: true, ownerUserId: true } },
          },
        },
      },
    });

    if (!milestone) {
      return apiError('NOT_FOUND', 'Milestone not found.', 404);
    }

    if (milestone.status !== 'HELD') {
      return apiError('INVALID_STATE', `Only held milestones can be processed. Current status is ${milestone.status}.`, 400);
    }

    // --- APPROVE: Admin verifies criteria and releases funds to agency ---
    if (body.action === 'APPROVE') {
      // In sandbox, ensure a verified payment attempt exists for this milestone
      const existingAttempt = await prisma.paymentAttempt.findFirst({
        where: { milestoneId: body.milestoneId, status: 'VALID' },
      });
      if (!existingAttempt) {
        const holdLedger = await prisma.ledgerEntry.findFirst({
          where: { milestoneId: body.milestoneId, type: 'HOLD' },
        });
        const rawProvider = holdLedger?.provider?.startsWith('SANDBOX_')
          ? holdLedger.provider
          : `SANDBOX_${holdLedger?.provider || 'SSLCOMMERZ'}`;
        await prisma.paymentAttempt.create({
          data: {
            milestoneId: body.milestoneId,
            provider: rawProvider,
            providerTxnId: holdLedger?.providerTxnId || randomUUID(),
            amountPoisha: milestone.amountPoisha,
            currency: 'BDT',
            status: 'VALID',
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          },
        });
      }

      const adminNote = body.note?.trim() || 'Admin verified release criteria and approved disbursement to agency.';
      const result = await transitionEscrow(body.milestoneId, 'RELEASED', authorization.user, adminNote);

      await prisma.milestone.update({
        where: { id: body.milestoneId },
        data: { releaseRequested: false },
      });

      // Notify Agency Owner
      if (milestone.application?.agency?.ownerUserId) {
        await sendNotification({
          userId: milestone.application.agency.ownerUserId,
          type: 'ESCROW',
          title: 'Escrow Funds Released',
          message: `Payment of ${formatPoishaToBDT(milestone.amountPoisha)} for milestone "${milestone.name}" has been verified by admin and disbursed to your agency.`,
          entityType: 'ESCROW',
          entityId: '/agency/dashboard',
        });
      }

      // Notify Student
      if (milestone.application?.student?.id) {
        await sendNotification({
          userId: milestone.application.student.id,
          type: 'ESCROW',
          title: 'Escrow Release Approved by Admin',
          message: `Admin verified and approved escrow release of ${formatPoishaToBDT(milestone.amountPoisha)} for milestone "${milestone.name}" to ${milestone.application.agency.name}.`,
          entityType: 'ESCROW',
          entityId: '/dashboard/payments',
        });
      }

      return paymentJson({
        success: true,
        action: 'APPROVE',
        message: `✓ Escrow funds of ${formatPoishaToBDT(milestone.amountPoisha)} verified and released to ${milestone.application.agency.name}.`,
        result,
      });
    }

    // --- REJECT: Admin rejects the release request, keeping funds in escrow ---
    const rejectionNote = body.note?.trim() || 'Verification criteria not yet confirmed by administrator.';

    await prisma.milestone.update({
      where: { id: body.milestoneId },
      data: {
        releaseRequested: false,
        releaseNote: `Rejected: ${rejectionNote}`,
      },
    });

    // Notify Student
    if (milestone.application?.student?.id) {
      await sendNotification({
        userId: milestone.application.student.id,
        type: 'ESCROW',
        title: 'Escrow Release Request Rejected',
        message: `Admin reviewed your escrow release request for "${milestone.name}" and did not approve it. Reason: ${rejectionNote}. Funds remain securely held in escrow.`,
        entityType: 'ESCROW',
        entityId: '/dashboard/payments',
      });
    }

    // Notify Agency
    if (milestone.application?.agency?.ownerUserId) {
      await sendNotification({
        userId: milestone.application.agency.ownerUserId,
        type: 'ESCROW',
        title: 'Escrow Release Request Not Approved',
        message: `Admin did not approve escrow release for milestone "${milestone.name}": ${rejectionNote}.`,
        entityType: 'ESCROW',
        entityId: '/agency/dashboard',
      });
    }

    return paymentJson({
      success: true,
      action: 'REJECT',
      message: `✕ Release request rejected. Milestone "${milestone.name}" remains held in escrow.`,
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
