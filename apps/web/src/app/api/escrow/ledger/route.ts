import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forbiddenResponse, requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere } from '@/lib/auth/relationships';
import { handleApiError } from '@/lib/api/response';

export async function GET(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const params = new URL(request.url).searchParams;
    // A read endpoint must never alter the financial ledger.
    if (params.has('simulateTamperEntryId')) return forbiddenResponse();
    const milestoneId = params.get('milestoneId') ?? undefined;
    const entries = await prisma.ledgerEntry.findMany({
      where: { milestoneId, milestone: { application: applicationAccessWhere(authorization.user) } },
      orderBy: { timestamp: 'desc' }, take: 200,
    });
    return NextResponse.json({ ledgerCount: entries.length,
      entries: entries.map(entry => ({ ...entry, amountPoisha: entry.amountPoisha.toString() })) });
  } catch (error) { return handleApiError(error); }
}
