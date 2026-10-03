import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  professorCount: vi.fn(),
  professorFindMany: vi.fn(),
  professorUpsert: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    professor: {
      count: mocks.professorCount,
      findMany: mocks.professorFindMany,
      upsert: mocks.professorUpsert,
    },
  },
}));

import { GET } from './route';

beforeEach(() => {
  vi.resetAllMocks();
});

it('GET auto-seeds if professor count is 0 and returns professors list', async () => {
  mocks.professorCount.mockResolvedValue(0);
  mocks.professorFindMany.mockResolvedValue([
    {
      id: 'prof-mit-vision',
      name: 'Prof. Antonio Torralba',
      title: 'Professor',
      university: 'MIT',
      department: 'EECS',
      country: 'USA',
      tier: 'R1',
      labName: 'Vision Lab',
      labUrl: 'https://vision.mit.edu',
      email: 'torralba@mit.edu',
      primaryDomain: 'Computer Science & AI',
      researchInterests: ['Computer Vision'],
      activeFundingIndicator: true,
      fundingSources: ['NSF'],
      acceptingStudents: true,
      hIndex: 128,
      citationsCount: 165000,
      labLocation: 'Cambridge, MA',
      recentPublications: [],
    },
  ]);

  const request = new Request('http://localhost/api/scholar-finder/professors?domain=Computer%20Science%20%26%20AI');
  const response = await GET(request);

  expect(response.status).toBe(200);
  expect(mocks.professorUpsert).toHaveBeenCalled();
  const data = await response.json();
  expect(data.total).toBe(1);
  expect(data.professors[0].name).toBe('Prof. Antonio Torralba');
});

it('GET filters professors by query string', async () => {
  mocks.professorCount.mockResolvedValue(5);
  mocks.professorFindMany.mockResolvedValue([
    {
      id: 'prof-tum-ai',
      name: 'Prof. Daniel Cremers',
      title: 'Professor',
      university: 'TUM',
      department: 'Informatics',
      country: 'Germany',
      tier: 'TU9',
      labName: 'Vision Munich',
      labUrl: null,
      email: 'cremers@tum.de',
      googleScholarUrl: null,
      primaryDomain: 'Computer Science & AI',
      researchInterests: ['SLAM', 'Computer Vision'],
      activeFundingIndicator: true,
      fundingSources: [],
      acceptingStudents: true,
      hIndex: 112,
      citationsCount: 88000,
      labLocation: 'Munich',
      recentPublications: [],
    },
  ]);

  const request = new Request('http://localhost/api/scholar-finder/professors?q=Cremers');
  const response = await GET(request);

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.professors[0].name).toBe('Prof. Daniel Cremers');
});
