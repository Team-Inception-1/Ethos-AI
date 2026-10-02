import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  outreachFindMany: vi.fn(),
  outreachUpsert: vi.fn(),
  outreachDeleteMany: vi.fn(),
  professorFindUnique: vi.fn(),
  professorCreate: vi.fn(),
}));

vi.mock('@/lib/auth/authorization', () => ({
  requireUser: async () => ({
    user: { id: 'usr-student-01', role: 'STUDENT', email: 'student@example.test' },
    response: null,
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    professorOutreach: {
      findMany: mocks.outreachFindMany,
      upsert: mocks.outreachUpsert,
      deleteMany: mocks.outreachDeleteMany,
    },
    professor: {
      findUnique: mocks.professorFindUnique,
      create: mocks.professorCreate,
    },
  },
}));

import { GET, POST, DELETE } from './route';

const request = (method: string, body?: unknown, origin = 'http://localhost') =>
  new Request('http://localhost/api/scholar-finder/outreach', {
    method,
    headers: { origin, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  vi.resetAllMocks();
});

it('GET returns user outreach pipeline', async () => {
  mocks.outreachFindMany.mockResolvedValue([
    {
      id: 'outreach-1',
      studentId: 'usr-student-01',
      professorId: 'prof-mit-vision',
      stage: 'SHORTLISTED',
      sentAt: null,
      emailDraft: 'Dear Prof. Torralba...',
      notes: 'Focus on vision models',
      followUpDueAt: null,
      professor: {
        name: 'Prof. Antonio Torralba',
        university: 'MIT',
        labName: 'Vision Group',
      },
    },
  ]);

  const response = await GET();
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.pipeline).toHaveLength(1);
  expect(data.pipeline[0]).toMatchObject({
    id: 'outreach-1',
    profId: 'prof-mit-vision',
    profName: 'Prof. Antonio Torralba',
    university: 'MIT',
    stage: 'shortlisted',
    draftedEmail: 'Dear Prof. Torralba...',
  });
});

it('POST upserts outreach item and auto-provisions professor record if new', async () => {
  mocks.professorFindUnique.mockResolvedValue(null);
  mocks.professorCreate.mockResolvedValue({ id: 'prof-new-01' });
  mocks.outreachUpsert.mockResolvedValue({
    id: 'outreach-new',
    studentId: 'usr-student-01',
    professorId: 'prof-new-01',
    stage: 'DRAFTED',
    emailDraft: 'Draft content',
    notes: 'Draft note',
    sentAt: null,
    professor: {
      name: 'Prof. New',
      university: 'Stanford',
      labName: 'AI Lab',
    },
  });

  const response = await POST(
    request('POST', {
      profId: 'prof-new-01',
      profName: 'Prof. New',
      university: 'Stanford',
      labName: 'AI Lab',
      stage: 'drafted',
      draftedEmail: 'Draft content',
      notes: 'Draft note',
    })
  );

  expect(response.status).toBe(201);
  expect(mocks.professorCreate).toHaveBeenCalled();
  expect(mocks.outreachUpsert).toHaveBeenCalled();
});

it('DELETE removes outreach item for current student', async () => {
  mocks.outreachDeleteMany.mockResolvedValue({ count: 1 });

  const response = await DELETE(request('DELETE', { profId: 'prof-mit-vision' }));
  expect(response.status).toBe(200);
  expect(mocks.outreachDeleteMany).toHaveBeenCalledWith({
    where: {
      studentId: 'usr-student-01',
      professorId: 'prof-mit-vision',
    },
  });
});
