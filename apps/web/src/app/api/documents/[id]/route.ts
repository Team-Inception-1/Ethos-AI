import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteDocumentFile } from '@/lib/storage';
import { forbiddenResponse, requireUser } from '@/lib/auth/authorization';
import { canAccessDocument } from '@/lib/auth/relationships';
import { apiError, handleApiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { id } = await context.params;
    if (!await canAccessDocument(authorization.user, id)) return forbiddenResponse();
    const document = await prisma.document.findUnique({ where: { id }, include: { documentScan: true } });
    return NextResponse.json({ document });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const { id } = await context.params;
    if (!await canAccessDocument(authorization.user, id, true)) return forbiddenResponse();
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return apiError('NOT_FOUND', 'Document not found.', 404);
    // Delete database record first so storage failure never leaves an orphan DB row (AUD-027)
    await prisma.document.delete({ where: { id } });
    try {
      await deleteDocumentFile(document.storageKey);
    } catch (storageError) {
      console.warn('Storage file deletion failed after database record was removed:', storageError);
    }
    return NextResponse.json({ data: { id } });
  } catch (error) { return handleApiError(error); }
}
