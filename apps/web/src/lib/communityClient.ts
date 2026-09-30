/**
 * Ethos AI — Student Peer Networking & Country Hubs Client
 * Provides stateful operations for country-based groups, isolated feeds,
 * anonymous posting, verified student/senior interactions, 1-to-1 peer messaging,
 * and report/block functionality.
 */

import { z } from 'zod';
import initialCommunityData from '@/data/communityData.json';

export type StudentStatusType = 'incoming' | 'current' | 'alumni';

export interface CountryHub {
  id: string;
  country: string;
  countryCode: string;
  flag: string;
  tagline: string;
  description: string;
  memberCount: number;
  postCount: number;
  popularCities: string[];
  topUniversities: string[];
  joined?: boolean;
  quickLinks: Array<{ title: string; url: string }>;
}

export interface SeniorMentor {
  id: string;
  name: string;
  avatar: string;
  country: string;
  countryId: string;
  status: StudentStatusType;
  isVerified: boolean;
  university: string;
  program: string;
  intake: string;
  bio: string;
  helpedCount: number;
  isAvailableForChat: boolean;
}

export interface CommunityPostItem {
  id: string;
  countryId: string;
  country: string;
  category: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isAnonymous: boolean;
  authorStatus: StudentStatusType;
  authorUniversity: string;
  authorVerified: boolean;
  isSeniorAsk: boolean;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  createdAt: string;
  pinned: boolean;
}

export interface CommunityCommentItem {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isAnonymous: boolean;
  authorStatus: StudentStatusType;
  authorUniversity: string;
  authorVerified: boolean;
  isSeniorAnswer: boolean;
  content: string;
  createdAt: string;
}

export interface DirectMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface DirectMessageThread {
  id: string;
  threadId: string;
  participantIds: string[];
  messages: DirectMessageItem[];
}

export interface ReportedItem {
  id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  reason: string;
  details?: string;
  timestamp: string;
}

// LocalStorage Keys for client-side persistence
const STORAGE_PREFIX = 'ethos_community_';
const KEY_POSTS = `${STORAGE_PREFIX}posts`;
const KEY_COMMENTS = `${STORAGE_PREFIX}comments`;
const KEY_DMS = `${STORAGE_PREFIX}direct_messages`;
const KEY_BLOCKED_USERS = `${STORAGE_PREFIX}blocked_users`;
const KEY_REPORTS = `${STORAGE_PREFIX}reports`;

function getSafeLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setSafeLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
}


