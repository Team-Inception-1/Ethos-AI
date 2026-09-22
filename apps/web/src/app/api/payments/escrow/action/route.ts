import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, milestoneId, actorId = 'usr-student-01', provider = 'BKASH', reason = '', note = '' } = body;

    if (!action || !milestoneId) {
      return NextResponse.json(
        { error: 'action and milestoneId are required' },
        { status: 400 }
      );
    }

    if (action === 'deposit') {
      const result = db.depositEscrow({
        milestoneId,
        actorId,
        provider,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'release') {
      const result = db.releaseEscrow({
        milestoneId,
        actorId,
        note,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'dispute') {
      const result = db.disputeEscrow({
        milestoneId,
        actorId,
        reason: reason || 'Dispute raised by student for milestone non-performance',
      });
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Error executing escrow action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process escrow action' },
      { status: 500 }
    );
  }
}
