import { z } from 'zod';
import { requireRole } from '@/lib/auth/authorization';
import { initiatePayment } from '@/lib/payments/service';
import { gatewaySchema } from '@/lib/payments/sandbox';
import { paymentJson, paymentErrorResponse, requirePaymentRequest } from '@/lib/payments/http';

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT']);
    if (authorization.response) return authorization.response;
    requirePaymentRequest(request);
    const body = z.object({
      milestoneId: z.string().min(1).max(200), provider: gatewaySchema.default('SSLCOMMERZ'),
      // Immediate, unsigned holds are forbidden, including from legacy clients.
      simulateInstantHold: z.literal(false).optional(),
    }).parse(await request.json());
    return paymentJson(await initiatePayment(body.milestoneId, body.provider, authorization.user));
  } catch (error) { return paymentErrorResponse(error); }
}
