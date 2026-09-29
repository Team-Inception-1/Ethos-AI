import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser, requireRole } from '@/lib/auth/authorization';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const canReview = user?.role === 'ADMIN';
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || undefined;
    const university = searchParams.get('university') || undefined;
    const id = searchParams.get('id');

    if (id) {
      const catalog = db.getUniversityCourseCatalogById(id);
      if (!catalog) {
        return NextResponse.json({ success: false, error: `Course catalog '${id}' not found` }, { status: 404 });
      }
      if ((!catalog.isVerified || catalog.status !== 'VERIFIED') && !canReview) {
        return NextResponse.json({ success: false, error: 'Course catalog is pending verification.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, catalog });
    }

    const catalogs = db
      .getUniversityCourseCatalogs(country, university)
      .filter((catalog) => canReview || (catalog.isVerified && catalog.status === 'VERIFIED'));
    return NextResponse.json({ success: true, count: catalogs.length, catalogs });
  } catch (error: any) {
    console.error('Error in GET /api/provenance/catalogs:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch course catalogs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    const body = await request.json();
    const { universityName, country, programName, annualTuitionLocal, currency, officialCatalogUrl, officialSourceTitle } = body;

    if (!universityName || !country || !programName || !officialCatalogUrl || !currency) {
      return NextResponse.json(
        { success: false, error: 'universityName, country, programName, officialCatalogUrl, and currency are required' },
        { status: 400 }
      );
    }

    // Benchmark exchange lookup for conversion to BDT
    const benchmark = db.getCountryCostBenchmark(country);
    const exchangeRate = benchmark ? benchmark.exchangeRateBdt : 120.0;
    const tuitionLocalNum = Number(annualTuitionLocal) || 0;
    const annualTuitionBdt = Math.round(tuitionLocalNum * exchangeRate);

    const catalog = db.upsertUniversityCourseCatalog({
      ...body,
      annualTuitionLocal: tuitionLocalNum,
      annualTuitionBdt,
      currency: currency.toUpperCase(),
      officialCatalogUrl,
      officialSourceTitle: officialSourceTitle || `${universityName} Official Fee Schedule`,
      isVerified: true,
      status: 'VERIFIED',
      verifiedByAdminId: authorization.user.id,
      lastAuditedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Official course catalog for ${catalog.universityName} verified and saved.`,
      catalog,
    });
  } catch (error: any) {
    console.error('Error in POST /api/provenance/catalogs:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save course catalog' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Catalog ID is required' }, { status: 400 });
    }

    const deleted = db.deleteUniversityCourseCatalog(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: `Course catalog '${id}' not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Course catalog '${deleted.programName}' at ${deleted.universityName} deleted.`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/provenance/catalogs:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete course catalog' }, { status: 500 });
  }
}
