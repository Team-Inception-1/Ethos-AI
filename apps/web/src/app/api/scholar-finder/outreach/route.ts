import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { sameOrigin } from '@/lib/auth/registration';
import { apiError, handleApiError } from '@/lib/api/response';

const outreachPostSchema = z.object({
  profId: z.string().min(1).max(100),
  profName: z.string().max(200).optional(),
  university: z.string().max(200).optional(),
  labName: z.string().max(200).optional(),
  stage: z.enum(['shortlisted', 'drafted', 'contacted', 'interviewing', 'offer_received', 'rejected', 'closed']).default('shortlisted'),
  subjectLine: z.string().max(300).optional().nullable(),
  draftedEmail: z.string().max(20000).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  sentAt: z.string().datetime().optional().nullable(),
  followUpDueAt: z.string().datetime().optional().nullable(),
});

const STAGE_MAP: Record<string, 'SHORTLISTED' | 'DRAFTED' | 'CONTACTED' | 'INTERVIEWING' | 'OFFER_RECEIVED' | 'REJECTED' | 'CLOSED'> = {
  shortlisted: 'SHORTLISTED',
  drafted: 'DRAFTED',
  contacted: 'CONTACTED',
  interviewing: 'INTERVIEWING',
  offer_received: 'OFFER_RECEIVED',
  rejected: 'REJECTED',
  closed: 'CLOSED',
};

export async function GET() {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;

  try {
    const outreaches = await prisma.professorOutreach.findMany({
      where: { studentId: authorization.user.id },
      include: {
        professor: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const pipeline = outreaches.map((row) => ({
      id: row.id,
      profId: row.professorId,
      profName: row.professor.name,
      university: row.professor.university,
      labName: row.professor.labName,
      stage: row.stage.toLowerCase() as 'shortlisted' | 'drafted' | 'contacted' | 'interviewing',
      sentAt: row.sentAt ? row.sentAt.toISOString() : undefined,
      draftedEmail: row.emailDraft ?? undefined,
      notes: row.notes ?? undefined,
      followUpDueAt: row.followUpDueAt ? row.followUpDueAt.toISOString() : undefined,
    }));

    return Response.json({ pipeline }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);

  try {
    const body = outreachPostSchema.parse(await request.json());

    // Ensure professor exists
    let professor = await prisma.professor.findUnique({
      where: { id: body.profId },
    });

    if (!professor) {
      professor = await prisma.professor.create({
        data: {
          id: body.profId,
          name: body.profName || 'Faculty Researcher',
          title: 'Professor',
          university: body.university || 'Target Institution',
          department: 'Academic Department',
          country: 'USA',
          tier: 'R1 / Global Top',
          labName: body.labName || 'Research Lab',
          email: `${body.profId.replace(/[^a-zA-Z0-9]/g, '')}@academic.test`,
          primaryDomain: 'Computer Science & AI',
          researchInterests: ['Artificial Intelligence', 'Computational Sciences'],
          activeFundingIndicator: true,
          acceptingStudents: true,
        },
      });
    }

    const prismaStage = STAGE_MAP[body.stage] || 'SHORTLISTED';

    const outreach = await prisma.professorOutreach.upsert({
      where: {
        studentId_professorId: {
          studentId: authorization.user.id,
          professorId: body.profId,
        },
      },
      update: {
        stage: prismaStage,
        subjectLine: body.subjectLine,
        emailDraft: body.draftedEmail,
        notes: body.notes,
        sentAt: body.sentAt ? new Date(body.sentAt) : undefined,
        followUpDueAt: body.followUpDueAt ? new Date(body.followUpDueAt) : undefined,
      },
      create: {
        studentId: authorization.user.id,
        professorId: body.profId,
        stage: prismaStage,
        subjectLine: body.subjectLine,
        emailDraft: body.draftedEmail,
        notes: body.notes,
        sentAt: body.sentAt ? new Date(body.sentAt) : undefined,
        followUpDueAt: body.followUpDueAt ? new Date(body.followUpDueAt) : undefined,
      },
      include: {
        professor: true,
      },
    });

    return Response.json(
      {
        success: true,
        item: {
          id: outreach.id,
          profId: outreach.professorId,
          profName: outreach.professor.name,
          university: outreach.professor.university,
          labName: outreach.professor.labName,
          stage: outreach.stage.toLowerCase(),
          sentAt: outreach.sentAt ? outreach.sentAt.toISOString() : undefined,
          draftedEmail: outreach.emailDraft ?? undefined,
          notes: outreach.notes ?? undefined,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);

  try {
    const { searchParams } = new URL(request.url);
    let profId = searchParams.get('profId');

    if (!profId) {
      try {
        const body = (await request.json()) as { profId?: string };
        profId = body.profId ?? null;
      } catch {
        // ignore body parse
      }
    }

    if (!profId) {
      return apiError('VALIDATION_ERROR', 'profId is required.', 400);
    }

    await prisma.professorOutreach.deleteMany({
      where: {
        studentId: authorization.user.id,
        professorId: profId,
      },
    });

    return Response.json({ success: true, message: 'Outreach item removed.' });
  } catch (error) {
    return handleApiError(error);
  }
}
