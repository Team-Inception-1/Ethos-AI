import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';
import { communityError } from '@/lib/community/access';
import { accessibleThread, messageDTO, messageInclude } from '@/lib/community/messages';
type Context = { params: Promise<{ id: string }> };
const inputSchema = z.object({ content: z.string().trim().min(1).max(10000) });
const pageSchema = z.object({ cursor: z.string().min(1).optional(), limit: z.coerce.number().int().min(1).max(100).default(50) });
export async function GET(request: Request, context: Context) {
  const authorization = await requireRole(['STUDENT']); if (authorization.response) return authorization.response;
  try {
    const { id } = await context.params; await accessibleThread(authorization.user.id, id);
    const input = pageSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const rows = await prisma.peerMessage.findMany({ where: { threadId: id }, orderBy: [{ sentAt: 'desc' }, { id: 'desc' }], take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}), include: messageInclude });
    const items = rows.slice(0, input.limit);
    return NextResponse.json({ data: { items: [...items].reverse().map(messageDTO), nextCursor: rows.length > input.limit ? items.at(-1)?.id : null } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return communityError(error); }
}
export async function POST(request: Request, context: Context) {
  const authorization = await requireRole(['STUDENT']); if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const { id } = await context.params; await accessibleThread(authorization.user.id, id);
    const input = inputSchema.parse(await request.json());
    const saved = await prisma.$transaction(async tx => {
      const message = await tx.peerMessage.create({ data: { threadId: id, senderId: authorization.user.id, content: input.content }, include: messageInclude });
      await tx.peerMessageThread.update({ where: { id }, data: { updatedAt: new Date() } });
      return message;
    }, { maxWait: 10000, timeout: 15000 });
    return NextResponse.json({ data: messageDTO(saved) }, { status: 201 });
  } catch (error) { return communityError(error); }
}
