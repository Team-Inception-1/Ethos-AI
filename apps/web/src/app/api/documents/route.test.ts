import { expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/authorization', () => ({
  requireUser: async () => ({
    user: { id: 'parent-1', role: 'PARENT', email: 'parent@example.test', isVerified: true },
    response: null,
  }),
  forbiddenResponse: () => new Response(null, { status: 403 }),
}));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/storage', () => ({ uploadDocumentFile: vi.fn(), deleteDocumentFile: vi.fn() }));

import { POST } from './route';

it('keeps parent document access read-only', async () => {
  const response = await POST(new Request('http://localhost/api/documents', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
    body: new FormData(),
  }));

  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toMatchObject({
    error: { code: 'FORBIDDEN', message: expect.stringContaining('view-only') },
  });
});
