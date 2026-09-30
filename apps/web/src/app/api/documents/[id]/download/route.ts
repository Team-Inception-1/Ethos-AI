import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, forbiddenResponse } from '@/lib/auth/authorization';
import { canAccessDocument } from '@/lib/auth/relationships';
import { readDocumentFile } from '@/lib/storage';
import { apiError, handleApiError } from '@/lib/api/response';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { id } = await context.params;
    if (!await canAccessDocument(authorization.user, id)) return forbiddenResponse();
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return apiError('NOT_FOUND', 'Document not found.', 404);
    const bytes = await readDocumentFile(document.storageKey);
    return new NextResponse(new Uint8Array(bytes), { headers: {
      'Content-Type': document.mimeType, 'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
    } });
  } catch (error) { return handleApiError(error); }
}
