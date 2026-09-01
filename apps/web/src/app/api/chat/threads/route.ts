import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/chat/threads
 * Returns all active chat threads for the current user.
 * Query params:
 *   - userId (optional, defaults to demo student 'usr-student-01')
 *   - role (optional, 'STUDENT' | 'AGENCY' | 'PARENT')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'usr-student-01';
    const role = searchParams.get('role') || 'STUDENT';

    const threads = db.getChatThreads(userId, role);
    return NextResponse.json({ threads });
  } catch (error) {
    console.error('Error fetching chat threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat threads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/threads
 * Creates or retrieves a chat thread for an application.
 * Body: { applicationId: string, agencyId: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, agencyId } = body;

    if (!applicationId || !agencyId) {
      return NextResponse.json(
        { error: 'applicationId and agencyId are required' },
        { status: 400 }
      );
    }

    const thread = db.createChatThread(applicationId, agencyId);
    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat thread:', error);
    return NextResponse.json(
      { error: 'Failed to create chat thread' },
      { status: 500 }
    );
  }
}
