import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EscrowTransitionError } from '@/lib/escrowStateMachine';

/**
 * POST /api/escrow/release
 * Releases held escrow funds to the consultancy agency
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      milestoneId,
      actorId = 'usr-student-01',
      actorRole = 'STUDENT',
      note,
    } = body;

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'milestoneId is required' },
        { status: 400 }
      );
    }

    const milestone = db.getMilestoneById(milestoneId);
    if (!milestone) {
      return NextResponse.json(
        { error: `Milestone '${milestoneId}' not found.` },
        { status: 404 }
      );
    }

    const result = db.updateMilestoneStatus({
      milestoneId,
      targetStatus: 'RELEASED',
      actorId,
      actorRole,
      note: note || `Authorized release of milestone: ${milestone.releaseCondition}`,
      provider: 'SSLCOMMERZ',
    });

    return NextResponse.json({
      success: true,
      status: 'RELEASED',
      message: `Milestone '${milestone.name}' funds successfully released to consultancy.`,
      milestone: result.milestone,
      ledgerEntry: result.ledgerEntry,
      receipt: result.receipt,
    });
  } catch (error: any) {
    if (error instanceof EscrowTransitionError) {
      return NextResponse.json(
        {
          error: error.message,
          currentStatus: error.currentStatus,
          targetStatus: error.targetStatus,
        },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/escrow/release:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to release escrow milestone' },
      { status: 500 }
    );
  }
}
