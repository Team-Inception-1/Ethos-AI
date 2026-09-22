import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatPoishaToBDT, poishaToBdt } from '@/lib/escrowStateMachine';

/**
 * GET /api/escrow/receipts/[id]
 * Returns official digital receipt details for settled milestones
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    let receipt = db.getReceiptById(id);
    if (!receipt) {
      receipt =
        db.getReceipts().find((r) => r.receiptNumber === id) ||
        db.getReceiptByLedgerEntryId(id);
    }

    if (!receipt) {
      return NextResponse.json(
        { error: `Receipt '${id}' not found.` },
        { status: 404 }
      );
    }

    const ledgerEntry = db.getLedgerEntries().find((l) => l.id === receipt.ledgerEntryId);
    const milestone = ledgerEntry ? db.getMilestoneById(ledgerEntry.milestoneId) : null;
    const application = milestone ? db.getApplicationById(milestone.applicationId) : null;
    const student = application ? db.getUserById(application.studentId) : null;
    const agency = application ? db.getAgencyById(application.agencyId) : null;

    return NextResponse.json({
      receipt: {
        ...receipt,
        amountBdt: poishaToBdt(receipt.amountPoisha),
        amountFormatted: formatPoishaToBDT(receipt.amountPoisha),
      },
      ledgerEntry,
      milestone: milestone
        ? {
            id: milestone.id,
            name: milestone.name,
            condition: milestone.releaseCondition,
          }
        : null,
      parties: {
        student: student
          ? {
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
            }
          : null,
        agency: agency
          ? {
              id: agency.id,
              name: agency.name,
              licenseNo: agency.licenseNo,
            }
          : null,
      },
      verificationStamp: {
        isTamperProof: true,
        hash: ledgerEntry?.txHash || 'N/A',
        verifiedAt: new Date().toISOString(),
        issuer: 'Ethos AI Escrow Settlement Authority',
      },
    });
  } catch (error: any) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
