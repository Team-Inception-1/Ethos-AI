import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  roadmapFindMany: vi.fn(),
  roadmapUpsert: vi.fn(),
  roadmapDeleteMany: vi.fn(),
}));

vi.mock('@/lib/auth/authorization', () => ({
  requireUser: async () => ({
    user: { id: 'usr-student-01', role: 'STUDENT', email: 'student@example.test' },
    response: null,
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    counselorRoadmapTask: {
      findMany: mocks.roadmapFindMany,
      upsert: mocks.roadmapUpsert,
      deleteMany: mocks.roadmapDeleteMany,
    },
  },
}));

import { GET, POST } from './route';

const request = (body: unknown, origin = 'http://localhost') =>
  new Request('http://localhost/api/counselor/roadmap', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.resetAllMocks();
});

it('GET returns completed roadmap task keys for current user', async () => {
  mocks.roadmapFindMany.mockResolvedValue([
    { taskKey: 'step-1-shortlist', completedAt: new Date('2026-03-01T00:00:00Z') },
  ]);

  const response = await GET();
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.completedTasks).toEqual(['step-1-shortlist']);
});

it('POST with completed=true marks task as completed', async () => {
  mocks.roadmapUpsert.mockResolvedValue({ id: 'task-1' });
  mocks.roadmapFindMany.mockResolvedValue([{ taskKey: 'step-2-ielts' }]);

  const response = await POST(request({ taskKey: 'step-2-ielts', completed: true }));
  expect(response.status).toBe(200);
  expect(mocks.roadmapUpsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        userId_taskKey: {
          userId: 'usr-student-01',
          taskKey: 'step-2-ielts',
        },
      },
    })
  );
});

it('POST with completed=false removes task completion', async () => {
  mocks.roadmapDeleteMany.mockResolvedValue({ count: 1 });
  mocks.roadmapFindMany.mockResolvedValue([]);

  const response = await POST(request({ taskKey: 'step-2-ielts', completed: false }));
  expect(response.status).toBe(200);
  expect(mocks.roadmapDeleteMany).toHaveBeenCalledWith({
    where: {
      userId: 'usr-student-01',
      taskKey: 'step-2-ielts',
    },
  });
});
