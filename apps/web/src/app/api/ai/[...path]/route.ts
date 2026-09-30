import { requireUser } from '@/lib/auth/authorization';
import { sameOrigin } from '@/lib/auth/registration';
import { forwardAiRequest } from '@/lib/ai/proxy';

export const runtime = 'nodejs';

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const authorization = await requireUser();
  if (authorization.response) return authorization.response;
  if (request.method === 'POST' && !sameOrigin(request)) {
    return Response.json({ detail: 'A same-origin request is required.' }, { status: 403 });
  }
  const { path } = await context.params;
  return forwardAiRequest(request, path.join('/'));
}

export const GET = handle;
export const POST = handle;
