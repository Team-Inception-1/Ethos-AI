import { prisma } from '@/lib/prisma';
import type { AuthenticatedUser } from '@/lib/auth/authorization';
import { apiError, handleApiError } from '@/lib/api/response';

export class CommunityError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}
export const communityError = (error: unknown) => error instanceof CommunityError
  ? apiError(error.code, error.message, error.status) : handleApiError(error);

export async function communityMembership(userId: string, communityId: string) {
  const member = await prisma.studentCommunityMembership.findUnique({ where: { userId_communityId: { userId, communityId } } });
  if (!member) throw new CommunityError('MEMBERSHIP_REQUIRED', 'Join this country hub first.', 403);
  return member;
}
export async function blockedUserIds(userId: string) {
  const blocks = await prisma.userBlock.findMany({ where: { OR: [{ blockerId: userId }, { blockedUserId: userId }] } });
  return blocks.map(block => block.blockerId === userId ? block.blockedUserId : block.blockerId);
}
export async function accessiblePost(user: AuthenticatedUser, postId: string) {
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) throw new CommunityError('NOT_FOUND', 'Post not found.', 404);
  if ((await blockedUserIds(user.id)).includes(post.authorId)) throw new CommunityError('NOT_FOUND', 'Post not found.', 404);
  if (user.role !== 'ADMIN') await communityMembership(user.id, post.communityId);
  return post;
}
