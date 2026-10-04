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
    const disputes = await prisma.milestone.findMany({
      where: { status: 'DISPUTED' },
      include: {
        application: {
          include: {
            student: { select: { id: true, name: true, email: true, phone: true } },
            agency: { select: { id: true, name: true, licenseNo: true } },
          },
        },
        _count: { select: { ledgerEntries: true } },
        ledgerEntries: {
          where: { type: 'DISPUTE_FREEZE' },
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return paymentJson({
      success: true,
      disputes: disputes.map((m) => ({
        id: m.id,
        milestoneId: m.id,
        applicationId: m.applicationId,
        milestoneName: m.name,
        amountPoisha: m.amountPoisha,
        amountBDT: poishaToBdt(m.amountPoisha),
        amountFormatted: formatPoishaToBDT(m.amountPoisha),
        status: m.status.toLowerCase(),
        student: m.application.student,
        agency: m.application.agency,
        application: {
          targetUniversity: m.application.targetUniversity,
          targetProgram: m.application.targetProgram,
          targetCountry: m.application.targetCountry,
        },
        ledgerCount: m._count.ledgerEntries,
        disputedAt: m.ledgerEntries[0]?.timestamp ?? m.updatedAt,
        reason: m.ledgerEntries[0]?.note ?? '',
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
        action: z.enum(['REFUND', 'RELEASE']),
        reason: z.string().trim().min(1).max(2000),
      })
      .parse(await request.json());

    // Ensure the disputed milestone exists
    const milestone = await prisma.milestone.findUnique({
      where: { id: body.milestoneId },
      include: {
        application: {
          select: {
            id: true,
            studentId: true,
            agency: { select: { id: true, name: true, ownerUserId: true } },
          },
        },
      },
    });
    if (!milestone) {
      return apiError('NOT_FOUND', 'Disputed milestone not found.', 404);
    }

    // In sandbox, ensure a verified payment attempt exists for this milestone
    const existingAttempt = await prisma.paymentAttempt.findFirst({
      where: { milestoneId: body.milestoneId, status: 'VALID' },
    });
    if (!existingAttempt) {
      const holdLedger = await prisma.ledgerEntry.findFirst({
        where: { milestoneId: body.milestoneId, type: 'HOLD' },
      });
      const provider = holdLedger?.provider?.startsWith('SANDBOX_')
        ? holdLedger.provider
        : 'SANDBOX_SSLCOMMERZ';

      await prisma.paymentAttempt.create({
        data: {
          milestoneId: body.milestoneId,
          provider,
          providerTxnId: holdLedger?.providerTxnId || randomUUID(),
          amountPoisha: milestone.amountPoisha,
          currency: 'BDT',
          status: 'VALID',
          expiresAt: new Date(Date.now() + 30 * 86400000),
        },
      });
    }

    const result = await transitionEscrow(
      body.milestoneId,
      body.action === 'REFUND' ? 'REFUNDED' : 'RELEASED',
      authorization.user,
      body.reason,
      true
    );

    const formattedAmount = formatPoishaToBDT(milestone.amountPoisha);
    if (body.action === 'REFUND') {
      if (milestone.application?.studentId) {
        await sendNotification({
          userId: milestone.application.studentId,
          type: 'ESCROW',
          title: 'Dispute Resolved: Refund Approved',
          message: `Admin approved a refund of ${formattedAmount} for milestone "${milestone.name}". Reason: ${body.reason}`,
          entityType: 'ESCROW',
          entityId: '/dashboard/payments',
        });
      }
      if (milestone.application?.agency?.ownerUserId) {
        await sendNotification({
          userId: milestone.application.agency.ownerUserId,
          type: 'DISPUTE',
          title: 'Dispute Resolved: Refunded to Student',
          message: `Admin resolved the dispute on milestone "${milestone.name}" (${formattedAmount}) with a refund to the student. Reason: ${body.reason}`,
          entityType: 'DISPUTE',
          entityId: '/agency/dashboard',
        });
      }
    } else {
      if (milestone.application?.studentId) {
        await sendNotification({
          userId: milestone.application.studentId,
          type: 'ESCROW',
          title: 'Dispute Resolved: Escrow Released',
          message: `Admin authorized release of ${formattedAmount} for milestone "${milestone.name}" to ${milestone.application.agency.name}. Reason: ${body.reason}`,
          entityType: 'ESCROW',
          entityId: '/dashboard/payments',
        });
      }
      if (milestone.application?.agency?.ownerUserId) {
        await sendNotification({
          userId: milestone.application.agency.ownerUserId,
          type: 'ESCROW',
          title: 'Dispute Resolved: Escrow Released to Agency',
          message: `Admin authorized the release of ${formattedAmount} for milestone "${milestone.name}" to your agency. Reason: ${body.reason}`,
          entityType: 'ESCROW',
          entityId: '/agency/dashboard',
        });
      }
    }

    return paymentJson({
      ...result,
      success: true,
      message:
        body.action === 'REFUND'
          ? `Refund of ${formatPoishaToBDT(milestone.amountPoisha)} approved and returned to student.`
          : `Escrow release of ${formatPoishaToBDT(milestone.amountPoisha)} authorized to agency.`,
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
