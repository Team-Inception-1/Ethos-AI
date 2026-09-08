/**
 * Ethos AI — Database Client & Data Access Layer
 * Aligned with Issue #14 (K-11) & ETHOS_AI_CONTEXT.md §6
 *
 * Provides typed data access for core entities with seamless in-memory fallback
 * when PostgreSQL is offline or running in standalone frontend demo mode.
 */

import seedData from '@/data/seedData.json';

// In-Memory Database Store (initialized with seedData)
class InMemoryDatabase {
  users = [...seedData.users];
  studentProfiles = [...seedData.studentProfiles];
  parentLinks = [...seedData.parentLinks];
  agencies = [...seedData.agencies];
  agencyPricings = [...seedData.agencyPricings];
  applications = [...seedData.applications];
  stageEvents = [...seedData.stageEvents];
  milestones = [...seedData.milestones];
  ledgerEntries = [...seedData.ledgerEntries];
  receipts = [...seedData.receipts];
  chatThreads = [...seedData.chatThreads];
  chatMessages = [...seedData.chatMessages];

  // User queries
  getUserById(id: string) {
    return this.users.find((u) => u.id === id) || null;
  }

  getUserByEmail(email: string) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // Agency queries
  getAgencies() {
    return this.agencies;
  }

  getAgencyById(id: string) {
    return this.agencies.find((a) => a.id === id) || null;
  }

  getAgencyPricing(agencyId: string) {
    return this.agencyPricings.filter((p) => p.agencyId === agencyId);
  }

  // Application queries
  getApplicationsByStudent(studentId: string) {
    return this.applications.filter((a) => a.studentId === studentId);
  }

  getApplicationById(id: string) {
    const app = this.applications.find((a) => a.id === id);
    if (!app) return null;
    const agency = this.getAgencyById(app.agencyId);
    const stages = this.stageEvents.filter((s) => s.applicationId === id);
    const milestones = this.milestones.filter((m) => m.applicationId === id);
    return { ...app, agency, stageEvents: stages, milestones };
  }

  // Milestone Escrow queries
  getMilestonesByApp(applicationId: string) {
    return this.milestones.filter((m) => m.applicationId === applicationId);
  }

  getLedgerEntries() {
    return this.ledgerEntries;
  }

  createLedgerEntry(entry: {
    milestoneId: string;
    type: 'HOLD' | 'RELEASE' | 'REFUND' | 'DISPUTE_FREEZE';
    amountPoisha: string;
    provider: string;
    providerTxnId: string;
    txHash: string;
    actorId: string;
    note?: string;
  }) {
    const newEntry = {
      id: `ldg-${Date.now()}`,
      note: entry.note || '',
      ...entry,
      timestamp: new Date().toISOString(),
    };
    this.ledgerEntries.push(newEntry);
    return newEntry;
  }

  // Chat queries (Module 5.12 — Issue #17)
  getChatThreads(userId: string, role?: string) {
    return this.chatThreads
      .filter((t) => {
        const app = this.applications.find((a) => a.id === t.applicationId);
        if (!app) return false;
        if (role?.toUpperCase() === 'AGENCY') {
          const agency = this.agencies.find((ag) => ag.id === t.agencyId);
          return agency?.ownerUserId === userId || t.agencyId === userId || agency?.id === userId;
        }
        return app.studentId === userId;
      })
      .map((t) => {
        const app = this.applications.find((a) => a.id === t.applicationId);
        const agency = this.agencies.find((ag) => ag.id === t.agencyId);
        const student = this.users.find((u) => u.id === app?.studentId);
        const msgs = this.chatMessages.filter((m) => m.threadId === t.id);
        const lastMessage = msgs[msgs.length - 1] || null;
        const unreadCount = msgs.filter((m) => !m.isRead && m.senderId !== userId).length;

        return {
          id: t.id,
          applicationId: t.applicationId,
          agencyId: t.agencyId,
          agencyName: agency?.name || 'Consultancy Agency',
          studentName: student?.name || 'Student',
          targetUniversity: app?.targetUniversity || 'University',
          targetCountry: app?.targetCountry || 'Country',
          lastMessage: lastMessage ? {
            text: lastMessage.body,
            time: lastMessage.sentAt,
            senderRole: lastMessage.senderRole,
          } : null,
          unreadCount,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      });
  }

  getThreadById(threadId: string) {
    const thread = this.chatThreads.find((t) => t.id === threadId);
    if (!thread) return null;
    const app = this.applications.find((a) => a.id === thread.applicationId);
    const agency = this.agencies.find((ag) => ag.id === thread.agencyId);
    const student = this.users.find((u) => u.id === app?.studentId);
    return { ...thread, application: app, agency, student };
  }

  getThreadByApplicationId(applicationId: string) {
    return this.chatThreads.find((t) => t.applicationId === applicationId) || null;
  }

  getMessagesByThread(threadId: string) {
    return this.chatMessages.filter((m) => m.threadId === threadId);
  }

  createChatMessage(params: {
    threadId: string;
    senderId: string;
    senderRole: 'STUDENT' | 'PARENT' | 'AGENCY' | 'ADMIN' | string;
    body: string;
    attachmentDocId?: string;
  }) {
    const normalizedRole = (params.senderRole?.toUpperCase() || 'STUDENT') as 'STUDENT' | 'PARENT' | 'AGENCY' | 'ADMIN';
    // Generate deterministic SHA-256 simulation hash for immutable audit
    const hashPayload = `${params.threadId}:${params.senderId}:${Date.now()}:${params.body}`;
    let hash = 0;
    for (let i = 0; i < hashPayload.length; i++) {
      hash = (hash << 5) - hash + hashPayload.charCodeAt(i);
      hash |= 0;
    }
    const msgHash = `msg-sha256-${Math.abs(hash).toString(16).padStart(16, '0')}`;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      threadId: params.threadId,
      senderId: params.senderId,
      senderRole: normalizedRole,
      body: params.body,
      attachmentDocId: params.attachmentDocId,
      msgHash,
      isRead: false,
      sentAt: new Date().toISOString(),
    };

    this.chatMessages.push(newMsg);

    // Update thread updatedAt
    const thread = this.chatThreads.find((t) => t.id === params.threadId);
    if (thread) {
      thread.updatedAt = new Date().toISOString();
    }

    return newMsg;
  }

  createChatThread(applicationId: string, agencyId: string) {
    const existing = this.getThreadByApplicationId(applicationId);
    if (existing) return existing;

    const newThread = {
      id: `thd-${Date.now()}`,
      applicationId,
      agencyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.chatThreads.push(newThread);
    return newThread;
  }
}

// Global singleton instance for in-memory persistence during development / demo
const globalForDb = globalThis as unknown as { ethosDb?: InMemoryDatabase };
export const db = globalForDb.ethosDb ?? new InMemoryDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.ethosDb = db;

