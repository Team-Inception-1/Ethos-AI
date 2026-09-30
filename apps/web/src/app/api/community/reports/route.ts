import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { apiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';
import { accessiblePost, blockedUserIds, communityError, CommunityError } from '@/lib/community/access';
const inputSchema = z.object({ targetType: z.enum(['post', 'comment']), targetId: z.string().min(1), reason: z.string().trim().min(3).max(200), details: z.string().trim().max(5000).optional() });
export async function POST(request: Request) {
  const authorization = await requireUser(); if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const input = inputSchema.parse(await request.json()); const reporterId = authorization.user.id;
    if (input.targetType === 'post') await accessiblePost(authorization.user, input.targetId);
    else {
      const comment = await prisma.communityComment.findUnique({ where: { id: input.targetId } });
      if (!comment || (await blockedUserIds(reporterId)).includes(comment.authorId)) throw new CommunityError('NOT_FOUND', 'Comment not found.', 404);
      await accessiblePost(authorization.user, comment.postId);
    }
    const target = input.targetType === 'post' ? { postId: input.targetId } : { commentId: input.targetId };
    const where = input.targetType === 'post' ? { reporterId_postId: { reporterId, postId: input.targetId } } : { reporterId_commentId: { reporterId, commentId: input.targetId } };
    const report = await prisma.communityReport.upsert({ where, update: {}, create: { reporterId, ...target, reason: input.reason, details: input.details } });
    return NextResponse.json({ data: { id: report.id, reporterId, targetType: input.targetType, targetId: input.targetId,
      reason: report.reason, details: report.details ?? '', timestamp: report.createdAt.toISOString() } }, { status: 201 });
  } catch (error) { return communityError(error); }
}
