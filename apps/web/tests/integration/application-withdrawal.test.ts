import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  application: { findUnique: vi.fn(), delete: vi.fn() },
  paymentAttempt: { deleteMany: vi.fn() },
  document: { updateMany: vi.fn() },
  ledgerEntry: { count: vi.fn() },
  $transaction: vi.fn(),
  sendNotification: vi.fn(),
}));

vi.mock('@/lib/auth/authorization', () => ({ requireUser: mocks.requireUser }));
vi.mock('@/lib/notifications', () => ({
  sendNotification: mocks.sendNotification,
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: mocks.application,
    paymentAttempt: mocks.paymentAttempt,
    document: mocks.document,
    ledgerEntry: mocks.ledgerEntry,
    $transaction: mocks.$transaction,
  },
}));

import { DELETE } from '@/app/api/applications/[id]/route';

function request(body?: unknown, origin = 'http://localhost') {
  return new Request('http://localhost/api/applications/app-123', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({
    user: { id: 'student-1', role: 'STUDENT', email: 'student@example.com', isVerified: true },
    response: null,
  });
  mocks.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
    return cb({
      paymentAttempt: mocks.paymentAttempt,
      document: mocks.document,
      application: mocks.application,
    });
  });
  mocks.ledgerEntry.count.mockResolvedValue(0);
});

describe('application withdrawal (DELETE /api/applications/[id])', () => {
  it('successfully withdraws a pending application and notifies agency and student', async () => {
    mocks.application.findUnique.mockResolvedValue({
      id: 'app-123',
      studentId: 'student-1',
      stage: 'SUBMITTED',
      targetUniversity: 'University of Toronto',
      targetCountry: 'Canada',
      milestones: [{ id: 'm-1', status: 'PENDING', amountPoisha: BigInt(2500000) }],
      agency: { id: 'agt-1', name: 'Global Edu BD', ownerUserId: 'agency-owner-1' },
      student: { id: 'student-1', name: 'Rahim Khan', email: 'student@example.com' },
    });

    const res = await DELETE(request({ reason: 'Applying to a different intake' }), {
      params: Promise.resolve({ id: 'app-123' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mocks.application.delete).toHaveBeenCalledWith({ where: { id: 'app-123' } });
    expect(mocks.document.updateMany).toHaveBeenCalledWith({
      where: { applicationId: 'app-123' },
      data: { applicationId: null },
    });

    expect(mocks.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'agency-owner-1',
        title: 'Application Withdrawn',
        message: expect.stringContaining('Rahim Khan has withdrawn their application for University of Toronto'),
      })
    );
    expect(mocks.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'student-1',
        title: 'Application Withdrawn',
      })
    );
  });

  it('rejects cross-student withdrawal attempt', async () => {
    mocks.application.findUnique.mockResolvedValue({
      id: 'app-123',
      studentId: 'another-student',
      stage: 'SUBMITTED',
      targetUniversity: 'McGill',
      targetCountry: 'Canada',
      milestones: [],
      agency: { id: 'agt-1', name: 'Global Edu', ownerUserId: 'agency-owner-1' },
      student: { id: 'another-student', name: 'Karim', email: 'karim@example.com' },
    });

    const res = await DELETE(request(), {
      params: Promise.resolve({ id: 'app-123' }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe('FORBIDDEN');
    expect(mocks.application.delete).not.toHaveBeenCalled();
  });

  it('allows administrator to withdraw application on behalf of student', async () => {
    mocks.requireUser.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN', email: 'admin@example.com', isVerified: true },
      response: null,
    });
    mocks.application.findUnique.mockResolvedValue({
      id: 'app-123',
      studentId: 'student-1',
      stage: 'SUBMITTED',
      targetUniversity: 'University of Waterloo',
      targetCountry: 'Canada',
      milestones: [],
      agency: { id: 'agt-1', name: 'Global Edu', ownerUserId: 'agency-owner-1' },
      student: { id: 'student-1', name: 'Rahim Khan', email: 'student@example.com' },
    });

    const res = await DELETE(request(), {
      params: Promise.resolve({ id: 'app-123' }),
    });

    expect(res.status).toBe(200);
    expect(mocks.application.delete).toHaveBeenCalledWith({ where: { id: 'app-123' } });
  });

  it('blocks withdrawal if milestone funds are locked in escrow (HELD status)', async () => {
    mocks.application.findUnique.mockResolvedValue({
      id: 'app-123',
      studentId: 'student-1',
      stage: 'UNDER_REVIEW',
      targetUniversity: 'UBC',
      targetCountry: 'Canada',
      milestones: [{ id: 'm-1', status: 'HELD', amountPoisha: BigInt(5000000) }],
      agency: { id: 'agt-1', name: 'Global Edu', ownerUserId: 'agency-owner-1' },
      student: { id: 'student-1', name: 'Rahim Khan', email: 'student@example.com' },
    });

    const res = await DELETE(request(), {
      params: Promise.resolve({ id: 'app-123' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('ESCROW_LOCKED');
    expect(mocks.application.delete).not.toHaveBeenCalled();
  });

  it('blocks withdrawal if application is already COMPLETED or VISA_APPROVED', async () => {
    mocks.application.findUnique.mockResolvedValue({
      id: 'app-123',
      studentId: 'student-1',
      stage: 'VISA_APPROVED',
      targetUniversity: 'UBC',
      targetCountry: 'Canada',
      milestones: [],
      agency: { id: 'agt-1', name: 'Global Edu', ownerUserId: 'agency-owner-1' },
      student: { id: 'student-1', name: 'Rahim Khan', email: 'student@example.com' },
    });

    const res = await DELETE(request(), {
      params: Promise.resolve({ id: 'app-123' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('BAD_REQUEST');
    expect(mocks.application.delete).not.toHaveBeenCalled();
  });

  it('rejects foreign-origin requests (CSRF protection)', async () => {
    const res = await DELETE(request(undefined, 'http://malicious-site.com'), {
      params: Promise.resolve({ id: 'app-123' }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe('FORBIDDEN');
    expect(mocks.application.findUnique).not.toHaveBeenCalled();
  });
});
