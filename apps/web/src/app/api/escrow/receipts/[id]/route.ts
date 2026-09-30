import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forbiddenResponse, requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere } from '@/lib/auth/relationships';
import { handleApiError } from '@/lib/api/response';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { id } = await context.params;
    const receipt = await prisma.receipt.findFirst({
      where: { OR: [{ id }, { receiptNumber: id }, { ledgerEntryId: id }],
        ledgerEntry: { milestone: { application: applicationAccessWhere(authorization.user) } } },
    });
    if (!receipt) return forbiddenResponse();
    return NextResponse.json({ receipt: { ...receipt, amountPoisha: receipt.amountPoisha.toString() } });
  } catch (error) { return handleApiError(error); }
}
