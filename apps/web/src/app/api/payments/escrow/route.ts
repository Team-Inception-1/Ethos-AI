import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere } from '@/lib/auth/relationships';
import { handleApiError } from '@/lib/api/response';

export async function GET(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const applicationId = new URL(request.url).searchParams.get('applicationId') ?? undefined;
    const milestones = await prisma.milestone.findMany({
      where: { applicationId, application: applicationAccessWhere(authorization.user) },
      include: { ledgerEntries: { include: { receipt: true } }, application: {
        include: { student: { select: { id: true, name: true } }, agency: { select: { id: true, name: true } } },
      } }, take: 100, orderBy: { orderIndex: 'asc' },
    });
    const ledgerEntries = milestones.flatMap(m => m.ledgerEntries);
    const receipts = ledgerEntries.flatMap(e => e.receipt ? [e.receipt] : []);
    const total = (status: string) => milestones.filter(m => m.status === status)
      .reduce((sum, m) => sum + m.amountPoisha, BigInt(0)).toString();
    return new NextResponse(JSON.stringify({ milestones: milestones.map(m => ({ ...m,
      targetUniversity: m.application.targetUniversity, agencyName: m.application.agency.name,
    })), ledgerEntries, receipts,
      summary: { heldPoisha: total('HELD'), releasedPoisha: total('RELEASED'),
        pendingPoisha: total('PENDING'), disputedPoisha: total('DISPUTED'), refundedPoisha: total('REFUNDED') },
    }, (_key, value) => typeof value === 'bigint' ? value.toString() : value), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) { return handleApiError(error); }
}
