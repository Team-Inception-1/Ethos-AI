import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { transitionEscrow } from '@/lib/payments/service';
import { paymentJson, paymentErrorResponse, requirePaymentRequest } from '@/lib/payments/http';
import { formatPoishaToBDT, poishaToBdt } from '@/lib/escrowStateMachine';

export async function GET() {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    const disputes = await prisma.milestone.findMany({ where: { status: 'DISPUTED' },
      include: { application: { include: {
        student: { select: { id: true, name: true, email: true, phone: true } }, agency: { select: { id: true, name: true, licenseNo: true } },
      } }, _count: { select: { ledgerEntries: true } }, ledgerEntries: { where: { type: 'DISPUTE_FREEZE' }, orderBy: { timestamp: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' }, take: 100,
    });
    return paymentJson({ success: true, disputes: disputes.map(m => ({
      id: m.id, milestoneId: m.id, applicationId: m.applicationId, milestoneName: m.name,
      amountPoisha: m.amountPoisha, amountBDT: poishaToBdt(m.amountPoisha), amountFormatted: formatPoishaToBDT(m.amountPoisha),
      status: m.status.toLowerCase(), student: m.application.student, agency: m.application.agency,
      application: { targetUniversity: m.application.targetUniversity, targetProgram: m.application.targetProgram,
        targetCountry: m.application.targetCountry }, ledgerCount: m._count.ledgerEntries,
      disputedAt: m.ledgerEntries[0]?.timestamp ?? m.updatedAt, reason: m.ledgerEntries[0]?.note ?? '',
    })) });
  } catch (error) { return paymentErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    requirePaymentRequest(request);
    const body = z.object({ milestoneId: z.string().min(1).max(200), action: z.enum(['REFUND', 'RELEASE']),
      reason: z.string().trim().min(1).max(2000),
    }).parse(await request.json());
    return paymentJson(await transitionEscrow(body.milestoneId, body.action === 'REFUND' ? 'REFUNDED' : 'RELEASED', authorization.user, body.reason, true));
  } catch (error) { return paymentErrorResponse(error); }
}
