import type { Prisma } from '@prisma/client';

export const profileInclude = {
  studentProfile: true,
  agencyProfile: true,
  parentLinksAsParent: {
    include: { student: { include: { studentProfile: true } } },
    orderBy: { linkedAt: 'desc' },
  },
  parentLinksAsStudent: {
    include: { parent: true },
    orderBy: { linkedAt: 'desc' },
  },
} as const;

type Profile = Prisma.UserGetPayload<{ include: typeof profileInclude }>;

function relationshipUser(user: Profile['parentLinksAsParent'][number]['student'] | Profile['parentLinksAsStudent'][number]['parent']) {
  const studentProfile = 'studentProfile' in user ? user.studentProfile : null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role.toLowerCase(),
    isVerified: user.isVerified,
    avatarUrl: user.avatarUrl ?? '',
    createdAt: user.createdAt.toISOString(),
    studentDetails: studentProfile ? {
      targetCountries: studentProfile.targetCountries,
      targetField: studentProfile.targetField ?? '',
      budgetRange: studentProfile.budgetRange ?? '',
      ieltsScore: studentProfile.ieltsScore ?? '',
      linkCode: studentProfile.linkCode,
    } : undefined,
  };
}

export function profileDTO(user: Profile) {
  const approvedStudents = user.parentLinksAsParent.filter(link => link.isApproved);
  const approvedParents = user.parentLinksAsStudent.filter(link => link.isApproved);
  return {
    id: user.id, email: user.email, name: user.name, phone: user.phone,
    role: user.role.toLowerCase(), isVerified: user.isVerified,
    avatarUrl: user.avatarUrl ?? '', createdAt: user.createdAt.toISOString(),
    linkedStudentIds: approvedStudents.map(link => link.studentId),
    linkedParentIds: approvedParents.map(link => link.parentId),
    linkedStudents: approvedStudents.map(link => ({ ...relationshipUser(link.student), relationshipId: link.id })),
    linkedParents: approvedParents.map(link => ({ ...relationshipUser(link.parent), relationshipId: link.id })),
    pendingGuardianRequests: user.parentLinksAsStudent.filter(link => !link.isApproved).map(link => ({
      id: link.id,
      relationship: link.relationship,
      requestedAt: link.linkedAt.toISOString(),
      parent: relationshipUser(link.parent),
    })),
    pendingStudentRequests: user.parentLinksAsParent.filter(link => !link.isApproved).map(link => ({
      id: link.id,
      relationship: link.relationship,
      requestedAt: link.linkedAt.toISOString(),
      student: relationshipUser(link.student),
    })),
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
