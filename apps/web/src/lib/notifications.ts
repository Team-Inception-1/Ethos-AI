import { prisma } from '@/lib/prisma';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
}

/**
 * Persists a notification for a user in the database.
 * Wrapped in a fail-safe catch block so notification delivery never aborts or rolls back primary business transactions.
 */
export async function sendNotification(input: CreateNotificationInput): Promise<void> {
  try {
    if (!input.userId) return;
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
    });
  } catch (error) {
    // Non-blocking: fail-safe logging so notifications never crash core transactions
    console.error('[NotificationService] Failed to send notification:', error);
  }
}

/**
 * Persists multiple notifications in a single batch.
 */
export async function sendNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  try {
    const validInputs = inputs.filter((i) => !!i.userId);
    if (validInputs.length === 0) return;
    await prisma.notification.createMany({
      data: validInputs.map((input) => ({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      })),
    });
  } catch (error) {
    console.error('[NotificationService] Failed to send batch notifications:', error);
  }
}
