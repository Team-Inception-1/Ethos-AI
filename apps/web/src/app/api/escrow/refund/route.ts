import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EscrowTransitionError } from '@/lib/escrowStateMachine';
import { requireRole } from '@/lib/auth/authorization';

/**
 * POST /api/escrow/refund
 * Refunds held or disputed escrow funds back to the student
 */
export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    const body = await request.json();
    const {
      milestoneId,
      reason = 'Refund approved per dispute resolution policy',
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
      targetStatus: 'REFUNDED',
      actorId: authorization.user.id,
      actorRole: authorization.user.role,
      note: `Escrow Refund Issued: ${reason}`,
      provider: 'SSLCOMMERZ_REFUND',
    });

    return NextResponse.json({
      success: true,
      status: 'REFUNDED',
      message: `Escrow funds for '${milestone.name}' have been refunded to the student account.`,
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
    console.error('Error in POST /api/escrow/refund:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to issue escrow refund' },
      { status: 500 }
    );
  }
}
