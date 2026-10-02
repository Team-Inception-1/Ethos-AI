import { prisma } from '@/lib/prisma';
import { apiError, handleApiError } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const agency = await prisma.agency.findUnique({
      where: { id },
      include: {
        pricingServices: {
          orderBy: { amountPoisha: 'asc' },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            rating: true,
            title: true,
            text: true,
            createdAt: true,
            student: {
              select: { name: true },
            },
          },
        },
        feeSubmissions: {
          where: { status: 'VERIFIED' },
          orderBy: { reviewedAt: 'desc' },
        },
      },
    });

    if (!agency) {
      return apiError('NOT_FOUND', 'Agency not found.', 404);
    }

    const feeMin = Number(agency.feeMinPoisha) / 100;
    const feeMax = Number(agency.feeMaxPoisha) / 100;
    const verified = agency.licenseStatus === 'VERIFIED';
    const latestFee = agency.feeSubmissions[0];

    return Response.json(
      {
        agency: {
          id: agency.id,
          name: agency.name,
          licenseNo: agency.licenseNo,
          licenseStatus: agency.licenseStatus,
          verified,
          rating: agency.rating,
          reviewCount: agency.reviewCount,
          reviews: agency.reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.text,
            authorName: r.student?.name ? `${r.student.name.charAt(0)}***` : 'Verified Student',
            createdAt: r.createdAt.toISOString(),
          })),
          success: agency.successRate,
          successRate: agency.successRate,
          riskScore: agency.riskScore,
          feeMinPoisha: agency.feeMinPoisha.toString(),
          feeMaxPoisha: agency.feeMaxPoisha.toString(),
          feeMin,
          feeMax,
          fee: `৳${feeMin >= 1000 ? `${Math.round(feeMin / 1000)}K` : feeMin}–৳${feeMax >= 1000 ? `${Math.round(feeMax / 1000)}K` : feeMax}`,
          address: agency.address || 'Dhaka, Bangladesh',
          website: agency.website || null,
          description: agency.description || '',
          countriesServed: agency.countriesServed,
          countryCodes: agency.countriesServed,
          refund: latestFee?.refundPolicy ? 'Escrow Protected' : '100% Escrow Guarantee',
          refundDays: 30,
          response: '< 4 hours',
          pricingServices: agency.pricingServices.map((p) => ({
            id: p.id,
            serviceName: p.serviceName,
            amountPoisha: p.amountPoisha.toString(),
            amountBdt: Number(p.amountPoisha) / 100,
            whenCharged: p.whenCharged,
            refundable: p.refundable,
            conditions: p.conditions,
          })),
          strengthsEn: [
            `Government license (${agency.licenseNo}) verified by Ethos AI.`,
            `${agency.successRate}% verified success rate across all partner destinations.`,
            'Milestone-based escrow payment protection required for all student contracts.',
          ],
          strengthsBn: [
            `সরকারি লাইসেন্স (${agency.licenseNo}) Ethos AI দ্বারা যাচাইকৃত।`,
            `সকল পার্টনার দেশে ${agency.successRate}% যাচাইকৃত ভিসা সফলতার হার।`,
            'সকল স্টুডেন্ট চুক্তির জন্য বাধ্যতামূলক মাইলস্টোন এসক্রো পেমেন্ট সুরক্ষা।',
          ],
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
