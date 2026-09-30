import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { blockedUserIds, CommunityError } from './access';
export const messageInclude = { sender: { select: { name: true } } } as const;
export const threadInclude = { messages: { take: 50, orderBy: { sentAt: 'desc' }, include: messageInclude } } as const;
export function messageDTO(message: Prisma.PeerMessageGetPayload<{ include: typeof messageInclude }>) {
  return { id: message.id, senderId: message.senderId, senderName: message.sender.name, content: message.content, timestamp: message.sentAt.toISOString() };
}
export function threadDTO(thread: Prisma.PeerMessageThreadGetPayload<{ include: typeof threadInclude }>) {
  return { id: thread.id, threadId: thread.id, participantIds: [thread.firstUserId, thread.secondUserId], messages: [...thread.messages].reverse().map(messageDTO) };
}
export async function accessibleThread(userId: string, threadId: string) {
  const thread = await prisma.peerMessageThread.findUnique({ where: { id: threadId } });
  if (!thread || ![thread.firstUserId, thread.secondUserId].includes(userId)) throw new CommunityError('NOT_FOUND', 'Message thread not found.', 404);
  const other = thread.firstUserId === userId ? thread.secondUserId : thread.firstUserId;
  if ((await blockedUserIds(userId)).includes(other)) throw new CommunityError('MESSAGING_BLOCKED', 'Messaging is unavailable for a blocked participant.', 403);
  return thread;
}
