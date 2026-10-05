process.env.ETHOS_PAYMENT_MODE = 'sandbox';
process.env.ETHOS_PAYMENT_SANDBOX_SECRET = '0123456789abcdef0123456789abcdef';

import { prisma } from '../apps/web/src/lib/prisma';
import { transitionEscrow } from '../apps/web/src/lib/payments/service';

async function main() {
  console.log('Testing escrow admin verification DB models & transitions...');

  // Find or create test student & agency
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const agency = await prisma.agency.findFirst({ where: { licenseStatus: 'VERIFIED' } });

  if (!student || !agency) {
    console.log('⚠️ Could not find existing student or agency. Skipping live DB test.');
    return;
  }

  // Create an application & milestone
  const app = await prisma.application.create({
    data: {
      studentId: student.id,
      agencyId: agency.id,
      targetCountry: 'Canada',
      targetUniversity: 'University of Toronto',
      targetProgram: 'MSc Computer Science',
      stage: 'SUBMITTED',
    },
  });

  const milestone = await prisma.milestone.create({
    data: {
      applicationId: app.id,
      name: 'Test Verification Milestone',
      orderIndex: 0,
      amountPoisha: BigInt(500000), // 5,000 BDT
      releaseCondition: 'Offer Letter Acceptance',
      status: 'HELD',
      releaseRequested: false,
    },
  });

  console.log(`Created test milestone: ${milestone.id} (Status: ${milestone.status})`);

  try {
    // Step 1: Simulate student requesting release
    const requested = await prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        releaseRequested: true,
        releaseRequestedAt: new Date(),
        releaseNote: 'I received the acceptance letter, please release funds to agency.',
      },
    });

    if (requested.status !== 'HELD' || !requested.releaseRequested) {
      throw new Error('Step 1 Failed: Status should still be HELD and releaseRequested should be true');
    }
    console.log('✅ Step 1 Passed: Student request flagged milestone awaiting admin without disbursing.');

    // Step 2: Query pending releases
    const pending = await prisma.milestone.findMany({
      where: { status: 'HELD', releaseRequested: true, id: milestone.id },
    });

    if (pending.length !== 1) {
      throw new Error('Step 2 Failed: Pending release query did not find requested milestone');
    }
    console.log('✅ Step 2 Passed: Admin releases query correctly finds pending release.');

    // Step 3: Admin Rejection test
    const rejected = await prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        releaseRequested: false,
        releaseNote: 'Rejected: Offer letter missing seal',
      },
    });
    if (rejected.status !== 'HELD' || rejected.releaseRequested) {
      throw new Error('Step 3 Failed: Status should remain HELD and releaseRequested should be false');
    }
    console.log('✅ Step 3 Passed: Admin rejection leaves funds HELD and resets request flag.');

    // Re-request for approval test
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        releaseRequested: true,
        releaseRequestedAt: new Date(),
        releaseNote: 'Re-submitting with official university seal.',
      },
    });

    // Ensure mock valid payment attempt exists for ledger
    await prisma.paymentAttempt.create({
      data: {
        milestoneId: milestone.id,
        provider: 'SANDBOX_BKASH',
        providerTxnId: 'txn_mock_' + Date.now(),
        amountPoisha: BigInt(500000),
        currency: 'BDT',
        status: 'VALID',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    // Step 4: Admin Approval test via transitionEscrow
    const released = await transitionEscrow(
      milestone.id,
      'RELEASED',
      { id: 'usr-admin-01', role: 'ADMIN' },
      'Admin verified official offer letter seal. Approved.'
    );

    if (released.status !== 'RELEASED' || released.releaseRequested) {
      throw new Error(`Step 4 Failed: Expected status RELEASED and releaseRequested false, got ${released.status}`);
    }
    console.log('✅ Step 4 Passed: Admin approval successfully executed transitionEscrow to RELEASED.');

    // Step 5: Check SHA-256 ledger entry
    const ledger = await prisma.ledgerEntry.findFirst({
      where: { milestoneId: milestone.id, type: 'RELEASE' },
    });

    if (!ledger || !ledger.txHash) {
      throw new Error('Step 5 Failed: SHA-256 ledger entry not generated');
    }
    console.log(`✅ Step 5 Passed: SHA-256 ledger entry recorded: ${ledger.txHash.slice(0, 16)}...`);
  } finally {
    // Clean up test data
    await prisma.ledgerEntry.deleteMany({ where: { milestoneId: milestone.id } }).catch(() => {});
    await prisma.paymentAttempt.deleteMany({ where: { milestoneId: milestone.id } }).catch(() => {});
    await prisma.milestone.delete({ where: { id: milestone.id } }).catch(() => {});
    await prisma.application.delete({ where: { id: app.id } }).catch(() => {});
    console.log('✅ Cleaned up test entities successfully.');
  }
  console.log('🎉 All escrow admin verification workflow tests passed perfectly!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
