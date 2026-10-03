const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPerson2Data() {
  console.log('Seeding initial verified professors in Neon...');

  const topProfs = [
    {
      id: 'prof-bengio',
      name: 'Prof. Yoshua Bengio',
      title: 'Full Professor & Scientific Director',
      university: 'Mila / Université de Montréal',
      department: 'Computer Science and Operations Research',
      country: 'Canada',
      tier: 'R1 / Flagship',
      labName: 'Mila — Quebec AI Institute',
      email: 'yoshua.bengio@mila.quebec',
      googleScholarUrl: 'https://scholar.google.com/citations?user=kukA0ikAAAAJ',
      primaryDomain: 'Artificial Intelligence',
      researchInterests: ['Deep Learning', 'Representation Learning', 'AI Safety & Governance'],
      activeFundingIndicator: true,
      fundingSources: ['CIFAR AI Chair', 'NSERC Discovery Grant'],
      acceptingStudents: true,
      hIndex: 180,
      citationsCount: 650000,
      labLocation: 'Montreal, QC, Canada',
      recentPublications: [
        { title: 'Towards AI Safety and Alignment in Frontier Neural Models', year: 2025 },
        { title: 'Generative Flow Networks for Scientific Discovery', year: 2024 },
      ],
    },
    {
      id: 'prof-schmidhuber',
      name: 'Prof. Jürgen Schmidhuber',
      title: 'Director of the AI Initiative',
      university: 'KAUST / IDSIA',
      department: 'Computer, Electrical and Mathematical Sciences',
      country: 'Switzerland',
      tier: 'R1 / Flagship',
      labName: 'IDSIA AI Laboratory',
      email: 'juergen@idsia.ch',
      googleScholarUrl: 'https://scholar.google.com/citations?user=gLnCTgIAAAAJ',
      primaryDomain: 'Machine Learning',
      researchInterests: ['Recurrent Neural Networks', 'Reinforcement Learning', 'Artificial General Intelligence'],
      activeFundingIndicator: true,
      fundingSources: ['Swiss National Science Foundation (SNSF)', 'ERC Advanced Grant'],
      acceptingStudents: true,
      hIndex: 125,
      citationsCount: 220000,
      labLocation: 'Lugano, Switzerland',
      recentPublications: [
        { title: 'One Big Net for Everything: Meta-Learning and General Problem Solving', year: 2025 },
      ],
    },
    {
      id: 'prof-manning',
      name: 'Prof. Christopher Manning',
      title: 'Thomas M. Siebel Professor in Machine Learning',
      university: 'Stanford University',
      department: 'Linguistics and Computer Science',
      country: 'USA',
      tier: 'R1 / Flagship',
      labName: 'Stanford Natural Language Processing Group',
      email: 'manning@cs.stanford.edu',
      googleScholarUrl: 'https://scholar.google.com/citations?user=1A9UMDAAAAAJ',
      primaryDomain: 'Natural Language Processing',
      researchInterests: ['Natural Language Processing', 'Large Language Models', 'Computational Linguistics'],
      activeFundingIndicator: true,
      fundingSources: ['NSF Directorate for Computer and Information Science', 'Stanford HAI Grant'],
      acceptingStudents: true,
      hIndex: 165,
      citationsCount: 310000,
      labLocation: 'Stanford, CA, USA',
      recentPublications: [
        { title: 'Scaling and Robustness in Transformer-Based Syntactic Reasoning', year: 2025 },
      ],
    },
  ];

  for (const p of topProfs) {
    await prisma.professor.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }
  console.log('Professors seeded successfully!');

  const finalVarsities = await prisma.campusUniversity.count();
  const finalAreas = await prisma.campusArea.count();
  const finalProfs = await prisma.professor.count();
  const finalAgencies = await prisma.agency.count();
  const finalCourses = await prisma.universityCourseCatalog.count();

  console.log('\n--- NEON POSTGRESQL VERIFICATION ---');
  console.log({
    agencies: finalAgencies,
    courseCatalogs: finalCourses,
    campusUniversities: finalVarsities,
    campusAreas: finalAreas,
    professors: finalProfs,
  });

  await prisma.$disconnect();
}

seedPerson2Data().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});
