import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EscrowTransitionError } from '@/lib/escrowStateMachine';
import { forbiddenResponse, requireRole } from '@/lib/auth/authorization';

/**
 * POST /api/escrow/dispute
 * Freezes held escrow funds and flags milestone as DISPUTED
 */
export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT']);
    if (authorization.response) return authorization.response;
    const body = await request.json();
    const {
      milestoneId,
      reason,
    } = body;

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'milestoneId is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'A valid dispute reason must be provided.' },
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

    const application = db.getApplicationById(milestone.applicationId);
    if (!application || application.studentId !== authorization.user.id) return forbiddenResponse();

    const result = db.updateMilestoneStatus({
      milestoneId,
      targetStatus: 'DISPUTED',
      actorId: authorization.user.id,
      actorRole: authorization.user.role,
      note: `Escrow Dispute Raised: ${reason}`,
      provider: 'ESCROW_VAULT',
    });

    return NextResponse.json({
      success: true,
      status: 'DISPUTED',
      message: `Escrow funds for '${milestone.name}' have been frozen pending dispute resolution.`,
      milestone: result.milestone,
      ledgerEntry: result.ledgerEntry,
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
    console.error('Error in POST /api/escrow/dispute:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to file escrow dispute' },
      { status: 500 }
    );
  }
}
