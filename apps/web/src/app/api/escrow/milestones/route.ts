import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatPoishaToBDT, poishaToBdt } from '@/lib/escrowStateMachine';

/**
 * GET /api/escrow/milestones
 * Query params:
 *   - applicationId (optional; defaults to 'app-001' or returns all if empty)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    const milestones = applicationId
      ? db.getMilestonesByApp(applicationId)
      : db.getAllMilestones();

    const allLedger = db.getLedgerEntries();
    const allReceipts = db.getReceipts();

    let heldPoisha = BigInt(0);
    let releasedPoisha = BigInt(0);
    let pendingPoisha = BigInt(0);
    let disputedPoisha = BigInt(0);
    let refundedPoisha = BigInt(0);

    const enrichedMilestones = milestones.map((m) => {
      const amount = BigInt(m.amountPoisha);
      if (m.status === 'HELD') heldPoisha += amount;
      else if (m.status === 'RELEASED') releasedPoisha += amount;
      else if (m.status === 'PENDING') pendingPoisha += amount;
      else if (m.status === 'DISPUTED') disputedPoisha += amount;
      else if (m.status === 'REFUNDED') refundedPoisha += amount;

      const mEntries = allLedger.filter((l) => l.milestoneId === m.id);
      const mReceipts = allReceipts.filter((r) =>
        mEntries.some((e) => e.id === r.ledgerEntryId)
      );

      return {
        ...m,
        amountBdt: poishaToBdt(m.amountPoisha),
        amountFormatted: formatPoishaToBDT(m.amountPoisha),
        ledgerCount: mEntries.length,
        receipt: mReceipts[0] || null,
      };
    });

    return NextResponse.json({
      applicationId: applicationId || null,
      summary: {
        heldPoisha: heldPoisha.toString(),
        heldFormatted: formatPoishaToBDT(heldPoisha),
        releasedPoisha: releasedPoisha.toString(),
        releasedFormatted: formatPoishaToBDT(releasedPoisha),
        pendingPoisha: pendingPoisha.toString(),
        pendingFormatted: formatPoishaToBDT(pendingPoisha),
        disputedPoisha: disputedPoisha.toString(),
        disputedFormatted: formatPoishaToBDT(disputedPoisha),
        refundedPoisha: refundedPoisha.toString(),
        refundedFormatted: formatPoishaToBDT(refundedPoisha),
      },
      milestones: enrichedMilestones,
    });
  } catch (error: any) {
    console.error('Error fetching escrow milestones:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch escrow milestones' },
      { status: 500 }
    );
  }
}
