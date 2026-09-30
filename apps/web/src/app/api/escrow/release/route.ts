import { z } from 'zod';
import { requireRole } from '@/lib/auth/authorization';
import { transitionEscrow } from '@/lib/payments/service';
import { paymentJson, paymentErrorResponse, requirePaymentRequest } from '@/lib/payments/http';

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT', 'ADMIN']);
    if (authorization.response) return authorization.response;
    requirePaymentRequest(request);
    const body = z.object({ milestoneId: z.string().min(1).max(200), note: z.string().trim().max(2000).optional() }).parse(await request.json());
    return paymentJson(await transitionEscrow(body.milestoneId, 'RELEASED', authorization.user, body.note));
  } catch (error) { return paymentErrorResponse(error); }
}
