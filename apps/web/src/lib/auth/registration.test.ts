import { describe, expect, it } from 'vitest';
import { readRegistration, registrationSchema, sealRegistration } from './registration';

const secret = 'test-only-secret-with-at-least-32-characters';
const draft = { name: 'Student', email: 'student@example.test', phone: '+8801712345678', role: 'student' as const, accountId: 'auth-student', expiresAt: Date.now() + 60000 };
describe('server-controlled registration', () => {
  it('normalizes Bangladesh phone numbers and email', () => {
    expect(registrationSchema.parse({ ...draft, email: 'STUDENT@example.test', phone: '01712345678', password: 'strong-password' })).toMatchObject({ phone: draft.phone, email: draft.email });
  });
  it('rejects public administrator signup and weak passwords', () => {
    expect(registrationSchema.safeParse({ ...draft, role: 'admin', password: 'strong-password' }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...draft, password: 'short' }).success).toBe(false);
  });
  it('encrypts registration details and authenticates the draft', () => {
    const sealed = sealRegistration(draft, secret);
    expect(sealed).not.toContain(draft.phone);
    expect(readRegistration(sealed, secret)).toEqual(draft);
    expect(readRegistration(sealed, secret + 'wrong')).toBeNull();
    const bytes = Buffer.from(sealed, 'base64url'); bytes[30] ^= 1;
    expect(readRegistration(bytes.toString('base64url'), secret)).toBeNull();
  });
  it('rejects expired, missing and malformed drafts', () => {
    expect(readRegistration(sealRegistration(draft, secret), secret, draft.expiresAt)).toBeNull();
    expect(readRegistration(undefined, secret)).toBeNull();
    expect(readRegistration('invalid', secret)).toBeNull();
  });
});
