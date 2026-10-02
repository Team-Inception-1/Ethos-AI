import { POST as pay } from '@/app/api/escrow/pay/route';
import { POST as release } from '@/app/api/escrow/release/route';
import { POST as dispute } from '@/app/api/escrow/dispute/route';
import { requireRole } from '@/lib/auth/authorization';
import { apiError, handleApiError } from '@/lib/api/response';
import { z } from 'zod';
import { sameOrigin } from '@/lib/auth/registration';

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT', 'ADMIN']);
    if (authorization.response) return authorization.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const body = z.object({
      action: z.enum(['deposit', 'release', 'dispute']), milestoneId: z.string().min(1),
      provider: z.enum(['SSLCOMMERZ', 'BKASH', 'NAGAD']).optional(),
      note: z.string().max(2000).optional(), reason: z.string().max(2000).optional(),
    }).parse(await request.json());
    const actionRequest = new Request(request.url, { method: 'POST',
      headers: request.headers, body: JSON.stringify(body) });
    if (body.action === 'deposit') return pay(actionRequest);
    if (body.action === 'release') return release(actionRequest);
    if (body.action === 'dispute') return dispute(actionRequest);
    return apiError('INVALID_ACTION', 'Unsupported escrow action.', 400);
  } catch (error) { return handleApiError(error); }
}
