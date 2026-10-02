import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/authorization';
import { sameOrigin } from '@/lib/auth/registration';
import { apiError, handleApiError } from '@/lib/api/response';

const shortlistSchema = z.object({
  catalogId: z.string().min(1).max(100),
});

export async function GET() {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;

  try {
    const shortlists = await prisma.counselorShortlist.findMany({
      where: { userId: authorization.user.id },
      include: {
        catalog: {
          select: {
            id: true,
            universityName: true,
            programName: true,
            country: true,
            city: true,
            degreeLevel: true,
            annualTuitionPoisha: true,
            officialCatalogUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(
      {
        shortlists: shortlists.map((s) => ({
          id: s.id,
          catalogId: s.catalogId,
          universityName: s.catalog.universityName,
          programName: s.catalog.programName,
          country: s.catalog.country,
          city: s.catalog.city,
          degreeLevel: s.catalog.degreeLevel,
          annualTuitionBdt: Number(s.catalog.annualTuitionPoisha) / 100,
          officialCatalogUrl: s.catalog.officialCatalogUrl,
          createdAt: s.createdAt.toISOString(),
        })),
        trackedIds: shortlists.map((s) => s.catalogId),
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);

  try {
    const body = shortlistSchema.parse(await request.json());

    // Verify catalog exists
    const catalog = await prisma.universityCourseCatalog.findUnique({
      where: { id: body.catalogId },
    });
    if (!catalog) {
      return apiError('NOT_FOUND', 'University catalog record not found.', 404);
    }

    const shortlist = await prisma.counselorShortlist.upsert({
      where: {
        userId_catalogId: {
          userId: authorization.user.id,
          catalogId: body.catalogId,
        },
      },
      update: {},
      create: {
        userId: authorization.user.id,
        catalogId: body.catalogId,
      },
    });

    return Response.json({ success: true, shortlist }, { status: 201 });
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
    const catalogIdParam = searchParams.get('catalogId');
    let catalogId = catalogIdParam;

    if (!catalogId) {
      try {
        const body = (await request.json()) as { catalogId?: string };
        catalogId = body.catalogId ?? null;
      } catch {
        // ignore JSON parse error if body is empty
      }
    }

    if (!catalogId) {
      return apiError('VALIDATION_ERROR', 'catalogId is required.', 400);
    }

    await prisma.counselorShortlist.deleteMany({
      where: {
        userId: authorization.user.id,
        catalogId,
      },
    });

    return Response.json({ success: true, message: 'Removed from shortlist.' });
  } catch (error) {
    return handleApiError(error);
  }
}
