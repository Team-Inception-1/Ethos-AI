import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Validation endpoint that re-fetches the official source URL for a benchmark
 * or catalog record and compares the numeric value with the stored value.
 *
 * Query parameters:
 *   - type: 'benchmark' | 'catalog'
 *   - id: record identifier
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  if (!type || !id) {
    return NextResponse.json({ success: false, error: 'Missing type or id query param' }, { status: 400 });
  }
  try {
    if (type === 'benchmark') {
      const benchmarks = await db.getCountryCostBenchmarks();
      const record = benchmarks.find((b) => b.id === id);
      if (!record) return NextResponse.json({ success: false, error: 'Benchmark not found' }, { status: 404 });
      const resp = await fetch(record.officialGovUrl);
      const text = await resp.text();
      const match = text.match(/\d[\d,\.]*\d/);
      const external = match ? parseFloat(match[0].replace(/,/g, '')) : null;
      const matchFlag = external !== null && Math.abs(external - record.blockedAccountOrGicBdt) < 0.01;
      return NextResponse.json({ success: true, match: matchFlag, stored: record.blockedAccountOrGicBdt, external });
    }
    if (type === 'catalog') {
      const record = await db.getUniversityCourseCatalogById(id);
      if (!record) return NextResponse.json({ success: false, error: 'Catalog not found' }, { status: 404 });
      const resp = await fetch(record.officialCatalogUrl);
      const text = await resp.text();
      const match = text.match(/\d[\d,\.]*\d/);
      const external = match ? parseFloat(match[0].replace(/,/g, '')) : null;
      const matchFlag = external !== null && Math.abs(external - record.annualTuitionLocal) < 0.01;
      return NextResponse.json({ success: true, match: matchFlag, stored: record.annualTuitionLocal, external });
    }
    return NextResponse.json({ success: false, error: 'Invalid type parameter' }, { status: 400 });
  } catch (e: any) {
    console.error('Validation error', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
