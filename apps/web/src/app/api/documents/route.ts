import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadDocumentFile } from '@/lib/storage';
import { forbiddenResponse, requireUser } from '@/lib/auth/authorization';
import { handleApiError } from '@/lib/api/response';
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
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    const ownerId = authorization.user.id;
    const applicationId = typeof form.get('applicationId') === 'string' ? String(form.get('applicationId')) : null;
    if (applicationId && !await prisma.application.findFirst({
      where: { id: applicationId, studentId: ownerId }, select: { id: true },
    })) return forbiddenResponse();
    const type = typeof form.get('type') === 'string' ? String(form.get('type')) : 'other';
    const { key } = await uploadDocumentFile(Buffer.from(await file.arrayBuffer()), file.name, file.type, ownerId);
    const document = await prisma.document.create({ data: {
      ownerId, applicationId, fileName: file.name, fileSize: file.size, mimeType: file.type,
      storageKey: key, type: types[type] ?? 'OTHER', isEncrypted: false,
    } });
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
