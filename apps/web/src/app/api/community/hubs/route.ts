import { NextResponse } from 'next/server';
import communityData from '@/data/communityData.json';
import { requireUser } from '@/lib/auth/authorization';

/**
 * GET /api/community/hubs
 * Returns all available country communities and senior mentors.
 */
export async function GET() {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    return NextResponse.json({
      hubs: communityData.hubs,
      seniors: communityData.seniors,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch community hubs' },
      { status: 500 }
    );
  }
}
