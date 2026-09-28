import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const stats = db.getAdminStats();
    return NextResponse.json({
      success: true,
      stats,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/overview:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch admin overview' },
      { status: 500 }
    );
  }
}
