import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  campusUniversityCount: vi.fn(),
  campusUniversityUpsert: vi.fn(),
  campusUniversityFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    campusUniversity: {
      count: mocks.campusUniversityCount,
      upsert: mocks.campusUniversityUpsert,
      findMany: mocks.campusUniversityFindMany,
    },
  },
}));

import { GET } from './route';

const sampleVarsity = {
  id: 'mit',
  name: 'Massachusetts Institute of Technology (MIT)',
  shortName: 'MIT',
  city: 'Cambridge',
  state: 'Massachusetts',
  country: 'United States',
  region: 'North America',
  currency: 'USD',
  currencySymbol: '$',
  exchangeRateBdt: 121.5,
  dormSituation: 'Severe dorm shortage.',
  sourceUrl: 'https://ethos-ai.com/campus-living/audit',
  sourceTitle: 'MIT Official Living & Housing Schedule 2026/2027',
  lastAuditedAt: new Date('2026-03-01T00:00:00Z'),
  areas: [
    {
      id: 'mit-kendall-sq',
      name: 'Kendall Square',
      distance: '0.3 miles',
      walkTime: '5 mins walk',
      commuteType: 'Walking',
      safetyScore: 9.5,
      description: 'Right on MIT border',
      groceryOptions: 'Whole Foods',
      rent: { sharedRoom: 1650, oneBedroom: 3400 },
      utilitiesMonthly: { single: 190, spouse: 250 },
      foodGroceries: { cookingAtHome: 420, diningOut: 160 },
      shoppingPersonal: { single: 160, spouse: 280 },
      transportation: { single: 90, spouse: 180 },
      healthMisc: { single: 340, spouse: 820 },
    },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
});

it('returns 200 with list of universities from database', async () => {
  mocks.campusUniversityCount.mockResolvedValue(1);
  mocks.campusUniversityFindMany.mockResolvedValue([sampleVarsity]);

  const request = new Request('http://localhost/api/campus-living');
  const response = await GET(request);

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.total).toBe(1);
  expect(data.universities[0]).toMatchObject({
    id: 'mit',
    name: 'Massachusetts Institute of Technology (MIT)',
    exchangeRateBDT: 121.5,
    sourceTitle: 'MIT Official Living & Housing Schedule 2026/2027',
  });
  expect(data.universities[0].areas).toHaveLength(1);
  expect(data.universities[0].areas[0].id).toBe('kendall-sq');
});

it('filters universities by query parameter', async () => {
  mocks.campusUniversityCount.mockResolvedValue(1);
  mocks.campusUniversityFindMany.mockResolvedValue([sampleVarsity]);

  const request = new Request('http://localhost/api/campus-living?q=cambridge');
  const response = await GET(request);

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.total).toBe(1);
  expect(data.universities[0].id).toBe('mit');
});

it('returns 500 if database query fails', async () => {
  mocks.campusUniversityCount.mockRejectedValue(new Error('Neon DB Offline'));

  const request = new Request('http://localhost/api/campus-living');
  const response = await GET(request);

  expect(response.status).toBe(500);
  const data = await response.json();
  expect(data.error.code).toBe('SERVICE_UNAVAILABLE');
});
