import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET ? 'configured' : 'unconfigured',
    provider: 'neon_better_auth',
    baseUrl: process.env.NEON_AUTH_BASE_URL || '',
    demoEnabled: process.env.ENABLE_DEMO_AUTH === 'true',
  });
}
