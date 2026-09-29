import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/authorization';

export async function GET(request: Request) {
  try {
    const authorization = await requireRole(['AGENCY']);
    if (authorization.response) return authorization.response;
    const { searchParams } = new URL(request.url);
    const agency = db.getAgencies().find((candidate) => candidate.ownerUserId === authorization.user.id);
    if (!agency) return NextResponse.json({ success: false, error: 'No agency profile is linked to this account.' }, { status: 404 });
    const agencyId = agency.id;
    const status = searchParams.get('status') || undefined;

    const submissions = db.getAgencyFeeSubmissions(agencyId, status);
    return NextResponse.json({ success: true, count: submissions.length, submissions });
  } catch (error: any) {
    console.error('Error in GET /api/agency/fee-submissions:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch fee submissions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['AGENCY']);
    if (authorization.response) return authorization.response;
    const body = await request.json();
    const { serviceName, country, amountBdt, whenCharged, refundPolicy, proofDocumentUrls } = body;

    if (!serviceName || !country || amountBdt === undefined || !whenCharged) {
      return NextResponse.json(
        { success: false, error: 'serviceName, country, amountBdt, and whenCharged are required' },
        { status: 400 }
      );
    }

    const agency = db.getAgencies().find((candidate) => candidate.ownerUserId === authorization.user.id);
    if (!agency) {
      return NextResponse.json({ success: false, error: 'No agency profile is linked to this account.' }, { status: 404 });
    }

    const submission = db.createAgencyFeeSubmission({
      agencyId: agency.id,
      agencyName: agency.name,
      country,
      serviceName,
      amountBdt: Number(amountBdt),
      whenCharged,
      refundable: body.refundable !== undefined ? Boolean(body.refundable) : true,
      refundPolicy: refundPolicy || 'Full refund if admission milestone is not met per escrow schedule',
      proofDocumentUrls: Array.isArray(proofDocumentUrls) && proofDocumentUrls.length > 0 ? proofDocumentUrls : ['/uploads/license_proof.pdf'],
    });

    return NextResponse.json({
      success: true,
      message: `Fee package '${submission.serviceName}' submitted for Admin verification.`,
      submission,
    });
  } catch (error: any) {
    console.error('Error in POST /api/agency/fee-submissions:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create fee submission' }, { status: 500 });
  }
}
