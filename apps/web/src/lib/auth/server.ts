import { createNeonAuth } from '@neondatabase/auth/next/server';
import './test-adapter';

let instance: ReturnType<typeof createNeonAuth> | undefined;

export function getNeonAuth() {
  if (instance) return instance;
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret || secret.length < 32) {
    throw new Error('Neon Auth requires NEON_AUTH_BASE_URL and a cookie secret of at least 32 characters.');
  }
  if (new URL(baseUrl).protocol !== 'https:') throw new Error('Neon Auth requires HTTPS.');
  instance = createNeonAuth({ baseUrl, cookies: { secret } });
  return instance;
}

// Lazily configure at request time; missing configuration never enables a fallback.
export const auth = { getSession: () => getNeonAuth().getSession() };
