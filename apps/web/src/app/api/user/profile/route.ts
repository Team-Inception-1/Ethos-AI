import { apiError } from '@/lib/api/response';

// Retired: profile lookup by caller-selected email/ID is never allowed.
const retired = () => apiError('ENDPOINT_RETIRED', 'Use /api/user/me for your current profile.', 410);
export const GET = retired;
export const PUT = retired;
