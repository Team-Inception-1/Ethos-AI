import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/authorization';
import { sameOrigin } from '@/lib/auth/registration';
import { apiError, handleApiError } from '@/lib/api/response';
import { sendNotification } from '@/lib/notifications';

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
    const raw = input.identifier.trim();
    const normalizedEmail = raw.toLowerCase();
    const formattedCode = raw.toUpperCase().startsWith('ETHOS-') ? raw : `ETHOS-${raw}`;

    const student = await prisma.user.findFirst({
      where: {
        role: 'STUDENT',
        OR: [
          { email: { equals: normalizedEmail, mode: 'insensitive' } },
          { studentProfile: { is: { linkCode: { equals: raw, mode: 'insensitive' } } } },
          { studentProfile: { is: { linkCode: { equals: formattedCode, mode: 'insensitive' } } } },
        ],
      },
      select: { id: true, isVerified: true, name: true, email: true },
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

    await sendNotification({
      userId: student.id,
      type: 'VERIFICATION',
      title: 'New Guardian Link Request',
      message: `A parent/guardian (${authorization.user.email}) requested to link as your ${input.relationship}. Review and approve in your profile settings.`,
      entityType: 'COMMUNITY',
      entityId: '/dashboard/profile',
    });

    return NextResponse.json({ data: { message: 'Link request sent. The student must approve it in their profile.' } }, { status: 201 });
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
      include: { parent: { select: { id: true, name: true, email: true } } },
    });
    if (!link) return apiError('NOT_FOUND', 'Pending guardian request not found.', 404);
    if (input.decision === 'approve') {
      await prisma.parentLink.update({ where: { id: link.id }, data: { isApproved: true, linkedAt: new Date() } });

      await sendNotification({
        userId: link.parentId,
        type: 'VERIFICATION',
        title: 'Guardian Link Approved',
        message: `Your student (${authorization.user.email}) has approved your guardian link request. You now have access to their dashboard and applications.`,
        entityType: 'COMMUNITY',
        entityId: '/dashboard',
      });

      return NextResponse.json({ data: { message: 'Guardian request approved.' } });
    }
    await prisma.parentLink.delete({ where: { id: link.id } });

    await sendNotification({
      userId: link.parentId,
      type: 'VERIFICATION',
      title: 'Guardian Link Declined',
      message: `The student (${authorization.user.email}) declined the guardian link request.`,
      entityType: 'COMMUNITY',
      entityId: '/dashboard/profile',
    });

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
