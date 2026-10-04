import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';
import { apiError, handleApiError } from '@/lib/api/response';
import { readRegistration, REGISTRATION_COOKIE, sameOrigin } from '@/lib/auth/registration';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
  try {
    const { data } = await auth.getSession();
    const identity = data?.user;
    if (!identity?.id || !identity.emailVerified) return apiError('EMAIL_NOT_VERIFIED', 'Verify your email before completing registration.', 401);
    const email = identity.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    const store = await cookies();
    if (existing) {
      // Public input must never replace legacy IDs, roles or existing data.
      store.delete(REGISTRATION_COOKIE);
      return NextResponse.json({ data: { id: existing.id } });
    }
    const draft = readRegistration(store.get(REGISTRATION_COOKIE)?.value, process.env.NEON_AUTH_COOKIE_SECRET ?? '');
    if (!draft || draft.accountId !== identity.id || draft.email !== email) {
      return apiError('REGISTRATION_EXPIRED', 'Your registration details expired. Start registration again or contact support.', 409);
    }
    const roles = { student: 'STUDENT', parent: 'PARENT', agency: 'AGENCY' } as const;
    const profile = await prisma.user.create({ data: {
      id: identity.id, name: draft.name, email, phone: draft.phone, role: roles[draft.role], isVerified: draft.role !== 'agency',
      ...(draft.role === 'student' ? { studentProfile: { create: { targetCountries: [], linkCode: 'ETHOS-STU-' + Math.floor(1000 + Math.random() * 9000) } } } : {}),
      ...(draft.role === 'agency' ? {
        agencyProfile: {
          create: {
            name: draft.name,
            licenseNo: 'MOE-BD-' + (new Date().getFullYear()) + '-' + Math.floor(100 + Math.random() * 900),
            licenseStatus: 'PENDING',
            countriesServed: ['CAN', 'GBR', 'USA', 'AUS'],
            rating: 0,
            reviewCount: 0,
            successRate: 0,
            description: 'Study-abroad consultancy awaiting administrative credential verification.',
          },
        },
      } : {}),
    }, select: { id: true } });
    store.delete(REGISTRATION_COOKIE);
    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
