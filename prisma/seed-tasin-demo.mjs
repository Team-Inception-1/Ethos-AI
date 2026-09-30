import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';

export const TASIN_ID = '8b899dca-af23-4d26-a97b-f3289d4030d1';

const hash = value => createHash('sha256').update(value).digest('hex');

export async function seedTasinDemo(prisma) {
  const student = await prisma.user.findUnique({ where: { id: TASIN_ID }, select: { id: true, name: true, role: true } });
  if (!student || student.role !== 'STUDENT') throw new Error('The configured Tasin student account was not found.');

  const agencies = await prisma.agency.findMany({
    where: { id: { in: ['agt-001', 'agt-002'] }, licenseStatus: 'VERIFIED' },
    select: { id: true, ownerUserId: true },
  });
  const agencyById = new Map(agencies.map(agency => [agency.id, agency]));
  if (!agencyById.has('agt-001') || !agencyById.has('agt-002')) {
    throw new Error('Both demo agencies must exist and be verified before seeding applications.');
  }

  const firstApplication = await prisma.application.upsert({
    where: { id: 'demo-tasin-ubc-2026' }, update: {}, create: {
      id: 'demo-tasin-ubc-2026', studentId: student.id, agencyId: 'agt-001', targetCountry: 'Canada',
      targetUniversity: 'University of British Columbia', targetProgram: 'M.Sc. in Computer Science',
      intakeSemester: 'Fall 2026', stage: 'UNDER_REVIEW',
    },
  });
  const secondApplication = await prisma.application.upsert({
    where: { id: 'demo-tasin-utoronto-2027' }, update: {}, create: {
      id: 'demo-tasin-utoronto-2027', studentId: student.id, agencyId: 'agt-002', targetCountry: 'Canada',
      targetUniversity: 'University of Toronto', targetProgram: 'M.Sc. in Applied Computing',
      intakeSemester: 'Winter 2027', stage: 'SUBMITTED',
    },
  });

  const events = [
    { id: 'demo-tasin-ubc-submitted', applicationId: firstApplication.id, stage: 'SUBMITTED', actorId: student.id,
      actorRole: 'STUDENT', note: 'Application submitted with academic profile and study goals.', timestamp: new Date('2026-09-20T08:30:00Z') },
    { id: 'demo-tasin-ubc-review', applicationId: firstApplication.id, stage: 'UNDER_REVIEW',
      actorId: agencyById.get('agt-001').ownerUserId, actorRole: 'AGENCY',
      note: 'Agency verified the profile and started the UBC application review.', timestamp: new Date('2026-09-22T10:15:00Z') },
    { id: 'demo-tasin-utoronto-submitted', applicationId: secondApplication.id, stage: 'SUBMITTED', actorId: student.id,
      actorRole: 'STUDENT', note: 'Application created and awaiting agency document review.', timestamp: new Date('2026-09-28T06:45:00Z') },
  ];
  for (const event of events) await prisma.stageEvent.upsert({ where: { id: event.id }, update: {}, create: event });

  const milestones = [
    { id: 'demo-tasin-ubc-file', applicationId: firstApplication.id, name: 'Profile Assessment & University Shortlist',
      orderIndex: 1, amountPoisha: BigInt(500000), releaseCondition: 'Student profile evaluated and shortlist approved', status: 'RELEASED' },
    { id: 'demo-tasin-ubc-offer', applicationId: firstApplication.id, name: 'Offer Letter Application & Processing',
      orderIndex: 2, amountPoisha: BigInt(2500000), releaseCondition: 'Official offer letter received and verified', status: 'HELD' },
    { id: 'demo-tasin-ubc-visa', applicationId: firstApplication.id, name: 'Visa Documentation & Interview Prep',
      orderIndex: 3, amountPoisha: BigInt(3000000), releaseCondition: 'Study-permit application prepared for filing', status: 'PENDING' },
    { id: 'demo-tasin-utoronto-initial', applicationId: secondApplication.id, name: 'Initial Processing Fee',
      orderIndex: 1, amountPoisha: BigInt(2000000), releaseCondition: 'Initial document review completed', status: 'PENDING' },
  ];
  for (const milestone of milestones) await prisma.milestone.upsert({ where: { id: milestone.id }, update: {}, create: milestone });

  const ledger = [
    { id: 'demo-tasin-ledger-file-hold', milestoneId: 'demo-tasin-ubc-file', type: 'HOLD', amountPoisha: BigInt(500000),
      provider: 'BKASH', providerTxnId: 'DEMO-TASIN-FILE-HOLD', actorId: student.id,
      note: 'Initial fee deposited into protected escrow.', timestamp: new Date('2026-09-20T08:35:00Z') },
    { id: 'demo-tasin-ledger-file-release', milestoneId: 'demo-tasin-ubc-file', type: 'RELEASE', amountPoisha: BigInt(500000),
      provider: 'BKASH', providerTxnId: 'DEMO-TASIN-FILE-RELEASE', actorId: student.id,
      note: 'Released after the profile assessment was confirmed.', timestamp: new Date('2026-09-21T09:00:00Z') },
    { id: 'demo-tasin-ledger-offer-hold', milestoneId: 'demo-tasin-ubc-offer', type: 'HOLD', amountPoisha: BigInt(2500000),
      provider: 'SSLCOMMERZ', providerTxnId: 'DEMO-TASIN-OFFER-HOLD', actorId: student.id,
      note: 'Offer-processing fee is held until the offer is verified.', timestamp: new Date('2026-09-22T10:30:00Z') },
  ];
  for (const entry of ledger) await prisma.ledgerEntry.upsert({ where: { id: entry.id }, update: {}, create: {
    ...entry, txHash: hash(`${entry.id}:${entry.providerTxnId}:${entry.amountPoisha}`),
  } });

  await prisma.receipt.upsert({ where: { id: 'demo-tasin-receipt-file' }, update: {}, create: {
    id: 'demo-tasin-receipt-file', ledgerEntryId: 'demo-tasin-ledger-file-release', receiptNumber: 'ETHOS-DEMO-TASIN-001',
    amountPoisha: BigInt(500000), currency: 'BDT', generatedAt: new Date('2026-09-21T09:01:00Z'),
  } });

  return { student: student.name, applications: [firstApplication.id, secondApplication.id] };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv.includes('--apply')) throw new Error('Refusing to change data without the explicit --apply flag.');
  const prisma = new PrismaClient();
  try {
    const result = await seedTasinDemo(prisma);
    console.log(`Demo ready for ${result.student}: ${result.applications.join(', ')}`);
  } finally {
    await prisma.$disconnect();
  }
}
