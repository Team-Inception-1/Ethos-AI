import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { profileDTO, profileInclude } from '@/lib/auth/profile';
import { apiError, handleApiError } from '@/lib/api/response';

const profileUpdates = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/).optional(),
  studentDetails: z.object({
    targetCountries: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
    targetField: z.string().trim().max(200).optional(),
    budgetRange: z.string().trim().max(100).optional(),
    ieltsScore: z.string().trim().max(100).optional(),
  }).optional(),
}); // Identity, role, verification, relationships and avatar keys are not writable here.

export async function GET() {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const user = await prisma.user.findUnique({ where: { id: authorization.user.id }, include: profileInclude });
    if (!user) return apiError('NOT_FOUND', 'Profile not found.', 404);
    return NextResponse.json({ data: profileDTO(user) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return handleApiError(error); }
}

export async function PUT(request: Request) {
  try {
    const authorization = await requireUser();
    if (authorization.response) return authorization.response;
    const { studentDetails, ...updates } = profileUpdates.parse(await request.json());
    if (studentDetails && authorization.user.role !== 'STUDENT') return apiError('FORBIDDEN', 'Only students can update student details.', 403);
    const user = await prisma.user.update({ where: { id: authorization.user.id }, data: {
      ...updates,
      ...(studentDetails ? { studentProfile: { update: studentDetails } } : {}),
    }, include: profileInclude });
    return NextResponse.json({ data: profileDTO(user) });
  } catch (error) { return handleApiError(error); }
}
