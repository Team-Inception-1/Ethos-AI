import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole, requireUser } from '@/lib/auth/authorization';
import { accessiblePost, blockedUserIds, communityError, communityMembership } from '@/lib/community/access';
import { commentDTO, commentInclude } from '@/lib/community/posts';
import { apiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';
type Context = { params: Promise<{ id: string }> };
const pagination = z.object({ cursor: z.string().min(1).optional(), limit: z.coerce.number().int().min(1).max(50).default(30) });
const inputSchema = z.object({ content: z.string().trim().min(1).max(10000), isAnonymous: z.boolean().default(false) });
export async function GET(request: Request, context: Context) {
  const authorization = await requireUser(); if (authorization.response) return authorization.response;
  try {
    const { id } = await context.params; await accessiblePost(authorization.user, id);
    const input = pagination.parse(Object.fromEntries(new URL(request.url).searchParams));
    const blocked = await blockedUserIds(authorization.user.id);
    const rows = await prisma.communityComment.findMany({ where: { postId: id, authorId: { notIn: blocked } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: input.limit + 1, ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}), include: commentInclude });
    const hasMore = rows.length > input.limit; const items = rows.slice(0, input.limit);
    return NextResponse.json({ data: { items: items.map(commentDTO), nextCursor: hasMore ? items.at(-1)?.id : null } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return communityError(error); }
}
export async function POST(request: Request, context: Context) {
  const authorization = await requireRole(['STUDENT']); if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const { id } = await context.params; const post = await accessiblePost(authorization.user, id);
    const member = await communityMembership(authorization.user.id, post.communityId);
    const input = inputSchema.parse(await request.json());
    const comment = await prisma.$transaction(async tx => {
      const saved = await tx.communityComment.create({ data: { postId: id, authorId: authorization.user.id, ...input,
        authorStatus: member.status, authorUniversity: member.targetOrCurrentUniversity, authorVerified: member.isVerified,
        isSeniorAnswer: member.isSeniorMentor && member.isVerified && member.status !== 'INCOMING_STUDENT' }, include: commentInclude });
      await tx.communityPost.update({ where: { id }, data: { commentsCount: { increment: 1 } } });
      return saved;
    });
    return NextResponse.json({ data: commentDTO(comment) }, { status: 201 });
  } catch (error) { return communityError(error); }
}
