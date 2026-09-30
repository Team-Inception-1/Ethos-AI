import { expect, test } from '@playwright/test';

test('home page is reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test('auth status endpoint responds', async ({ request }) => {
  const response = await request.get('/api/auth/status');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({ provider: 'neon_better_auth' });
});
