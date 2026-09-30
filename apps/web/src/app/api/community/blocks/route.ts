import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { apiError, handleApiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';
const inputSchema = z.object({ targetId: z.string().min(1).max(200) });
async function list(userId: string) {
  return (await prisma.userBlock.findMany({ where: { blockerId: userId }, orderBy: { createdAt: 'desc' }, take: 1000 })).map(block => block.blockedUserId);
}
export async function GET() {
  const authorization = await requireUser(); if (authorization.response) return authorization.response;
  try { return NextResponse.json({ data: await list(authorization.user.id) }, { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch (error) { return handleApiError(error); }
}
async function update(request: Request, block: boolean) {
  const authorization = await requireUser(); if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const { targetId } = inputSchema.parse(await request.json());
    if (targetId === authorization.user.id) return apiError('INVALID_TARGET', 'You cannot block yourself.', 400);
    if (block) {
      if (!await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })) return apiError('NOT_FOUND', 'User not found.', 404);
      await prisma.userBlock.upsert({ where: { blockerId_blockedUserId: { blockerId: authorization.user.id, blockedUserId: targetId } }, update: {},
        create: { blockerId: authorization.user.id, blockedUserId: targetId } });
    } else await prisma.userBlock.deleteMany({ where: { blockerId: authorization.user.id, blockedUserId: targetId } });
    return NextResponse.json({ data: await list(authorization.user.id) });
  } catch (error) { return handleApiError(error); }
}
export const POST = (request: Request) => update(request, true);
export const DELETE = (request: Request) => update(request, false);
