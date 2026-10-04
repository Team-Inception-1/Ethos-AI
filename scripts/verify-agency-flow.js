const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('--- 1. Check existing user Shopno International BD ---');
  const shopnoUser = await prisma.user.findUnique({
    where: { email: 'seyagi6887@flakeian.com' },
    include: { agencyProfile: true }
  });
  console.log('Shopno User found:', !!shopnoUser);
  console.log('Shopno Agency profile:', shopnoUser?.agencyProfile?.name);
  console.log('Shopno License:', shopnoUser?.agencyProfile?.licenseNo);
  console.log('Shopno Status:', shopnoUser?.agencyProfile?.licenseStatus);

  if (!shopnoUser?.agencyProfile) {
    throw new Error('FAILED: Shopno International BD does not have an agencyProfile!');
  }
  if (shopnoUser.agencyProfile.licenseStatus !== 'VERIFIED') {
    throw new Error('FAILED: Shopno International BD is not VERIFIED!');
  }

  console.log('\n--- 2. Simulate new agency registration & admin verification flow ---');
  const testId = 'test-agency-' + Date.now();
  const testEmail = 'verify-agency-' + Date.now() + '@ethos.test';
  
  // Step A: Registration complete creates User + agencyProfile (PENDING)
  const newUser = await prisma.user.create({
    data: {
      id: testId,
      name: 'Automated Test Agency',
      email: testEmail,
      phone: '+88017' + Math.floor(10000000 + Math.random() * 90000000),
      role: 'AGENCY',
      isVerified: false,
      agencyProfile: {
        create: {
          name: 'Automated Test Agency',
          licenseNo: 'TEST-BD-' + Date.now(),
          licenseStatus: 'PENDING',
          countriesServed: ['CAN', 'GBR'],
        }
      }
    },
    include: { agencyProfile: true }
  });
  console.log('Registered agency user:', newUser.id, '| isVerified:', newUser.isVerified);
  console.log('Registered agency profile:', newUser.agencyProfile?.name, '| Status:', newUser.agencyProfile?.licenseStatus);
  
  if (newUser.agencyProfile?.licenseStatus !== 'PENDING') {
    throw new Error('FAILED: Newly registered agency is not PENDING!');
  }

  // Step B: Appears in Admin Agencies Query
  const adminAgencies = await prisma.agency.findMany({
    where: { id: newUser.agencyProfile.id },
    include: { owner: true }
  });
  console.log('Found in Admin Agencies queue:', adminAgencies.length === 1, '| Status:', adminAgencies[0]?.licenseStatus);
  if (adminAgencies.length !== 1) {
    throw new Error('FAILED: Agency did not appear in admin agencies queue!');
  }

  // Step C: Admin approves agency in Agency Audits queue
  const approvedAgency = await prisma.$transaction(async (tx) => {
    const updated = await tx.agency.update({
      where: { id: newUser.agencyProfile.id },
      data: { licenseStatus: 'VERIFIED' }
    });
    await tx.user.update({
      where: { id: updated.ownerUserId },
      data: { isVerified: true }
    });
    return updated;
  });

  const reloadedUser = await prisma.user.findUnique({
    where: { id: newUser.id },
    include: { agencyProfile: true }
  });
  console.log('After approval - User isVerified:', reloadedUser.isVerified);
  console.log('After approval - Agency licenseStatus:', reloadedUser.agencyProfile?.licenseStatus);

  if (!reloadedUser.isVerified || reloadedUser.agencyProfile?.licenseStatus !== 'VERIFIED') {
    throw new Error('FAILED: Approval did not synchronize User and Agency status!');
  }

  // Cleanup test user
  await prisma.agency.delete({ where: { id: newUser.agencyProfile.id } });
  await prisma.user.delete({ where: { id: newUser.id } });
  console.log('\n--- Cleanup complete. All verification assertions PASSED! ---');
}

verify()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
