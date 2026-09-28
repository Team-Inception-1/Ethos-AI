import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const alerts = db.getScamAlerts();
    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/scam-alerts:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch scam alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alertId, action, adminNote } = body;

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'alertId and action are required' },
        { status: 400 }
      );
    }

    if (!['FLAG_AGENCY', 'BAN_AGENCY', 'DISMISS', 'RESOLVE'].includes(action)) {
      return NextResponse.json(
        { error: `Invalid action '${action}'. Must be FLAG_AGENCY, BAN_AGENCY, DISMISS, or RESOLVE.` },
        { status: 400 }
      );
    }

    const updated = db.resolveScamAlert({
      alertId,
      action,
      adminNote,
    });

    return NextResponse.json({
      success: true,
      alert: updated,
      message: `Scam alert action '${action}' applied successfully.`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/scam-alerts:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update scam alert' },
      { status: 500 }
    );
  }
}
