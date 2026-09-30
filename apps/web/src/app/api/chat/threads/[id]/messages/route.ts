import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { forbiddenResponse, requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere, canAccessDocument } from '@/lib/auth/relationships';
import { handleApiError } from '@/lib/api/response';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { id } = await context.params;
    const thread = await prisma.chatThread.findFirst({ where: {
      id, application: applicationAccessWhere(authorization.user),
    }, select: { id: true, applicationId: true, agencyId: true } });
    if (!thread) return forbiddenResponse();
    const messages = await prisma.chatMessage.findMany({ where: { threadId: id }, orderBy: { sentAt: 'asc' }, take: 200 });
    return NextResponse.json({ threadId: id, thread, messages, total: messages.length });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { id } = await context.params;
    const thread = await prisma.chatThread.findFirst({ where: {
      id, application: applicationAccessWhere(authorization.user),
    }, select: { id: true } });
    if (!thread) return forbiddenResponse();
    const body = z.object({
      body: z.string().trim().min(1).max(10000), attachmentDocId: z.string().min(1).optional(),
    }).parse(await request.json());
    if (body.attachmentDocId && !await canAccessDocument(authorization.user, body.attachmentDocId)) return forbiddenResponse();
    const sentAt = new Date();
    const message = await prisma.$transaction(async tx => {
      const created = await tx.chatMessage.create({ data: {
        ...body, threadId: id, senderId: authorization.user.id, senderRole: authorization.user.role, sentAt,
        msgHash: createHash('sha256').update(JSON.stringify([id, authorization.user.id, sentAt, body])).digest('hex'),
      } });
      await tx.chatThread.update({ where: { id }, data: { updatedAt: sentAt } });
      return created;
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
