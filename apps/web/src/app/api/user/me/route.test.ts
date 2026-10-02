import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ user: vi.fn(), update: vi.fn(), role: 'STUDENT' as 'STUDENT' | 'AGENCY' }));
vi.mock('@/lib/auth/authorization', () => ({ requireUser: async () => ({ user: {
  id: 'session-owner', role: mocks.role, email: 'owner@example.test', isVerified: true,
}, response: null }) }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.user, update: mocks.update } } }));
import { GET, PUT } from './route';

const profile = {
  id: 'session-owner', name: 'Owner', email: 'owner@example.test', phone: '+8801712345678',
  role: 'STUDENT', isVerified: false, createdAt: new Date(), passwordHash: 'never-expose',
  parentLinksAsParent: [], parentLinksAsStudent: [], studentProfile: null, agencyProfile: null,
};
beforeEach(() => { vi.resetAllMocks(); mocks.role = 'STUDENT'; mocks.user.mockResolvedValue(profile); mocks.update.mockResolvedValue(profile); });

const updateRequest = (body: unknown, origin = 'http://localhost') => new Request('http://localhost/api/user/me', {
  method: 'PUT', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
});

it('returns only the session’s profile and omits password hashes', async () => {
  const response = await GET();
  const body = await response.json();
  expect(body.data.id).toBe('session-owner');
  expect(body.data.passwordHash).toBeUndefined();
  expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'session-owner' } }));
});

it('rejects caller-selected identity, role, verification, avatar and relationship fields', async () => {
  const response = await PUT(updateRequest({
    id: 'victim', email: 'victim@example.test', role: 'ADMIN', isVerified: true, avatarUrl: 'javascript:bad',
    linkedStudentIds: ['victim'], name: 'New Name',
  }));
  expect(response.status).toBe(400);
  expect(mocks.update).not.toHaveBeenCalled();
});

it('rejects malformed profile updates before database writes', async () => {
  const response = await PUT(updateRequest({ phone: 'not-a-phone' }));
  expect(response.status).toBe(400);
  expect(mocks.update).not.toHaveBeenCalled();
});

it('rejects cross-origin profile writes', async () => {
  const response = await PUT(updateRequest({ name: 'New Name' }, 'https://attacker.example'));
  expect(response.status).toBe(403);
  expect(mocks.update).not.toHaveBeenCalled();
});

it('persists agency details and returns legal credentials to pending review', async () => {
  mocks.role = 'AGENCY';
  const response = await PUT(updateRequest({ agencyDetails: {
    agencyName: 'North Star Education', licenseNo: 'LIC-2026-1', countriesServed: ['Canada'],
  } }));
  expect(response.status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { agencyProfile: { update: {
    name: 'North Star Education', licenseNo: 'LIC-2026-1', countriesServed: ['Canada'], licenseStatus: 'PENDING',
  } } } }));
});
