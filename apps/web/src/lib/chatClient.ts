/**
 * Ethos AI — Real-Time Chat Client
 * Aligned with Module 5.12 & Issue #17 (K-16)
 *
 * Provides typed methods for interacting with chat threads, real-time message streams,
 * and immutable dispute evidence exports.
 */

export interface ChatThreadSummary {
  id: string;
  applicationId: string;
  agencyId: string;
  agencyName: string;
  studentName: string;
  targetUniversity: string;
  targetCountry: string;
  lastMessage: {
    text: string;
    time: string;
    senderRole: string;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageItem {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: 'STUDENT' | 'PARENT' | 'AGENCY' | 'ADMIN';
  body: string;
  attachmentDocId?: string | null;
  msgHash: string;
  isRead: boolean;
  sentAt: string;
}

export class ChatApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
  }
}

/** Fetch all chat threads for the current user */
export async function fetchChatThreads(
  userId: string = 'usr-student-01',
  role: string = 'STUDENT'
): Promise<ChatThreadSummary[]> {
  try {
    const res = await fetch(`/api/chat/threads?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.threads || [];
  } catch (err) {
    console.warn('Failed to fetch from /api/chat/threads, falling back to local client state:', err);
    return [];
  }
}

/** Fetch all messages in a specific thread */
export async function fetchThreadMessages(
  threadId: string
): Promise<{ thread: any; messages: ChatMessageItem[] }> {
  try {
    const res = await fetch(`/api/chat/threads/${encodeURIComponent(threadId)}/messages`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      thread: data.thread,
      messages: data.messages || [],
    };
  } catch (err) {
    console.warn(`Failed to fetch messages for thread ${threadId}:`, err);
    return { thread: null, messages: [] };
  }
}

/** Send a message to a thread */
export async function sendChatMessage(params: {
  threadId: string;
  senderId: string;
  senderRole: string;
  body: string;
  attachmentDocId?: string;
}): Promise<ChatMessageItem> {
  const res = await fetch(`/api/chat/threads/${encodeURIComponent(params.threadId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new ChatApiError('Failed to send chat message', res.status);
  }

  const data = await res.json();
  return data.message;
}

/** Export dispute transcript for evidence in grievance hearings */
export async function exportDisputeTranscript(threadId: string): Promise<any> {
  const res = await fetch(`/api/chat/threads/${encodeURIComponent(threadId)}/export`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new ChatApiError('Failed to export dispute transcript', res.status);
  }

  return res.json();
}
