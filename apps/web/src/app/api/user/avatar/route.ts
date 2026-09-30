import { NextResponse } from 'next/server';
import { uploadAvatarFile } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { sameOrigin } from '@/lib/auth/registration';
import { apiError, handleApiError } from '@/lib/api/response';
import { validateDocumentBytes } from '@/lib/documents/private-storage';

export async function POST(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const length = Number(request.headers.get('content-length'));
    if (length > 6 * 1024 * 1024) return apiError('FILE_TOO_LARGE', 'Image must be under 5 MB.', 413);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || !['image/jpeg', 'image/png'].includes(file.type)) return apiError('INVALID_FILE', 'Provide a JPEG or PNG image.', 400);
    if (!file.size || file.size > 5 * 1024 * 1024) return apiError('INVALID_FILE', 'Image must be nonempty and under 5 MB.', 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateDocumentBytes(buffer, file.type)) return apiError('INVALID_FILE', 'The image bytes do not match its type.', 400);
    // Avatars are public profile images; private documents use a separate bucket.
    const result = await uploadAvatarFile(buffer, file.name, file.type, authorization.user.id);
    await prisma.user.update({ where: { id: authorization.user.id }, data: { avatarUrl: result.url } });
    return NextResponse.json({ data: { avatarUrl: result.url }, success: true, avatarUrl: result.url });
  } catch (error) { return handleApiError(error); }
}
