import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/authorization';

export async function GET(request: Request) {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const submissions = db.getAgencyFeeSubmissions(undefined, status);
    return NextResponse.json({ success: true, count: submissions.length, submissions });
  } catch (error: any) {
    console.error('Error in GET /api/admin/fee-submissions:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch submissions for review' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    const body = await request.json();
    const { submissionId, action, adminFeedback } = body;

    if (!submissionId || !action) {
      return NextResponse.json(
        { success: false, error: 'submissionId and action (APPROVED or REJECTED) are required' },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'APPROVED' or 'REJECTED'" },
        { status: 400 }
      );
    }

    const reviewed = db.reviewAgencyFeeSubmission(
      submissionId,
      action,
      adminFeedback || (action === 'APPROVED' ? 'Verified against agency trade license and student escrow terms.' : 'Rejected due to non-compliant terms.'),
      authorization.user.id
    );

    return NextResponse.json({
      success: true,
      message: `Fee submission for '${reviewed.agencyName}' was ${action.toLowerCase()}.`,
      submission: reviewed,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/fee-submissions:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to review fee submission' }, { status: 500 });
  }
}
