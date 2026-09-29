import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export type PlatformRole = 'STUDENT' | 'PARENT' | 'AGENCY' | 'ADMIN';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: PlatformRole;
  isVerified: boolean;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const { data } = await auth.getSession();
  const sessionUser = data?.user;

  if (!sessionUser?.id || !sessionUser.email) return null;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: sessionUser.id }, { email: sessionUser.email.toLowerCase() }],
    },
    select: { id: true, email: true, role: true, isVerified: true },
  });

  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, error: 'Authentication is required.' }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ success: false, error: 'You are not authorized to perform this action.' }, { status: 403 });
}

export async function requireRole(roles: readonly PlatformRole[]) {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, response: unauthorizedResponse() };
  if (!roles.includes(user.role)) return { user: null, response: forbiddenResponse() };
  return { user, response: null };
}
