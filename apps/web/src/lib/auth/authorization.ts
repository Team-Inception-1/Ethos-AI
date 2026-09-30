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
  try {
    const { data } = await auth.getSession();
    const sessionUser = data?.user;

    if (sessionUser?.id && sessionUser.email && sessionUser.emailVerified) {
      const select = { id: true, email: true, role: true, isVerified: true } as const;
      const byId = await prisma.user.findUnique({ where: { id: sessionUser.id }, select });
      if (byId) return byId.email.toLowerCase() === sessionUser.email.toLowerCase() ? byId : null;
      // Preserve legacy platform IDs and foreign keys, but associate by email
      // only after Neon proves ownership of that email.
      const user = await prisma.user.findUnique({
        where: { email: sessionUser.email.toLowerCase() },
        select: { id: true, email: true, role: true, isVerified: true },
      });

      if (user) return user;
    }
  } catch {
    // Session/database failure must never grant access.
  }

  return null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' } }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You are not authorized to perform this action.' } }, { status: 403 });
}

export async function requireRole(roles: readonly PlatformRole[]) {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, response: unauthorizedResponse() };
  if (!roles.includes(user.role)) return { user: null, response: forbiddenResponse() };
  return { user, response: null };
}

export const requireUser = () => requireRole(['STUDENT', 'PARENT', 'AGENCY', 'ADMIN']);
