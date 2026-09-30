import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere } from '@/lib/auth/relationships';
import { applicationDocumentAccessWhere, applicationSelect } from '@/lib/applications/access';
import { apiError, handleApiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';

const createApplicationSchema = z.object({
  agencyId: z.string().trim().min(1).max(100),
  targetCountry: z.string().trim().min(2).max(100),
  targetUniversity: z.string().trim().min(2).max(200),
  targetProgram: z.string().trim().min(2).max(200),
  intakeSemester: z.string().trim().min(2).max(100),
});

export async function GET(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const page = z.coerce.number().int().min(1).max(10000).parse(new URL(request.url).searchParams.get('page') ?? '1');
    const pageSize = 25;
    const where = applicationAccessWhere(authorization.user);
    const documentsWhere = applicationDocumentAccessWhere(authorization.user);
    const [applications, total, activeApplications, documentCount, held] = await Promise.all([
      prisma.application.findMany({ where, select: { ...applicationSelect,
        _count: { select: { documents: { where: documentsWhere }, milestones: true } },
      }, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.application.count({ where }),
      prisma.application.count({ where: { AND: [where, { stage: { notIn: ['COMPLETED', 'VISA_REJECTED', 'VISA_APPROVED'] } }] } }),
      prisma.document.count({ where: documentsWhere }),
      prisma.milestone.aggregate({ where: { application: where, status: 'HELD' }, _sum: { amountPoisha: true } }),
    ]);
    return NextResponse.json({ applications: applications.map(({ _count, ...application }) => ({ ...application,
      documentCount: _count.documents, milestoneCount: _count.milestones,
    })), total, page, pageSize, summary: { activeApplications, documentCount, heldPoisha: (held._sum.amountPoisha ?? BigInt(0)).toString() } },
    { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;
  if (authorization.user.role !== 'STUDENT') {
    return apiError('FORBIDDEN', 'Only students can start applications.', 403);
  }
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);

  try {
    const input = createApplicationSchema.parse(await request.json());
    const agency = await prisma.agency.findFirst({
      where: { id: input.agencyId, licenseStatus: 'VERIFIED' },
      select: {
        id: true,
        pricingServices: {
          select: { serviceName: true, amountPoisha: true, whenCharged: true },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 10,
        },
      },
    });
    if (!agency) return apiError('AGENCY_UNAVAILABLE', 'Select a verified agency.', 404);

    const duplicate = await prisma.application.findFirst({
      where: {
        studentId: authorization.user.id,
        agencyId: agency.id,
        targetUniversity: { equals: input.targetUniversity, mode: 'insensitive' },
        targetProgram: { equals: input.targetProgram, mode: 'insensitive' },
        intakeSemester: { equals: input.intakeSemester, mode: 'insensitive' },
        stage: { notIn: ['COMPLETED', 'VISA_REJECTED'] },
      },
      select: { id: true },
    });
    if (duplicate) return apiError('APPLICATION_EXISTS', 'An active application for this program and intake already exists.', 409);

    const application = await prisma.application.create({
      data: {
        studentId: authorization.user.id,
        agencyId: agency.id,
        targetCountry: input.targetCountry,
        targetUniversity: input.targetUniversity,
        targetProgram: input.targetProgram,
        intakeSemester: input.intakeSemester,
        stageEvents: { create: {
          stage: 'SUBMITTED', actorId: authorization.user.id, actorRole: 'STUDENT',
          note: 'Application started by the student through the verified agency directory.',
        } },
        milestones: { create: agency.pricingServices.map((pricing, index) => ({
          name: pricing.serviceName,
          orderIndex: index + 1,
          amountPoisha: pricing.amountPoisha,
          releaseCondition: pricing.whenCharged,
          status: 'PENDING' as const,
        })) },
      },
      select: {
        ...applicationSelect,
        _count: { select: { documents: true, milestones: true } },
      },
    });
    const { _count, ...created } = application;
    return NextResponse.json({ data: { application: {
      ...created, documentCount: _count.documents, milestoneCount: _count.milestones,
    } } }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
