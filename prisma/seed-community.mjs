import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const statuses = { incoming: 'INCOMING_STUDENT', current: 'CURRENT_STUDENT', alumni: 'ALUMNI' };
export async function seedCommunity(db, { includeDemo = false } = {}) {
  if (includeDemo && process.env.NODE_ENV === 'production') throw new Error('Demo community seeding is forbidden in production.');
  const input = JSON.parse(await readFile(new URL('../apps/web/src/data/communityData.json', import.meta.url), 'utf8'));
  for (const hub of input.hubs) {
    await db.countryCommunity.upsert({ where: { country: hub.country }, update: {}, create: {
      id: hub.id, country: hub.country, countryCode: hub.countryCode, flagEmoji: hub.flag,
      tagline: hub.tagline, description: hub.description, popularCities: hub.popularCities,
      topUniversities: hub.topUniversities, quickLinks: hub.quickLinks,
      // Bundled counts are illustrative, never migrated as real memberships/activity.
    } });
  }
  if (!includeDemo) return;
  const people = new Map();
  for (const mentor of input.seniors) people.set(mentor.id, { name: mentor.name, avatar: mentor.avatar });
  for (const item of [...input.posts, ...input.comments]) {
    if (!people.has(item.authorId)) people.set(item.authorId, { name: item.isAnonymous ? 'Demo Student' : item.authorName, avatar: item.authorAvatar });
  }
  for (const [id, person] of people) {
    await db.user.upsert({ where: { id }, update: {}, create: {
      id, name: person.name, avatarUrl: person.avatar || null, email: `${id}@community-demo.invalid`,
      phone: `demo-community:${id}`, role: 'STUDENT', isVerified: false,
    } });
  }
  for (const mentor of input.seniors) {
    await db.studentCommunityMembership.upsert({ where: { userId_communityId: { userId: mentor.id, communityId: mentor.countryId } }, update: {}, create: {
      userId: mentor.id, communityId: mentor.countryId, status: statuses[mentor.status], targetOrCurrentUniversity: mentor.university,
      isSeniorMentor: true, isVerified: false, mentorBio: mentor.bio, program: mentor.program, intake: mentor.intake,
      isAvailableForChat: mentor.isAvailableForChat,
    } });
  }
  for (const post of input.posts) {
    await db.studentCommunityMembership.upsert({ where: { userId_communityId: { userId: post.authorId, communityId: post.countryId } }, update: {}, create: {
      userId: post.authorId, communityId: post.countryId, status: statuses[post.authorStatus], targetOrCurrentUniversity: post.authorUniversity,
    } });
    await db.communityPost.upsert({ where: { id: post.id }, update: {}, create: {
      id: post.id, communityId: post.countryId, authorId: post.authorId, title: post.title, content: post.content,
      category: post.category.toUpperCase(), isAnonymous: post.isAnonymous, isSeniorAsk: post.isSeniorAsk,
      authorStatus: statuses[post.authorStatus], authorUniversity: post.authorUniversity, authorVerified: false,
      isPinned: post.pinned, createdAt: new Date(post.createdAt),
    } });
  }
  for (const comment of input.comments) {
    await db.communityComment.upsert({ where: { id: comment.id }, update: {}, create: {
      id: comment.id, postId: comment.postId, authorId: comment.authorId, content: comment.content, isAnonymous: comment.isAnonymous,
      authorStatus: statuses[comment.authorStatus], authorUniversity: comment.authorUniversity, authorVerified: false,
      isSeniorAnswer: false, createdAt: new Date(comment.createdAt),
    } });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const url = new URL(process.env.DATABASE_URL ?? '');
  const safeTest = ['localhost', '127.0.0.1', 'postgres'].includes(url.hostname) && url.pathname === '/ethos_test';
  if (!safeTest && url.hostname !== process.env.COMMUNITY_SEED_ALLOWED_HOST) throw new Error('Explicit COMMUNITY_SEED_ALLOWED_HOST must match the intended database.');
  const db = new PrismaClient();
  try {
    await seedCommunity(db, { includeDemo: process.env.ENABLE_DEMO_DATA === 'true' });
    console.log('Community seed complete; existing rows were not overwritten.');
  } finally { await db.$disconnect(); }
}
