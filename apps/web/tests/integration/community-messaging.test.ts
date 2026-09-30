import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), blocks: vi.fn(), user: vi.fn(), shared: vi.fn(), thread: vi.fn(), upsertThread: vi.fn(), messages: vi.fn(), createMessage: vi.fn(), updateThread: vi.fn(), upsertBlock: vi.fn(), removeBlock: vi.fn() }));
vi.mock('@/lib/auth/authorization', () => ({ requireRole: mocks.authorize, requireUser: mocks.authorize }));
vi.mock('@/lib/prisma', () => {
  const tx = { peerMessage: { create: mocks.createMessage }, peerMessageThread: { update: mocks.updateThread } };
  return { prisma: { userBlock: { findMany: mocks.blocks, upsert: mocks.upsertBlock, deleteMany: mocks.removeBlock }, user: { findUnique: mocks.user },
    studentCommunityMembership: { findFirst: mocks.shared }, peerMessageThread: { ...tx.peerMessageThread, findUnique: mocks.thread, upsert: mocks.upsertThread },
    peerMessage: { ...tx.peerMessage, findMany: mocks.messages }, $transaction: async (action: (value: typeof tx) => unknown) => action(tx) } };
});
import { POST as open } from '@/app/api/community/messages/threads/route';
import { GET, POST as send } from '@/app/api/community/messages/threads/[id]/messages/route';
import { POST as block, DELETE as unblock } from '@/app/api/community/blocks/route';
const request = (body: unknown = {}) => new Request('http://localhost:3000/api/community/messages', { method: 'POST', headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const fixture = { id: 'thread', firstUserId: 'student', secondUserId: 'target', messages: [] };
const context = { params: Promise.resolve({ id: 'thread' }) };
beforeEach(() => {
  vi.resetAllMocks(); mocks.authorize.mockResolvedValue({ user: { id: 'student', role: 'STUDENT' }, response: null });
  mocks.blocks.mockResolvedValue([]); mocks.user.mockResolvedValue({ id: 'target', role: 'STUDENT' }); mocks.shared.mockResolvedValue({ id: 'shared' });
  mocks.thread.mockResolvedValue(null); mocks.upsertThread.mockResolvedValue(fixture); mocks.messages.mockResolvedValue([]);
  mocks.createMessage.mockResolvedValue({ id: 'message', senderId: 'student', sender: { name: 'Student' }, content: 'Hello', sentAt: new Date() });
});
describe('persistent participant-only peer messaging', () => {
  it('prevents self-messaging, nonshared contact and mutual blocks', async () => {
    expect((await open(request({ targetId: 'student' }))).status).toBe(400);
    mocks.shared.mockResolvedValue(null); expect((await open(request({ targetId: 'target' }))).status).toBe(403);
    mocks.blocks.mockResolvedValue([{ blockerId: 'target', blockedUserId: 'student' }]); expect((await open(request({ targetId: 'target' }))).status).toBe(403);
    expect(mocks.upsertThread).not.toHaveBeenCalled();
  });
  it('uses a unique sorted participant pair, never caller-specified sender identity', async () => {
    expect((await open(request({ targetId: 'target', firstUserId: 'attacker' }))).status).toBe(201);
    expect(mocks.upsertThread).toHaveBeenCalledWith(expect.objectContaining({ create: { firstUserId: 'student', secondUserId: 'target' }, update: {} }));
    mocks.thread.mockResolvedValue(fixture);
    expect((await send(request({ content: 'Hello', senderId: 'admin' }), context)).status).toBe(201);
    expect(mocks.createMessage).toHaveBeenCalledWith(expect.objectContaining({ data: { threadId: 'thread', senderId: 'student', content: 'Hello' } }));
  });
  it('denies outsider reads and writes and blocks existing conversation access', async () => {
    mocks.thread.mockResolvedValue({ ...fixture, firstUserId: 'outsider-one', secondUserId: 'outsider-two' });
    expect((await GET(request(), context)).status).toBe(404); expect((await send(request({ content: 'Forged' }), context)).status).toBe(404);
    mocks.thread.mockResolvedValue(fixture); mocks.blocks.mockResolvedValue([{ blockerId: 'target', blockedUserId: 'student' }]);
    expect((await GET(request(), context)).status).toBe(403); expect(mocks.messages).not.toHaveBeenCalled(); expect(mocks.createMessage).not.toHaveBeenCalled();
  });
  it('persists idempotent own blocks and unblocks without deleting anyone else’s records', async () => {
    expect((await block(request({ targetId: 'target', blockerId: 'admin' }))).status).toBe(200);
    expect(mocks.upsertBlock).toHaveBeenCalledWith(expect.objectContaining({ create: { blockerId: 'student', blockedUserId: 'target' }, update: {} }));
    expect((await unblock(request({ targetId: 'target' }))).status).toBe(200);
    expect(mocks.removeBlock).toHaveBeenCalledWith({ where: { blockerId: 'student', blockedUserId: 'target' } });
    expect((await block(request({ targetId: 'student' }))).status).toBe(400);
  });
});
