import type { Prisma } from '@prisma/client';

export const profileInclude = {
  studentProfile: true, agencyProfile: true,
  parentLinksAsParent: { where: { isApproved: true }, select: { studentId: true } },
  parentLinksAsStudent: { where: { isApproved: true }, select: { parentId: true } },
} as const;

export function profileDTO(user: Prisma.UserGetPayload<{ include: typeof profileInclude }>) {
  return {
    id: user.id, email: user.email, name: user.name, phone: user.phone,
    role: user.role.toLowerCase(), isVerified: user.isVerified,
    avatarUrl: user.avatarUrl ?? '', createdAt: user.createdAt.toISOString(),
    linkedStudentIds: user.parentLinksAsParent.map(link => link.studentId),
    linkedParentIds: user.parentLinksAsStudent.map(link => link.parentId),
    studentDetails: user.studentProfile ? {
      targetCountries: user.studentProfile.targetCountries, targetField: user.studentProfile.targetField ?? '',
      budgetRange: user.studentProfile.budgetRange ?? '', ieltsScore: user.studentProfile.ieltsScore ?? '',
      linkCode: user.studentProfile.linkCode,
    } : undefined,
    agencyDetails: user.agencyProfile ? {
      agencyName: user.agencyProfile.name, licenseNo: user.agencyProfile.licenseNo,
      licenseStatus: user.agencyProfile.licenseStatus.toLowerCase(), countriesServed: user.agencyProfile.countriesServed,
    } : undefined,
  };
}
