import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(), canAccessDocument: vi.fn(),
  chatThread: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  chatMessage: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
  document: { findFirst: vi.fn() },
}));
vi.mock('@/lib/auth/authorization', () => ({ requireUser: mocks.requireUser,
  forbiddenResponse: () => Response.json({ error: { code: 'FORBIDDEN' } }, { status: 403 }),
}));
vi.mock('@/lib/auth/relationships', () => ({ canAccessDocument: mocks.canAccessDocument,
  applicationAccessWhere: (user: { id: string }) => ({ studentId: user.id }),
}));
vi.mock('@/lib/prisma', () => ({ prisma: { ...mocks, $transaction: (fn: (tx: typeof mocks) => unknown) => fn(mocks) } }));

import { GET, POST } from '@/app/api/chat/threads/[id]/messages/route';
import { GET as exportGet } from '@/app/api/chat/threads/[id]/export/route';
import { GET as threadsGet } from '@/app/api/chat/threads/route';

const context = { params: Promise.resolve({ id: 'thread' }) };
const post = (body: unknown) => new Request('http://localhost/api/chat/threads/thread/messages', {
  method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'http://localhost' }, body: JSON.stringify(body),
});
beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: 'student', role: 'STUDENT' }, response: null });
  mocks.chatThread.findFirst.mockResolvedValue({ id: 'thread', applicationId: 'application' });
  mocks.chatMessage.count.mockResolvedValue(0);
});
describe('application chat persistence and evidence', () => {
  it('scopes conversation access to the authenticated participant before reading messages', async () => {
    mocks.chatThread.findFirst.mockResolvedValue(null);
    const response = await GET(new Request('http://localhost/messages'), context);
    expect(response.status).toBe(403);
    expect(mocks.chatThread.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'thread', application: { studentId: 'student' } },
    }));
    expect(mocks.chatMessage.findMany).not.toHaveBeenCalled();
  });
  it('derives sender identity and role from session and persists message plus thread activity together', async () => {
    mocks.chatMessage.create.mockResolvedValue({ id: 'message' });
    const response = await POST(post({ body: 'Hello', senderId: 'admin', senderRole: 'ADMIN' }), context);
    expect(response.status).toBe(201);
    expect(mocks.chatMessage.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      body: 'Hello', threadId: 'thread', senderId: 'student', senderRole: 'STUDENT', msgHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }) });
    expect(mocks.chatThread.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'thread' } }));
  });
  it('refuses attaching a document from another application even if the sender owns it', async () => {
    mocks.canAccessDocument.mockResolvedValue(true);
    mocks.document.findFirst.mockResolvedValue(null);
    const response = await POST(post({ body: 'Attachment', attachmentDocId: 'private-other-application' }), context);
    expect(response.status).toBe(403);
    expect(mocks.document.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: {
      id: 'private-other-application', applicationId: 'application',
    } }));
    expect(mocks.chatMessage.create).not.toHaveBeenCalled();
  });
  it('does not accept inaccessible attachment documents', async () => {
    mocks.canAccessDocument.mockResolvedValue(false);
    expect((await POST(post({ body: 'Attachment', attachmentDocId: 'secret' }), context)).status).toBe(403);
    expect(mocks.document.findFirst).not.toHaveBeenCalled();
    expect(mocks.chatMessage.create).not.toHaveBeenCalled();
  });
  it('returns the latest page in chronological order with a truthful older-message cursor', async () => {
    const rows = Array.from({ length: 201 }, (_, i) => ({ id: `message-${201 - i}` }));
    mocks.chatMessage.findMany.mockResolvedValue(rows);
    mocks.chatMessage.count.mockResolvedValue(250);
    const response = await GET(new Request('http://localhost/messages'), context);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.messages).toHaveLength(200);
    expect(data.messages[0].id).toBe('message-2');
    expect(data.messages[199].id).toBe('message-201');
    expect(data.nextCursor).toBe('message-2');
    expect(data.total).toBe(250);
  });
  it('rejects pagination anchors from another conversation', async () => {
    mocks.chatMessage.findFirst.mockResolvedValue(null);
    const response = await GET(new Request('http://localhost/messages?before=other-thread-message'), context);
    expect(response.status).toBe(404);
    expect(mocks.chatMessage.findMany).not.toHaveBeenCalled();
  });
  it('exports actual stored messages with an integrity digest and no invented certification', async () => {
    const messages = [{ id: 'message', body: 'Persisted message', sentAt: new Date('2026-01-01') }];
    mocks.chatThread.findFirst.mockResolvedValue({ id: 'thread', messages });
    const response = await exportGet(new Request('http://localhost/export'), context);
    const data = await response.json();
    expect(data.transcript[0].body).toBe('Persisted message');
    expect(data.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(data)).not.toContain('CERTIFIED');
    expect(data.auditSignature).toBeUndefined();
  });
  it('returns actual empty thread state', async () => {
    mocks.chatThread.findMany.mockResolvedValue([]);
    const response = await threadsGet();
    expect(await response.json()).toMatchObject({ data: { threads: [] }, threads: [] });
  });
});
