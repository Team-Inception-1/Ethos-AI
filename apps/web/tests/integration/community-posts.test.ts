import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), member: vi.fn(), blocks: vi.fn(), post: vi.fn(), posts: vi.fn(), create: vi.fn(), updateHub: vi.fn(), comments: vi.fn(), createComment: vi.fn(), updatePost: vi.fn(), like: vi.fn(), unlike: vi.fn(), countLikes: vi.fn(), lock: vi.fn() }));
vi.mock('@/lib/auth/authorization', () => ({ requireUser: mocks.authorize, requireRole: mocks.authorize }));
vi.mock('@/lib/prisma', () => {
  const tx = { communityPost: { create: mocks.create, update: mocks.updatePost }, countryCommunity: { update: mocks.updateHub }, communityComment: { create: mocks.createComment }, communityPostLike: { upsert: mocks.like, deleteMany: mocks.unlike, count: mocks.countLikes }, $queryRaw: mocks.lock };
  return { prisma: { ...tx, studentCommunityMembership: { findUnique: mocks.member }, userBlock: { findMany: mocks.blocks },
    communityPost: { ...tx.communityPost, findUnique: mocks.post, findMany: mocks.posts }, communityComment: { ...tx.communityComment, findMany: mocks.comments }, $transaction: async (action: (value: typeof tx) => unknown) => action(tx) } };
});
import { GET, POST } from '@/app/api/community/posts/route';
import { POST as comment } from '@/app/api/community/posts/[id]/comments/route';
import { POST as like, DELETE as unlike } from '@/app/api/community/posts/[id]/like/route';
const fixture = { id: 'post', communityId: 'hub-germany', authorId: 'real-author', title: 'Question', content: 'Advice', category: 'HELP', isAnonymous: true,
  authorStatus: 'CURRENT_STUDENT', authorUniversity: 'Private University', authorVerified: true, isSeniorAsk: false, isPinned: false, createdAt: new Date(),
  author: { name: 'Private Name', avatarUrl: 'private.jpg' }, community: { country: 'Germany' }, likes: [], _count: { likes: 2, comments: 3 } };
const request = (body: unknown = {}) => new Request('http://localhost:3000/api/community/posts', { method: 'POST', headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const context = { params: Promise.resolve({ id: 'post' }) };
beforeEach(() => {
  vi.resetAllMocks(); mocks.authorize.mockResolvedValue({ user: { id: 'student', role: 'STUDENT' }, response: null });
  mocks.member.mockResolvedValue({ status: 'INCOMING_STUDENT', isVerified: false, targetOrCurrentUniversity: null, isSeniorMentor: false });
  mocks.blocks.mockResolvedValue([]); mocks.post.mockResolvedValue(fixture); mocks.posts.mockResolvedValue([fixture]); mocks.create.mockResolvedValue(fixture); mocks.countLikes.mockResolvedValue(2);
});
describe('persistent community posts', () => {
  it('requires membership for reads and writes', async () => {
    mocks.member.mockResolvedValue(null);
    expect((await GET(new Request('http://localhost:3000/api/community/posts?hubId=hub-germany'))).status).toBe(403);
    expect((await POST(request({ countryId: 'hub-germany', title: 'Question', content: 'Advice' }))).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('stores real session author, derives status and verification, but hides all anonymous identity', async () => {
    const response = await POST(request({ countryId: 'hub-germany', title: 'Question', content: 'Advice', isAnonymous: true,
      authorId: 'admin', authorStatus: 'ALUMNI', authorVerified: true, pinned: true }));
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ authorId: 'student', authorStatus: 'INCOMING_STUDENT', authorVerified: false }) }));
    const dto = (await response.json()).data;
    expect(dto).toMatchObject({ authorId: '', authorName: 'Anonymous Student', authorUniversity: '', authorAvatar: '', authorVerified: false, likesCount: 2, commentsCount: 3 });
    expect(JSON.stringify(dto)).not.toContain('real-author'); expect(JSON.stringify(dto)).not.toContain('Private Name');
  });
  it('applies country/category/search/block filters and bounded cursor pagination server-side', async () => {
    mocks.blocks.mockResolvedValue([{ blockerId: 'student', blockedUserId: 'blocked' }]);
    expect((await GET(new Request('http://localhost:3000/api/community/posts?hubId=hub-germany&category=Visa&query=visa&seniorOnly=true&limit=10&cursor=last'))).status).toBe(200);
    expect(mocks.posts).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ communityId: 'hub-germany', category: 'VISA', isSeniorAsk: true, authorId: { notIn: ['blocked'] } }), cursor: { id: 'last' }, skip: 1, take: 11 }));
    expect((await GET(new Request('http://localhost:3000/api/community/posts?hubId=hub-germany&limit=9999'))).status).toBe(400);
  });
  it('prevents comments or likes on a blocked author', async () => {
    mocks.blocks.mockResolvedValue([{ blockerId: 'real-author', blockedUserId: 'student' }]);
    expect((await comment(request({ content: 'Reply' }), context)).status).toBe(404);
    expect((await like(request(), context)).status).toBe(404); expect(mocks.like).not.toHaveBeenCalled();
  });
  it('uses idempotent locked like/unlike operations and database-derived counts', async () => {
    expect((await like(request(), context)).status).toBe(200);
    expect(mocks.lock).toHaveBeenCalled(); expect(mocks.like).toHaveBeenCalledWith(expect.objectContaining({ where: { postId_userId: { postId: 'post', userId: 'student' } }, update: {} }));
    expect((await unlike(request(), context)).status).toBe(200);
    expect(mocks.unlike).toHaveBeenCalledWith({ where: { postId: 'post', userId: 'student' } });
    expect(mocks.updatePost).toHaveBeenLastCalledWith({ where: { id: 'post' }, data: { likesCount: 2 } });
  });
});
