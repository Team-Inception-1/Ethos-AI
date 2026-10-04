import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  reviewFindMany: vi.fn(),
  reviewFindFirst: vi.fn(),
  reviewCreate: vi.fn(),
  reviewAggregate: vi.fn(),
  agencyFindUnique: vi.fn(),
  agencyUpdate: vi.fn(),
  applicationFindFirst: vi.fn(),
  sendNotification: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/auth/authorization', () => ({
  requireRole: mocks.auth,
}));

vi.mock('@/lib/auth/registration', () => ({
  sameOrigin: () => true,
}));

vi.mock('@/lib/notifications', () => ({
  sendNotification: mocks.sendNotification,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    review: {
      findMany: mocks.reviewFindMany,
      findFirst: mocks.reviewFindFirst,
      create: mocks.reviewCreate,
      aggregate: mocks.reviewAggregate,
    },
    agency: {
      findUnique: mocks.agencyFindUnique,
      update: mocks.agencyUpdate,
    },
    application: {
      findFirst: mocks.applicationFindFirst,
    },
    $transaction: (fn: (tx: any) => Promise<any>) => fn({
      review: {
        create: mocks.reviewCreate,
        aggregate: mocks.reviewAggregate,
      },
      agency: {
        update: mocks.agencyUpdate,
      },
    }),
  },
}));

import { GET, POST } from './route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: 'usr-student-01', email: 'student@example.com', role: 'STUDENT', isVerified: true },
    response: null,
  });
  mocks.agencyFindUnique.mockResolvedValue({
    id: 'agt-001',
    name: 'Global Edu BD',
    ownerUserId: 'usr-agency-01',
  });
  mocks.reviewFindFirst.mockResolvedValue(null);
  mocks.applicationFindFirst.mockResolvedValue({ id: 'app-001' });
  mocks.reviewCreate.mockResolvedValue({
    id: 'rev-new-01',
    rating: 5,
    title: 'Great experience',
    text: 'They helped me secure my student visa smoothly.',
    isVerified: true,
    createdAt: new Date('2026-10-05T05:00:00Z'),
  });
  mocks.reviewAggregate.mockResolvedValue({
    _avg: { rating: 4.9 },
    _count: { id: 10 },
  });
  mocks.agencyUpdate.mockResolvedValue({});
});

it('GET returns reviews for an agency with masked author names', async () => {
  mocks.reviewFindMany.mockResolvedValue([
    {
      id: 'rev-01',
      rating: 5,
      title: 'Top consultancy',
      text: 'Very professional counselors.',
      isVerified: true,
      createdAt: new Date('2026-09-20T10:00:00Z'),
      student: { name: 'Farhan Kabir' },
    },
  ]);

  const request = new Request('http://localhost/api/agencies/agt-001/reviews');
  const response = await GET(request, { params: Promise.resolve({ id: 'agt-001' }) });
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.reviews).toHaveLength(1);
  expect(data.reviews[0].rating).toBe(5);
  expect(data.reviews[0].authorName).toBe('F***');
  expect(data.reviews[0].comment).toBe('Very professional counselors.');
});

it('POST creates a verified review and recalculates agency rating', async () => {
  const request = new Request('http://localhost/api/agencies/agt-001/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: 5,
      title: 'Great experience',
      text: 'They helped me secure my student visa smoothly.',
    }),
  });

  const response = await POST(request, { params: Promise.resolve({ id: 'agt-001' }) });
  const data = await response.json();

  expect(response.status).toBe(201);
  expect(data.review.rating).toBe(5);
  expect(data.agency.rating).toBe(4.9);
  expect(data.agency.reviewCount).toBe(10);
  expect(mocks.reviewCreate).toHaveBeenCalled();
  expect(mocks.agencyUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'agt-001' },
      data: { rating: 4.9, reviewCount: 10 },
    })
  );
});

it('POST rejects duplicate review from the same student for the same agency', async () => {
  mocks.reviewFindFirst.mockResolvedValue({ id: 'rev-existing-01' });

  const request = new Request('http://localhost/api/agencies/agt-001/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: 4,
      text: 'Another review attempt.',
    }),
  });

  const response = await POST(request, { params: Promise.resolve({ id: 'agt-001' }) });
  expect(response.status).toBe(409);
});

it('POST rejects review with text shorter than 10 characters', async () => {
  const request = new Request('http://localhost/api/agencies/agt-001/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: 5,
      text: 'Too short',
    }),
  });

  const response = await POST(request, { params: Promise.resolve({ id: 'agt-001' }) });
  expect(response.status).toBe(400);
});
