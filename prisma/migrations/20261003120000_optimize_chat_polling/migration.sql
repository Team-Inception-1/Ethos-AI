-- Support chronological delta polling without scanning every message in a thread.
CREATE INDEX IF NOT EXISTS "ChatMessage_threadId_sentAt_id_idx"
ON "ChatMessage"("threadId", "sentAt", "id");

-- Support unread-message updates performed after each delta response.
CREATE INDEX IF NOT EXISTS "ChatMessage_threadId_isRead_senderId_idx"
ON "ChatMessage"("threadId", "isRead", "senderId");
