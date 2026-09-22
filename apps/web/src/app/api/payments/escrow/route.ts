import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId') || undefined;

    const milestones = db.getAllMilestones(applicationId);
    const summary = db.getEscrowSummary();
    const ledgerEntries = db.getLedgerEntries();
    const receipts = db.receipts;

    return NextResponse.json({
      milestones,
      summary,
      ledgerEntries,
      receipts,
    });
  } catch (error) {
    console.error('Error fetching escrow data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escrow data' },
      { status: 500 }
    );
  }
}
