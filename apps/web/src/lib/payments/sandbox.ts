import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { PaymentError } from './errors';

export const gatewaySchema = z.enum(['SSLCOMMERZ', 'BKASH', 'NAGAD']);
export type Gateway = z.infer<typeof gatewaySchema>;
export const callbackSchema = z.object({
  provider: gatewaySchema,
  providerTxnId: z.string().uuid(),
  milestoneId: z.string().min(1).max(200),
  amountPoisha: z.string().regex(/^[1-9]\d{0,18}$/),
  currency: z.literal('BDT'),
  status: z.enum(['VALID', 'FAILED', 'CANCELLED']),
}).strict();
export type SandboxCallback = z.infer<typeof callbackSchema>;

// No live gateway is implemented. Never silently substitute simulated money.
export function isSandboxConfigured() {
  const secret = process.env.ETHOS_PAYMENT_SANDBOX_SECRET;
  const safeRuntime = process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview';
  return safeRuntime && process.env.ETHOS_PAYMENT_MODE === 'sandbox' && Boolean(secret && secret.length >= 32);
}

export function requireSandbox() {
  const secret = process.env.ETHOS_PAYMENT_SANDBOX_SECRET;
  if (!isSandboxConfigured() || !secret) {
    throw new PaymentError('PAYMENTS_DISABLED', 'Payment processing is not configured.', 503);
  }
  return secret;
}

export function verifySandboxCallback(rawBody: string, timestamp: string | null, signature: string | null) {
  const secret = requireSandbox();
  if (!timestamp || !/^\d{10}$/.test(timestamp) || !signature || !/^[a-f0-9]{64}$/.test(signature) ||
      Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    throw new PaymentError('INVALID_SIGNATURE', 'Invalid payment callback signature.', 401);
  }
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) {
    throw new PaymentError('INVALID_SIGNATURE', 'Invalid payment callback signature.', 401);
  }
  return callbackSchema.parse(JSON.parse(rawBody));
}
