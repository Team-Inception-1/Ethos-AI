import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('additive schema safety', () => {
  it('contains all 14 missing models without destructive statements or old-table changes', () => {
    const sql = readFileSync(new URL('../../../../../prisma/migrations/20260930130000_add_platform_models/migration.sql', import.meta.url), 'utf8');
    expect(sql.match(/CREATE TABLE /g)).toHaveLength(14);
    expect(sql).not.toMatch(/\bDROP\b|\bTRUNCATE\b|ALTER COLUMN|^DELETE\b/m);
    expect(sql).not.toMatch(/ALTER TABLE "(?:User|Agency|Document|StudentProfile|Application)"/);
    expect(sql).toContain('PeerMessageThread_ordered_participants_check');
    expect(sql).toContain('CommunityReport_one_target_check');
  });
});
