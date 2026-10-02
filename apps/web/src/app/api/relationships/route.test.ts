import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  role: 'PARENT' as 'PARENT' | 'STUDENT',
  userFindFirst: vi.fn(), linkFindUnique: vi.fn(), linkFindFirst: vi.fn(),
  create: vi.fn(), update: vi.fn(), remove: vi.fn(),
}));
vi.mock('@/lib/auth/authorization', () => ({
  requireRole: async () => ({ user: { id: 'current-user', role: mocks.role, email: 'user@example.test', isVerified: true }, response: null }),
}));
vi.mock('@/lib/prisma', () => ({ prisma: {
  user: { findFirst: mocks.userFindFirst },
  parentLink: { findUnique: mocks.linkFindUnique, findFirst: mocks.linkFindFirst,
    create: mocks.create, update: mocks.update, delete: mocks.remove },
} }));

import { DELETE, PATCH, POST } from './route';

const request = (method: string, body: unknown, origin = 'http://localhost') => new Request('http://localhost/api/relationships', {
  method, headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.resetAllMocks(); mocks.role = 'PARENT';
  mocks.userFindFirst.mockResolvedValue({ id: 'student-1', isVerified: true });
  mocks.linkFindUnique.mockResolvedValue(null); mocks.create.mockResolvedValue({ id: 'link-1' });
});

it('creates a pending link request instead of granting immediate access', async () => {
  const response = await POST(request('POST', { identifier: 'ETHOS-STU-0001' }));
  expect(response.status).toBe(201);
  expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    parentId: 'current-user', studentId: 'student-1', isApproved: false,
  }) });
});

it('requires the student owner to approve a pending request', async () => {
  mocks.role = 'STUDENT'; mocks.linkFindFirst.mockResolvedValue({ id: '8f7de9d4-3d89-4ed6-b860-fdb442f5569f' });
  const response = await PATCH(request('PATCH', { linkId: '8f7de9d4-3d89-4ed6-b860-fdb442f5569f', decision: 'approve' }));
  expect(response.status).toBe(200);
  expect(mocks.linkFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ studentId: 'current-user' }) }));
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isApproved: true }) }));
});

it('allows only a relationship participant to unlink', async () => {
  mocks.linkFindFirst.mockResolvedValue({ id: 'link-1' });
  const response = await DELETE(request('DELETE', { studentId: 'student-1' }));
  expect(response.status).toBe(200);
  expect(mocks.linkFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ parentId: 'current-user' }) }));
  expect(mocks.remove).toHaveBeenCalledWith({ where: { id: 'link-1' } });
});

it('rejects cross-origin relationship changes', async () => {
  const response = await POST(request('POST', { identifier: 'student@example.test' }, 'https://attacker.example'));
  expect(response.status).toBe(403);
  expect(mocks.create).not.toHaveBeenCalled();
});
