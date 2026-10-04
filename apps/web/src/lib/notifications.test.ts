import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  notification: {
    create: vi.fn(),
    createMany: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { sendNotification, sendNotifications } from './notifications';

describe('Notification Service (sendNotification, sendNotifications)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('persists a notification successfully', async () => {
    mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });

    await sendNotification({
      userId: 'user-123',
      type: 'APPLICATION',
      title: 'Application Update',
      message: 'Your application has progressed to review.',
      entityType: 'APPLICATION',
      entityId: 'app-999',
    });

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        type: 'APPLICATION',
        title: 'Application Update',
        message: 'Your application has progressed to review.',
        entityType: 'APPLICATION',
        entityId: 'app-999',
      },
    });
  });

  it('safely skips if userId is missing', async () => {
    await sendNotification({
      userId: '',
      type: 'SYSTEM',
      title: 'No User',
      message: 'Missing user',
    });

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it('does not throw when database creation fails', async () => {
    mockPrisma.notification.create.mockRejectedValue(new Error('DB disconnect'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      sendNotification({
        userId: 'user-123',
        type: 'SYSTEM',
        title: 'Error Test',
        message: 'Testing error resilience',
      })
    ).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('batches multiple notifications', async () => {
    mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });

    await sendNotifications([
      { userId: 'user-1', type: 'ESCROW', title: 'Funded', message: 'Escrow held' },
      { userId: 'user-2', type: 'ESCROW', title: 'Received', message: 'Payment in escrow' },
    ]);

    expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'user-1', type: 'ESCROW', title: 'Funded', message: 'Escrow held', entityType: null, entityId: null },
        { userId: 'user-2', type: 'ESCROW', title: 'Received', message: 'Payment in escrow', entityType: null, entityId: null },
      ],
    });
  });
});
