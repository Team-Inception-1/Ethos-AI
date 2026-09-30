import type { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@/lib/auth/authorization';

export function applicationDocumentAccessWhere(user: AuthenticatedUser): Prisma.DocumentWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'STUDENT') return { ownerId: user.id };
  if (user.role === 'PARENT') return { owner: { parentLinksAsStudent: { some: { parentId: user.id, isApproved: true } } } };
  return { application: { stage: { notIn: ['COMPLETED', 'VISA_REJECTED'] },
    agency: { ownerUserId: user.id, licenseStatus: 'VERIFIED' } } };
}

export const applicationSelect = {
  id: true, targetCountry: true, targetUniversity: true, targetProgram: true, intakeSemester: true,
  stage: true, createdAt: true, updatedAt: true,
  agency: { select: { id: true, name: true } }, student: { select: { id: true, name: true } },
} satisfies Prisma.ApplicationSelect;
