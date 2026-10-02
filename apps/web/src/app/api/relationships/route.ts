import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { sameOrigin } from '@/lib/auth/registration';
import { apiError, handleApiError } from '@/lib/api/response';

const requestSchema = z.object({
  identifier: z.string().trim().min(3).max(320),
  relationship: z.string().trim().min(2).max(40).default('Guardian'),
}).strict();

const decisionSchema = z.object({
  linkId: z.string().uuid(),
  decision: z.enum(['approve', 'reject']),
}).strict();

const unlinkSchema = z.object({
  linkId: z.string().uuid().optional(),
  studentId: z.string().min(1).optional(),
}).strict().refine(value => value.linkId || value.studentId, { message: 'A relationship must be selected.' });

function requireOrigin(request: Request) {
  return sameOrigin(request) ? null : apiError('FORBIDDEN', 'A same-origin request is required.', 403);
}

export async function POST(request: Request) {
  try {
    const authorization = await requireRole(['PARENT']);
    if (authorization.response) return authorization.response;
    const originError = requireOrigin(request);
    if (originError) return originError;
    const input = requestSchema.parse(await request.json());
    const normalized = input.identifier.toLowerCase();
    const student = await prisma.user.findFirst({
      where: {
        role: 'STUDENT',
        OR: [
          { email: normalized },
          { studentProfile: { is: { linkCode: input.identifier.toUpperCase() } } },
        ],
      },
      select: { id: true, isVerified: true },
    });
    if (!student) return apiError('NOT_FOUND', 'No student account matches that email or link code.', 404);
    if (!student.isVerified) return apiError('STUDENT_NOT_VERIFIED', 'The student must verify their account before linking.', 409);

    const existing = await prisma.parentLink.findUnique({
      where: { parentId_studentId: { parentId: authorization.user.id, studentId: student.id } },
      select: { isApproved: true },
    });
    if (existing?.isApproved) return apiError('ALREADY_LINKED', 'This student is already linked to your account.', 409);
    if (existing) return apiError('REQUEST_PENDING', 'The student has not responded to your existing request yet.', 409);

    await prisma.parentLink.create({ data: {
      parentId: authorization.user.id,
      studentId: student.id,
      relationship: input.relationship,
      isApproved: false,
    } });
    return NextResponse.json({ data: { message: 'Link request sent. The student must approve it.' } }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await requireRole(['STUDENT']);
    if (authorization.response) return authorization.response;
    const originError = requireOrigin(request);
    if (originError) return originError;
    const input = decisionSchema.parse(await request.json());
    const link = await prisma.parentLink.findFirst({
      where: { id: input.linkId, studentId: authorization.user.id, isApproved: false },
      select: { id: true },
    });
    if (!link) return apiError('NOT_FOUND', 'Pending guardian request not found.', 404);
    if (input.decision === 'approve') {
      await prisma.parentLink.update({ where: { id: link.id }, data: { isApproved: true, linkedAt: new Date() } });
      return NextResponse.json({ data: { message: 'Guardian request approved.' } });
    }
    await prisma.parentLink.delete({ where: { id: link.id } });
    return NextResponse.json({ data: { message: 'Guardian request rejected.' } });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await requireRole(['PARENT', 'STUDENT']);
    if (authorization.response) return authorization.response;
    const originError = requireOrigin(request);
    if (originError) return originError;
    const input = unlinkSchema.parse(await request.json());
    const link = await prisma.parentLink.findFirst({ where: {
      ...(input.linkId ? { id: input.linkId } : { studentId: input.studentId }),
      ...(authorization.user.role === 'PARENT'
        ? { parentId: authorization.user.id }
        : { studentId: authorization.user.id }),
    }, select: { id: true } });
    if (!link) return apiError('NOT_FOUND', 'Relationship not found.', 404);
    await prisma.parentLink.delete({ where: { id: link.id } });
    return NextResponse.json({ data: { message: 'Relationship removed.' } });
  } catch (error) { return handleApiError(error); }
}
