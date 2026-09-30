import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadDocumentFile, deleteDocumentFile } from '@/lib/storage';
import { forbiddenResponse, requireUser } from '@/lib/auth/authorization';
import { apiError, handleApiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';
import { MAX_DOCUMENT_BYTES, validDocumentMime, validateDocumentBytes } from '@/lib/documents/private-storage';
import type { DocumentType } from '@prisma/client';

const types: Record<string, DocumentType> = {
  offer_letter: 'OFFER_LETTER', agreement: 'SIGNED_AGREEMENT',
  passport: 'PASSPORT_ID', transcript: 'ACADEMIC_TRANSCRIPT', other: 'OTHER',
};

export async function GET() {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    // Owner is always the session identity. Relationship-scoped listing can
    // be added explicitly; caller-selected owner IDs never change this query.
    const documents = await prisma.document.findMany({
      where: { ownerId: authorization.user.id }, include: { documentScan: true },
      orderBy: { uploadedAt: 'desc' }, take: 100,
    });
    return NextResponse.json({ documents: documents.map(doc => ({
      id: doc.id, ownerId: doc.ownerId, applicationId: doc.applicationId,
      name: doc.fileName, type: Object.keys(types).find(key => types[key] === doc.type) ?? 'other',
      size: `${(doc.fileSize / 1024).toFixed(0)} KB`, sizeBytes: doc.fileSize,
      mimeType: doc.mimeType, storageKey: doc.storageKey,
      storageUrl: `/api/documents/${doc.id}/download`,
      version: doc.version, uploadedAt: doc.uploadedAt.toISOString(),
      riskScore: doc.documentScan?.riskScore ?? null, verdict: doc.documentScan?.verdict ?? null,
      flags: Array.isArray(doc.documentScan?.flags) ? doc.documentScan.flags.map(String) : [],
    })) });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return apiError('INVALID_FILE', 'Provide a PDF, JPEG, or PNG file.', 400);
    if (!file.size || file.size > MAX_DOCUMENT_BYTES) return apiError('INVALID_FILE_SIZE', 'Files must be nonempty and no larger than 10 MB.', 413);
    if (!validDocumentMime(file.type)) return apiError('INVALID_FILE_TYPE', 'Only PDF, JPEG, and PNG files are accepted.', 415);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!validateDocumentBytes(bytes, file.type)) return apiError('INVALID_FILE_CONTENT', 'File contents do not match its type.', 415);
    const ownerId = authorization.user.id;
    const applicationId = typeof form.get('applicationId') === 'string' ? String(form.get('applicationId')) : null;
    if (applicationId && !await prisma.application.findFirst({
      where: { id: applicationId, studentId: ownerId }, select: { id: true },
    })) return forbiddenResponse();
    const type = typeof form.get('type') === 'string' ? String(form.get('type')) : 'other';
    const { key } = await uploadDocumentFile(bytes, file.name, file.type, ownerId);
    let document;
    try {
      document = await prisma.document.create({ data: {
        ownerId, applicationId, fileName: file.name, fileSize: file.size, mimeType: file.type,
        storageKey: key, type: types[type] ?? 'OTHER', isEncrypted: false,
      } });
    } catch (error) {
      // Compensate only for this request's newly created object, not an existing document.
      try { await deleteDocumentFile(key); } catch { console.error('New-document storage cleanup failed.'); }
      throw error;
    }
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
