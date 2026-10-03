import { expect, test } from '@playwright/test';

test('document upload errors are visible and failed uploads never create a document card', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/api/user/me', route => route.fulfill({ json: { data: { id: 'student', name: 'Test Student',
    email: 'student@example.test', phone: '+8801712345678', role: 'student', isVerified: true,
    avatarUrl: '/icon.svg', createdAt: new Date().toISOString(), linkedParentIds: [], linkedStudentIds: [],
    linkedStudents: [], linkedParents: [], pendingGuardianRequests: [] } } }));
  await page.route('**/api/documents', route => route.request().method() === 'GET'
    ? route.fulfill({ json: { documents: [] } })
    : route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE', message: 'Private storage unavailable. Please retry.' } } }));
  await page.goto('/dashboard/documents');
  await expect(page.getByRole('heading', { name: 'Document Vault & Storage' })).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({ name: 'sample.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n%%EOF') });
  await expect(page.getByRole('alert').filter({ hasText: 'Private storage unavailable' })).toHaveText('Private storage unavailable. Please retry.');
  await expect(page.getByText('sample.pdf', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '+ Upload Document' })).toBeEnabled();
});
