import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/server', () => ({ auth: { getSession: vi.fn(async () => ({ data: null })) } }));

const routes = [
  ['user/me', 'GET'], ['user/me', 'PUT'], ['user/avatar', 'POST'],
  ['documents', 'GET'], ['documents', 'POST'], ['documents/[id]', 'GET'],
  ['documents/[id]', 'DELETE'], ['documents/[id]/scan', 'POST'], ['documents/[id]/download', 'GET'],
  ['chat/threads', 'GET'], ['chat/threads', 'POST'], ['chat/threads/[id]/messages', 'GET'],
  ['chat/threads/[id]/messages', 'POST'], ['chat/threads/[id]/export', 'GET'],
  ['community/hubs', 'GET'], ['community/posts', 'GET'], ['community/posts', 'POST'],
  ['community/hubs/[id]/membership', 'POST'], ['community/hubs/[id]/membership', 'DELETE'],
  ['community/posts/[id]/comments', 'GET'], ['community/posts/[id]/comments', 'POST'],
  ['community/posts/[id]/like', 'POST'], ['community/posts/[id]/like', 'DELETE'],
  ['community/blocks', 'GET'], ['community/blocks', 'POST'], ['community/blocks', 'DELETE'],
  ['community/reports', 'POST'], ['community/messages/threads', 'POST'],
  ['community/messages/threads/[id]/messages', 'GET'], ['community/messages/threads/[id]/messages', 'POST'],
  ['payments/escrow', 'GET'], ['payments/escrow/action', 'POST'],
  ['escrow/milestones', 'GET'], ['escrow/ledger', 'GET'], ['escrow/receipts/[id]', 'GET'],
  ['escrow/pay', 'POST'], ['escrow/release', 'POST'], ['escrow/refund', 'POST'], ['escrow/dispute', 'POST'],
  ['admin/users', 'GET'], ['admin/users', 'POST'], ['admin/agencies', 'GET'], ['admin/agencies', 'POST'],
  ['admin/disputes', 'GET'], ['admin/disputes', 'POST'], ['admin/fee-submissions', 'GET'],
  ['admin/fee-submissions', 'POST'], ['admin/scam-alerts', 'GET'], ['admin/scam-alerts', 'POST'],
  ['admin/overview', 'GET'], ['agency/fee-submissions', 'GET'], ['agency/fee-submissions', 'POST'],
  ['provenance/catalogs', 'POST'], ['provenance/catalogs', 'DELETE'],
  ['provenance/benchmarks', 'POST'], ['provenance/benchmarks', 'PATCH'],
] as const;

describe('API access denial with forged actor/role headers', () => {
  it.each(routes)('%s %s rejects unauthenticated callers before accessing data', async (path, method) => {
    const route: Record<string, (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>> =
      await import('../../src/app/api/' + path + '/route');
    const response = await route[method](new Request('http://localhost/api/' + path, {
      method, headers: { 'x-user-role': 'ADMIN', 'x-user-id': 'usr-admin-01' },
    }), { params: Promise.resolve({ id: 'private-resource' }) });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
  });
});
