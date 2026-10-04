import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { profileDTO, profileInclude } from '@/lib/auth/profile';
import { sameOrigin } from '@/lib/auth/registration';
import { apiError, handleApiError } from '@/lib/api/response';

const profileUpdates = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/).optional(),
  studentDetails: z.object({
    targetCountries: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
    targetField: z.string().trim().max(200).optional(),
    budgetRange: z.string().trim().max(100).optional(),
    ieltsScore: z.string().trim().max(100).optional(),
  }).strict().optional(),
  agencyDetails: z.object({
    agencyName: z.string().trim().min(2).max(160),
    licenseNo: z.string().trim().min(2).max(100),
    countriesServed: z.array(z.string().trim().min(2).max(100)).max(50),
  }).strict().optional(),
}).strict(); // Identity, role, verification, relationships and avatar keys are not writable here.

export async function GET() {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    let user = await prisma.user.findUnique({ where: { id: authorization.user.id }, include: profileInclude });
    if (!user) return apiError('NOT_FOUND', 'Profile not found.', 404);

    if (authorization.user.role === 'STUDENT' && !user.studentProfile && prisma.studentProfile?.create) {
      const code = 'ETHOS-STU-' + Math.floor(1000 + Math.random() * 9000);
      try {
        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            targetCountries: [],
            linkCode: code,
          },
        });
        const reloaded = await prisma.user.findUnique({ where: { id: authorization.user.id }, include: profileInclude });
        if (reloaded) user = reloaded;
      } catch {
        // Continue if profile creation is handled concurrently or mocked in unit tests
      }
    }

    return NextResponse.json({ data: profileDTO(user) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return handleApiError(error); }
}

export async function PUT(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);
    const { studentDetails, agencyDetails, ...updates } = profileUpdates.parse(await request.json());
    if (studentDetails && authorization.user.role !== 'STUDENT') return apiError('FORBIDDEN', 'Only students can update student details.', 403);
    if (agencyDetails && authorization.user.role !== 'AGENCY') return apiError('FORBIDDEN', 'Only agencies can update agency details.', 403);
    const user = await prisma.user.update({ where: { id: authorization.user.id }, data: {
      ...updates,
      ...(studentDetails ? {
        studentProfile: {
          upsert: {
            create: {
              ...studentDetails,
              targetCountries: studentDetails.targetCountries ?? [],
              linkCode: 'ETHOS-STU-' + Math.floor(1000 + Math.random() * 9000),
            },
            update: studentDetails,
          },
        },
      } : {}),
      ...(agencyDetails ? { agencyProfile: { update: {
        name: agencyDetails.agencyName,
        licenseNo: agencyDetails.licenseNo,
        countriesServed: agencyDetails.countriesServed,
        // Changes to legal credentials must be reviewed again by an administrator.
        licenseStatus: 'PENDING',
      } } } : {}),
    }, include: profileInclude });
    return NextResponse.json({ data: profileDTO(user) });
  } catch (error) { return handleApiError(error); }
}
