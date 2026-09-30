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
  await expect(page.getByText('The sign-in code could not be sent. Please retry.')).toBeVisible();
  await expect(page.getByRole('group', { name: 'OTP input' })).toHaveCount(0);
});
