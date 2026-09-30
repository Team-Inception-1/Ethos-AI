import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestAuthAdapter } from './test-adapter';

afterEach(() => vi.unstubAllEnvs());

describe('test-only authentication adapter', () => {
  it.each(['production', 'development', undefined])('refuses to start under %s', (env) => {
    vi.stubEnv('NODE_ENV', env);
    expect(() => createTestAuthAdapter({})).toThrow('NODE_ENV=test');
  });

  it('refuses enabled non-test configuration on module load', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_TEST_AUTH', 'true');
    vi.resetModules();
    await expect(import('./test-adapter')).rejects.toThrow('NODE_ENV=test');
  });

  it('rejects missing, unknown and inherited fixture tokens', async () => {
    const adapter = createTestAuthAdapter({});
    for (const token of [null, 'unknown', 'toString', '__proto__']) {
      expect(await adapter.getSession(token)).toBeNull();
    }
  });

  it('returns an isolated verified fixture, not a caller-supplied role', async () => {
    const adapter = createTestAuthAdapter({
      student: { user: { id: 'test-student', email: 'student@example.test', name: 'Student', emailVerified: true } },
    });
    const session = await adapter.getSession('student');
    expect(session?.user.id).toBe('test-student');
    if (session) session.user.id = 'admin';
    expect((await adapter.getSession('student'))?.user.id).toBe('test-student');
    vi.stubEnv('NODE_ENV', 'production');
    await expect(adapter.getSession('student')).rejects.toThrow('NODE_ENV=test');
  });
});
