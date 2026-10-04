import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAuth = vi.hoisted(() => ({
  user: vi.fn(),
}));

const mockPrisma = vi.hoisted(() => ({
  notification: {
    findMany: vi.fn(),
    createMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('@/lib/auth/authorization', () => ({
  requireUser: mockAuth.user,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from '@/app/api/notifications/route';

describe('Notifications API (/api/notifications)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuth.user.mockResolvedValue({
      user: { id: 'test-user-id', role: 'STUDENT', email: 'student@example.test', name: 'Test Student' },
      response: null,
    });
  });

  it('rejects unauthenticated requests on GET', async () => {
    mockAuth.user.mockResolvedValue({
      user: null,
      response: new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED' } }), { status: 401 }),
    });

    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockPrisma.notification.findMany).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated requests on POST', async () => {
    mockAuth.user.mockResolvedValue({
      user: null,
      response: new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED' } }), { status: 401 }),
    });

    const req = new Request('http://localhost:3000/api/notifications', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects cross-origin mutations on POST', async () => {
    const req = new Request('http://localhost:3000/api/notifications', {
      method: 'POST',
      headers: { origin: 'https://malicious-site.example', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(mockPrisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it('returns empty notifications list without seeding defaults if database has no notifications for user', async () => {
    mockPrisma.notification.findMany.mockResolvedValueOnce([]);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
    expect(data.notifications).toHaveLength(0);
    expect(data.unreadCount).toBe(0);
  });

  it('returns real notifications from database when available', async () => {
    mockPrisma.notification.findMany.mockResolvedValueOnce([
      {
        id: 'notif-1',
        userId: 'test-user-id',
        type: 'APPLICATION',
        title: 'Application Confirmed',
        message: 'Your application has been confirmed.',
        entityType: 'APPLICATION',
        entityId: 'app-1',
        readAt: null,
        createdAt: new Date(),
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.notifications).toHaveLength(1);
    expect(data.notifications[0].title).toBe('Application Confirmed');
    expect(data.notifications[0].read).toBe(false);
    expect(data.unreadCount).toBe(1);
  });

  it('marks a single notification as read', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

    const req = new Request('http://localhost:3000/api/notifications', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', id: 'notif-123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notif-123', userId: 'test-user-id' },
      data: { readAt: expect.any(Date) },
    });
  });

  it('marks all notifications as read', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

    const req = new Request('http://localhost:3000/api/notifications', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.markedCount).toBe(3);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});
