import { apiError } from '@/lib/api/response';

// Fail closed until signed provider reconciliation is implemented. An unsigned
// callback must never transition an escrow milestone, even in a sandbox.
export async function POST() {
  return apiError('PAYMENT_WEBHOOK_DISABLED', 'Verified payment callbacks are not configured.', 503);
}
