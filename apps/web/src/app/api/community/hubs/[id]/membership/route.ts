import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { apiError, handleApiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const authorization = await requireRole(['STUDENT']);
  if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const { id } = await context.params;
    if (!await prisma.countryCommunity.findUnique({ where: { id }, select: { id: true } })) return apiError('NOT_FOUND', 'Hub not found.', 404);
    await prisma.studentCommunityMembership.upsert({ where: { userId_communityId: { userId: authorization.user.id, communityId: id } }, update: {},
      create: { userId: authorization.user.id, communityId: id } });
    return NextResponse.json({ data: { joined: true, memberCount: await prisma.studentCommunityMembership.count({ where: { communityId: id } }) } });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: Context) {
  const authorization = await requireRole(['STUDENT']);
  if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const { id } = await context.params;
    await prisma.studentCommunityMembership.deleteMany({ where: { userId: authorization.user.id, communityId: id } });
    return NextResponse.json({ data: { joined: false, memberCount: await prisma.studentCommunityMembership.count({ where: { communityId: id } }) } });
  } catch (error) { return handleApiError(error); }
}
