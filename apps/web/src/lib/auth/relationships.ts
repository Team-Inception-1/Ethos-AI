import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { AuthenticatedUser } from './authorization';

export function applicationAccessWhere(user: AuthenticatedUser): Prisma.ApplicationWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'STUDENT') return { studentId: user.id };
  if (user.role === 'PARENT') return {
    student: { parentLinksAsStudent: { some: { parentId: user.id, isApproved: true } } },
  };
  return { agency: { ownerUserId: user.id, licenseStatus: 'VERIFIED' } };
}

export async function canAccessApplication(user: AuthenticatedUser, id: string) {
  return !!await prisma.application.findFirst({
    where: { AND: [{ id }, applicationAccessWhere(user)] }, select: { id: true },
  });
}

export async function canAccessDocument(user: AuthenticatedUser, id: string, write = false) {
  const document = await prisma.document.findUnique({ where: { id }, select: { ownerId: true, applicationId: true } });
  if (!document) return false;
  if (user.role === 'ADMIN' || document.ownerId === user.id) return true;
  if (write) return false;
  if (user.role === 'PARENT') return !!await prisma.parentLink.findFirst({
    where: { parentId: user.id, studentId: document.ownerId, isApproved: true }, select: { id: true },
  });
  if (user.role === 'AGENCY' && document.applicationId) return !!await prisma.application.findFirst({
    where: { id: document.applicationId, studentId: document.ownerId,
      stage: { notIn: ['COMPLETED', 'VISA_REJECTED'] },
      agency: { ownerUserId: user.id, licenseStatus: 'VERIFIED' } }, select: { id: true },
  });
  return false;
}

export async function accessibleApplicationIds(user: AuthenticatedUser) {
  return (await prisma.application.findMany({ where: applicationAccessWhere(user), select: { id: true } })).map(a => a.id);
}
