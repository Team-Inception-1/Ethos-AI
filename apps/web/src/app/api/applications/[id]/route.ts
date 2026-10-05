import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere } from '@/lib/auth/relationships';
import { applicationDocumentAccessWhere, applicationSelect } from '@/lib/applications/access';
import { apiError, handleApiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';
import { sendNotification } from '@/lib/notifications';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { id } = await context.params;
    const documentsWhere = applicationDocumentAccessWhere(authorization.user);
    const application = await prisma.application.findFirst({ where: { AND: [{ id }, applicationAccessWhere(authorization.user)] },
      select: { ...applicationSelect,
        _count: { select: { documents: { where: documentsWhere }, milestones: true } },
        stageEvents: { select: { id: true, stage: true, actorRole: true, actor: { select: { name: true } }, note: true, timestamp: true },
          orderBy: { timestamp: 'desc' }, take: 100 },
        documents: { where: documentsWhere, select: { id: true, fileName: true, fileSize: true, mimeType: true, uploadedAt: true },
          orderBy: { uploadedAt: 'desc' }, take: 100 },
        milestones: { select: { id: true, name: true, amountPoisha: true, releaseCondition: true, status: true, dueDate: true },
          orderBy: { orderIndex: 'asc' }, take: 100 },
        chatThread: { select: { id: true } },
      },
    });
    if (!application) return apiError('NOT_FOUND', 'Application not found or access is unavailable.', 404);
    const { _count, milestones, ...details } = application;
    return NextResponse.json({ application: { ...details, documentCount: _count.documents, milestoneCount: _count.milestones,
      milestones: milestones.map(milestone => ({ ...milestone, amountPoisha: milestone.amountPoisha.toString() })),
    } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);

    const { id } = await context.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        milestones: {
          select: { id: true, status: true, amountPoisha: true },
        },
        agency: {
          select: { id: true, name: true, ownerUserId: true },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!application) {
      return apiError('NOT_FOUND', 'Application not found.', 404);
    }

    const isStudentOwner =
      authorization.user.role.toUpperCase() === 'STUDENT' &&
      application.studentId === authorization.user.id;
    const isAdmin = authorization.user.role.toUpperCase() === 'ADMIN';

    if (!isStudentOwner && !isAdmin) {
      return apiError(
        'FORBIDDEN',
        'Only the student who submitted the application or an administrator can withdraw it.',
        403
      );
    }

    if (application.stage === 'COMPLETED' || application.stage === 'VISA_APPROVED') {
      return apiError(
        'BAD_REQUEST',
        'Completed or visa-approved applications cannot be withdrawn.',
        400
      );
    }

    const activeEscrowMilestones = application.milestones.filter(
      (m) => m.status === 'HELD' || m.status === 'DISPUTED'
    );
    if (activeEscrowMilestones.length > 0) {
      return apiError(
        'ESCROW_LOCKED',
        'Cannot withdraw an application while funds are held or disputed in escrow. Please request an escrow refund or dispute resolution in the Payments dashboard first.',
        400
      );
    }

    const milestoneIds = application.milestones.map((m) => m.id);
    if (milestoneIds.length > 0) {
      const ledgerCount = await prisma.ledgerEntry.count({
        where: { milestoneId: { in: milestoneIds } },
      });
      if (ledgerCount > 0) {
        return apiError(
          'FINANCIAL_AUDIT_EXISTS',
          'Cannot withdraw an application with processed ledger transactions. Please contact support or request assistance.',
          400
        );
      }
    }

    let reason = '';
    try {
      const body = await request.json();
      if (body && typeof body.reason === 'string') {
        reason = body.reason.trim().slice(0, 1000);
      }
    } catch {
      // Body is optional
    }

    await prisma.$transaction(async (tx) => {
      if (milestoneIds.length > 0) {
        await tx.paymentAttempt.deleteMany({
          where: { milestoneId: { in: milestoneIds } },
        });
      }

      await tx.document.updateMany({
        where: { applicationId: id },
        data: { applicationId: null },
      });

      await tx.application.delete({
        where: { id },
      });
    });

    if (application.agency?.ownerUserId) {
      try {
        await sendNotification({
          userId: application.agency.ownerUserId,
          type: 'APPLICATION',
          title: 'Application Withdrawn',
          message: `${application.student?.name || 'A student'} has withdrawn their application for ${application.targetUniversity} (${application.targetCountry}).${reason ? ` Reason: "${reason}"` : ''}`,
          entityType: 'AGENCY',
          entityId: application.agency.id,
        });
      } catch (err) {
        console.error('[ApplicationWithdrawal] Failed to notify agency owner:', err);
      }
    }

    try {
      await sendNotification({
        userId: application.studentId,
        type: 'APPLICATION',
        title: 'Application Withdrawn',
        message: `Your application for ${application.targetUniversity} (${application.targetCountry}) has been successfully withdrawn.`,
        entityType: 'APPLICATION',
        entityId: null,
      });
    } catch (err) {
      console.error('[ApplicationWithdrawal] Failed to notify student:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Application has been successfully withdrawn.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

