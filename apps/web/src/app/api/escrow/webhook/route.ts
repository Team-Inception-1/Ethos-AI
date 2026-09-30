import { apiError } from '@/lib/api/response';
import { verifySandboxCallback } from '@/lib/payments/sandbox';
import { reconcilePayment } from '@/lib/payments/service';
import { paymentErrorResponse, paymentJson } from '@/lib/payments/http';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > 16384) return apiError('PAYLOAD_TOO_LARGE', 'Payment callback is too large.', 413);
    const callback = verifySandboxCallback(rawBody, request.headers.get('x-ethos-timestamp'), request.headers.get('x-ethos-signature'));
    return paymentJson(await reconcilePayment(callback));
  } catch (error) { return paymentErrorResponse(error); }
}
