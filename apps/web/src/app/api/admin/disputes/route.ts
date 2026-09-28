import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EscrowTransitionError } from '@/lib/escrowStateMachine';

export async function GET() {
  try {
    const disputes = db.getAdminDisputes();
    return NextResponse.json({
      success: true,
      disputes,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/disputes:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { milestoneId, action, reason } = body;

    if (!milestoneId || !action) {
      return NextResponse.json(
        { error: 'milestoneId and action (REFUND or RELEASE) are required' },
        { status: 400 }
      );
    }

    if (!['REFUND', 'RELEASE'].includes(action)) {
      return NextResponse.json(
        { error: `Invalid action '${action}'. Must be REFUND or RELEASE.` },
        { status: 400 }
      );
    }

    const result = db.resolveDispute({
      milestoneId,
      action,
      reason: reason || `Admin resolved dispute in favor of ${action}`,
      actorId: 'usr-admin-01',
    });

    return NextResponse.json({
      success: true,
      action,
      milestone: result.milestone,
      ledgerEntry: result.ledgerEntry,
      message: `Dispute resolved successfully: Milestone marked as ${result.milestone.status}.`,
    });
  } catch (error: any) {
    if (error instanceof EscrowTransitionError) {
      return NextResponse.json(
        { error: error.message, currentStatus: error.currentStatus, targetStatus: error.targetStatus },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/admin/disputes:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to resolve dispute' },
      { status: 500 }
    );
  }
}
