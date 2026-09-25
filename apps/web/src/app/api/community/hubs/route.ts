import { NextResponse } from 'next/server';
import communityData from '@/data/communityData.json';

/**
 * GET /api/community/hubs
 * Returns all available country communities and senior mentors.
 */
export async function GET() {
  try {
    return NextResponse.json({
      hubs: communityData.hubs,
      seniors: communityData.seniors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch community hubs' },
      { status: 500 }
    );
  }
}
