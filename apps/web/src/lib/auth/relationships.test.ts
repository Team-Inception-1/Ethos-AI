import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ document: vi.fn(), parent: vi.fn(), application: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: {
  document: { findUnique: mocks.document }, parentLink: { findFirst: mocks.parent }, application: { findFirst: mocks.application },
} }));
import { canAccessDocument } from './relationships';
import type { AuthenticatedUser, PlatformRole } from './authorization';
const user = (role: PlatformRole): AuthenticatedUser => ({ id: 'viewer', email: 'viewer@example.test', role, isVerified: true });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.document.mockResolvedValue({ ownerId: 'other', applicationId: 'application' });
});

describe('private document relationship checks', () => {
  it('denies unrelated students and missing documents', async () => {
    expect(await canAccessDocument(user('STUDENT'), 'document')).toBe(false);
    mocks.document.mockResolvedValue(null);
    expect(await canAccessDocument(user('ADMIN'), 'missing')).toBe(false);
  });
  it('permits owner/admin but does not let parents or agencies delete another owner’s document', async () => {
    expect(await canAccessDocument(user('ADMIN'), 'document', true)).toBe(true);
    for (const role of ['PARENT', 'AGENCY'] as const) expect(await canAccessDocument(user(role), 'document', true)).toBe(false);
    mocks.document.mockResolvedValue({ ownerId: 'viewer' });
    expect(await canAccessDocument(user('STUDENT'), 'document', true)).toBe(true);
  });
  it('requires an explicitly approved parent/student relationship', async () => {
    mocks.parent.mockResolvedValue(null);
    expect(await canAccessDocument(user('PARENT'), 'document')).toBe(false);
    mocks.parent.mockResolvedValue({ id: 'approved-link' });
    expect(await canAccessDocument(user('PARENT'), 'document')).toBe(true);
    expect(mocks.parent).toHaveBeenLastCalledWith(expect.objectContaining({ where: {
      parentId: 'viewer', studentId: 'other', isApproved: true,
    } }));
  });
  it('requires a verified agency with an active application for the document owner', async () => {
    mocks.application.mockResolvedValue(null);
    expect(await canAccessDocument(user('AGENCY'), 'document')).toBe(false);
    mocks.application.mockResolvedValue({ id: 'application' });
    expect(await canAccessDocument(user('AGENCY'), 'document')).toBe(true);
    expect(mocks.application).toHaveBeenLastCalledWith(expect.objectContaining({ where: {
      id: 'application', studentId: 'other', stage: { notIn: ['COMPLETED', 'VISA_REJECTED'] },
      agency: { ownerUserId: 'viewer', licenseStatus: 'VERIFIED' },
    } }));
  });
});
