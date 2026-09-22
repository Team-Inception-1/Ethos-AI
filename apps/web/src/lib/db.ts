/**
 * Ethos AI — Database Client & Data Access Layer
 * Aligned with Issue #14 (K-11) & ETHOS_AI_CONTEXT.md §6
 *
 * Provides typed data access for core entities with seamless in-memory fallback
 * when PostgreSQL is offline or running in standalone frontend demo mode.
 */

import seedData from '@/data/seedData.json';

export interface DocumentRecord {
  id: string;
  ownerId: string;
  applicationId?: string | null;
  name: string;
  type: 'offer_letter' | 'agreement' | 'passport' | 'transcript' | 'other';
  size: string;
  sizeBytes: number;
  mimeType: string;
  storageKey: string;
  storageUrl: string;
  version: number;
  riskScore: number | null;
  verdict: 'likely_genuine' | 'needs_review' | 'likely_fake' | null;
  flags: string[];
  uploadedAt: string;
}

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

  documents: DocumentRecord[] = [
    {
      id: 'doc-001',
      ownerId: 'usr-student-01',
      applicationId: 'app-001',
      name: 'Offer_Letter_U_of_Toronto_Fall2026.pdf',
      type: 'offer_letter',
      size: '1.2 MB',
      sizeBytes: 1258291,
      mimeType: 'application/pdf',
      storageKey: 'documents/usr-student-01/offer_toronto.pdf',
      storageUrl: '/uploads/offer_toronto.pdf',
      version: 1,
      riskScore: 4,
      verdict: 'likely_genuine',
      flags: ['Verified official admissions domain', 'University accredited'],
      uploadedAt: '2026-07-25T14:30:00Z',
    },
    {
      id: 'doc-002',
      ownerId: 'usr-student-01',
      applicationId: 'app-001',
      name: 'Signed_Agreement_Global_Edu_BD.pdf',
      type: 'agreement',
      size: '856 KB',
      sizeBytes: 876544,
      mimeType: 'application/pdf',
      storageKey: 'documents/usr-student-01/agreement_globaledu.pdf',
      storageUrl: '/uploads/agreement_globaledu.pdf',
      version: 2,
      riskScore: 28,
      verdict: 'needs_review',
      flags: ['Ambiguous refund terms on non-visa refusal', 'Unilateral indemnity clause'],
      uploadedAt: '2026-07-10T11:00:00Z',
    },
    {
      id: 'doc-003',
      ownerId: 'usr-student-01',
      applicationId: null,
      name: 'Passport_Copy_Riya_Ahmed.pdf',
      type: 'passport',
      size: '320 KB',
      sizeBytes: 327680,
      mimeType: 'application/pdf',
      storageKey: 'documents/usr-student-01/passport_copy.pdf',
      storageUrl: '/uploads/passport_copy.pdf',
      version: 1,
      riskScore: null,
      verdict: null,
      flags: [],
      uploadedAt: '2026-07-05T09:15:00Z',
    },
    {
      id: 'doc-004',
      ownerId: 'usr-student-01',
      applicationId: 'app-001',
      name: 'Academic_Transcript_HSC_Viqarunnisa.pdf',
      type: 'transcript',
      size: '2.1 MB',
      sizeBytes: 2202009,
      mimeType: 'application/pdf',
      storageKey: 'documents/usr-student-01/transcript_hsc.pdf',
      storageUrl: '/uploads/transcript_hsc.pdf',
      version: 1,
      riskScore: null,
      verdict: null,
      flags: [],
      uploadedAt: '2026-06-28T16:20:00Z',
    },
  ];

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

  // Document Vault queries & mutations
  getDocuments(ownerId?: string) {
    if (!ownerId) return this.documents;
    return this.documents.filter((d) => d.ownerId === ownerId || d.ownerId === 'usr-student-01');
  }

  getDocumentById(id: string) {
    return this.documents.find((d) => d.id === id) || null;
  }

  createDocument(doc: Omit<DocumentRecord, 'id' | 'uploadedAt'> & { id?: string }) {
    const newDoc: DocumentRecord = {
      id: doc.id || `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: new Date().toISOString(),
      ...doc,
    };
    this.documents.unshift(newDoc);
    return newDoc;
  }

  updateDocumentScan(
    id: string,
    scan: {
      riskScore: number;
      verdict: 'likely_genuine' | 'needs_review' | 'likely_fake';
      flags: string[];
    }
  ) {
    const doc = this.getDocumentById(id);
    if (!doc) return null;
    doc.riskScore = scan.riskScore;
    doc.verdict = scan.verdict;
    doc.flags = scan.flags;
    return doc;
  }

  deleteDocument(id: string) {
    const idx = this.documents.findIndex((d) => d.id === id);
    if (idx !== -1) {
      const removed = this.documents.splice(idx, 1)[0];
      return removed;
    }
    return null;
  }

  // Milestone Escrow queries & actions
  getAllMilestones(applicationId?: string) {
    let list = this.milestones;
    if (applicationId) {
      list = list.filter((m) => m.applicationId === applicationId);
    }
    return list.map((m) => {
      const app = this.applications.find((a) => a.id === m.applicationId);
      const agency = this.agencies.find((ag) => ag.id === app?.agencyId);
      const ledger = this.ledgerEntries.filter((l) => l.milestoneId === m.id);
      return {
        ...m,
        targetUniversity: app?.targetUniversity || 'University of Toronto',
        agencyName: agency?.name || 'Global Edu BD',
        ledgerCount: ledger.length,
      };
    });
  }

  getEscrowSummary() {
    let held = 0;
    let released = 0;
    let pending = 0;
    for (const m of this.milestones) {
      const amt = Number(m.amountPoisha) / 100;
      if (m.status.toUpperCase() === 'HELD') held += amt;
      else if (m.status.toUpperCase() === 'RELEASED') released += amt;
      else if (m.status.toUpperCase() === 'PENDING') pending += amt;
    }
    return { held, released, pending };
  }

  depositEscrow(params: {
    milestoneId: string;
    actorId: string;
    provider: string;
    amountPoisha?: string;
  }) {
    const milestone = this.milestones.find((m) => m.id === params.milestoneId);
    if (!milestone) throw new Error('Milestone not found');

    milestone.status = 'HELD';
    const amountPoisha = params.amountPoisha || milestone.amountPoisha;

    const payload = `HOLD:${milestone.id}:${Date.now()}:${amountPoisha}:${params.provider}`;
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }
    const txHash = `0x${Math.abs(hash).toString(16).padStart(64, 'a')}`;
    const txnId = `${params.provider.toUpperCase()}-TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const entry = this.createLedgerEntry({
      milestoneId: milestone.id,
      type: 'HOLD',
      amountPoisha,
      provider: params.provider,
      providerTxnId: txnId,
      txHash,
      actorId: params.actorId,
      note: `Escrow deposit held securely for ${milestone.name}`,
    });

    return { milestone, entry };
  }

  releaseEscrow(params: {
    milestoneId: string;
    actorId: string;
    note?: string;
  }) {
    const milestone = this.milestones.find((m) => m.id === params.milestoneId);
    if (!milestone) throw new Error('Milestone not found');

    milestone.status = 'RELEASED';

    const payload = `RELEASE:${milestone.id}:${Date.now()}:${milestone.amountPoisha}`;
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }
    const txHash = `0x${Math.abs(hash).toString(16).padStart(64, 'b')}`;
    const txnId = `REL-TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const entry = this.createLedgerEntry({
      milestoneId: milestone.id,
      type: 'RELEASE',
      amountPoisha: milestone.amountPoisha,
      provider: 'ETHOS-ESCROW',
      providerTxnId: txnId,
      txHash,
      actorId: params.actorId,
      note: params.note || `Milestone verified and funds released to agency`,
    });

    const receiptNum = `ETHOS-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receipt = {
      id: `rec-${Date.now()}`,
      ledgerEntryId: entry.id,
      receiptNumber: receiptNum,
      amountPoisha: milestone.amountPoisha,
      currency: 'BDT',
      pdfStorageKey: `receipts/${receiptNum}.pdf`,
      generatedAt: new Date().toISOString(),
    };
    this.receipts.push(receipt);

    return { milestone, entry, receipt };
  }

  disputeEscrow(params: {
    milestoneId: string;
    actorId: string;
    reason: string;
  }) {
    const milestone = this.milestones.find((m) => m.id === params.milestoneId);
    if (!milestone) throw new Error('Milestone not found');

    milestone.status = 'DISPUTED';

    const payload = `DISPUTE:${milestone.id}:${Date.now()}:${params.reason}`;
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }
    const txHash = `0x${Math.abs(hash).toString(16).padStart(64, 'c')}`;

    const entry = this.createLedgerEntry({
      milestoneId: milestone.id,
      type: 'DISPUTE_FREEZE',
      amountPoisha: milestone.amountPoisha,
      provider: 'ETHOS-GOVERNANCE',
      providerTxnId: `DISP-${Math.floor(100000 + Math.random() * 900000)}`,
      txHash,
      actorId: params.actorId,
      note: `Escrow freeze: ${params.reason}`,
    });

    return { milestone, entry };
  }

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
    let thread = this.chatThreads.find((t) => t.id === threadId || t.applicationId === threadId);
    if (!thread) {
      const app = this.applications.find((a) => a.id === threadId);
      if (app) {
        thread = this.createChatThread(app.id, app.agencyId);
      } else {
        return null;
      }
    }
    const app = this.applications.find((a) => a.id === thread.applicationId);
    const agency = this.agencies.find((ag) => ag.id === thread.agencyId);
    const student = this.users.find((u) => u.id === app?.studentId);
    return { ...thread, application: app, agency, student };
  }

  getThreadByApplicationId(applicationId: string) {
    return this.chatThreads.find((t) => t.applicationId === applicationId) || null;
  }

  getMessagesByThread(threadId: string) {
    const thread = this.chatThreads.find((t) => t.id === threadId || t.applicationId === threadId);
    const canonicalId = thread ? thread.id : threadId;
    return this.chatMessages.filter((m) => m.threadId === canonicalId || m.threadId === threadId);
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
if (globalForDb.ethosDb) {
  Object.setPrototypeOf(globalForDb.ethosDb, InMemoryDatabase.prototype);
  if (!globalForDb.ethosDb.documents) {
    globalForDb.ethosDb.documents = new InMemoryDatabase().documents;
  }
  for (const t of seedData.chatThreads) {
    if (!globalForDb.ethosDb.chatThreads.some((et) => et.id === t.id)) {
      globalForDb.ethosDb.chatThreads.push(t);
    }
  }
  for (const m of seedData.chatMessages) {
    if (!globalForDb.ethosDb.chatMessages.some((em) => em.id === m.id)) {
      globalForDb.ethosDb.chatMessages.push(m as any);
    }
  }
}
export const db = globalForDb.ethosDb ?? new InMemoryDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.ethosDb = db;

