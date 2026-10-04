import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ canAccessDocument: vi.fn().mockResolvedValue(false) }));
vi.mock('@/lib/auth/authorization', () => ({
  requireUser: async () => ({
    user: { id: 'parent-1', role: 'PARENT', email: 'parent@example.test', isVerified: true },
    response: null,
  }),
  forbiddenResponse: () => new Response(null, { status: 403 }),
}));
vi.mock('@/lib/auth/relationships', () => ({ canAccessDocument: mocks.canAccessDocument }));
vi.mock('@/lib/prisma', () => ({ prisma: { document: { findUnique: vi.fn() } } }));
vi.mock('@/lib/storage', () => ({ readDocumentFile: vi.fn() }));

import { POST } from './route';

it('requires document mutation access before starting an AI scan', async () => {
  const response = await POST(
    new Request('http://localhost/api/documents/document-1/scan', {
      method: 'POST', headers: { origin: 'http://localhost' },
    }),
    { params: Promise.resolve({ id: 'document-1' }) },
  );

  expect(response.status).toBe(403);
  expect(mocks.canAccessDocument).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'parent-1', role: 'PARENT' }),
    'document-1',
    true,
  );
});
