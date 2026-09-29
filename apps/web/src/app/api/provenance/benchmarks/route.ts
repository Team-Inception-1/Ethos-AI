import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser, requireRole } from '@/lib/auth/authorization';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const canReview = user?.role === 'ADMIN';
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    if (country) {
      const benchmark = db.getCountryCostBenchmark(country);
      if (!benchmark) {
        return NextResponse.json({ success: false, error: `Benchmark for country '${country}' not found` }, { status: 404 });
      }
      if (!benchmark.isVerified && !canReview) {
        return NextResponse.json({ success: false, error: 'Benchmark is pending verification.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, benchmark });
    }

    const benchmarks = db.getCountryCostBenchmarks().filter((benchmark) => canReview || benchmark.isVerified);
    return NextResponse.json({ success: true, count: benchmarks.length, benchmarks });
  } catch (error: any) {
    console.error('Error in GET /api/provenance/benchmarks:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch benchmarks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['AGENCY', 'ADMIN']);
    if (authorization.response) return authorization.response;
    const body = await request.json();
    const { country, countryCode, officialGovUrl } = body;

    if (!country || !countryCode || !officialGovUrl) {
      return NextResponse.json(
        { success: false, error: 'country, countryCode, and officialGovUrl are required' },
        { status: 400 }
      );
    }

    // Agency submissions start as unverified — admin must cross-verify before publishing to students
    const benchmark = db.upsertCountryCostBenchmark({
      ...body,
      isVerified: false,
      verifiedByAdminId: '',
      lastAuditedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Benchmark for ${benchmark.country} submitted for admin verification.`,
      benchmark,
    });
  } catch (error: any) {
    console.error('Error in POST /api/provenance/benchmarks:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to upsert benchmark' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    const body = await request.json();
    const { id, isVerified } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Benchmark id is required' }, { status: 400 });
    }

    const all = db.getCountryCostBenchmarks();
    const existing = all.find((b) => b.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: `Benchmark '${id}' not found` }, { status: 404 });
    }

    const updated = db.upsertCountryCostBenchmark({
      ...existing,
      isVerified: Boolean(isVerified),
      verifiedByAdminId: authorization.user.id,
      lastAuditedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: isVerified
        ? `Benchmark for ${updated.country} verified and published to students.`
        : `Benchmark for ${updated.country} verification revoked.`,
      benchmark: updated,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/provenance/benchmarks:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update benchmark' }, { status: 500 });
  }
}
