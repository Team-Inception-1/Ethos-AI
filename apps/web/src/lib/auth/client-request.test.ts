import { afterEach, describe, expect, it, vi } from 'vitest';
import { postAuth } from './client-request';
afterEach(() => vi.unstubAllGlobals());
describe('typed authentication results', () => {
  it('passes the password to password sign-in without requesting an OTP', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 })); vi.stubGlobal('fetch', fetcher);
    expect((await postAuth('/api/auth/sign-in/email', { email: 'student@example.test', password: 'actual-password' })).success).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1].body).toContain('actual-password');
  });
  it.each(['INVALID_EMAIL_OR_PASSWORD', 'OTP_EXPIRED', 'TOO_MANY_ATTEMPTS', 'USER_ALREADY_EXISTS'])('retains provider error %s', async code => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code, message: 'Provider rejected request' }), { status: 400 })));
    expect(await postAuth('/api/auth/sign-in/email-otp', {})).toEqual({ success: false, error: { code, message: 'Provider rejected request' } });
  });
  it('handles malformed errors, throttling and network failures without rejecting', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('not json', { status: 429 })).mockRejectedValueOnce(new Error('Offline'));
    vi.stubGlobal('fetch', fetcher);
    expect(await postAuth('/api/auth/email-otp/send-verification-otp', {})).toMatchObject({ success: false, error: { code: 'RATE_LIMITED' } });
    expect(await postAuth('/api/auth/sign-in/email', {})).toMatchObject({ success: false, error: { code: 'NETWORK_ERROR' } });
  });
  it('posts password reset requests to the correct Neon Auth endpoints', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);

    const forgotResult = await postAuth('/api/auth/forget-password/email-otp', { email: 'student@example.test' });
    expect(forgotResult.success).toBe(true);
    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/auth/forget-password/email-otp', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'student@example.test' }),
    }));

    const resetResult = await postAuth('/api/auth/email-otp/reset-password', {
      email: 'student@example.test',
      otp: '123456',
      password: 'new-secure-password',
    });
    expect(resetResult.success).toBe(true);
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/auth/email-otp/reset-password', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'student@example.test', otp: '123456', password: 'new-secure-password' }),
    }));
  });
});
