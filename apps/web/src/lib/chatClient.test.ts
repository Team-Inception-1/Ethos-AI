import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchChatThreads, fetchThreadMessages, sendChatMessage, ChatApiError } from './chatClient';

afterEach(() => vi.unstubAllGlobals());
describe('chat browser error handling', () => {
  it('surfaces service failure instead of presenting an empty conversation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ error: { message: 'Temporarily unavailable' } }, { status: 503 })));
    await expect(fetchChatThreads()).rejects.toThrow('Temporarily unavailable');
    await expect(fetchThreadMessages('thread')).rejects.toBeInstanceOf(ChatApiError);
  });
  it('sends only message content, never caller-supplied identity', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ message: { id: 'saved' } }));
    vi.stubGlobal('fetch', fetchMock);
    await sendChatMessage({ threadId: 'thread', senderId: 'forged', senderRole: 'ADMIN', body: 'Hello' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ body: 'Hello' });
  });
});
