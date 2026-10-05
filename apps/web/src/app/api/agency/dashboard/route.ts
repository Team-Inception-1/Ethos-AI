import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { applicationStages, stageTransitions } from '@/lib/platform/agency-contracts';
import { identifier, PlatformConflict, platformError, success, toBdt } from '@/lib/platform/http';
import { sameOrigin } from '@/lib/auth/registration';
import { sendNotification } from '@/lib/notifications';

export async function GET() {
  try {
    const auth = await requireRole(['AGENCY']);
    if (auth.response) return auth.response;
    let agency = await prisma.agency.findUnique({ where: { ownerUserId: auth.user.id }, select: {
      id: true, name: true, licenseNo: true, licenseStatus: true, countriesServed: true,
    } });
    if (!agency) {
      const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { name: true } });
      agency = await prisma.agency.create({
        data: {
          ownerUserId: auth.user.id,
          name: user?.name || 'Agency Workspace',
          licenseNo: 'MOE-BD-' + (new Date().getFullYear()) + '-' + Math.floor(100 + Math.random() * 900),
          licenseStatus: auth.user.isVerified ? 'VERIFIED' : 'PENDING',
          countriesServed: ['CAN', 'GBR', 'USA', 'AUS'],
          rating: 0,
          reviewCount: 0,
          successRate: 0,
          description: 'Study-abroad consultancy awaiting administrative credential verification.',
        },
        select: {
          id: true, name: true, licenseNo: true, licenseStatus: true, countriesServed: true,
        },
      });
    }
    const [applications, services, documents, rawMilestones] = await Promise.all([
      agency.licenseStatus === 'VERIFIED' ? prisma.application.findMany({ where: { agencyId: agency.id },
        include: { student: { select: { id: true, name: true, email: true, phone: true } },
          documents: { select: { id: true, fileName: true, type: true } },
          milestones: { where: { status: 'HELD' }, select: { amountPoisha: true } },
          stageEvents: { orderBy: { timestamp: 'desc' }, take: 1, select: { note: true } } },
        orderBy: { updatedAt: 'desc' }, take: 200,
      }) : Promise.resolve([]),
      prisma.agencyPricing.findMany({ where: { agencyId: agency.id }, orderBy: { serviceName: 'asc' } }),
      prisma.document.findMany({ where: { ownerId: auth.user.id },
        select: { id: true, fileName: true, type: true, uploadedAt: true }, orderBy: { uploadedAt: 'desc' }, take: 100 }),
      prisma.milestone.findMany({
        where: { application: { agencyId: agency.id } },
        include: {
          application: {
            select: {
              id: true,
              targetUniversity: true,
              targetProgram: true,
              targetCountry: true,
              intakeSemester: true,
              stage: true,
              student: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
          ledgerEntries: { orderBy: { timestamp: 'desc' } },
          paymentAttempts: { where: { status: 'VALID' }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        take: 300,
      }),
    ]);

    const payouts = rawMilestones.map(m => {
      const releaseLedger = m.ledgerEntries.find(e => e.type === 'RELEASE');
      const holdLedger = m.ledgerEntries.find(e => e.type === 'HOLD');
      const latestLedger = m.ledgerEntries[0];
      const validAttempt = m.paymentAttempts[0];

      return {
        id: m.id,
        milestoneName: m.name,
        orderIndex: m.orderIndex,
        amountBdt: toBdt(m.amountPoisha),
        status: m.status,
        releaseCondition: m.releaseCondition,
        releaseRequested: m.releaseRequested,
        releaseRequestedAt: m.releaseRequestedAt ? m.releaseRequestedAt.toISOString() : null,
        releaseNote: m.releaseNote,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        releasedAt: releaseLedger ? releaseLedger.timestamp.toISOString() : (m.status === 'RELEASED' ? m.updatedAt.toISOString() : null),
        heldAt: holdLedger ? holdLedger.timestamp.toISOString() : (m.status !== 'PENDING' ? m.createdAt.toISOString() : null),
        provider: releaseLedger?.provider ?? holdLedger?.provider ?? validAttempt?.provider ?? 'SSLCOMMERZ',
        providerTxnId: releaseLedger?.providerTxnId ?? holdLedger?.providerTxnId ?? validAttempt?.providerTxnId ?? null,
        txHash: releaseLedger?.txHash ?? holdLedger?.txHash ?? latestLedger?.txHash ?? null,
        student: {
          id: m.application.student.id,
          name: m.application.student.name,
          email: m.application.student.email,
          phone: m.application.student.phone,
        },
        application: {
          id: m.application.id,
          targetUniversity: m.application.targetUniversity,
          targetProgram: m.application.targetProgram,
          targetCountry: m.application.targetCountry,
          intakeSemester: m.application.intakeSemester,
          stage: m.application.stage,
        },
      };
    });

    const payoutsSummary = {
      totalReleasedBdt: payouts.filter(p => p.status === 'RELEASED').reduce((sum, p) => sum + p.amountBdt, 0),
      totalHeldBdt: payouts.filter(p => p.status === 'HELD').reduce((sum, p) => sum + p.amountBdt, 0),
      totalPendingAdminBdt: payouts.filter(p => p.status === 'HELD' && p.releaseRequested).reduce((sum, p) => sum + p.amountBdt, 0),
      releasedCount: payouts.filter(p => p.status === 'RELEASED').length,
      heldCount: payouts.filter(p => p.status === 'HELD').length,
    };

    return success({
      agency,
      applications: applications.map(({ milestones, stageEvents, ...row }) => ({ ...row,
        heldBdt: toBdt(milestones.reduce((sum, milestone) => sum + milestone.amountPoisha, BigInt(0))),
        lastNote: stageEvents[0]?.note ?? null,
      })),
      services: services.map(({ amountPoisha, ...row }) => ({ ...row, amountBdt: toBdt(amountPoisha) })),
      documents,
      payouts,
      payoutsSummary,
    });
  } catch (error) { return platformError(error); }
}
export async function PATCH(request: Request) {
  try {
    const auth = await requireRole(['AGENCY']);
    if (auth.response) return auth.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const input = z.object({ applicationId: identifier, stage: z.enum(applicationStages),
      note: z.string().trim().max(10000).optional() }).parse(await request.json());
    const result = await prisma.$transaction(async tx => {
      const application = await tx.application.findFirst({
        where: { id: input.applicationId, agency: { ownerUserId: auth.user.id, licenseStatus: 'VERIFIED' } },
        select: {
          id: true,
          stage: true,
          studentId: true,
          targetUniversity: true,
          targetCountry: true,
          agency: { select: { name: true } },
        },
      });
      if (!application) return null;
      if (!stageTransitions[application.stage].includes(input.stage)) throw new PlatformConflict('This stage transition is not allowed.');
      const changed = await tx.application.updateMany({ where: { id: application.id, stage: application.stage }, data: { stage: input.stage } });
      if (!changed.count) throw new PlatformConflict('The application was updated by another request. Refresh and retry.');
      await tx.stageEvent.create({ data: { applicationId: application.id, stage: input.stage,
        actorId: auth.user.id, actorRole: 'AGENCY', note: input.note } });
      return {
        id: application.id,
        stage: input.stage,
        studentId: application.studentId,
        targetUniversity: application.targetUniversity,
        targetCountry: application.targetCountry,
        agencyName: application.agency.name,
      };
    });
    if (!result) return apiError('FORBIDDEN', 'Application is not accessible to this verified agency.', 403);

    const formattedStage = input.stage.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    await sendNotification({
      userId: result.studentId,
      type: 'APPLICATION',
      title: `Application Update: ${formattedStage}`,
      message: `${result.agencyName} updated your application for ${result.targetUniversity} (${result.targetCountry}) to "${formattedStage}".${input.note ? ` Note: ${input.note}` : ''}`,
      entityType: 'APPLICATION',
      entityId: result.id,
    });

    return success({ application: { id: result.id, stage: result.stage }, message: 'Application stage saved. Escrow balances are unchanged.' });
  } catch (error) { return platformError(error); }
}
