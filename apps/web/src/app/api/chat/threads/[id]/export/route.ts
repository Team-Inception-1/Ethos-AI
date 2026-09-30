import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { forbiddenResponse, requireUser } from '@/lib/auth/authorization';
import { applicationAccessWhere } from '@/lib/auth/relationships';
import { apiError, handleApiError } from '@/lib/api/response';
import { success } from '@/lib/platform/http';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { id } = await context.params;
    const thread = await prisma.chatThread.findFirst({
      where: { id, application: applicationAccessWhere(authorization.user) },
      include: { messages: { orderBy: [{ sentAt: 'asc' }, { id: 'asc' }], take: 10001 } },
    });
    if (!thread) return forbiddenResponse();
    if (thread.messages.length > 10000) return apiError('EXPORT_TOO_LARGE', 'This transcript exceeds the export limit.', 413);
    const exportedAt = new Date().toISOString();
    const digest = createHash('sha256').update(JSON.stringify(thread.messages)).digest('hex');
    // A digest is an integrity aid, not a certified signature or legal attestation.
    return success({ threadId: id, exportedAt, digest, transcript: thread.messages });
  } catch (error) { return handleApiError(error); }
}
