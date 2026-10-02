import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import campusLivingData from '@/data/campusLivingData.json';

/**
 * GET /api/campus-living
 * Reads from Neon PostgreSQL CampusUniversity & CampusArea models.
 * Automatically seeds the database if records have not yet been inserted.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim();
    const region = searchParams.get('region')?.toLowerCase().trim();

    // Ensure database records exist
    const count = await prisma.campusUniversity.count();
    if (count === 0) {
      for (const u of campusLivingData) {
        await prisma.campusUniversity.upsert({
          where: { id: u.id },
          update: {},
          create: {
            id: u.id,
            name: u.name,
            shortName: u.shortName,
            city: u.city,
            state: u.state ?? null,
            country: u.country,
            region: u.region,
            currency: u.currency,
            currencySymbol: u.currencySymbol,
            exchangeRateBdt: u.exchangeRateBDT,
            dormSituation: u.dormSituation,
            sourceUrl: 'https://ethos-ai.com/campus-living/audit',
            sourceTitle: `${u.shortName} Official Living & Housing Schedule 2026/2027`,
            lastAuditedAt: new Date(),
            areas: {
              create: u.areas.map((a) => ({
                id: `${u.id}-${a.id}`,
                name: a.name,
                distance: a.distance,
                walkTime: a.walkTime,
                commuteType: a.commuteType,
                safetyScore: a.safetyScore,
                description: a.description,
                groceryOptions: a.groceryOptions,
                rent: a.rent as any,
                utilitiesMonthly: a.utilitiesMonthly as any,
                foodGroceries: a.foodGroceries as any,
                shoppingPersonal: a.shoppingPersonal as any,
                transportation: a.transportation as any,
                healthMisc: a.healthMisc as any,
                sourceUrl: 'https://ethos-ai.com/campus-living/audit',
                lastAuditedAt: new Date(),
              })),
            },
          },
        });
      }
    }

    const where: any = {};
    if (region && region !== 'all') {
      where.region = { equals: region, mode: 'insensitive' };
    }

    let universities = await prisma.campusUniversity.findMany({
      where,
      include: {
        areas: {
          orderBy: { safetyScore: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (query) {
      universities = universities.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.shortName.toLowerCase().includes(query) ||
          u.city.toLowerCase().includes(query) ||
          u.country.toLowerCase().includes(query) ||
          u.areas.some((area) => area.name.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      total: universities.length,
      universities: universities.map((u) => ({
        id: u.id,
        name: u.name,
        shortName: u.shortName,
        city: u.city,
        state: u.state,
        country: u.country,
        region: u.region,
        currency: u.currency,
        currencySymbol: u.currencySymbol,
        exchangeRateBDT: u.exchangeRateBdt,
        dormSituation: u.dormSituation,
        sourceUrl: u.sourceUrl,
        sourceTitle: u.sourceTitle,
        lastAuditedAt: u.lastAuditedAt ? u.lastAuditedAt.toISOString() : null,
        areas: u.areas.map((a) => ({
          id: a.id.replace(`${u.id}-`, ''),
          name: a.name,
          distance: a.distance,
          walkTime: a.walkTime,
          commuteType: a.commuteType,
          safetyScore: a.safetyScore,
          description: a.description,
          groceryOptions: a.groceryOptions,
          rent: a.rent,
          utilitiesMonthly: a.utilitiesMonthly,
          foodGroceries: a.foodGroceries,
          shoppingPersonal: a.shoppingPersonal,
          transportation: a.transportation,
          healthMisc: a.healthMisc,
        })),
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching campus living data:', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Failed to fetch campus living data.' } },
      { status: 500 }
    );
  }
}
