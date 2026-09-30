import type { Prisma } from '@prisma/client';
import { academicStatus } from './hubs';

export const postInclude = (userId: string) => ({ author: { select: { name: true, avatarUrl: true } }, community: { select: { country: true } },
  likes: { where: { userId }, select: { userId: true } }, _count: { select: { likes: true, comments: true } } }) as const;
type Post = Prisma.CommunityPostGetPayload<{ include: ReturnType<typeof postInclude> }>;
export function postDTO(post: Post) {
  return { id: post.id, countryId: post.communityId, country: post.community.country,
    category: post.category[0] + post.category.slice(1).toLowerCase(), title: post.title, content: post.content,
    authorId: post.isAnonymous ? '' : post.authorId, authorName: post.isAnonymous ? 'Anonymous Student' : post.author.name,
    authorAvatar: post.isAnonymous ? '' : post.author.avatarUrl ?? '', isAnonymous: post.isAnonymous,
    authorStatus: post.isAnonymous ? 'incoming' : academicStatus[post.authorStatus], authorUniversity: post.isAnonymous ? '' : post.authorUniversity ?? '',
    authorVerified: !post.isAnonymous && post.authorVerified, isSeniorAsk: post.isSeniorAsk,
    likesCount: post._count.likes, likedBy: post.likes.map(like => like.userId), commentsCount: post._count.comments,
    createdAt: post.createdAt.toISOString(), pinned: post.isPinned };
}
export const commentInclude = { author: { select: { name: true, avatarUrl: true } } } as const;
type Comment = Prisma.CommunityCommentGetPayload<{ include: typeof commentInclude }>;
export function commentDTO(comment: Comment) {
  return { id: comment.id, postId: comment.postId, content: comment.content,
    authorId: comment.isAnonymous ? '' : comment.authorId, authorName: comment.isAnonymous ? 'Anonymous Student' : comment.author.name,
    authorAvatar: comment.isAnonymous ? '' : comment.author.avatarUrl ?? '', isAnonymous: comment.isAnonymous,
    authorStatus: comment.isAnonymous ? 'incoming' : academicStatus[comment.authorStatus],
    authorUniversity: comment.isAnonymous ? '' : comment.authorUniversity ?? '', authorVerified: !comment.isAnonymous && comment.authorVerified,
    isSeniorAnswer: !comment.isAnonymous && comment.isSeniorAnswer, createdAt: comment.createdAt.toISOString() };
}
