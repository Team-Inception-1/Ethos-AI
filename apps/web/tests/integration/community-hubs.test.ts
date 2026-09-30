import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), hubs: vi.fn(), mentors: vi.fn(), blocks: vi.fn(), hub: vi.fn(), join: vi.fn(), leave: vi.fn(), count: vi.fn() }));
vi.mock('@/lib/auth/authorization', () => ({ requireUser: mocks.authorize, requireRole: mocks.authorize }));
vi.mock('@/lib/prisma', () => ({ prisma: { countryCommunity: { findMany: mocks.hubs, findUnique: mocks.hub }, userBlock: { findMany: mocks.blocks },
  studentCommunityMembership: { findMany: mocks.mentors, upsert: mocks.join, deleteMany: mocks.leave, count: mocks.count } } }));
import { GET } from '@/app/api/community/hubs/route';
import { POST, DELETE } from '@/app/api/community/hubs/[id]/membership/route';
const context = { params: Promise.resolve({ id: 'hub-germany' }) };
const request = () => new Request('http://localhost:3000/api/community/hubs/hub-germany/membership', { method: 'POST', headers: { origin: 'http://localhost:3000' }, body: JSON.stringify({ userId: 'attacker', isVerified: true }) });
beforeEach(() => {
  vi.resetAllMocks(); mocks.authorize.mockResolvedValue({ user: { id: 'student', role: 'STUDENT' }, response: null });
  mocks.blocks.mockResolvedValue([]); mocks.hubs.mockResolvedValue([]); mocks.mentors.mockResolvedValue([]);
  mocks.hub.mockResolvedValue({ id: 'hub-germany' }); mocks.count.mockResolvedValue(2);
});
describe('Neon hub persistence', () => {
  it('loads database counts and current-session membership, not illustrative counters', async () => {
    mocks.hubs.mockResolvedValue([{ id: 'hub-germany', country: 'Germany', countryCode: 'DE', flagEmoji: '🇩🇪', tagline: '', description: '',
      popularCities: [], topUniversities: [], quickLinks: [], memberCount: 999, postCount: 999, _count: { members: 2, posts: 3 }, members: [{ userId: 'student' }] }]);
    const response = await GET(); expect(response.status).toBe(200);
    expect((await response.json()).data.hubs[0]).toMatchObject({ memberCount: 2, postCount: 3, joined: true });
    expect(mocks.hubs).toHaveBeenCalledWith(expect.objectContaining({ include: expect.objectContaining({ members: { where: { userId: 'student' } } }) }));
  });
  it('joins idempotently using session identity and safe unverified membership defaults', async () => {
    expect((await POST(request(), context)).status).toBe(200);
    expect(mocks.join).toHaveBeenCalledWith({ where: { userId_communityId: { userId: 'student', communityId: 'hub-germany' } }, update: {}, create: { userId: 'student', communityId: 'hub-germany' } });
  });
  it('leaves only the current user membership', async () => {
    expect((await DELETE(request(), context)).status).toBe(200);
    expect(mocks.leave).toHaveBeenCalledWith({ where: { userId: 'student', communityId: 'hub-germany' } });
  });
  it('denies cross-origin membership changes and unknown hubs without writes', async () => {
    expect((await POST(new Request(request().url, { method: 'POST', headers: { origin: 'https://attacker.test' } }), context)).status).toBe(403);
    mocks.hub.mockResolvedValue(null); expect((await POST(request(), context)).status).toBe(404); expect(mocks.join).not.toHaveBeenCalled();
  });
  it('fails honestly on unavailable database instead of returning bundled data', async () => {
    mocks.hubs.mockRejectedValue(new Error('Unavailable')); expect((await GET()).status).toBe(503);
  });
});
