const JSON_LIMIT = 1024 * 1024;
const UPLOAD_LIMIT = 20 * 1024 * 1024 + 64 * 1024;

const postPaths = new Set([
  'analyze-offer-letter', 'analyze-offer-letter/text', 'analyze-agreement',
  'analyze-agreement/text', 'scan-content', 'counselor/evaluate',
  'counselor/discover-live', 'counselor/chat', 'counselor/audit-sop',
  'scholar/search', 'scholar/generate-email', 'scholar/interview-prep',
  'scholar/parse-cv/file', 'scholar/parse-cv/text', 'scholar/match-profile',
  'scholar/deconstruct-paper', 'scholar/live-search', 'scholar/tara-strategy', 'scholar/tara-advisor',
]);
const uploadPaths = new Set(['analyze-offer-letter', 'analyze-agreement', 'scholar/parse-cv/file']);

export function allowedAiPath(method: string, path: string) {
  if (method === 'POST') return postPaths.has(path);
  return method === 'GET' && (['counselor/countries', 'scholar/guide'].includes(path) ||
    /^agencies\/[a-zA-Z0-9_-]{1,128}\/risk-score$/.test(path));
}

export async function readBoundedBody(request: Request | Response, limit: number): Promise<Uint8Array> {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) throw new RangeError('Body too large');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new RangeError('Body too large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return body;
}

function failure(status: number, detail: string) {
  return Response.json({ detail }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function forwardAiRequest(request: Request, path: string) {
  if (!allowedAiPath(request.method, path)) return failure(404, 'AI endpoint not found.');
  const serviceUrl = process.env.AI_SERVICE_URL;
  const token = process.env.AI_SERVICE_API_TOKEN;
  if (!serviceUrl || !token) return failure(503, 'AI service is not configured.');
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let body: Uint8Array | undefined;
  if (request.method === 'POST') {
    const contentType = request.headers.get('content-type') || '';
    const upload = uploadPaths.has(path);
    if (!(upload ? /^multipart\/form-data;.*boundary=/i.test(contentType) : /^application\/json(?:;|$)/i.test(contentType))) {
      return failure(415, 'Unsupported request content type.');
    }
    headers['Content-Type'] = contentType;
    try { body = await readBoundedBody(request, upload ? UPLOAD_LIMIT : JSON_LIMIT); }
    catch { return failure(413, 'Request body is too large.'); }
    if (!upload) {
      try {
        const payload = JSON.parse(new TextDecoder().decode(body));
        if (path === 'scan-content' && payload?.agency_id != null) {
          return failure(403, 'Agency risk events may only be recorded by trusted server workflows.');
        }
      } catch { return failure(400, 'Invalid JSON request.'); }
    }
  }
  try {
    const response = await fetch(new URL(`/api/ai/${path}`, serviceUrl), {
      method: request.method, headers, body: body as BodyInit | undefined,
      signal: AbortSignal.timeout(60_000), cache: 'no-store', redirect: 'error',
    });
    if (!response.ok) {
      const status = [400, 413, 415, 422, 429].includes(response.status) ? response.status : 503;
      return failure(status, status === 503 ? 'AI analysis is temporarily unavailable.' : 'AI request was rejected. Check the input and retry.');
    }
    const result = JSON.parse(new TextDecoder().decode(await readBoundedBody(response, 4 * JSON_LIMIT)));
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return failure(503, 'AI analysis is temporarily unavailable.'); }
}
