import { z } from 'zod';

export type AuthResult<T = undefined> = { success: true; data: T } | { success: false; error: { code: string; message: string } };
export const authFailure = (code: string, message: string): AuthResult<never> => ({ success: false, error: { code, message } });
const errorSchema = z.object({ code: z.string().optional(), message: z.string().optional() });
const envelopeSchema = z.object({ error: errorSchema.optional(), code: z.string().optional(), message: z.string().optional() });
export async function postAuth(path: string, body: unknown): Promise<AuthResult> {
  try {
    const response = await fetch(path, { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (response.ok) return { success: true, data: undefined };
    const parsed = envelopeSchema.safeParse(await response.json().catch(() => null));
    const failure = parsed.success ? parsed.data.error ?? parsed.data : undefined;
    return authFailure(failure?.code ?? (response.status === 429 ? 'RATE_LIMITED' : 'AUTH_REQUEST_FAILED'),
      failure?.message ?? (response.status === 429 ? 'Too many attempts. Wait before trying again.' : 'Authentication request failed. Please retry.'));
  } catch { return authFailure('NETWORK_ERROR', 'Could not reach authentication. Check your connection and retry.'); }
}
