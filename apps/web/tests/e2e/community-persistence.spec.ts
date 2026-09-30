import { expect, test } from '@playwright/test';

test('community waits for API-confirmed join, post and like; failed posting keeps the draft', async ({ page }) => {
  let joined = false;
  let failPost = true;
  const profile = { id: 'student', name: 'Test Student', email: 'student@example.test', phone: '+8801712345678', role: 'student', isVerified: true,
    avatarUrl: '/icon.svg', createdAt: new Date().toISOString(), linkedParentIds: [], linkedStudentIds: [] };
  const post = { id: 'saved-post', countryId: 'hub-germany', country: 'Germany', category: 'Help', title: 'Saved question', content: 'Saved body',
    authorId: 'student', authorName: 'Test Student', authorAvatar: '/icon.svg', isAnonymous: false, authorStatus: 'incoming', authorUniversity: '',
    authorVerified: false, isSeniorAsk: false, likesCount: 0, likedBy: [], commentsCount: 0, createdAt: new Date().toISOString(), pinned: false };
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/api/user/me', route => route.fulfill({ json: { data: profile } }));
  await page.route('**/api/auth/status', route => route.fulfill({ json: { status: 'configured', demoEnabled: false } }));
  await page.route('**/api/community/hubs', route => route.fulfill({ json: { data: { hubs: [{ id: 'hub-germany', country: 'Germany', countryCode: 'DE', flag: '🇩🇪',
    tagline: 'Neon hub', description: 'Persistent hub', popularCities: [], topUniversities: [], quickLinks: [], memberCount: joined ? 1 : 0, postCount: 0, joined }], seniors: [] } } }));
  await page.route('**/api/community/hubs/hub-germany/membership', route => { joined = true; return route.fulfill({ json: { data: { joined: true, memberCount: 1 } } }); });
  await page.route('**/api/community/posts?*', route => route.fulfill({ json: { data: { items: [], nextCursor: null } } }));
  await page.route('**/api/community/posts', route => failPost ? route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE', message: 'Post could not be saved' } } }) : route.fulfill({ status: 201, json: { data: post } }));
  await page.route('**/api/community/posts/saved-post/like', route => route.fulfill({ json: { data: { isLiked: true, likesCount: 1 } } }));
  await page.goto('/community');
  await page.getByRole('button', { name: /Join Germany Hub/ }).click();
  await expect(page.getByRole('button', { name: /Joined Community/ })).toBeVisible();
  await page.getByRole('button', { name: /Create Post in Germany/ }).click();
  await page.getByPlaceholder('e.g. Dhaka Embassy visa appointment timeline for Winter semester').fill('Saved question');
  await page.getByPlaceholder('Share specific context, requirements, dates, or what advice you need...').fill('Saved body');
  await page.getByRole('button', { name: /Publish to Germany Hub/ }).click();
  await expect(page.getByText('Post could not be saved', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('e.g. Dhaka Embassy visa appointment timeline for Winter semester')).toHaveValue('Saved question');
  failPost = false;
  await page.getByRole('button', { name: /Publish to Germany Hub/ }).click();
  await expect(page.getByRole('heading', { name: 'Saved question' })).toBeVisible();
  await page.getByRole('button', { name: /0 Likes/ }).click();
  await expect(page.getByRole('button', { name: /1 Like/ })).toBeVisible();
});
