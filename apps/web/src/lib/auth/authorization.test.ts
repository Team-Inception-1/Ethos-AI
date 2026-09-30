import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestAuthAdapter } from './test-adapter';

const mocks = vi.hoisted(() => ({ session: vi.fn(), findUser: vi.fn() }));
vi.mock('@/lib/auth/server', () => ({ auth: { getSession: mocks.session } }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.findUser } } }));
import { getAuthenticatedUser, requireRole } from './authorization';

const fixture = { user: { id: 'auth-student', email: 'student@example.test', name: 'Student', emailVerified: true } };
const adapter = createTestAuthAdapter({ student: fixture });
const profile = { id: 'auth-student', email: fixture.user.email, role: 'STUDENT', isVerified: true };

beforeEach(() => { mocks.session.mockReset(); mocks.findUser.mockReset(); });

describe('authoritative Neon session authorization', () => {
  it.each([null, { user: null }, { user: { ...fixture.user, emailVerified: false } }])('denies missing/unverified session %j', async data => {
    mocks.session.mockResolvedValue({ data });
    expect(await getAuthenticatedUser()).toBeNull();
    expect((await requireRole(['ADMIN'])).response?.status).toBe(401);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it('fails closed when the auth provider or database fails', async () => {
    mocks.session.mockRejectedValue(new Error('Offline'));
    expect(await getAuthenticatedUser()).toBeNull();
    mocks.session.mockResolvedValue({ data: await adapter.getSession('student') });
    mocks.findUser.mockRejectedValue(new Error('Offline'));
    expect(await getAuthenticatedUser()).toBeNull();
  });

  it('loads the role from PostgreSQL and returns 403 for role mismatch', async () => {
    mocks.session.mockResolvedValue({ data: await adapter.getSession('student') });
    mocks.findUser.mockResolvedValue(profile);
    expect(await getAuthenticatedUser()).toEqual(profile);
    expect((await requireRole(['ADMIN'])).response?.status).toBe(403);
    expect((await requireRole(['STUDENT'])).user?.id).toBe(profile.id);
  });

  it('preserves a legacy profile ID only using a verified session email', async () => {
    mocks.session.mockResolvedValue({ data: fixture });
    mocks.findUser.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...profile, id: 'legacy-student' });
    expect((await getAuthenticatedUser())?.id).toBe('legacy-student');
    expect(mocks.findUser).toHaveBeenLastCalledWith(expect.objectContaining({ where: { email: fixture.user.email } }));
  });

  it('does not accept an ID collision with a different email', async () => {
    mocks.session.mockResolvedValue({ data: fixture });
    mocks.findUser.mockResolvedValue({ ...profile, email: 'other@example.test' });
    expect(await getAuthenticatedUser()).toBeNull();
    expect(mocks.findUser).toHaveBeenCalledTimes(1);
  });
});
