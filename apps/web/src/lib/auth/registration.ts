import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

export const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100), email: z.string().trim().email().transform(value => value.toLowerCase()),
  phone: z.string().trim().transform(value => {
    const digits = value.replace(/[\s()-]/g, '');
    if (/^01\d{9}$/.test(digits)) return '+88' + digits;
    if (/^1\d{9}$/.test(digits)) return '+880' + digits;
    return digits.startsWith('880') ? '+' + digits : digits;
  }).pipe(z.string().regex(/^\+[1-9]\d{6,14}$/, 'Enter a valid international phone number.')),
  role: z.enum(['student', 'parent', 'agency']), password: z.string().min(8).max(128),
});
const draftSchema = registrationSchema.omit({ password: true }).extend({ accountId: z.string().min(1), expiresAt: z.number() });
export type RegistrationDraft = z.infer<typeof draftSchema>;
export const REGISTRATION_COOKIE = 'ethos-registration';
export const REGISTRATION_TTL = 30 * 60;
function key(secret: string) {
  if (secret.length < 32) throw new Error('Registration requires a configured auth cookie secret.');
  return createHash('sha256').update(secret).digest();
}
export function sealRegistration(draft: RegistrationDraft, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv);
  cipher.setAAD(Buffer.from(REGISTRATION_COOKIE));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(draftSchema.parse(draft)), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}
export function readRegistration(value: string | undefined, secret: string, now = Date.now()): RegistrationDraft | null {
  try {
    if (!value) return null;
    const bytes = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key(secret), bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(REGISTRATION_COOKIE));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const plaintext = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
    const draft = draftSchema.parse(JSON.parse(plaintext));
    return draft.expiresAt > now ? draft : null;
  } catch { return null; }
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
