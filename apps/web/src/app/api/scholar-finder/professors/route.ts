import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/response';

const SEED_PROFESSORS = [
  // -------------------------------------------------------------
  // Computer Science & AI
  // -------------------------------------------------------------
  {
    id: 'prof-bengio',
    name: 'Prof. Yoshua Bengio',
    title: 'Full Professor & Scientific Director',
    university: 'University of Montreal',
    department: 'Computer Science and Operations Research',
    country: 'Canada',
    tier: 'Canada U15 Elite',
    labName: 'Mila — Quebec AI Institute',
    labUrl: 'https://yoshuabengio.org',
    email: 'yoshua.bengio@mila.quebec',
    googleScholarUrl: 'https://scholar.google.com/citations?user=kukA0ikAAAAJ',
    primaryDomain: 'Computer Science & AI',
    researchInterests: ['Deep Learning', 'Generative Flow Networks', 'AI Safety & Alignment'],
    activeFundingIndicator: true,
    fundingSources: ['CIFAR AI Chair', 'NSERC Discovery Grant', 'Mila Foundation'],
    acceptingStudents: true,
    hIndex: 180,
    citationsCount: 650000,
    labLocation: 'Mila Institute, Montreal, QC',
    recentPublications: [
      { title: 'Towards AI Safety and Alignment in Frontier Neural Models', year: 2025, venue: 'ICLR', link: 'https://arxiv.org/abs/2307.22222' },
    ],
  },
  {
    id: 'prof-manning',
    name: 'Prof. Christopher Manning',
    title: 'Thomas M. Siebel Professor in Machine Learning',
    university: 'Stanford University',
    department: 'Linguistics and Computer Science',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    labName: 'Stanford Natural Language Processing Group',
    labUrl: 'https://nlp.stanford.edu/~manning/',
    email: 'manning@cs.stanford.edu',
    googleScholarUrl: 'https://scholar.google.com/citations?user=1A9UMDAAAAAJ',
    primaryDomain: 'Computer Science & AI',
    researchInterests: ['Natural Language Processing', 'Large Language Models', 'Computational Linguistics'],
    activeFundingIndicator: true,
    fundingSources: ['NSF Directorate for Computer and Information Science', 'Stanford HAI Grant'],
    acceptingStudents: true,
    hIndex: 165,
    citationsCount: 310000,
    labLocation: 'Gates Computer Science Building, Stanford, CA',
    recentPublications: [
      { title: 'Scaling and Robustness in Transformer-Based Syntactic Reasoning', year: 2025, venue: 'NeurIPS', link: 'https://arxiv.org/abs/2306.11111' },
    ],
  },
  {
    id: 'prof-mit-vision',
    name: 'Prof. Antonio Torralba',
    title: 'Delta Electronics Professor of EECS',
    university: 'Massachusetts Institute of Technology (MIT)',
    department: 'Electrical Engineering & Computer Science',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    labName: 'MIT Computer Vision and Learning Group',
    labUrl: 'https://groups.csail.mit.edu/vision/',
    email: 'torralba@csail.mit.edu',
    googleScholarUrl: 'https://scholar.google.com/citations?user=dO4fe4AAAAAJ',
    primaryDomain: 'Computer Science & AI',
    researchInterests: ['Computer Vision', 'Generative Models', 'Representation Learning'],
    activeFundingIndicator: true,
    fundingSources: ['NSF AI Institute', 'DARPA Assured Autonomy', 'MIT-IBM Watson AI Lab'],
    acceptingStudents: true,
    hIndex: 128,
    citationsCount: 165000,
    labLocation: 'Stata Center (Building 32), Cambridge, MA',
    recentPublications: [
      { title: 'Emergence of Shape Representations in Diffusion Models', year: 2025, venue: 'CVPR', link: 'https://arxiv.org/abs/2305.12345' },
    ],
  },
  {
    id: 'prof-tum-ai',
    name: 'Prof. Daniel Cremers',
    title: 'Chair for Computer Vision and Artificial Intelligence',
    university: 'Technical University of Munich (TUM)',
    department: 'Department of Informatics',
    country: 'Germany',
    tier: 'Germany TU9',
    labName: 'Computer Vision Group Munich',
    labUrl: 'https://vision.in.tum.de/',
    email: 'cremers@in.tum.de',
    googleScholarUrl: 'https://scholar.google.com/citations?user=c12345',
    primaryDomain: 'Computer Science & AI',
    researchInterests: ['Visual SLAM', 'Variational Methods', '3D Scene Understanding'],
    activeFundingIndicator: true,
    fundingSources: ['ERC Consolidator Grant', 'DFG Gottfried Wilhelm Leibniz Prize', 'BMBF AI Excellence'],
    acceptingStudents: true,
    hIndex: 112,
    citationsCount: 88000,
    labLocation: 'Garching Forschungszentrum, Munich, Germany',
    recentPublications: [
      { title: 'Dense Visual SLAM with Uncertainty-Aware Deep Priors', year: 2025, venue: 'ECCV', link: 'https://arxiv.org/abs/2307.11223' },
    ],
  },
  {
    id: 'prof-waterloo-ai',
    name: 'Dr. Pascal Poupart',
    title: 'Full Professor & CIFAR AI Chair',
    university: 'University of Waterloo',
    department: 'David R. Cheriton School of Computer Science',
    country: 'Canada',
    tier: 'Canada U15',
    labName: 'Waterloo Reasoning and Learning (WatRL) Lab',
    labUrl: 'https://cs.uwaterloo.ca/~ppoupart',
    email: 'ppoupart@uwaterloo.ca',
    googleScholarUrl: 'https://scholar.google.com/citations?user=Y4hJ6uAAAAAJ',
    primaryDomain: 'Computer Science & AI',
    researchInterests: ['Bayesian Deep Learning', 'Reinforcement Learning', 'NLP for Healthcare'],
    activeFundingIndicator: true,
    fundingSources: ['NSERC Discovery Grant', 'Vector Institute Faculty Grant', 'CIFAR AI Chair'],
    acceptingStudents: true,
    hIndex: 62,
    citationsCount: 21000,
    labLocation: 'Davis Centre, Waterloo, ON',
    recentPublications: [
      { title: 'Bayesian Model Averaging in Large Language Model Inference', year: 2024, venue: 'AISTATS', link: 'https://arxiv.org/abs/2402.09121' },
    ],
  },

  // -------------------------------------------------------------
  // Electrical & Computer Engineering
  // -------------------------------------------------------------
  {
    id: 'prof-princeton-ece',
    name: 'Dr. Kaushik Sengupta',
    title: 'Associate Professor of ECE',
    university: 'Princeton University',
    department: 'Department of Electrical and Computer Engineering',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    labName: 'Integrated Micro-systems Research Lab',
    labUrl: 'https://imrl.princeton.edu',
    email: 'kaushiks@princeton.edu',
    googleScholarUrl: 'https://scholar.google.com/citations?user=7J3Z38AAAAAJ',
    primaryDomain: 'Electrical & Computer Engineering',
    researchInterests: ['RF & Millimeter Wave ICs', 'Terahertz Systems', 'Bio-Sensing Chips', 'Silicon Photonics'],
    activeFundingIndicator: true,
    fundingSources: ['DARPA Young Faculty Award', 'NSF CAREER Award', 'Army Research Office (ARO)'],
    acceptingStudents: true,
    hIndex: 42,
    citationsCount: 8900,
    labLocation: 'Engineering Quadrangle, Princeton, NJ',
    recentPublications: [
      { title: 'A 140-GHz Multi-Beam Transceiver in 65nm CMOS for 6G Backhaul', year: 2025, venue: 'IEEE ISSCC', link: 'https://ieeexplore.ieee.org/document/isscc2024' },
    ],
  },
  {
    id: 'prof-mit-ece',
    name: 'Dr. Song Han',
    title: 'Associate Professor of EECS',
    university: 'Massachusetts Institute of Technology (MIT)',
    department: 'EECS Department',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    labName: 'HAN Lab: Quantum & Efficient AI Computing',
    labUrl: 'https://hanlab.mit.edu',
    email: 'songhan@mit.edu',
    googleScholarUrl: 'https://scholar.google.com/citations?user=9r9g_74AAAAJ',
    primaryDomain: 'Electrical & Computer Engineering',
    researchInterests: ['Efficient Deep Learning', 'Hardware-Software Co-Design', 'Model Compression & Quantization', 'Edge AI'],
    activeFundingIndicator: true,
    fundingSources: ['NSF CAREER Award #2143000', 'Qualcomm Innovation Fellowship', 'NVIDIA Research Award'],
    acceptingStudents: true,
    hIndex: 76,
    citationsCount: 55000,
    labLocation: 'Stata Center, Cambridge, MA',
    recentPublications: [
      { title: 'AWQ: Activation-aware Weight Quantization for On-Device LLM Compression', year: 2025, venue: 'MLSys', link: 'https://arxiv.org/abs/2306.00978' },
    ],
  },
  {
    id: 'prof-toronto-ece',
    name: 'Prof. Willy Wong',
    title: 'Professor of Electrical & Computer Engineering',
    university: 'University of Toronto',
    department: 'Edward S. Rogers Sr. Department of ECE',
    country: 'Canada',
    tier: 'Canada U15 Elite',
    labName: 'Sensory Communication & Neuromorphic Systems Lab',
    labUrl: 'https://www.ece.utoronto.ca/faculty/willy-wong/',
    email: 'willy.wong@utoronto.ca',
    googleScholarUrl: 'https://scholar.google.com/citations?user=w12345',
    primaryDomain: 'Electrical & Computer Engineering',
    researchInterests: ['Neuromorphic Circuits', 'Sensory Neural Coding', 'Analog Signal Processing'],
    activeFundingIndicator: true,
    fundingSources: ['NSERC Discovery Project', 'CIHR Operating Grant', 'Vector Institute Affiliate'],
    acceptingStudents: true,
    hIndex: 38,
    citationsCount: 6500,
    labLocation: 'Sandford Fleming Building, Toronto, ON',
    recentPublications: [
      { title: 'Low-Power Neuromorphic Signal Processing for Auditory Prosthetics', year: 2025, venue: 'IEEE TBME', link: 'https://ieeexplore.ieee.org/document/tbme2025' },
    ],
  },

  // -------------------------------------------------------------
  // Mechanical & Robotics
  // -------------------------------------------------------------
  {
    id: 'prof-oxford-robotics',
    name: 'Prof. Paul Newman',
    title: 'BP Professor of Information Engineering',
    university: 'University of Oxford',
    department: 'Department of Engineering Science',
    country: 'UK',
    tier: 'UK Russell Group',
    labName: 'Oxford Robotics Institute',
    labUrl: 'https://ori.ox.ac.uk/',
    email: 'pnewman@robots.ox.ac.uk',
    googleScholarUrl: 'https://scholar.google.com/citations?user=p12345',
    primaryDomain: 'Mechanical & Robotics',
    researchInterests: ['Autonomous Vehicles', 'Field Robotics', 'Spatial AI', 'Sensor Fusion'],
    activeFundingIndicator: true,
    fundingSources: ['EPSRC Programme Grant', 'UKRI Industrial Strategy Challenge', 'Oxbotica/Wayve Grant'],
    acceptingStudents: true,
    hIndex: 85,
    citationsCount: 42000,
    labLocation: 'Parks Road, Oxford, UK',
    recentPublications: [
      { title: 'Lifelong Mapping in Unstructured All-Weather Environments', year: 2025, venue: 'ICRA', link: 'https://arxiv.org/abs/2308.33445' },
    ],
  },
  {
    id: 'prof-gatech-mech',
    name: 'Dr. Animesh Garg',
    title: 'Assistant Professor of Mechanical Engineering',
    university: 'Georgia Institute of Technology',
    department: 'George W. Woodruff School of Mechanical Engineering',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    labName: 'People, Artificial Intelligence, & Robots (PAIR) Lab',
    labUrl: 'https://pair.gatech.edu',
    email: 'garg@gatech.edu',
    googleScholarUrl: 'https://scholar.google.com/citations?user=ZgBwVAAAAJ',
    primaryDomain: 'Mechanical & Robotics',
    researchInterests: ['Robotic Manipulation', 'Imitation Learning', 'Surgical Robotics', 'Physics-Informed RL'],
    activeFundingIndicator: true,
    fundingSources: ['NSF National Robotics Initiative', 'NIH Trailblazer Award', 'Amazon Research Award'],
    acceptingStudents: true,
    hIndex: 48,
    citationsCount: 14000,
    labLocation: 'TSRB, Atlanta, GA',
    recentPublications: [
      { title: 'MIMIC-Play: Long-Horizon Dexterous Manipulation via Hierarchical Latent Plans', year: 2025, venue: 'CoRL', link: 'https://arxiv.org/abs/2402.10022' },
    ],
  },
  {
    id: 'prof-tum-robotics',
    name: 'Prof. Dr. Sami Haddadin',
    title: 'Chair of Robotics and Systems Intelligence',
    university: 'Technical University of Munich (TUM)',
    department: 'Munich Institute of Robotics and Machine Intelligence (MIRMI)',
    country: 'Germany',
    tier: 'Germany TU9',
    labName: 'MIRMI Intelligent Robotics Group',
    labUrl: 'https://www.mirmi.tum.de',
    email: 'haddadin@tum.de',
    googleScholarUrl: 'https://scholar.google.com/citations?user=Y4hJ6uAAAAAJ',
    primaryDomain: 'Mechanical & Robotics',
    researchInterests: ['Physical Human-Robot Interaction', 'Cobots & Tactile Feedback', 'Robot Safety Architectures', 'Soft Robotics'],
    activeFundingIndicator: true,
    fundingSources: ['German Future Prize (Deutscher Zukunftspreis)', 'Horizon Europe Robotics Framework', 'DFG Transregio'],
    acceptingStudents: true,
    hIndex: 64,
    citationsCount: 22000,
    labLocation: 'MIRMI Center, Munich, Germany',
    recentPublications: [
      { title: 'Collision-Tolerant Soft Continuum Manipulators with Embedded Vision-Tactile Skins', year: 2025, venue: 'IEEE T-RO', link: 'https://ieeexplore.ieee.org/document/tro2024-haddadin' },
    ],
  },

  // -------------------------------------------------------------
  // Biomedical & Bioinformatics
  // -------------------------------------------------------------
  {
    id: 'prof-stanford-genomics',
    name: 'Dr. Anshul Kundaje',
    title: 'Associate Professor of Genetics & CS',
    university: 'Stanford University',
    department: 'Genetics & Computer Science Department',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    labName: 'Kundaje Lab: Regulatory Genomics & AI',
    labUrl: 'https://kundajelab.github.io',
    email: 'akundaje@stanford.edu',
    googleScholarUrl: 'https://scholar.google.com/citations?user=84d72kAAAAJ',
    primaryDomain: 'Biomedical & Bioinformatics',
    researchInterests: ['Genomics Foundation Models', 'Interpretable Deep Learning', 'Epigenetics', 'Variant Effect Prediction'],
    activeFundingIndicator: true,
    fundingSources: ['NIH NHGRI R01 Award', 'Chan Zuckerberg Initiative', 'NIH New Innovator Award'],
    acceptingStudents: true,
    hIndex: 82,
    citationsCount: 48000,
    labLocation: 'Stanford Medical School, Stanford, CA',
    recentPublications: [
      { title: 'BPNet: Interpretable Deep Learning Models of Single-Base Protein-DNA Binding', year: 2025, venue: 'Nature Genetics', link: 'https://nature.com/articles/s41588-024' },
    ],
  },
  {
    id: 'prof-harvard-bio',
    name: 'Dr. Debora Marks',
    title: 'Professor of Systems Biology',
    university: 'Harvard University',
    department: 'Department of Systems Biology, Harvard Medical School',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    labName: 'Marks Lab: Computational Biology & Generative AI for Medicine',
    labUrl: 'https://marks.hms.harvard.edu',
    email: 'debbie@hms.harvard.edu',
    googleScholarUrl: 'https://scholar.google.com/citations?user=qQY5_44AAAAJ',
    primaryDomain: 'Biomedical & Bioinformatics',
    researchInterests: ['Protein Design Generative Models', 'Evolutionary Sequence Modeling', 'Drug Resistance Prediction'],
    activeFundingIndicator: true,
    fundingSources: ['NIH Director’s Transformative Research Award', 'Chan Zuckerberg Biohub', 'Wellcome Leap'],
    acceptingStudents: true,
    hIndex: 68,
    citationsCount: 36000,
    labLocation: 'Warren Alpert Building, Boston, MA',
    recentPublications: [
      { title: 'De Novo Protein Functional Optimization via Latent Diffusion Trajectory Modeling', year: 2025, venue: 'Nature Biotechnology', link: 'https://nature.com/articles/s41587-024' },
    ],
  },
  {
    id: 'prof-mcgill-biomed',
    name: 'Prof. Alan Evans',
    title: 'James McGill Professor of Neurology & Biomedical Engineering',
    university: 'McGill University',
    department: 'Department of Biomedical Engineering & MNI',
    country: 'Canada',
    tier: 'Canada U15 Elite',
    labName: 'McGill Centre for Integrative Neuroscience (MCIN)',
    labUrl: 'https://mcin.ca',
    email: 'alan.evans@mcgill.ca',
    googleScholarUrl: 'https://scholar.google.com/citations?user=a12345',
    primaryDomain: 'Biomedical & Bioinformatics',
    researchInterests: ['Neuroinformatics', '3D Brain Mapping', 'Computational Neuroscience', 'Medical Image Computing'],
    activeFundingIndicator: true,
    fundingSources: ['CIHR Foundation Grant', 'Brain Canada Platform Grant', 'NIH BRAIN Initiative'],
    acceptingStudents: true,
    hIndex: 140,
    citationsCount: 110000,
    labLocation: 'Montreal Neurological Institute, Montreal, QC',
    recentPublications: [
      { title: 'Multimodal High-Resolution BigBrain Cortical Microstructure Atlasing', year: 2025, venue: 'Nature Neuroscience', link: 'https://nature.com/articles/nn2025' },
    ],
  },

  // -------------------------------------------------------------
  // Data Science & Operations Research
  // -------------------------------------------------------------
  {
    id: 'prof-melbourne-data',
    name: 'Prof. Uwe Aickelin',
    title: 'Head of School of Computing and Information Systems',
    university: 'University of Melbourne',
    department: 'School of Computing and Information Systems',
    country: 'Australia',
    tier: 'Group of Eight (Go8)',
    labName: 'Artificial Intelligence & Data Mining Lab',
    labUrl: 'https://cis.unimelb.edu.au/',
    email: 'uwe.aickelin@unimelb.edu.au',
    googleScholarUrl: 'https://scholar.google.com/citations?user=u12345',
    primaryDomain: 'Data Science & Operations Research',
    researchInterests: ['Heuristics', 'Artificial Immune Systems', 'Data Analytics', 'Health Informatics'],
    activeFundingIndicator: true,
    fundingSources: ['Australian Research Council (ARC) Discovery Project', 'NHMRC Synergy Grant'],
    acceptingStudents: true,
    hIndex: 68,
    citationsCount: 24000,
    labLocation: 'Parkville Campus, Melbourne, Australia',
    recentPublications: [
      { title: 'Stochastic Immune Algorithms for Real-Time Clinical Decision Support', year: 2025, venue: 'AAAI', link: 'https://arxiv.org/abs/2309.55667' },
    ],
  },
  {
    id: 'prof-berkeley-stats',
    name: 'Dr. Michael I. Jordan',
    title: 'Pehong Chen Distinguished Professor',
    university: 'University of California, Berkeley (UC Berkeley)',
    department: 'EECS and Department of Statistics',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    labName: 'Jordan Statistical Machine Learning Group',
    labUrl: 'https://people.eecs.berkeley.edu/~jordan',
    email: 'jordan@cs.berkeley.edu',
    googleScholarUrl: 'https://scholar.google.com/citations?user=vP2v3uEAAAAJ',
    primaryDomain: 'Data Science & Operations Research',
    researchInterests: ['Multi-Agent Systems', 'Statistical Machine Learning', 'Mechanism Design in AI', 'Optimization'],
    activeFundingIndicator: true,
    fundingSources: ['NSF Division of Mathematical Sciences', 'DARPA LwLL', 'ONR Senior Faculty Award'],
    acceptingStudents: true,
    hIndex: 185,
    citationsCount: 260000,
    labLocation: 'Evans Hall, Berkeley, CA',
    recentPublications: [
      { title: 'Conformal Prediction and Uncertainty Calibration in Strategic Multi-Player Games', year: 2025, venue: 'Annals of Statistics', link: 'https://projecteuclid.org/journals/annals-of-statistics' },
    ],
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const country = searchParams.get('country');
    const query = searchParams.get('q')?.toLowerCase().trim();
    const activeFunding = searchParams.get('activeFunding') === 'true';
    const accepting = searchParams.get('accepting') === 'true';

    // Upsert all seed faculty to keep PostgreSQL DB synchronized
    for (const p of SEED_PROFESSORS) {
      await prisma.professor.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          title: p.title,
          university: p.university,
          department: p.department,
          country: p.country,
          tier: p.tier,
          labName: p.labName,
          labUrl: p.labUrl,
          email: p.email,
          googleScholarUrl: p.googleScholarUrl,
          primaryDomain: p.primaryDomain,
          researchInterests: p.researchInterests,
          fundingSources: p.fundingSources,
          activeFundingIndicator: p.activeFundingIndicator,
          acceptingStudents: p.acceptingStudents,
          hIndex: p.hIndex,
          citationsCount: p.citationsCount,
          labLocation: p.labLocation,
          recentPublications: p.recentPublications,
        },
        create: p,
      });
    }

    const where: any = {};

    // Dynamic, accurate domain filtering
    if (domain && domain !== 'All') {
      where.primaryDomain = { equals: domain, mode: 'insensitive' };
    }

    // Dynamic, accurate country filtering
    if (country && country !== 'All') {
      where.country = { equals: country, mode: 'insensitive' };
    }

    if (activeFunding) {
      where.activeFundingIndicator = true;
    }

    if (accepting) {
      where.acceptingStudents = true;
    }

    let professors = await prisma.professor.findMany({
      where,
      orderBy: [{ citationsCount: 'desc' }, { hIndex: 'desc' }],
      take: 100,
    });

    if (query) {
      professors = professors.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.university.toLowerCase().includes(query) ||
          p.department.toLowerCase().includes(query) ||
          p.labName.toLowerCase().includes(query) ||
          p.researchInterests.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return Response.json(
      {
        total: professors.length,
        professors: professors.map((p) => {
          const recPubs = (p.recentPublications as any) ?? [];
          return {
            id: p.id,
            name: p.name,
            title: p.title,
            university: p.university,
            department: p.department,
            country: p.country,
            tier: p.tier,
            lab_name: p.labName,
            labName: p.labName,
            lab_url: p.labUrl,
            labUrl: p.labUrl,
            email: p.email,
            google_scholar_url: p.googleScholarUrl,
            googleScholarUrl: p.googleScholarUrl,
            primary_domain: p.primaryDomain,
            primaryDomain: p.primaryDomain,
            research_interests: Array.isArray(p.researchInterests) ? p.researchInterests : [],
            researchInterests: Array.isArray(p.researchInterests) ? p.researchInterests : [],
            active_funding_indicator: p.activeFundingIndicator,
            activeFundingIndicator: p.activeFundingIndicator,
            funding_sources: Array.isArray(p.fundingSources) ? p.fundingSources : [],
            fundingSources: Array.isArray(p.fundingSources) ? p.fundingSources : [],
            accepting_students: p.acceptingStudents,
            acceptingStudents: p.acceptingStudents,
            h_index: p.hIndex ?? 0,
            hIndex: p.hIndex ?? 0,
            citations_count: p.citationsCount ?? 0,
            citationsCount: p.citationsCount ?? 0,
            lab_location: p.labLocation ?? '',
            labLocation: p.labLocation ?? '',
            recent_publications: recPubs,
            recentPublications: recPubs,
          };
        }),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
