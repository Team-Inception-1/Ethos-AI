import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ user: vi.fn(), update: vi.fn() }));
vi.mock('@/lib/auth/authorization', () => ({ requireUser: async () => ({ user: {
  id: 'session-owner', role: 'STUDENT', email: 'owner@example.test', isVerified: true,
}, response: null }) }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.user, update: mocks.update } } }));
import { GET, PUT } from './route';

const profile = {
  id: 'session-owner', name: 'Owner', email: 'owner@example.test', phone: '+8801712345678',
  role: 'STUDENT', isVerified: false, createdAt: new Date(), passwordHash: 'never-expose',
  parentLinksAsParent: [], parentLinksAsStudent: [], studentProfile: null, agencyProfile: null,
};
beforeEach(() => { vi.resetAllMocks(); mocks.user.mockResolvedValue(profile); mocks.update.mockResolvedValue(profile); });

it('returns only the session’s profile and omits password hashes', async () => {
  const response = await GET();
  const body = await response.json();
  expect(body.data.id).toBe('session-owner');
  expect(body.data.passwordHash).toBeUndefined();
  expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'session-owner' } }));
});

it('ignores caller-selected ID/email, role, verification, avatar and relationship fields', async () => {
  const response = await PUT(new Request('http://localhost/api/user/me', { method: 'PUT', body: JSON.stringify({
    id: 'victim', email: 'victim@example.test', role: 'ADMIN', isVerified: true, avatarUrl: 'javascript:bad',
    linkedStudentIds: ['victim'], name: 'New Name',
  }) }));
  expect(response.status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'session-owner' }, data: { name: 'New Name' } }));
});

it('rejects malformed profile updates before database writes', async () => {
  const response = await PUT(new Request('http://localhost/api/user/me', { method: 'PUT', body: JSON.stringify({ phone: 'not-a-phone' }) }));
  expect(response.status).toBe(400);
  expect(mocks.update).not.toHaveBeenCalled();
});
