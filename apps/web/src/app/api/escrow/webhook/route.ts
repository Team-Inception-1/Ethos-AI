import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PaymentProviderRegistry, GatewayProviderId } from '@/lib/paymentProviders';
import { EscrowTransitionError } from '@/lib/escrowStateMachine';

/**
 * POST /api/escrow/webhook
 * Receives Instant Payment Notification (IPN) / Webhook from payment gateways
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const providerId: GatewayProviderId =
      (body.provider || request.headers.get('x-gateway-provider') || 'SSLCOMMERZ').toUpperCase();

    const provider = PaymentProviderRegistry.get(providerId);

    const isValid = await provider.verifyWebhook(body);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature or missing required transaction references' },
        { status: 400 }
      );
    }

    const verified = await provider.processWebhook(body);

    if (verified.status !== 'VALID') {
      return NextResponse.json(
        { message: `Payment status '${verified.status}', ignoring.` },
        { status: 200 }
      );
    }

    const existingEntry = db
      .getLedgerEntries()
      .find((entry) => entry.providerTxnId === verified.providerTxnId);

    if (existingEntry) {
      return NextResponse.json({
        idempotent: true,
        message: `Transaction '${verified.providerTxnId}' was already processed.`,
        ledgerEntryId: existingEntry.id,
      });
    }

    const milestone = db.getMilestoneById(verified.milestoneId);
    if (!milestone) {
      return NextResponse.json(
        { error: `Milestone '${verified.milestoneId}' not found.` },
        { status: 404 }
      );
    }

    const result = db.updateMilestoneStatus({
      milestoneId: milestone.id,
      targetStatus: 'HELD',
      actorId: 'system-gateway-webhook',
      actorRole: 'SYSTEM',
      note: `Escrow hold confirmed by ${provider.displayName} webhook. Provider Txn: ${verified.providerTxnId}`,
      provider: provider.id,
      providerTxnId: verified.providerTxnId,
    });

    return NextResponse.json({
      success: true,
      status: 'HELD',
      milestone: result.milestone,
      ledgerEntry: result.ledgerEntry,
    });
  } catch (error: any) {
    if (error instanceof EscrowTransitionError) {
      return NextResponse.json(
        { error: error.message, currentStatus: error.currentStatus, targetStatus: error.targetStatus },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/escrow/webhook:', error);
    return NextResponse.json(
      { error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
