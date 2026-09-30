import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), signup: vi.fn(), existing: vi.fn(), duplicate: vi.fn(), create: vi.fn(), getCookie: vi.fn(), setCookie: vi.fn(), deleteCookie: vi.fn() }));
vi.mock('@/lib/auth/server', () => ({ auth: { getSession: mocks.session }, getNeonAuth: () => ({ signUp: { email: mocks.signup } }) }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.existing, findFirst: mocks.duplicate, create: mocks.create } } }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.getCookie, set: mocks.setCookie, delete: mocks.deleteCookie }) }));
import { POST as start } from '@/app/api/registration/start/route';
import { POST as complete } from '@/app/api/registration/complete/route';
import { POST as retiredOtp } from '@/app/api/auth/otp/send/route';
import { sealRegistration } from '@/lib/auth/registration';
const secret = 'test-only-secret-with-at-least-32-characters';
const input = { name: 'Student', email: 'student@example.test', phone: '+8801712345678', role: 'student', password: 'actual-password' };
const request = (body: unknown = {}, origin = 'http://localhost:3000') => new Request('http://localhost:3000/api/registration', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NEON_AUTH_COOKIE_SECRET', secret);
  mocks.existing.mockResolvedValue(null); mocks.duplicate.mockResolvedValue(null);
  mocks.session.mockResolvedValue({ data: { user: { id: 'auth-student', email: input.email, emailVerified: true } } });
  mocks.signup.mockResolvedValue({ data: { user: { id: 'auth-student' } } });
  mocks.create.mockResolvedValue({ id: 'auth-student' });
});
describe('registration API boundaries', () => {
  it('rejects cross-origin, admin roles and unverified accounts before writing', async () => {
    expect((await start(request(input, 'https://attacker.test'))).status).toBe(403);
    expect((await start(request({ ...input, role: 'admin' }))).status).toBe(400);
    mocks.session.mockResolvedValue({ data: { user: { id: 'auth-student', email: input.email, emailVerified: false } } });
    expect((await complete(request())).status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.signup).not.toHaveBeenCalled();
  });
  it('passes actual password to Neon, sets a secure draft, but does not provision before verification', async () => {
    expect((await start(request(input))).status).toBe(201);
    expect(mocks.signup).toHaveBeenCalledWith({ name: input.name, email: input.email, password: input.password });
    expect(mocks.setCookie).toHaveBeenCalledWith('ethos-registration', expect.any(String), expect.objectContaining({ httpOnly: true, sameSite: 'strict' }));
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('rejects duplicate email or phone without creating a Neon account', async () => {
    mocks.duplicate.mockResolvedValue({ id: 'existing' });
    expect((await start(request(input))).status).toBe(409); expect(mocks.signup).not.toHaveBeenCalled();
  });
  it('binds provisioning to the verified account and ignores forged body roles', async () => {
    mocks.getCookie.mockReturnValue({ value: sealRegistration({ ...input, role: 'student', accountId: 'auth-student', expiresAt: Date.now() + 60000 }, secret) });
    expect((await complete(request({ role: 'ADMIN', isVerified: true }))).status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: 'auth-student', role: 'STUDENT', studentProfile: expect.any(Object) }) }));
  });
  it('rejects draft/account mismatch', async () => {
    mocks.getCookie.mockReturnValue({ value: sealRegistration({ ...input, role: 'student', accountId: 'another-account', expiresAt: Date.now() + 60000 }, secret) });
    expect((await complete(request())).status).toBe(409); expect(mocks.create).not.toHaveBeenCalled();
  });
  it('preserves existing legacy profile and never reassigns its role', async () => {
    mocks.existing.mockResolvedValue({ id: 'legacy' });
    expect((await complete(request({ role: 'ADMIN' }))).status).toBe(200); expect(mocks.create).not.toHaveBeenCalled();
  });
  it('retires caller-supplied OTP dispatch', async () => { expect((await retiredOtp()).status).toBe(410); });
});
