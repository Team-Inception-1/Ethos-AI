import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { accessiblePost, communityError } from '@/lib/community/access';
import { apiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';
type Context = { params: Promise<{ id: string }> };
async function setLike(request: Request, context: Context, liked: boolean) {
  const authorization = await requireRole(['STUDENT']); if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const { id } = await context.params; await accessiblePost(authorization.user, id);
    const count = await prisma.$transaction(async tx => {
      // Serialize mutations of this post so the materialized counter cannot race.
      await tx.$queryRaw`SELECT "id" FROM "CommunityPost" WHERE "id" = ${id} FOR UPDATE`;
      if (liked) await tx.communityPostLike.upsert({ where: { postId_userId: { postId: id, userId: authorization.user.id } }, update: {}, create: { postId: id, userId: authorization.user.id } });
      else await tx.communityPostLike.deleteMany({ where: { postId: id, userId: authorization.user.id } });
      const likesCount = await tx.communityPostLike.count({ where: { postId: id } });
      await tx.communityPost.update({ where: { id }, data: { likesCount } });
      return likesCount;
    }, { maxWait: 10000, timeout: 20000 });
    return NextResponse.json({ data: { isLiked: liked, likesCount: count } });
  } catch (error) { return communityError(error); }
}
export const POST = (request: Request, context: Context) => setLike(request, context, true);
export const DELETE = (request: Request, context: Context) => setLike(request, context, false);
