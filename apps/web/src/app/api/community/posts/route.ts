import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CommunityPostCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, requireUser } from '@/lib/auth/authorization';
import { blockedUserIds, communityError, communityMembership } from '@/lib/community/access';
import { postDTO, postInclude } from '@/lib/community/posts';
import { apiError } from '@/lib/api/response';
import { sameOrigin } from '@/lib/auth/registration';
const category = z.string().transform(value => value.toUpperCase()).pipe(z.nativeEnum(CommunityPostCategory));
const querySchema = z.object({ hubId: z.string().min(1), category: category.optional(), seniorOnly: z.enum(['true', 'false']).default('false'),
  query: z.string().max(200).default(''), cursor: z.string().min(1).optional(), limit: z.coerce.number().int().min(1).max(50).default(30) });
const inputSchema = z.object({ countryId: z.string().min(1), category: category.default('HELP'), title: z.string().trim().min(2).max(200),
  content: z.string().trim().min(1).max(20000), isAnonymous: z.boolean().default(false), isSeniorAsk: z.boolean().default(false) });
export async function GET(request: Request) {
  const authorization = await requireUser(); if (authorization.response) return authorization.response;
  try {
    const input = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    if (authorization.user.role !== 'ADMIN') await communityMembership(authorization.user.id, input.hubId);
    const blocked = await blockedUserIds(authorization.user.id);
    const rows = await prisma.communityPost.findMany({ where: { communityId: input.hubId, authorId: { notIn: blocked },
      ...(input.category ? { category: input.category } : {}), ...(input.seniorOnly === 'true' ? { isSeniorAsk: true } : {}),
      ...(input.query ? { OR: [{ title: { contains: input.query, mode: 'insensitive' } }, { content: { contains: input.query, mode: 'insensitive' } },
        { isAnonymous: false, author: { name: { contains: input.query, mode: 'insensitive' } } }] } : {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}), include: postInclude(authorization.user.id) });
    const hasMore = rows.length > input.limit; const items = rows.slice(0, input.limit);
    return NextResponse.json({ data: { items: items.map(postDTO), nextCursor: hasMore ? items.at(-1)?.id : null } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return communityError(error); }
}
export async function POST(request: Request) {
  const authorization = await requireRole(['STUDENT']); if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const input = inputSchema.parse(await request.json());
    const member = await communityMembership(authorization.user.id, input.countryId);
    const saved = await prisma.$transaction(async tx => {
      const post = await tx.communityPost.create({ data: { communityId: input.countryId, authorId: authorization.user.id, category: input.category,
        title: input.title, content: input.content, isAnonymous: input.isAnonymous, isSeniorAsk: input.isSeniorAsk,
        authorStatus: member.status, authorUniversity: member.targetOrCurrentUniversity, authorVerified: member.isVerified }, include: postInclude(authorization.user.id) });
      await tx.countryCommunity.update({ where: { id: input.countryId }, data: { postCount: { increment: 1 } } });
      return post;
    });
    return NextResponse.json({ data: postDTO(saved) }, { status: 201 });
  } catch (error) { return communityError(error); }
}
