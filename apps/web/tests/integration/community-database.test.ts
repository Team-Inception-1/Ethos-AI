import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), cookie: vi.fn() }));
vi.mock('@/lib/auth/server', () => ({ auth: { getSession: mocks.session } }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.cookie, delete: vi.fn() }) }));
import { POST as provision } from '@/app/api/registration/complete/route';
import { POST as join } from '@/app/api/community/hubs/[id]/membership/route';
import { POST as post, GET as feed } from '@/app/api/community/posts/route';
import { POST as comment } from '@/app/api/community/posts/[id]/comments/route';
import { POST as like, DELETE as unlike } from '@/app/api/community/posts/[id]/like/route';
import { sealRegistration } from '@/lib/auth/registration';
import { POST as openThread } from '@/app/api/community/messages/threads/route';
import { POST as sendMessage, GET as readMessages } from '@/app/api/community/messages/threads/[id]/messages/route';
import { POST as report } from '@/app/api/community/reports/route';
import { POST as block } from '@/app/api/community/blocks/route';

const enabled = process.env.RUN_DATABASE_TESTS === 'true' || process.env.RUN_NEON_STABILIZATION_TESTS === 'true';
if (enabled) {
  const url = new URL(process.env.DATABASE_URL ?? '');
  const local = ['localhost', '127.0.0.1', 'postgres'].includes(url.hostname) && url.pathname === '/ethos_test';
  const isolated = process.env.RUN_NEON_STABILIZATION_TESTS === 'true' && url.hostname === 'ep-weathered-shadow-axeh7rga-pooler.c-4.us-east-2.aws.neon.tech' && url.pathname === '/neondb';
  if (process.env.NODE_ENV !== 'test' || (!local && !isolated)) throw new Error('Community integration tests refuse any unapproved/live database.');
}
const db = new PrismaClient();
const studentId = 'stabilization-test-' + randomUUID();
const hubId = 'stabilization-test-hub-' + randomUUID();
const email = studentId + '@example.test';
const peerId = 'stabilization-test-peer-' + randomUUID();
const secret = 'test-only-cookie-secret-at-least-32-characters';
const request = (path: string, body?: unknown) => new Request('http://localhost:3000/api/' + path, {
  method: body === undefined ? 'GET' : 'POST', headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
describe.skipIf(!enabled)('real PostgreSQL registration/community workflow', () => {
  beforeAll(async () => {
    vi.stubEnv('NEON_AUTH_COOKIE_SECRET', secret);
    mocks.session.mockResolvedValue({ data: { user: { id: studentId, email, emailVerified: true } } });
    mocks.cookie.mockReturnValue({ value: sealRegistration({ name: 'Integration Student', email, phone: '+' + String(Date.now()).slice(-12), role: 'student', accountId: studentId, expiresAt: Date.now() + 60000 }, secret) });
    await db.countryCommunity.create({ data: { id: hubId, country: hubId, countryCode: 'TEST', flagEmoji: '🏳' } });
  });
  afterAll(async () => {
    // Delete only uniquely created test fixtures, never existing users or hubs.
    await db.countryCommunity.deleteMany({ where: { id: hubId } });
    await db.user.deleteMany({ where: { id: { in: [studentId, peerId] } } });
    await db.$disconnect();
  });
  it('provisions a verified student, joins idempotently, persists an anonymous post/comment, and serializes repeated concurrent likes', async () => {
    vi.stubEnv('NEON_AUTH_COOKIE_SECRET', secret);
    expect((await provision(request('registration/complete', { role: 'ADMIN' }))).status).toBe(201);
    const hubContext = { params: Promise.resolve({ id: hubId }) };
    expect((await join(request('community/hubs/' + hubId + '/membership', {}), hubContext)).status).toBe(200);
    expect((await join(request('community/hubs/' + hubId + '/membership', {}), hubContext)).status).toBe(200);
    expect(await db.studentCommunityMembership.count({ where: { userId: studentId, communityId: hubId } })).toBe(1);
    const created = await post(request('community/posts', { countryId: hubId, title: 'Persistent question', content: 'Real database body', isAnonymous: true, authorId: 'forged' }));
    expect(created.status).toBe(201); const postId = (await created.json()).data.id;
    expect((await db.communityPost.findUniqueOrThrow({ where: { id: postId } })).authorId).toBe(studentId);
    const postContext = { params: Promise.resolve({ id: postId }) };
    expect((await comment(request('community/posts/' + postId + '/comments', { content: 'Persisted reply' }), postContext)).status).toBe(201);
    const responses = await Promise.all(Array.from({ length: 3 }, () => like(request('community/posts/' + postId + '/like', {}), postContext)));
    expect(responses.map(response => response.status)).toEqual([200, 200, 200]);
    expect(await db.communityPostLike.count({ where: { postId } })).toBe(1);
    expect((await db.communityPost.findUniqueOrThrow({ where: { id: postId } })).likesCount).toBe(1);
    expect((await unlike(request('community/posts/' + postId + '/like', {}), postContext)).status).toBe(200);
    expect((await unlike(request('community/posts/' + postId + '/like', {}), postContext)).status).toBe(200);
    const result = await feed(request('community/posts?hubId=' + hubId)); expect(result.status).toBe(200);
    const dto = (await result.json()).data.items[0]; expect(dto).toMatchObject({ authorId: '', authorName: 'Anonymous Student', likesCount: 0, commentsCount: 1 });
    expect(await db.user.count({ where: { id: studentId, role: 'STUDENT' } })).toBe(1);
    await db.user.create({ data: { id: peerId, name: 'Integration Peer', email: peerId + '@example.test', phone: 'integration:' + peerId, role: 'STUDENT' } });
    await db.studentCommunityMembership.create({ data: { userId: peerId, communityId: hubId } });
    const opened = await openThread(request('community/messages/threads', { targetId: peerId }));
    expect(opened.status).toBe(201); const threadId = (await opened.json()).data.id;
    const threadContext = { params: Promise.resolve({ id: threadId }) };
    expect((await sendMessage(request('community/messages', { content: 'Persisted hello', senderId: 'forged' }), threadContext)).status).toBe(201);
    expect(await db.peerMessage.count({ where: { threadId, senderId: studentId } })).toBe(1);
    expect((await readMessages(request('community/messages'), threadContext)).status).toBe(200);
    const reportRequest = () => request('community/reports', { targetType: 'post', targetId: postId, reason: 'Test moderation' });
    expect((await report(reportRequest())).status).toBe(201); expect((await report(reportRequest())).status).toBe(201);
    expect(await db.communityReport.count({ where: { reporterId: studentId, postId } })).toBe(1);
    expect((await block(request('community/blocks', { targetId: peerId }))).status).toBe(200);
    expect((await block(request('community/blocks', { targetId: peerId }))).status).toBe(200);
    expect(await db.userBlock.count({ where: { blockerId: studentId, blockedUserId: peerId } })).toBe(1);
    expect((await sendMessage(request('community/messages', { content: 'Blocked' }), threadContext)).status).toBe(403);
    mocks.session.mockResolvedValue({ data: { user: { id: peerId, email: peerId + '@example.test', emailVerified: true } } });
    expect((await readMessages(request('community/messages'), threadContext)).status).toBe(403);
    mocks.session.mockResolvedValue({ data: { user: { id: 'outsider', email: 'outsider@example.test', emailVerified: true } } });
    expect((await readMessages(request('community/messages'), threadContext)).status).toBe(401);
  }, 120000);
});
