import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, forbiddenResponse } from '@/lib/auth/authorization';
import { applicationAccessWhere } from '@/lib/auth/relationships';
import { handleApiError } from '@/lib/api/response';

export async function GET() {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const threads = await prisma.chatThread.findMany({
      where: { application: applicationAccessWhere(authorization.user) },
      include: { application: { include: { student: { select: { name: true } } } },
        agency: { select: { name: true } }, messages: { orderBy: { sentAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' }, take: 100,
    });
    return NextResponse.json({ threads: threads.map(thread => ({
      id: thread.id, applicationId: thread.applicationId, agencyId: thread.agencyId,
      agencyName: thread.agency.name, studentName: thread.application.student.name,
      targetUniversity: thread.application.targetUniversity, targetCountry: thread.application.targetCountry,
      createdAt: thread.createdAt, updatedAt: thread.updatedAt,
      lastMessage: thread.messages[0] ? { text: thread.messages[0].body, time: thread.messages[0].sentAt,
        senderRole: thread.messages[0].senderRole } : null,
    })) });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { applicationId } = z.object({ applicationId: z.string().min(1) }).parse(await request.json());
    const application = await prisma.application.findFirst({
      where: { AND: [{ id: applicationId }, applicationAccessWhere(authorization.user)] },
      select: { id: true, agencyId: true },
    });
    if (!application) return forbiddenResponse();
    const thread = await prisma.chatThread.upsert({
      where: { applicationId }, create: { applicationId, agencyId: application.agencyId }, update: {},
    });
    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
