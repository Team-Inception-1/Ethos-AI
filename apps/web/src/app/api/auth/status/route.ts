import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'neon_better_auth',
    baseUrl: process.env.NEON_AUTH_BASE_URL || 'https://ep-young-term-axk9zwb2.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth',
  });
}
