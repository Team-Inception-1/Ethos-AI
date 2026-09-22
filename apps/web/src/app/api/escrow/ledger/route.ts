import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatPoishaToBDT } from '@/lib/escrowStateMachine';

/**
 * GET /api/escrow/ledger
 * Returns the append-only cryptographic ledger and integrity verification status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestoneId');
    const simulateTamper = searchParams.get('simulateTamperEntryId');

    if (simulateTamper) {
      db.simulateLedgerTamper(simulateTamper, '999999999');
    }

    let entries = db.getLedgerEntries();
    if (milestoneId) {
      entries = entries.filter((e) => e.milestoneId === milestoneId);
    }

    const verification = db.verifyLedgerIntegrity();

    const enrichedEntries = entries.map((entry, idx) => ({
      ...entry,
      index: idx,
      amountFormatted: formatPoishaToBDT(entry.amountPoisha),
      txHashShort: `${entry.txHash.slice(0, 8)}...${entry.txHash.slice(-8)}`,
    }));

    return NextResponse.json({
      ledgerCount: entries.length,
      auditVerification: verification,
      entries: enrichedEntries,
    });
  } catch (error: any) {
    console.error('Error in GET /api/escrow/ledger:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch ledger audit trail' },
      { status: 500 }
    );
  }
}
