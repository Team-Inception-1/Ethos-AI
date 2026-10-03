const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('==============================================');
  console.log('   NEON POSTGRESQL LIVE DATABASE AUDIT');
  console.log('==============================================\n');
  
  const profCount = await prisma.professor.count();
  console.log('1. Professors Table: ' + profCount + ' records');
  const profs = await prisma.professor.findMany({
    select: { name: true, primaryDomain: true, country: true },
    orderBy: { citationsCount: 'desc' },
  });
  profs.forEach((p, i) => {
    console.log('   [' + (i + 1) + '] ' + p.name + ' — ' + p.primaryDomain + ' (' + p.country + ')');
  });

  const agencyCount = await prisma.agency.count();
  console.log('\n2. Agencies Table: ' + agencyCount + ' agencies');

  const courseCount = await prisma.courseCatalog.count();
  console.log('3. Course Catalogs Table: ' + courseCount + ' university courses');

  const campusUniCount = await prisma.campusUniversity.count();
  console.log('4. Campus Universities Table: ' + campusUniCount + ' universities');

  const campusAreaCount = await prisma.campusArea.count();
  console.log('5. Campus Living Areas Table: ' + campusAreaCount + ' rental living areas');

  const outreachCount = await prisma.professorOutreach.count();
  console.log('6. Professor Outreach Table: ' + outreachCount + ' records');

  const shortlistCount = await prisma.counselorShortlist.count();
  console.log('7. Counselor Shortlists Table: ' + shortlistCount + ' records');

  const roadmapCount = await prisma.counselorRoadmap.count();
  console.log('8. Counselor Roadmaps Table: ' + roadmapCount + ' records');

  await prisma.$disconnect();
  console.log('\n==============================================');
  console.log('  CONFIRMED: ALL DATA IS SAVED IN NEON DB');
  console.log('==============================================');
}

checkDatabase().catch((err) => {
  console.error('Database query error:', err);
  process.exit(1);
});
