import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere } from '@/lib/auth/relationships';
import { applicationDocumentAccessWhere, applicationSelect } from '@/lib/applications/access';
import { apiError, handleApiError } from '@/lib/api/response';

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
