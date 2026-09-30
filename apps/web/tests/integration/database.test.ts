import { PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';

// Never load .env files here. This suite may write only to a disposable local DB.
const enabled = process.env.RUN_DATABASE_TESTS === 'true';
if (enabled) {
  const url = new URL(process.env.DATABASE_URL || '');
  if (process.env.NODE_ENV !== 'test' ||
      !['localhost', '127.0.0.1', 'postgres'].includes(url.hostname) ||
      url.pathname !== '/ethos_test') {
    throw new Error('Database tests require NODE_ENV=test and a local ethos_test database.');
  }
}

describe.skipIf(!enabled)('PostgreSQL regression foundation', () => {
  const prisma = new PrismaClient();
  afterAll(() => prisma.$disconnect());

  it('rolls back failed writes and enforces unique email without partial profiles', async () => {
    const id = randomUUID();
    const email = `${id}@example.test`;
    await expect(prisma.$transaction(async (tx) => {
      await tx.user.create({ data: { id, email, phone: id, name: 'Test', role: 'STUDENT',
        studentProfile: { create: { targetCountries: [], linkCode: id } } } });
      await tx.user.create({ data: { email, phone: randomUUID(), name: 'Duplicate' } });
    })).rejects.toMatchObject({ code: 'P2002' });
    expect(await prisma.user.findUnique({ where: { id } })).toBeNull();
    expect(await prisma.studentProfile.findUnique({ where: { userId: id } })).toBeNull();
  });
});
