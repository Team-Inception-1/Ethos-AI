import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = db.getAdminUsers();
    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, isVerified, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const updated = db.updateUserAdmin(userId, { isVerified, role });

    return NextResponse.json({
      success: true,
      user: updated,
      message: `User '${updated.name}' updated successfully.`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
