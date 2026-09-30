import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere } from '@/lib/auth/relationships';
import { handleApiError } from '@/lib/api/response';
import { formatPoishaToBDT, poishaToBdt } from '@/lib/escrowStateMachine';

export async function GET(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const applicationId = new URL(request.url).searchParams.get('applicationId') ?? undefined;
    const records = await prisma.milestone.findMany({
      where: { applicationId, application: applicationAccessWhere(authorization.user) },
      include: { ledgerEntries: { include: { receipt: true } } }, orderBy: { orderIndex: 'asc' }, take: 100,
    });
    const summary: Record<string, string> = {};
    for (const status of ['HELD', 'RELEASED', 'PENDING', 'DISPUTED', 'REFUNDED']) {
      const total = records.filter(m => m.status === status).reduce((sum, m) => sum + m.amountPoisha, BigInt(0));
      summary[status.toLowerCase() + 'Poisha'] = total.toString();
      summary[status.toLowerCase() + 'Formatted'] = formatPoishaToBDT(total);
    }
    const milestones = records.map(({ ledgerEntries, ...milestone }) => ({
      ...milestone, amountPoisha: milestone.amountPoisha.toString(),
      amountBdt: poishaToBdt(milestone.amountPoisha), amountFormatted: formatPoishaToBDT(milestone.amountPoisha),
      ledgerCount: ledgerEntries.length, receipt: ledgerEntries.find(e => e.receipt)?.receipt ?? null,
    }));
    return new NextResponse(JSON.stringify({ applicationId: applicationId ?? null, summary, milestones },
      (_key, value) => typeof value === 'bigint' ? value.toString() : value), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) { return handleApiError(error); }
}
