import { apiError } from '@/lib/api/response';

// Codes are generated, delivered and verified only by Neon Auth.
export async function POST() {
  return apiError('ENDPOINT_RETIRED', 'Use Neon Auth email-OTP endpoints.', 410);
}