const hubSchema = z.object({
  id: z.string(), country: z.string(), countryCode: z.string(), flag: z.string(), tagline: z.string(), description: z.string(),
  memberCount: z.number(), postCount: z.number(), joined: z.boolean(), popularCities: z.array(z.string()),
  topUniversities: z.array(z.string()), quickLinks: z.array(z.object({ title: z.string(), url: z.string().url() })),
});
const mentorSchema = z.object({
  id: z.string(), name: z.string(), avatar: z.string(), country: z.string(), countryId: z.string(), status: z.enum(['incoming', 'current', 'alumni']),
  isVerified: z.boolean(), university: z.string(), program: z.string(), intake: z.string(), bio: z.string(),
  helpedCount: z.number(), isAvailableForChat: z.boolean(),
});
const hubResponseSchema = z.object({ data: z.object({ hubs: z.array(hubSchema), seniors: z.array(mentorSchema) }) });
async function hubRequest() {
  const response = await fetch('/api/community/hubs', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new Error('Community could not be loaded. Sign in and retry.');
  return hubResponseSchema.parse(await response.json()).data;
}

export class CommunityService {
  // ── Hubs ──────────────────────────────────────────────────────────
  static async getHubs(): Promise<CountryHub[]> { return (await hubRequest()).hubs; }
  static async getJoinedHubIds(_userId: string): Promise<string[]> {
    void _userId; // The server derives identity from the session.
    return (await hubRequest()).hubs.filter(hub => hub.joined).map(hub => hub.id);
  }
  static async toggleJoinHub(_userId: string, hubId: string, joined: boolean): Promise<{ joined: boolean; joinedHubs: string[]; memberCount: number }> {
    const response = await fetch('/api/community/hubs/' + encodeURIComponent(hubId) + '/membership', {
      method: joined ? 'DELETE' : 'POST', credentials: 'same-origin',
    });
    if (!response.ok) throw new Error('Hub membership could not be updated. Please retry.');
    const { data } = z.object({ data: z.object({ joined: z.boolean(), memberCount: z.number() }) }).parse(await response.json());
    return { ...data, joinedHubs: await this.getJoinedHubIds(_userId) };
  }

  // ── Posts (Strict Country Group Isolation) ────────────────────────
  static getPosts(params: {
    hubId: string;
    category?: string;
    seniorOnly?: boolean;
    query?: string;
    currentUserId?: string;
  }): CommunityPostItem[] {
    const customPosts = getSafeLocalStorage<CommunityPostItem[]>(KEY_POSTS, []);
    const allPosts: CommunityPostItem[] = [...customPosts, ...(initialCommunityData.posts as CommunityPostItem[])];

    // Filter out duplicate IDs
    const seen = new Set<string>();
    const deduped: CommunityPostItem[] = [];
    for (const post of allPosts) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        deduped.push(post);
      }
    }

    const blockedUsers = params.currentUserId ? this.getBlockedUsers(params.currentUserId) : [];

    // STRICT COUNTRY ISOLATION: A post created in one country group must only be visible within that country group
    return deduped.filter((post) => {
      // 1. Mandatory country match
      if (post.countryId !== params.hubId) return false;

      // 2. Hide blocked authors
      if (blockedUsers.includes(post.authorId)) return false;

      // 3. Category filter
      if (params.category && params.category !== 'All' && post.category !== params.category) {
        return false;
      }

      // 4. "Ask a Senior" filter
      if (params.seniorOnly && !post.isSeniorAsk) {
        return false;
      }

      // 5. Search query
      if (params.query && params.query.trim()) {
        const q = params.query.toLowerCase().trim();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesContent = post.content.toLowerCase().includes(q);
        const matchesAuthor = !post.isAnonymous && post.authorName.toLowerCase().includes(q);
        const matchesUni = post.authorUniversity.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesAuthor && !matchesUni) return false;
      }

      return true;
    });
  }

  static createPost(payload: {
    countryId: string;
    country: string;
    category: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    isAnonymous: boolean;
    authorStatus: StudentStatusType;
    authorUniversity: string;
    authorVerified: boolean;
    isSeniorAsk?: boolean;
  }): CommunityPostItem {
    const newPost: CommunityPostItem = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      countryId: payload.countryId,
      country: payload.country,
      category: payload.category || 'Help',
      title: payload.title.trim(),
      content: payload.content.trim(),
      authorId: payload.authorId,
      authorName: payload.isAnonymous ? 'Anonymous Student' : payload.authorName,
      authorAvatar: payload.isAnonymous ? '' : payload.authorAvatar,
      isAnonymous: payload.isAnonymous,
      authorStatus: payload.authorStatus,
      authorUniversity: payload.authorUniversity || 'Prospective Student',
      authorVerified: payload.authorVerified,
      isSeniorAsk: !!payload.isSeniorAsk,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      pinned: false,
    };

    const customPosts = getSafeLocalStorage<CommunityPostItem[]>(KEY_POSTS, []);
    customPosts.unshift(newPost);
    setSafeLocalStorage(KEY_POSTS, customPosts);

    return newPost;
  }

  static toggleLikePost(postId: string, userId: string): { likesCount: number; isLiked: boolean } {
    const customPosts = getSafeLocalStorage<CommunityPostItem[]>(KEY_POSTS, []);
    let post = customPosts.find((p) => p.id === postId);

    if (!post) {
      // Find in initial and clone to custom
      const initial = (initialCommunityData.posts as CommunityPostItem[]).find((p) => p.id === postId);
      if (initial) {
        post = { ...initial, likedBy: [...initial.likedBy] };
        customPosts.push(post);
      }
    }

    if (!post) return { likesCount: 0, isLiked: false };

    const idx = post.likedBy.indexOf(userId);
    let isLiked = false;
    if (idx > -1) {
      post.likedBy.splice(idx, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
      isLiked = false;
    } else {
      post.likedBy.push(userId);
      post.likesCount += 1;
      isLiked = true;
    }

    setSafeLocalStorage(KEY_POSTS, customPosts);
    return { likesCount: post.likesCount, isLiked };
  }

  // ── Comments ──────────────────────────────────────────────────────
  static getComments(postId: string, currentUserId?: string): CommunityCommentItem[] {
    const customComments = getSafeLocalStorage<CommunityCommentItem[]>(KEY_COMMENTS, []);
    const allComments: CommunityCommentItem[] = [
      ...customComments,
      ...(initialCommunityData.comments as CommunityCommentItem[]),
    ];

    const blockedUsers = currentUserId ? this.getBlockedUsers(currentUserId) : [];

    return allComments
      .filter((c) => c.postId === postId && !blockedUsers.includes(c.authorId))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  static addComment(payload: {
    postId: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    isAnonymous: boolean;
    authorStatus: StudentStatusType;
    authorUniversity: string;
    authorVerified: boolean;
    isSeniorAnswer?: boolean;
  }): CommunityCommentItem {
    const newComment: CommunityCommentItem = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      postId: payload.postId,
      authorId: payload.authorId,
      authorName: payload.isAnonymous ? 'Anonymous Student' : payload.authorName,
      authorAvatar: payload.isAnonymous ? '' : payload.authorAvatar,
      isAnonymous: payload.isAnonymous,
      authorStatus: payload.authorStatus,
      authorUniversity: payload.authorUniversity || 'Ethos Student',
      authorVerified: payload.authorVerified,
      isSeniorAnswer: !!payload.isSeniorAnswer,
      content: payload.content.trim(),
      createdAt: new Date().toISOString(),
    };

    const customComments = getSafeLocalStorage<CommunityCommentItem[]>(KEY_COMMENTS, []);
    customComments.push(newComment);
    setSafeLocalStorage(KEY_COMMENTS, customComments);

    // Increment post commentsCount
    const customPosts = getSafeLocalStorage<CommunityPostItem[]>(KEY_POSTS, []);
    let post = customPosts.find((p) => p.id === payload.postId);
    if (!post) {
      const initial = (initialCommunityData.posts as CommunityPostItem[]).find((p) => p.id === payload.postId);
      if (initial) {
        post = { ...initial };
        customPosts.push(post);
      }
    }
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
      setSafeLocalStorage(KEY_POSTS, customPosts);
    }

    return newComment;
  }

  // ── Seniors & Mentors ("Ask a Senior") ────────────────────────────
  static async getSeniorsByCountry(countryId: string): Promise<SeniorMentor[]> {
    return (await hubRequest()).seniors.filter(senior => senior.countryId === countryId);
  }

  // ── 1-to-1 Peer Messaging ─────────────────────────────────────────
  static getDirectThread(user1Id: string, user2Id: string): DirectMessageThread {
    const dms = getSafeLocalStorage<DirectMessageThread[]>(
      KEY_DMS,
      initialCommunityData.directMessages as DirectMessageThread[]
    );

    const sortedIds = [user1Id, user2Id].sort();
    const threadKey = `dm-${sortedIds.join('-')}`;

    let thread = dms.find(
      (t) =>
        t.participantIds.includes(user1Id) &&
        t.participantIds.includes(user2Id) &&
        t.participantIds.length === 2
    );

    if (!thread) {
      thread = {
        id: threadKey,
        threadId: threadKey,
        participantIds: sortedIds,
        messages: [],
      };
      dms.push(thread);
      setSafeLocalStorage(KEY_DMS, dms);
    }

    return thread;
  }

  static sendDirectMessage(
    user1Id: string,
    user2Id: string,
    senderId: string,
    senderName: string,
    content: string
  ): DirectMessageItem {
    const dms = getSafeLocalStorage<DirectMessageThread[]>(
      KEY_DMS,
      initialCommunityData.directMessages as DirectMessageThread[]
    );

    const sortedIds = [user1Id, user2Id].sort();
    let thread = dms.find(
      (t) =>
        t.participantIds.includes(user1Id) &&
        t.participantIds.includes(user2Id) &&
        t.participantIds.length === 2
    );

    if (!thread) {
      thread = {
        id: `dm-${sortedIds.join('-')}`,
        threadId: `dm-${sortedIds.join('-')}`,
        participantIds: sortedIds,
        messages: [],
      };
      dms.push(thread);
    }

    const newMsg: DirectMessageItem = {
      id: `msg-${Date.now()}`,
      senderId,
      senderName,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    thread.messages.push(newMsg);
    setSafeLocalStorage(KEY_DMS, dms);
    return newMsg;
  }

  // ── Report & Block Functionality ──────────────────────────────────
  static reportItem(payload: {
    reporterId: string;
    targetType: 'post' | 'comment' | 'user';
    targetId: string;
    reason: string;
    details?: string;
  }): ReportedItem {
    const reports = getSafeLocalStorage<ReportedItem[]>(KEY_REPORTS, []);
    const newReport: ReportedItem = {
      id: `rep-${Date.now()}`,
      reporterId: payload.reporterId,
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
      details: payload.details,
      timestamp: new Date().toISOString(),
    };
    reports.push(newReport);
    setSafeLocalStorage(KEY_REPORTS, reports);
    return newReport;
  }

  static getBlockedUsers(userId: string): string[] {
    const allBlocked = getSafeLocalStorage<Record<string, string[]>>(KEY_BLOCKED_USERS, {});
    return allBlocked[userId] || [];
  }

  static blockUser(blockerId: string, targetUserId: string): string[] {
    const allBlocked = getSafeLocalStorage<Record<string, string[]>>(KEY_BLOCKED_USERS, {});
    const list = allBlocked[blockerId] ? [...allBlocked[blockerId]] : [];
    if (!list.includes(targetUserId)) {
      list.push(targetUserId);
    }
    allBlocked[blockerId] = list;
    setSafeLocalStorage(KEY_BLOCKED_USERS, allBlocked);
    return list;
  }

  static unblockUser(blockerId: string, targetUserId: string): string[] {
    const allBlocked = getSafeLocalStorage<Record<string, string[]>>(KEY_BLOCKED_USERS, {});
    let list = allBlocked[blockerId] ? [...allBlocked[blockerId]] : [];
    list = list.filter((id) => id !== targetUserId);
    allBlocked[blockerId] = list;
    setSafeLocalStorage(KEY_BLOCKED_USERS, allBlocked);
    return list;
  }
}
