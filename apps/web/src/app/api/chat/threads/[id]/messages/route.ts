import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/chat/threads/[id]/messages
 * Fetches message history for a specific thread.
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const messages = db.getMessagesByThread(id);
    const thread = db.getThreadById(id);

    return NextResponse.json({
      threadId: id,
      thread,
      messages,
      total: messages.length,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/threads/[id]/messages
 * Sends a message in a specific chat thread.
 * Body: { senderId: string, senderRole: string, body: string, attachmentDocId?: string }
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await props.params;
    const body = await request.json();
    const { senderId, senderRole, body: msgBody, attachmentDocId } = body;

    if (!senderId || !msgBody?.trim()) {
      return NextResponse.json(
        { error: 'senderId and message body are required' },
        { status: 400 }
      );
    }

    const message = db.createChatMessage({
      threadId,
      senderId,
      senderRole: (senderRole || 'STUDENT') as 'STUDENT' | 'PARENT' | 'AGENCY' | 'ADMIN',
      body: msgBody.trim(),
      attachmentDocId,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
