import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNeonAuth } from '@/lib/auth/server';
import { apiError, handleApiError } from '@/lib/api/response';
import { readRegistration, registrationSchema, REGISTRATION_COOKIE, REGISTRATION_TTL, sameOrigin, sealRegistration } from '@/lib/auth/registration';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const input = registrationSchema.parse(await request.json());
    const secret = process.env.NEON_AUTH_COOKIE_SECRET ?? '';
    if (secret.length < 32) return apiError('AUTH_UNAVAILABLE', 'Authentication is not configured.', 503);
    const store = await cookies();
    const pending = readRegistration(store.get(REGISTRATION_COOKIE)?.value, secret);
    if (pending && pending.email === input.email && pending.phone === input.phone && pending.role === input.role && pending.name === input.name) {
      return NextResponse.json({ data: { email: pending.email, requiresVerification: true } });
    }
    const duplicate = await prisma.user.findFirst({ where: { OR: [{ email: input.email }, { phone: input.phone }] }, select: { id: true } });
    if (duplicate) return apiError('ACCOUNT_EXISTS', 'An account with this email or phone already exists. Sign in instead.', 409);
    const result = await getNeonAuth().signUp.email({ email: input.email, name: input.name, password: input.password });
    if (result.error || !result.data?.user?.id) {
      return apiError(result.error?.code ?? 'REGISTRATION_FAILED', result.error?.message ?? 'Registration failed. Please retry.', result.error?.status ?? 400);
    }
    const draft = { name: input.name, email: input.email, phone: input.phone, role: input.role,
      accountId: result.data.user.id, expiresAt: Date.now() + REGISTRATION_TTL * 1000 };
    store.set(REGISTRATION_COOKIE, sealRegistration(draft, secret), {
      httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: REGISTRATION_TTL,
    });
    return NextResponse.json({ data: { email: input.email, requiresVerification: true } }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
