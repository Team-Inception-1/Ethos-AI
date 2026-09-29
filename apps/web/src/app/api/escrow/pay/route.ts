import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PaymentProviderRegistry } from '@/lib/paymentProviders';
import { EscrowTransitionError } from '@/lib/escrowStateMachine';
import { forbiddenResponse, requireRole } from '@/lib/auth/authorization';

/**
 * POST /api/escrow/pay
 * Initiates payment via chosen provider (SSLCOMMERZ, BKASH, NAGAD)
 */
export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT']);
    if (authorization.response) return authorization.response;
    const body = await request.json();
    const {
      milestoneId,
      provider = 'SSLCOMMERZ',
      simulateInstantHold = true,
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

    const application = db.getApplicationById(milestone.applicationId);
    if (!application || application.studentId !== authorization.user.id) return forbiddenResponse();

    if (milestone.status !== 'PENDING') {
      return NextResponse.json(
        {
          error: `Cannot pay milestone with status '${milestone.status}'. Only PENDING milestones can be paid into escrow.`,
        },
        { status: 400 }
      );
    }

    const studentId = authorization.user.id;
    const user = db.getUserById(studentId);
    const providerInstance = PaymentProviderRegistry.get(provider);

    const initResult = await providerInstance.initiatePayment({
      milestoneId: milestone.id,
      amountPoisha: milestone.amountPoisha,
      currency: 'BDT',
      studentId,
      studentName: user?.name || 'Riya Ahmed',
      studentEmail: user?.email || 'riya@example.com',
      studentPhone: user?.phone || '+8801712345678',
    });

    if (simulateInstantHold) {
      const updateResult = db.updateMilestoneStatus({
        milestoneId: milestone.id,
        targetStatus: 'HELD',
        actorId: studentId,
        actorRole: 'STUDENT',
        note: note || `Escrow deposit via ${providerInstance.displayName}`,
        provider: providerInstance.id,
        providerTxnId: initResult.providerTxnId,
      });

      return NextResponse.json({
        success: true,
        status: 'HELD',
        message: `Successfully deposited ${milestone.amountPoisha} poisha into escrow via ${providerInstance.displayName}`,
        payment: initResult,
        milestone: updateResult.milestone,
        ledgerEntry: updateResult.ledgerEntry,
      });
    }

    return NextResponse.json({
      success: true,
      status: 'INITIATED',
      payment: initResult,
    });
  } catch (error: any) {
    if (error instanceof EscrowTransitionError) {
      return NextResponse.json(
        { error: error.message, currentStatus: error.currentStatus, targetStatus: error.targetStatus },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/escrow/pay:', error);
    return NextResponse.json(
      { error: error?.message || 'Payment initiation failed' },
      { status: 500 }
    );
  }
}
