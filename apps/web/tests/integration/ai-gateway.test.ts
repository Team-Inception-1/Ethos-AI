import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ authorize: vi.fn() }));
vi.mock('@/lib/auth/authorization', () => ({ requireUser: mocks.authorize }));
import { POST, GET } from '@/app/api/ai/[...path]/route';
import { readBoundedBody } from '@/lib/ai/proxy';

const upstream = vi.fn();
const context = (path = 'analyze-agreement/text') => ({ params: Promise.resolve({ path: path.split('/') }) });
function request(body = { agreement_text: 'Example agreement' }, origin = 'https://ethos.test') {
  return new Request('https://ethos.test/api/ai/analyze-agreement/text', {
    method: 'POST', headers: { origin, 'Content-Type': 'application/json', Authorization: 'Bearer browser-forgery' }, body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.resetAllMocks(); vi.stubGlobal('fetch', upstream);
  vi.stubEnv('AI_SERVICE_URL', 'https://internal-ai.test'); vi.stubEnv('AI_SERVICE_API_TOKEN', 'private-test-token');
  mocks.authorize.mockResolvedValue({ user: { id: 'student', role: 'STUDENT' }, response: null });
  upstream.mockResolvedValue(Response.json({ verdict: 'clear' }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('authenticated AI gateway', () => {
  it('denies anonymous and cross-origin requests before upstream work', async () => {
    mocks.authorize.mockResolvedValueOnce({ response: Response.json({}, { status: 401 }) });
    expect((await POST(request(), context())).status).toBe(401);
    expect((await POST(request(undefined, 'https://attacker.test'), context())).status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('injects server credentials and returns an uncached result', async () => {
    const result = await POST(request(), context());
    expect(await result.json()).toEqual({ verdict: 'clear' });
    expect(result.headers.get('cache-control')).toBe('no-store');
    expect(upstream).toHaveBeenCalledWith(new URL('https://internal-ai.test/api/ai/analyze-agreement/text'), expect.objectContaining({
      headers: { Authorization: 'Bearer private-test-token', 'Content-Type': 'application/json' }, redirect: 'error',
    }));
  });
  it('does not expose risk-event writes or accept user-selected agency scan targets', async () => {
    expect((await POST(request(), context('agencies/agency/risk-events'))).status).toBe(404);
    const scan = new Request('https://ethos.test/api/ai/scan-content', { method: 'POST', headers: { origin: 'https://ethos.test', 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'scam', agency_id: 'victim' }) });
    expect((await POST(scan, context('scan-content'))).status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('rejects traversal and oversized bodies before forwarding', async () => {
    expect((await GET(new Request('https://ethos.test'), context('../health'))).status).toBe(404);
    expect((await POST(request({ agreement_text: 'x'.repeat(1024 * 1024) }), context())).status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('bounds chunked bodies even without a Content-Length', async () => {
    const body = new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(4)); controller.enqueue(new Uint8Array(4)); controller.close();
    } }));
    await expect(readBoundedBody(body, 6)).rejects.toThrow(RangeError);
  });
  it('fails closed without service config and sanitizes upstream secrets', async () => {
    vi.stubEnv('AI_SERVICE_API_TOKEN', '');
    expect((await POST(request(), context())).status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
    vi.stubEnv('AI_SERVICE_API_TOKEN', 'private-test-token');
    upstream.mockResolvedValue(Response.json({ detail: 'secret provider connection string' }, { status: 500 }));
    const result = await POST(request(), context());
    expect(result.status).toBe(503); expect(await result.text()).not.toContain('secret');
  });
});
