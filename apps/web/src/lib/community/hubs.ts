import type { Prisma } from '@prisma/client';
import { z } from 'zod';

export const linksSchema = z.array(z.object({ title: z.string(), url: z.string().url() }));
export const academicStatus = { INCOMING_STUDENT: 'incoming', CURRENT_STUDENT: 'current', ALUMNI: 'alumni' } as const;
export function hubDTO(hub: Prisma.CountryCommunityGetPayload<{ include: { _count: { select: { members: true; posts: true } }; members: true } }>) {
  return { id: hub.id, country: hub.country, countryCode: hub.countryCode, flag: hub.flagEmoji,
    tagline: hub.tagline, description: hub.description ?? '', popularCities: hub.popularCities, topUniversities: hub.topUniversities,
    quickLinks: linksSchema.parse(hub.quickLinks), memberCount: hub._count.members, postCount: hub._count.posts, joined: hub.members.length > 0 };
}

export function mentorDTO(member: Prisma.StudentCommunityMembershipGetPayload<{ include: { user: true; community: true } }>) {
  return { id: member.userId, name: member.user.name, avatar: member.user.avatarUrl ?? '', country: member.community.country,
    countryId: member.communityId, status: academicStatus[member.status], isVerified: member.isVerified,
    university: member.targetOrCurrentUniversity ?? '', program: member.program ?? '', intake: member.intake ?? '',
    bio: member.mentorBio ?? '', helpedCount: 0, isAvailableForChat: member.isAvailableForChat };
}
