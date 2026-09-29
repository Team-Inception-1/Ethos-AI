import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/authorization';

export async function GET() {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    const rawAgencies = db.getAgencies();
    const agencies = rawAgencies.map((agency) => {
      const owner = db.getUserById(agency.ownerUserId);
      const pricings = db.getAgencyPricing(agency.id);
      return {
        ...agency,
        owner: owner ? { name: owner.name, email: owner.email, phone: owner.phone } : null,
        pricingsCount: pricings.length,
        submittedDocs: [
          { name: 'Trade License & Ministry Authorization', status: 'verified', size: '2.4 MB' },
          { name: 'University Agency Representation Agreement', status: 'verified', size: '1.8 MB' },
          { name: 'Tax Clearance Certificate (TIN/BIN)', status: 'verified', size: '950 KB' },
        ],
      };
    });

    return NextResponse.json({
      success: true,
      agencies,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/agencies:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch agencies' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['ADMIN']);
    if (authorization.response) return authorization.response;
    const body = await request.json();
    const { agencyId, action, note } = body;

    if (!agencyId || !action) {
      return NextResponse.json(
        { error: 'agencyId and action are required' },
        { status: 400 }
      );
    }

    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(action)) {
      return NextResponse.json(
        { error: `Invalid action '${action}'. Must be VERIFIED, REJECTED, or PENDING.` },
        { status: 400 }
      );
    }

    const updated = db.updateAgencyStatus(agencyId, action, note);

    return NextResponse.json({
      success: true,
      agency: updated,
      message: `Agency '${updated.name}' status set to ${action}.`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/agencies:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update agency status' },
      { status: 500 }
    );
  }
}
