import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  shortlistFindMany: vi.fn(),
  shortlistUpsert: vi.fn(),
  shortlistDeleteMany: vi.fn(),
  catalogFindUnique: vi.fn(),
}));

vi.mock('@/lib/auth/authorization', () => ({
  requireUser: async () => ({
    user: { id: 'usr-student-01', role: 'STUDENT', email: 'student@example.test' },
    response: null,
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    counselorShortlist: {
      findMany: mocks.shortlistFindMany,
      upsert: mocks.shortlistUpsert,
      deleteMany: mocks.shortlistDeleteMany,
    },
    universityCourseCatalog: {
      findUnique: mocks.catalogFindUnique,
    },
  },
}));

import { GET, POST, DELETE } from './route';

const request = (method: string, body?: unknown, origin = 'http://localhost') =>
  new Request('http://localhost/api/counselor/shortlist', {
    method,
    headers: { origin, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  vi.resetAllMocks();
});

it('GET returns user shortlists and trackedIds', async () => {
  mocks.shortlistFindMany.mockResolvedValue([
    {
      id: 'sl-1',
      catalogId: 'cat-tum-01',
      createdAt: new Date('2026-03-01T00:00:00Z'),
      catalog: {
        id: 'cat-tum-01',
        universityName: 'TUM',
        programName: 'M.Sc. Informatics',
        country: 'Germany',
        city: 'Munich',
        degreeLevel: 'Master',
        annualTuitionPoisha: BigInt(600000),
        officialCatalogUrl: 'https://tum.de',
      },
    },
  ]);

  const response = await GET();
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.trackedIds).toEqual(['cat-tum-01']);
  expect(data.shortlists[0].universityName).toBe('TUM');
});

it('POST upserts catalog into user shortlist', async () => {
  mocks.catalogFindUnique.mockResolvedValue({ id: 'cat-tum-01' });
  mocks.shortlistUpsert.mockResolvedValue({
    id: 'sl-1',
    userId: 'usr-student-01',
    catalogId: 'cat-tum-01',
  });

  const response = await POST(request('POST', { catalogId: 'cat-tum-01' }));
  expect(response.status).toBe(201);
  expect(mocks.shortlistUpsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        userId_catalogId: {
          userId: 'usr-student-01',
          catalogId: 'cat-tum-01',
        },
      },
    })
  );
});

it('POST rejects if catalog does not exist', async () => {
  mocks.catalogFindUnique.mockResolvedValue(null);

  const response = await POST(request('POST', { catalogId: 'non-existent' }));
  expect(response.status).toBe(404);
});

it('DELETE removes catalog from user shortlist', async () => {
  mocks.shortlistDeleteMany.mockResolvedValue({ count: 1 });

  const response = await DELETE(request('DELETE', { catalogId: 'cat-tum-01' }));
  expect(response.status).toBe(200);
  expect(mocks.shortlistDeleteMany).toHaveBeenCalledWith({
    where: {
      userId: 'usr-student-01',
      catalogId: 'cat-tum-01',
    },
  });
});
