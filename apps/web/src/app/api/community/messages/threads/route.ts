import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';
import { blockedUserIds, communityError } from '@/lib/community/access';
import { threadDTO, threadInclude } from '@/lib/community/messages';
const inputSchema = z.object({ targetId: z.string().min(1).max(200) });
export async function POST(request: Request) {
  const authorization = await requireRole(['STUDENT']); if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const { targetId } = inputSchema.parse(await request.json()); const userId = authorization.user.id;
    if (userId === targetId) return apiError('INVALID_TARGET', 'You cannot message yourself.', 400);
    if ((await blockedUserIds(userId)).includes(targetId)) return apiError('MESSAGING_BLOCKED', 'Messaging is unavailable for a blocked participant.', 403);
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } });
    if (target?.role !== 'STUDENT') return apiError('NOT_FOUND', 'Student not found.', 404);
    const [firstUserId, secondUserId] = [userId, targetId].sort();
    const where = { firstUserId_secondUserId: { firstUserId, secondUserId } };
    const existing = await prisma.peerMessageThread.findUnique({ where, include: threadInclude });
    if (existing) return NextResponse.json({ data: threadDTO(existing) });
    const shared = await prisma.studentCommunityMembership.findFirst({ where: { userId, community: { members: { some: { userId: targetId } } } }, select: { id: true } });
    if (!shared) return apiError('MEMBERSHIP_REQUIRED', 'Join a shared country hub before messaging this student.', 403);
    const thread = await prisma.peerMessageThread.upsert({ where, update: {}, create: { firstUserId, secondUserId }, include: threadInclude });
    return NextResponse.json({ data: threadDTO(thread) }, { status: 201 });
  } catch (error) { return communityError(error); }
}
