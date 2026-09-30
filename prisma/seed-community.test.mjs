import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedCommunity } from './seed-community.mjs';

test('hub seeding is idempotent and never overwrites user edits', async () => {
  const rows = new Map();
  const db = { countryCommunity: { upsert: async ({ where, create, update }) => {
    assert.deepEqual(update, {});
    if (!rows.has(where.country)) rows.set(where.country, create);
    return rows.get(where.country);
  } } };
  await seedCommunity(db);
  assert.equal(rows.size, 6);
  rows.get('Germany').tagline = 'User edited';
  await seedCommunity(db);
  assert.equal(rows.size, 6);
  assert.equal(rows.get('Germany').tagline, 'User edited');
  assert.equal(rows.get('Germany').memberCount, undefined);
});

test('production demo seed is rejected before touching the database', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try { await assert.rejects(seedCommunity({}, { includeDemo: true }), /forbidden/); }
  finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});
