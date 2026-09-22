import { NextResponse } from 'next/server';
import campusLivingData from '@/data/campusLivingData.json';

/**
 * GET /api/campus-living
 * Supports optional ?q= query param for university name/city search
 * and ?region= for filtering by continent/region
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim();
    const region = searchParams.get('region')?.toLowerCase().trim();

    let results = campusLivingData as any[];

    if (region && region !== 'all') {
      results = results.filter((u) => u.region?.toLowerCase() === region);
    }

    if (query) {
      results = results.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.shortName.toLowerCase().includes(query) ||
          u.city.toLowerCase().includes(query) ||
          u.country.toLowerCase().includes(query) ||
          u.areas.some((a: any) => a.name.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      total: results.length,
      universities: results,
    });
  } catch (error: any) {
    console.error('Error fetching campus living data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch campus living data' },
      { status: 500 }
    );
  }
}
