import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere } from '@/lib/auth/relationships';
import { applicationDocumentAccessWhere, applicationSelect } from '@/lib/applications/access';
import { handleApiError } from '@/lib/api/response';

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
