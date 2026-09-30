import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  agency: { findFirst: vi.fn() },
  application: { findFirst: vi.fn(), create: vi.fn() },
}));

vi.mock('@/lib/auth/authorization', () => ({ requireUser: mocks.requireUser }));
vi.mock('@/lib/prisma', () => ({ prisma: { agency: mocks.agency, application: mocks.application } }));

import { POST } from '@/app/api/applications/route';

const payload = {
  agencyId: 'agt-001',
  studentId: 'forged-student',
  targetCountry: 'Canada',
  targetUniversity: 'University of British Columbia',
  targetProgram: 'M.Sc. in Computer Science',
  intakeSemester: 'Fall 2027',
};

function request(body: unknown = payload, origin = 'http://localhost') {
  return new Request('http://localhost/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({
    user: { id: 'signed-in-student', role: 'STUDENT', email: 'student@example.com', isVerified: true },
    response: null,
  });
  mocks.agency.findFirst.mockResolvedValue({
    id: 'agt-001',
    pricingServices: [{ serviceName: 'Application processing', amountPoisha: BigInt(2500000), whenCharged: 'On submission' }],
  });
  mocks.application.findFirst.mockResolvedValue(null);
  mocks.application.create.mockResolvedValue({
    id: 'application-1', targetCountry: 'Canada', targetUniversity: payload.targetUniversity,
    targetProgram: payload.targetProgram, intakeSemester: payload.intakeSemester, stage: 'SUBMITTED',
    createdAt: new Date('2026-09-30T00:00:00Z'), updatedAt: new Date('2026-09-30T00:00:00Z'),
    agency: { id: 'agt-001', name: 'Global Edu BD' }, student: { id: 'signed-in-student', name: 'Student' },
    _count: { documents: 0, milestones: 1 },
  });
});

describe('application creation', () => {
  it('derives the student from the session and creates milestones from verified agency pricing', async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(mocks.agency.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'agt-001', licenseStatus: 'VERIFIED' },
    }));
    expect(mocks.application.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      studentId: 'signed-in-student', agencyId: 'agt-001', stageEvents: { create: expect.objectContaining({ actorId: 'signed-in-student' }) },
      milestones: { create: [expect.objectContaining({ amountPoisha: BigInt(2500000), status: 'PENDING' })] },
    }) }));
    expect(mocks.application.create.mock.calls[0]?.[0].data.studentId).not.toBe('forged-student');
    expect(await response.json()).toMatchObject({ data: { application: { id: 'application-1', milestoneCount: 1 } } });
  });

  it('rejects non-students before any database write', async () => {
    mocks.requireUser.mockResolvedValue({ user: { id: 'parent', role: 'PARENT' }, response: null });
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(mocks.application.create).not.toHaveBeenCalled();
  });

  it('requires same-origin mutations', async () => {
    const response = await POST(request(payload, 'https://attacker.example'));
    expect(response.status).toBe(403);
    expect(mocks.application.create).not.toHaveBeenCalled();
  });

  it('does not create duplicate active applications', async () => {
    mocks.application.findFirst.mockResolvedValue({ id: 'existing' });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.application.create).not.toHaveBeenCalled();
  });
});
