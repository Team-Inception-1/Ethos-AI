import { z } from 'zod';

export const currentUserSchema = z.object({
  id: z.string().min(1), name: z.string(), email: z.email(), phone: z.string(),
  role: z.enum(['student', 'parent', 'agency', 'admin']), isVerified: z.boolean(),
  avatarUrl: z.string().optional(), createdAt: z.string(),
  linkedParentIds: z.array(z.string()), linkedStudentIds: z.array(z.string()),
  studentDetails: z.object({ targetCountries: z.array(z.string()), targetField: z.string(),
    budgetRange: z.string(), ieltsScore: z.string(), linkCode: z.string() }).optional(),
  agencyDetails: z.object({ agencyName: z.string(), licenseNo: z.string(),
    licenseStatus: z.enum(['verified', 'pending', 'rejected', 'suspended']), countriesServed: z.array(z.string()) }).optional(),
});

export type User = z.infer<typeof currentUserSchema>;
export type UserRole = User['role'];
export type StudentDetails = NonNullable<User['studentDetails']>;
export type AgencyDetails = NonNullable<User['agencyDetails']>;
