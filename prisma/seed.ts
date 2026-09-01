/**
 * Ethos AI — Database Seed Script
 * Aligned with Issue #14 (K-11)
 *
 * Populates PostgreSQL database with realistic Bangladeshi study-abroad consultancy data,
 * multi-role user accounts, linked guardians, stage-tracked applications, escrow milestones,
 * immutable ledger transactions, and tamper-evident chat logs.
 */

import { PrismaClient } from '@prisma/client';
import seedData from './seedData.json';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Starting Ethos AI database seeding...');

  // 1. Seed Users
  console.log(`👤 Seeding ${seedData.users.length} users...`);
  for (const u of seedData.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        phone: u.phone,
        name: u.name,
        role: u.role as any,
        isVerified: u.isVerified,
        avatarUrl: u.avatarUrl,
      },
    });
  }

  // 2. Seed Student Profiles
  console.log(`🎓 Seeding ${seedData.studentProfiles.length} student profiles...`);
  for (const sp of seedData.studentProfiles) {
    await prisma.studentProfile.upsert({
      where: { id: sp.id },
      update: {},
      create: {
        id: sp.id,
        userId: sp.userId,
        targetCountries: sp.targetCountries,
        targetField: sp.targetField,
        budgetRange: sp.budgetRange,
        ieltsScore: sp.ieltsScore,
        linkCode: sp.linkCode,
        educationHistory: sp.educationHistory as any,
      },
    });
  }

  // 3. Seed Parent Links
  console.log(`👨‍👩‍👧 Seeding ${seedData.parentLinks.length} parent-student guardian links...`);
  for (const pl of seedData.parentLinks) {
    await prisma.parentLink.upsert({
      where: { id: pl.id },
      update: {},
      create: {
        id: pl.id,
        parentId: pl.parentId,
        studentId: pl.studentId,
        relationship: pl.relationship,
        isApproved: pl.isApproved,
      },
    });
  }

  // 4. Seed Agencies
  console.log(`🏢 Seeding ${seedData.agencies.length} agencies...`);
  for (const a of seedData.agencies) {
    await prisma.agency.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        ownerUserId: a.ownerUserId,
        name: a.name,
        licenseNo: a.licenseNo,
        licenseStatus: a.licenseStatus as any,
        countriesServed: a.countriesServed,
        foundedYear: a.foundedYear,
        riskScore: a.riskScore,
        rating: a.rating,
        reviewCount: a.reviewCount,
        successRate: a.successRate,
        feeMinPoisha: BigInt(a.feeMinPoisha),
        feeMaxPoisha: BigInt(a.feeMaxPoisha),
        address: a.address,
        website: a.website,
        description: a.description,
      },
    });
  }

  // 5. Seed Agency Pricing
  console.log(`💰 Seeding ${seedData.agencyPricings.length} agency pricing packages...`);
  for (const pr of seedData.agencyPricings) {
    await prisma.agencyPricing.upsert({
      where: { id: pr.id },
      update: {},
      create: {
        id: pr.id,
        agencyId: pr.agencyId,
        serviceName: pr.serviceName,
        amountPoisha: BigInt(pr.amountPoisha),
        whenCharged: pr.whenCharged,
        refundable: pr.refundable,
        conditions: pr.conditions,
      },
    });
  }

  // 6. Seed Applications & Stage Events
  console.log(`📂 Seeding ${seedData.applications.length} applications...`);
  for (const app of seedData.applications) {
    await prisma.application.upsert({
      where: { id: app.id },
      update: {},
      create: {
        id: app.id,
        studentId: app.studentId,
        agencyId: app.agencyId,
        targetCountry: app.targetCountry,
        targetUniversity: app.targetUniversity,
        targetProgram: app.targetProgram,
        intakeSemester: app.intakeSemester,
        stage: app.stage as any,
      },
    });
  }

  for (const ste of seedData.stageEvents) {
    await prisma.stageEvent.upsert({
      where: { id: ste.id },
      update: {},
      create: {
        id: ste.id,
        applicationId: ste.applicationId,
        stage: ste.stage as any,
        actorId: ste.actorId,
        actorRole: ste.actorRole as any,
        note: ste.note,
        timestamp: new Date(ste.timestamp),
      },
    });
  }

  // 7. Seed Milestones, Ledger & Receipts
  console.log(`💳 Seeding ${seedData.milestones.length} milestones & ledger entries...`);
  for (const m of seedData.milestones) {
    await prisma.milestone.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        applicationId: m.applicationId,
        name: m.name,
        orderIndex: m.orderIndex,
        amountPoisha: BigInt(m.amountPoisha),
        releaseCondition: m.releaseCondition,
        status: m.status as any,
      },
    });
  }

  for (const ldg of seedData.ledgerEntries) {
    await prisma.ledgerEntry.upsert({
      where: { id: ldg.id },
      update: {},
      create: {
        id: ldg.id,
        milestoneId: ldg.milestoneId,
        type: ldg.type as any,
        amountPoisha: BigInt(ldg.amountPoisha),
        provider: ldg.provider,
        providerTxnId: ldg.providerTxnId,
        txHash: ldg.txHash,
        actorId: ldg.actorId,
        note: ldg.note,
        timestamp: new Date(ldg.timestamp),
      },
    });
  }

  for (const rec of seedData.receipts) {
    await prisma.receipt.upsert({
      where: { id: rec.id },
      update: {},
      create: {
        id: rec.id,
        ledgerEntryId: rec.ledgerEntryId,
        receiptNumber: rec.receiptNumber,
        amountPoisha: BigInt(rec.amountPoisha),
        currency: rec.currency,
        pdfStorageKey: rec.pdfStorageKey,
        generatedAt: new Date(rec.generatedAt),
      },
    });
  }

  // 8. Seed Chat Threads & Messages
  console.log(`💬 Seeding ${seedData.chatThreads.length} chat threads & ${seedData.chatMessages.length} messages...`);
  for (const th of seedData.chatThreads) {
    await prisma.chatThread.upsert({
      where: { id: th.id },
      update: {},
      create: {
        id: th.id,
        applicationId: th.applicationId,
        agencyId: th.agencyId,
        createdAt: new Date(th.createdAt),
        updatedAt: new Date(th.updatedAt),
      },
    });
  }

  for (const msg of seedData.chatMessages) {
    await prisma.chatMessage.upsert({
      where: { id: msg.id },
      update: {},
      create: {
        id: msg.id,
        threadId: msg.threadId,
        senderId: msg.senderId,
        senderRole: msg.senderRole as any,
        body: msg.body,
        msgHash: msg.msgHash,
        isRead: msg.isRead,
        sentAt: new Date(msg.sentAt),
      },
    });
  }

  console.log('✅ Ethos AI database seeding completed successfully!');
}

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error('❌ Seeding error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
