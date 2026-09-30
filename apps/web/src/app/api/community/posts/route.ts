import { NextResponse } from 'next/server';
import communityData from '@/data/communityData.json';
import { requireUser, requireRole } from '@/lib/auth/authorization';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/community/posts?hubId=...&category=...&seniorOnly=...&q=...
 * Strict country group isolation: only posts belonging to hubId are returned.
 */
export async function GET(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get('hubId') || 'hub-germany';
    const category = searchParams.get('category');
    const seniorOnly = searchParams.get('seniorOnly') === 'true';
    const query = searchParams.get('q')?.toLowerCase().trim();

    let posts = communityData.posts.filter((p) => p.countryId === hubId);

    if (category && category !== 'All') {
      posts = posts.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
    }

    if (seniorOnly) {
      posts = posts.filter((p) => p.isSeniorAsk === true);
    }

    if (query) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          (!p.isAnonymous && p.authorName.toLowerCase().includes(query)) ||
          p.authorUniversity.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      hubId,
      total: posts.length,
      posts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch community posts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/posts
 * Creates a new country-specific post.
 */
export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT']);
    if (authorization.response) return authorization.response;
    const author = await prisma.user.findUnique({ where: { id: authorization.user.id }, select: { name: true, avatarUrl: true } });
    const body = await request.json();
    const { countryId, country, title, content, category, isAnonymous, isSeniorAsk } = body;

    if (!countryId || !title || !content) {
      return NextResponse.json(
        { error: 'countryId, title, and content are required' },
        { status: 400 }
      );
    }

    const newPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      countryId,
      country: country || 'Germany',
      category: category || 'Help',
      title: title.trim(),
      content: content.trim(),
      authorId: isAnonymous ? undefined : authorization.user.id,
      authorName: isAnonymous ? 'Anonymous Student' : (author?.name || ''),
      authorAvatar: isAnonymous ? '' : (author?.avatarUrl || ''),
      isAnonymous: !!isAnonymous,
      authorStatus: 'incoming',
      authorUniversity: '',
      authorVerified: authorization.user.isVerified,
      isSeniorAsk: !!isSeniorAsk,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      pinned: false,
    };

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    );
  }
}
