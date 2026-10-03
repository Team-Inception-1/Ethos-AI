import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  agencyFindUnique: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agency: { findUnique: mocks.agencyFindUnique },
  },
}));

import { GET } from './route';

const sampleAgency = {
  id: 'agt-test-01',
  name: 'Test Agency Ltd',
  licenseNo: 'TRAD/TEST/12345',
  licenseStatus: 'VERIFIED',
  countriesServed: ['CAN', 'GBR'],
  foundedYear: 2021,
  riskScore: 5,
  rating: 4.8,
  reviewCount: 42,
  successRate: 95,
  feeMinPoisha: BigInt(2500000),
  feeMaxPoisha: BigInt(8000000),
  address: 'Banani, Dhaka',
  website: 'https://testagency.example',
  description: 'Verified test agency',
  pricingServices: [
    {
      id: 'srv-1',
      serviceName: 'Full Package',
      amountPoisha: BigInt(5000000),
      whenCharged: 'On Offer',
      refundable: true,
      conditions: 'Refund if visa denied',
    },
  ],
  reviews: [
    {
      id: 'rev-1',
      rating: 5,
      title: 'Great service',
      text: 'Helped me get my visa smoothly.',
      createdAt: new Date('2026-01-15T00:00:00Z'),
      student: { name: 'Rahim Khan' },
    },
  ],
  feeSubmissions: [
    {
      id: 'fee-1',
      refundPolicy: 'Full refund within 30 days if no university offer',
      status: 'VERIFIED',
      reviewedAt: new Date('2026-02-01T00:00:00Z'),
    },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
});

it('returns 200 with full agency detail for valid agency id', async () => {
  mocks.agencyFindUnique.mockResolvedValue(sampleAgency);

  const request = new Request('http://localhost/api/agencies/agt-test-01');
  const response = await GET(request, { params: Promise.resolve({ id: 'agt-test-01' }) });

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.agency).toMatchObject({
    id: 'agt-test-01',
    name: 'Test Agency Ltd',
    verified: true,
    rating: 4.8,
    feeMin: 25000,
    feeMax: 80000,
    fee: '৳25K–৳80K',
    refund: 'Escrow Protected',
  });
  expect(data.agency.pricingServices).toHaveLength(1);
  expect(data.agency.reviews).toHaveLength(1);
  expect(data.agency.reviews[0].comment).toBe('Helped me get my visa smoothly.');
  expect(data.agency.reviews[0].authorName).toBe('R***');
});

it('returns 404 when agency id does not exist', async () => {
  mocks.agencyFindUnique.mockResolvedValue(null);

  const request = new Request('http://localhost/api/agencies/non-existent-id');
  const response = await GET(request, { params: Promise.resolve({ id: 'non-existent-id' }) });

  expect(response.status).toBe(404);
  const data = await response.json();
  expect(data.error.code).toBe('NOT_FOUND');
});

it('returns 503 on database query failure', async () => {
  mocks.agencyFindUnique.mockRejectedValue(new Error('DB Connection Timeout'));

  const request = new Request('http://localhost/api/agencies/agt-test-01');
  const response = await GET(request, { params: Promise.resolve({ id: 'agt-test-01' }) });

  expect(response.status).toBe(503);
  const data = await response.json();
  expect(data.error.code).toBe('SERVICE_UNAVAILABLE');
});
