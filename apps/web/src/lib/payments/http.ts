import { NextResponse } from 'next/server';
import { apiError, handleApiError } from '@/lib/api/response';
import { PaymentError } from './errors';

export function requirePaymentRequest(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    throw new PaymentError('FORBIDDEN', 'Payment actions require a same-origin request.', 403);
  }
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    throw new PaymentError('INVALID_CONTENT_TYPE', 'Payment actions require JSON.', 415);
  }
}

export function paymentJson(value: unknown, status = 200) {
  return new NextResponse(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function paymentErrorResponse(error: unknown) {
  if (error instanceof PaymentError) return apiError(error.code, error.message, error.status);
  return handleApiError(error);
}
