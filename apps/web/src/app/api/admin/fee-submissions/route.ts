import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { feeDto, reviewFee } from '@/lib/platform/fees';
import { identifier, parseFeeStatus, platformError, success } from '@/lib/platform/http';
import { sameOrigin } from '@/lib/auth/registration';
import { apiError } from '@/lib/api/response';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    const status = parseFeeStatus(new URL(request.url).searchParams.get('status'));
    const rows = await prisma.agencyFeeSubmission.findMany({ where: { status },
      include: { agency: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
    const submissions = rows.map(feeDto);
    return success({ submissions, count: submissions.length });
  } catch (error) { return platformError(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (auth.response) return auth.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const input = z.object({ submissionId: identifier, action: z.enum(['APPROVED', 'REJECTED']),
      adminFeedback: z.string().trim().min(1).max(10000) }).parse(await request.json());
    const submission = await reviewFee(input.submissionId, input.action, input.adminFeedback, auth.user.id);
    return success({ submission, message: `Fee submission ${input.action.toLowerCase()}.` });
  } catch (error) { return platformError(error); }
}
