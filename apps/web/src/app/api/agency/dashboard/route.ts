import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { applicationStages, stageTransitions } from '@/lib/platform/agency-contracts';
import { identifier, PlatformConflict, platformError, success, toBdt } from '@/lib/platform/http';
import { sameOrigin } from '@/lib/auth/registration';

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
          description: 'Study-abroad consultancy awaiting administrative credential verification.',
        },
        select: {
          id: true, name: true, licenseNo: true, licenseStatus: true, countriesServed: true,
        },
      });
    }
    const [applications, services, documents] = await Promise.all([
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
    ]);
    return success({ agency, applications: applications.map(({ milestones, stageEvents, ...row }) => ({ ...row,
      heldBdt: toBdt(milestones.reduce((sum, milestone) => sum + milestone.amountPoisha, BigInt(0))),
      lastNote: stageEvents[0]?.note ?? null,
    })), services: services.map(({ amountPoisha, ...row }) => ({ ...row, amountBdt: toBdt(amountPoisha) })), documents });
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
      const application = await tx.application.findFirst({ where: { id: input.applicationId,
        agency: { ownerUserId: auth.user.id, licenseStatus: 'VERIFIED' } }, select: { id: true, stage: true } });
      if (!application) return null;
      if (!stageTransitions[application.stage].includes(input.stage)) throw new PlatformConflict('This stage transition is not allowed.');
      const changed = await tx.application.updateMany({ where: { id: application.id, stage: application.stage }, data: { stage: input.stage } });
      if (!changed.count) throw new PlatformConflict('The application was updated by another request. Refresh and retry.');
      await tx.stageEvent.create({ data: { applicationId: application.id, stage: input.stage,
        actorId: auth.user.id, actorRole: 'AGENCY', note: input.note } });
      return { id: application.id, stage: input.stage };
    });
    if (!result) return apiError('FORBIDDEN', 'Application is not accessible to this verified agency.', 403);
    return success({ application: result, message: 'Application stage saved. Escrow balances are unchanged.' });
  } catch (error) { return platformError(error); }
}
