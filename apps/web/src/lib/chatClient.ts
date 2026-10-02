export interface ChatThreadSummary {
  id: string;
  applicationId: string;
  agencyId: string;
  agencyName: string;
  studentName: string;
  targetUniversity: string;
  targetCountry: string;
  lastMessage: { text: string; time: string; senderRole: string } | null;
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
  status?: 'sending' | 'sent' | 'failed';
  error?: string;
}
export interface ChatTranscript {
  threadId: string;
  exportedAt: string;
  digest: string;
  transcript: ChatMessageItem[];
}
export class ChatApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ChatApiError';
  }
}
async function read<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (!response.ok) {
    throw new ChatApiError(typeof payload.error?.message === 'string' ? payload.error.message : 'Chat request failed.', response.status);
  }
  return payload;
}
// Retain positional arguments while older callers migrate; identity always comes from the session.
export async function fetchChatThreads(userId?: string, role?: string): Promise<ChatThreadSummary[]> {
  void userId; void role;
  const data = await read<{ threads: ChatThreadSummary[] }>(await fetch('/api/chat/threads', { cache: 'no-store' }));
  return data.threads;
}
export async function fetchThreadMessages(threadId: string, before?: string): Promise<{
  thread: { id: string; applicationId: string; agencyId: string };
  messages: ChatMessageItem[];
  nextCursor?: string | null;
  total?: number;
}> {
  const query = before ? `?before=${encodeURIComponent(before)}` : '';
  return read(await fetch(`/api/chat/threads/${encodeURIComponent(threadId)}/messages${query}`, { cache: 'no-store' }));
}
export async function createChatThread(applicationId: string): Promise<ChatThreadSummary> {
  const data = await read<{ thread: ChatThreadSummary }>(await fetch('/api/chat/threads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId }),
  }));
  return data.thread;
}
export async function sendChatMessage(params: {
  threadId: string; senderId: string; senderRole: string; body: string; attachmentDocId?: string;
}): Promise<ChatMessageItem> {
  const data = await read<{ message: ChatMessageItem }>(await fetch(`/api/chat/threads/${encodeURIComponent(params.threadId)}/messages`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: params.body, attachmentDocId: params.attachmentDocId }),
  }));
  return data.message;
}
export async function exportDisputeTranscript(threadId: string): Promise<ChatTranscript> {
  return read(await fetch(`/api/chat/threads/${encodeURIComponent(threadId)}/export`, { cache: 'no-store' }));
}
