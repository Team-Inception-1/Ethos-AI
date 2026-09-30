import { z } from 'zod';

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

const postSchema = z.object({
  id: z.string(), countryId: z.string(), country: z.string(), category: z.string(), title: z.string(), content: z.string(),
  authorId: z.string(), authorName: z.string(), authorAvatar: z.string(), isAnonymous: z.boolean(),
  authorStatus: z.enum(['incoming', 'current', 'alumni']), authorUniversity: z.string(), authorVerified: z.boolean(),
  isSeniorAsk: z.boolean(), likesCount: z.number(), likedBy: z.array(z.string()), commentsCount: z.number(), createdAt: z.string(), pinned: z.boolean(),
});
const commentSchema = z.object({
  id: z.string(), postId: z.string(), authorId: z.string(), authorName: z.string(), authorAvatar: z.string(),
  isAnonymous: z.boolean(), authorStatus: z.enum(['incoming', 'current', 'alumni']), authorUniversity: z.string(),
  authorVerified: z.boolean(), isSeniorAnswer: z.boolean(), content: z.string(), createdAt: z.string(),
});
const messageSchema = z.object({ id: z.string(), senderId: z.string(), senderName: z.string(), content: z.string(), timestamp: z.string() });
const threadSchema = z.object({ id: z.string(), threadId: z.string(), participantIds: z.array(z.string()), messages: z.array(messageSchema) });
const reportSchema = z.object({ id: z.string(), reporterId: z.string(), targetType: z.enum(['post', 'comment', 'user']),
  targetId: z.string(), reason: z.string(), details: z.string().optional(), timestamp: z.string() });
const failureSchema = z.object({ error: z.object({ message: z.string() }) });
const pageSchema = <T extends z.ZodTypeAny>(item: T) => z.object({ items: z.array(item), nextCursor: z.string().nullable() });
export class CommunityRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
async function request<T>(path: string, schema: z.ZodType<T>, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/community/' + path, { method, credentials: 'same-origin', cache: 'no-store',
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  } catch { throw new CommunityRequestError('Could not reach community. Check your connection and retry.', 0); }
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = failureSchema.safeParse(json);
    throw new CommunityRequestError(parsed.success ? parsed.data.error.message : 'Community request failed. Please retry.', response.status);
  }
  return z.object({ data: schema }).parse(json).data;
}
export type PostFilters = { hubId: string; category?: string; seniorOnly?: boolean; query?: string; cursor?: string; currentUserId?: string };
export class CommunityService {
  static async getHubs(): Promise<CountryHub[]> { return (await request('hubs', hubResponseSchema.shape.data)).hubs; }
  static async getJoinedHubIds(userId: string): Promise<string[]> {
    void userId;
    return (await this.getHubs()).filter(hub => hub.joined).map(hub => hub.id);
  }
  static async toggleJoinHub(userId: string, hubId: string, joined: boolean) {
    const data = await request('hubs/' + encodeURIComponent(hubId) + '/membership', z.object({ joined: z.boolean(), memberCount: z.number() }), joined ? 'DELETE' : 'POST');
    return { ...data, joinedHubs: await this.getJoinedHubIds(userId) };
  }
  static async getPostsPage(filters: PostFilters) {
    const query = new URLSearchParams({ hubId: filters.hubId, seniorOnly: String(!!filters.seniorOnly) });
    if (filters.category && filters.category !== 'All') query.set('category', filters.category);
    if (filters.query) query.set('query', filters.query);
    if (filters.cursor) query.set('cursor', filters.cursor);
    return request('posts?' + query, pageSchema(postSchema));
  }
  static async getPosts(filters: PostFilters): Promise<CommunityPostItem[]> { return (await this.getPostsPage(filters)).items; }
  static async createPost(payload: { countryId: string; category: string; title: string; content: string; isAnonymous: boolean; isSeniorAsk?: boolean }): Promise<CommunityPostItem> {
    return request('posts', postSchema, 'POST', payload);
  }
  static async toggleLikePost(postId: string, userId: string, liked: boolean) {
    void userId;
    return request('posts/' + encodeURIComponent(postId) + '/like', z.object({ isLiked: z.boolean(), likesCount: z.number() }), liked ? 'DELETE' : 'POST');
  }
  static async getComments(postId: string, userId?: string): Promise<CommunityCommentItem[]> {
    void userId;
    return (await request('posts/' + encodeURIComponent(postId) + '/comments', pageSchema(commentSchema))).items;
  }
  static async addComment(payload: { postId: string; content: string; isAnonymous: boolean }): Promise<CommunityCommentItem> {
    return request('posts/' + encodeURIComponent(payload.postId) + '/comments', commentSchema, 'POST', { content: payload.content, isAnonymous: payload.isAnonymous });
  }
  static async getSeniorsByCountry(countryId: string): Promise<SeniorMentor[]> {
    return (await request('hubs', hubResponseSchema.shape.data)).seniors.filter(senior => senior.countryId === countryId);
  }
  static async getDirectThread(userId: string, targetId: string): Promise<DirectMessageThread> {
    void userId;
    return request('messages/threads', threadSchema, 'POST', { targetId });
  }
  static async sendDirectMessage(userId: string, targetId: string, senderId: string, senderName: string, content: string): Promise<DirectMessageItem> {
    void senderId; void senderName;
    const thread = await this.getDirectThread(userId, targetId);
    return request('messages/threads/' + encodeURIComponent(thread.id) + '/messages', messageSchema, 'POST', { content });
  }
  static async reportItem(payload: { reporterId: string; targetType: 'post' | 'comment' | 'user'; targetId: string; reason: string; details?: string }): Promise<ReportedItem> {
    const { reporterId, ...input } = payload; void reporterId;
    return request('reports', reportSchema, 'POST', input);
  }
  static async getBlockedUsers(userId: string): Promise<string[]> { void userId; return request('blocks', z.array(z.string())); }
  static async blockUser(userId: string, targetId: string): Promise<string[]> { void userId; return request('blocks', z.array(z.string()), 'POST', { targetId }); }
  static async unblockUser(userId: string, targetId: string): Promise<string[]> { void userId; return request('blocks', z.array(z.string()), 'DELETE', { targetId }); }
}

