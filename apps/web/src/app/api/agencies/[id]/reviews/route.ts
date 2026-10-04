import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, handleApiError } from '@/lib/api/response';
import { requireRole } from '@/lib/auth/authorization';
import { sameOrigin } from '@/lib/auth/registration';
import { sendNotification } from '@/lib/notifications';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional(),
  text: z.string().trim().min(10, 'Review must be at least 10 characters long').max(2000, 'Review cannot exceed 2000 characters'),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const reviews = await prisma.review.findMany({
      where: { agencyId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        rating: true,
        title: true,
        text: true,
        isVerified: true,
        createdAt: true,
        student: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title ?? null,
        comment: r.text,
        isVerified: r.isVerified,
        authorName: r.student?.name ? `${r.student.name.charAt(0)}***` : 'Verified Student',
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['STUDENT']);
    if (auth.response) return auth.response;
    if (!sameOrigin(request)) return apiError('FORBIDDEN', 'A same-origin request is required.', 403);

    const { id: agencyId } = await context.params;
    const body = await request.json();
    const input = reviewSchema.parse(body);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, ownerUserId: true },
    });
    if (!agency) {
      return apiError('NOT_FOUND', 'Agency not found.', 404);
    }

    const existingReview = await prisma.review.findFirst({
      where: { studentId: auth.user.id, agencyId: agency.id },
    });
    if (existingReview) {
      return apiError('CONFLICT', 'You have already submitted a review for this agency.', 409);
    }

    const application = await prisma.application.findFirst({
      where: { studentId: auth.user.id, agencyId: agency.id },
      select: { id: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          studentId: auth.user.id,
          agencyId: agency.id,
          applicationId: application?.id ?? null,
          rating: input.rating,
          title: input.title || null,
          text: input.text,
          isVerified: Boolean(application),
        },
        select: {
          id: true,
          rating: true,
          title: true,
          text: true,
          isVerified: true,
          createdAt: true,
        },
      });

      const agg = await tx.review.aggregate({
        where: { agencyId: agency.id },
        _avg: { rating: true },
        _count: { id: true },
      });

      const updatedRating = Number((agg._avg.rating ?? input.rating).toFixed(1));
      const updatedCount = agg._count.id;

      await tx.agency.update({
        where: { id: agency.id },
        data: {
          rating: updatedRating,
          reviewCount: updatedCount,
        },
      });

      return {
        review: newReview,
        newRating: updatedRating,
        newCount: updatedCount,
      };
    });

    if (agency.ownerUserId) {
      try {
        await sendNotification({
          userId: agency.ownerUserId,
          type: 'APPLICATION',
          title: `New Student Review (${input.rating} ⭐)`,
          message: `A student submitted a ${input.rating}-star review for ${agency.name}: "${input.text.slice(0, 80)}${input.text.length > 80 ? '...' : ''}"`,
          entityType: 'AGENCY',
          entityId: agency.id,
        });
      } catch {
        // Best-effort notification
      }
    }

    return NextResponse.json(
      {
        review: {
          id: result.review.id,
          rating: result.review.rating,
          title: result.review.title,
          comment: result.review.text,
          isVerified: result.review.isVerified,
          authorName: `${auth.user.email.charAt(0).toUpperCase()}***`,
          createdAt: result.review.createdAt.toISOString(),
        },
        agency: {
          rating: result.newRating,
          reviewCount: result.newCount,
        },
        message: 'Your verified review has been published successfully.',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
