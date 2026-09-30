import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Auth behavior must not depend on remote font/CDN availability.
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/api/user/me', route => route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED' } } }));
  await page.route('**/api/auth/status', route => route.fulfill({ json: { status: 'configured', demoEnabled: false } }));
});

test('a forged localStorage admin cannot restore a session', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ethos_auth_user', JSON.stringify({ id: 'usr-admin-01', role: 'admin' })));
  await page.goto('/login');
  await expect(page.getByLabel('Email Address')).toHaveValue('');
  await expect(page.getByText('Evaluator Quick-Fill Credentials')).toHaveCount(0);
  await page.goto('/profile');
  await expect(page.getByText('You are not signed in.')).toBeVisible();
});

test('failed OTP dispatch does not advance to verification', async ({ page }) => {
  await page.route('**/api/auth/email-otp/send-verification-otp', route => route.fulfill({ status: 503, json: { message: 'Email delivery unavailable' } }));
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /Or sign in with email OTP/ })).toBeEnabled();
  await page.getByLabel('Email Address').fill('student@example.test');
  await page.getByRole('button', { name: /sign in with email OTP/ }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Email delivery unavailable' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'OTP input' })).toHaveCount(0);
});

test('registration uses verification OTP, then provisions only after successful verification', async ({ page }) => {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  await page.route('**/api/registration/**', route => {
    calls.push({ path: new URL(route.request().url()).pathname, body: route.request().postDataJSON() });
    return route.fulfill({ json: { data: { requiresVerification: true } } });
  });
  await page.route('**/api/auth/email-otp/**', route => {
    calls.push({ path: new URL(route.request().url()).pathname, body: route.request().postDataJSON() });
    return route.fulfill({ json: { success: true } });
  });
  await page.route('**/api/auth/sign-in/email', route => route.fulfill({ json: { success: true } }));
  await page.goto('/register');
  await expect(page.getByRole('button', { name: 'Create Account →' })).toBeEnabled();
  await page.getByLabel('Full Name').fill('Test Student');
  await page.getByLabel('Email Address').fill('student@example.test');
  await page.getByLabel('Phone Number').fill('1712345678');
  await page.getByLabel('Create Password', { exact: true }).fill('actual-password');
  await page.getByRole('button', { name: 'Create Account →' }).click();
  await expect(page.getByRole('group', { name: 'OTP input' })).toBeVisible();
  expect(calls.map(call => call.path)).toEqual(['/api/registration/start', '/api/auth/email-otp/send-verification-otp']);
  expect(calls[1].body.type).toBe('email-verification');
  for (let i = 1; i <= 6; i++) await page.getByLabel('Digit ' + i).fill(String(i));
  await page.getByRole('button', { name: 'Verify & Continue →' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'could not be restored' })).toBeVisible();
  expect(calls.map(call => call.path)).toContain('/api/auth/email-otp/verify-email');
  expect(calls.map(call => call.path)).toContain('/api/registration/complete');
  expect(calls.map(call => call.path)).not.toContain('/api/auth/sign-in/email-otp');
});
