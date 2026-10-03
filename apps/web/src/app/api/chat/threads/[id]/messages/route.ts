import { createHash } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { forbiddenResponse, requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere, canAccessDocument } from '@/lib/auth/relationships';
import { apiError, handleApiError } from '@/lib/api/response';
import { success } from '@/lib/platform/http';
import { sameOrigin } from '@/lib/auth/registration';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { id } = await context.params;
    const thread = await prisma.chatThread.findFirst({ where: {
      id, application: applicationAccessWhere(authorization.user),
    }, select: { id: true, applicationId: true, agencyId: true } });
    if (!thread) return forbiddenResponse();
    const before = z.string().min(1).max(200).optional().parse(new URL(request.url).searchParams.get('before') ?? undefined);
    if (before && !await prisma.chatMessage.findFirst({ where: { id: before, threadId: id }, select: { id: true } })) {
      return apiError('NOT_FOUND', 'Message cursor not found in this conversation.', 404);
    }
    const messages = (await prisma.chatMessage.findMany({ where: { threadId: id },
      orderBy: [{ sentAt: 'desc' }, { id: 'desc' }], take: 201,
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    }));
    const hasMore = messages.length > 200;
    const page = messages.slice(0, 200).reverse();

    // Mark unread messages sent by others as read (AUD-018)
    if (typeof (prisma.chatMessage as { updateMany?: unknown }).updateMany === 'function') {
      await prisma.chatMessage.updateMany({
        where: { threadId: id, senderId: { not: authorization.user.id }, isRead: false },
        data: { isRead: true },
      });
    }

    return success({ threadId: id, thread, messages: page, total: await prisma.chatMessage.count({ where: { threadId: id } }),
      nextCursor: hasMore ? page[0]?.id : null });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const { id } = await context.params;
    const thread = await prisma.chatThread.findFirst({ where: {
      id, application: applicationAccessWhere(authorization.user),
    }, select: { id: true, applicationId: true } });
    if (!thread) return forbiddenResponse();
    const body = z.object({
      body: z.string().trim().min(1).max(10000), attachmentDocId: z.string().min(1).optional(),
    }).parse(await request.json());
    if (body.attachmentDocId) {
      if (!await canAccessDocument(authorization.user, body.attachmentDocId)) return forbiddenResponse();
      let attachment = await prisma.document.findFirst({ where: {
        id: body.attachmentDocId, applicationId: thread.applicationId,
      }, select: { id: true, applicationId: true } });
      if (!attachment) {
        const vaultDoc = await prisma.document.findFirst({
          where: { id: body.attachmentDocId, applicationId: null },
          select: { id: true, applicationId: true, ownerId: true },
        });
        if (vaultDoc && (vaultDoc.ownerId === authorization.user.id || authorization.user.role === 'AGENCY')) {
          await prisma.document.update({
            where: { id: vaultDoc.id },
            data: { applicationId: thread.applicationId },
          });
          attachment = vaultDoc;
        }
      }
      if (!attachment) return forbiddenResponse();
    }
    const sentAt = new Date();
    const message = await prisma.$transaction(async tx => {
      const created = await tx.chatMessage.create({ data: {
        ...body, threadId: id, senderId: authorization.user.id, senderRole: authorization.user.role, sentAt,
        msgHash: createHash('sha256').update(JSON.stringify([id, authorization.user.id, sentAt, body])).digest('hex'),
      } });
      await tx.chatThread.update({ where: { id }, data: { updatedAt: sentAt } });
      return created;
    });
    return success({ message }, 201);
  } catch (error) { return handleApiError(error); }
}
