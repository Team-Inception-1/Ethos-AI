/** Deterministic session fixtures for API integration tests, never a demo login. */
export type TestSession = {
  user: { id: string; email: string; name: string; emailVerified: boolean };
};

export function assertTestAuthEnvironment() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('The test auth adapter is permitted only under NODE_ENV=test.');
  }
}

// Fail on startup if someone enables the test adapter in development/production.
if (process.env.ENABLE_TEST_AUTH === 'true') assertTestAuthEnvironment();

export function createTestAuthAdapter(fixtures: Readonly<Record<string, TestSession>>) {
  assertTestAuthEnvironment();
  return {
    async getSession(token: string | null): Promise<TestSession | null> {
      // Also guard at use time; configuration must not be switched after startup.
      assertTestAuthEnvironment();
      if (!token || !Object.hasOwn(fixtures, token)) return null;
      return structuredClone(fixtures[token]);
    },
  };
}
