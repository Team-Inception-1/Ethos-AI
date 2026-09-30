import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, forbiddenResponse } from '@/lib/auth/authorization';
import { canAccessDocument } from '@/lib/auth/relationships';
import { readDocumentFile } from '@/lib/storage';
import { apiError, handleApiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';

const scanResult = z.object({
  risk_score: z.number().min(0).max(100),
  verdict: z.string().max(100), flags: z.array(z.string().max(2000)).max(100),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const { id } = await context.params;
    if (!await canAccessDocument(authorization.user, id)) return forbiddenResponse();
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return apiError('NOT_FOUND', 'Document not found.', 404);
    const serviceUrl = process.env.AI_SERVICE_URL;
    const token = process.env.AI_SERVICE_API_TOKEN;
    if (!serviceUrl || !token) return apiError('SCANNER_UNAVAILABLE', 'Document scanning is not configured.', 503);
    const endpoint = document.type === 'OFFER_LETTER' ? 'analyze-offer-letter' :
      document.type === 'SIGNED_AGREEMENT' ? 'analyze-agreement' : null;
    if (!endpoint) return apiError('UNSUPPORTED_SCAN', 'Automatic scanning is not supported for this document type.', 422);
    const form = new FormData();
    form.set('file', new Blob([new Uint8Array(await readDocumentFile(document.storageKey))],
      { type: document.mimeType }), document.fileName);
    const response = await fetch(new URL('/api/ai/' + endpoint, serviceUrl), {
      method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form,
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) return apiError('SCANNER_UNAVAILABLE', 'Document analysis failed. Please retry.', 503);
    const result = scanResult.parse(await response.json());
    const scan = await prisma.documentScan.upsert({
      where: { documentId: id },
      create: { documentId: id, riskScore: result.risk_score, verdict: result.verdict,
        flags: result.flags, modelVersion: 'ai-service' },
      update: { riskScore: result.risk_score, verdict: result.verdict, flags: result.flags },
    });
    return NextResponse.json({ scanResult: scan });
  } catch (error) { return handleApiError(error); }
}
