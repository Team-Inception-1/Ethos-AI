import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/authorization';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/response';
import { hubDTO, mentorDTO } from '@/lib/community/hubs';

export async function GET() {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;
  try {
    const blocks = await prisma.userBlock.findMany({ where: { OR: [{ blockerId: authorization.user.id }, { blockedUserId: authorization.user.id }] } });
    const blocked = blocks.map(block => block.blockerId === authorization.user.id ? block.blockedUserId : block.blockerId);
    const [hubs, seniors] = await Promise.all([
      prisma.countryCommunity.findMany({ orderBy: { country: 'asc' }, take: 100, include: {
        _count: { select: { members: true, posts: true } }, members: { where: { userId: authorization.user.id } },
      } }),
      prisma.studentCommunityMembership.findMany({ where: { isSeniorMentor: true, isVerified: true,
        status: { in: ['CURRENT_STUDENT', 'ALUMNI'] }, userId: { notIn: blocked } }, take: 100, include: { user: true, community: true } }),
    ]);
    return NextResponse.json({ data: { hubs: hubs.map(hubDTO), seniors: seniors.map(mentorDTO) } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return handleApiError(error); }
}
