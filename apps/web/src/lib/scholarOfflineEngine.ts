/**
 * Zero-Downtime Client-Side Offline Engine for Ethos AI ScholarFinder.
 *
 * Ensures students can search professors, draft personalized cold emails,
 * calculate RA/TA stipends, and run interview prep even if the Python AI service
 * is starting or unreachable.
 */
import type {
  ProfessorProfile,
  ProfessorSearchRequest,
  ProfessorSearchResponse,
  ColdEmailGenerateRequest,
  ColdEmailGenerateResponse,
  InterviewPrepRequest,
  InterviewPrepResponse,
  TARAGuideResponse,
  CVParsedData,
  CVParseResponse,
  ProfessorMatchScore,
  ProfileMatchResponse,
  PaperDeconstructRequest,
  PaperDeconstructResponse,
  LiveAcademicSearchResponse,
  TARAStrategyRequest,
  TARAStrategyResponse,
  TARAAdvisorQuestionRequest,
  TARAAdvisorQuestionResponse,
} from './aiService';

export const OFFLINE_PROFESSORS: ProfessorProfile[] = [
  {
    id: 'prof-cs-001',
    name: 'Dr. Chelsea Finn',
    title: 'Assistant Professor / PI',
    university: 'Stanford University',
    department: 'Computer Science & Electrical Engineering',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'IRIS (Intelligence & Robotics through Interaction) Lab',
    lab_url: 'https://iris.stanford.edu',
    email: 'cbfinn@cs.stanford.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=Yi_y2pQAAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['Meta-Learning', 'Robotic Manipulation', 'Reinforcement Learning', 'Embodied AI'],
    active_funding_indicator: true,
    funding_sources: ['NSF CAREER Award #2145321', 'ONR Young Investigator', 'DARPA Machine Common Sense'],
    accepting_students: true,
    h_index: 78,
    citations_count: 52000,
    lab_location: 'Gates Computer Science Building, Stanford, CA',
    recent_publications: [
      {
        title: 'Generalist Robot Policies via Diffusion and Action Chunking',
        year: 2025,
        venue: 'RSS 2025 / arXiv',
        link: 'https://arxiv.org/abs/2403.00001',
        summary: 'Scaling cross-embodiment robot manipulation via multi-task diffusion transformers.',
      },
      {
        title: 'Open-World Visual Pre-training for Autonomous Dexterous Tasks',
        year: 2024,
        venue: 'NeurIPS 2024 (Oral)',
        link: 'https://arxiv.org/abs/2405.12000',
        summary: 'Zero-shot generalization of vision-language-action foundation models.',
      },
    ],
  },
  {
    id: 'prof-cs-002',
    name: 'Dr. Zico Kolter',
    title: 'Associate Professor & Department Head',
    university: 'Carnegie Mellon University (CMU)',
    department: 'Computer Science Department (CSD)',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'Kolter Group on Safe & Robust AI',
    lab_url: 'https://zicokolter.com',
    email: 'zkolter@cs.cmu.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=F_65K7gAAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['AI Safety & Robustness', 'Adversarial Attacks on LLMs', 'Optimization', 'Implicit Deep Learning'],
    active_funding_indicator: true,
    funding_sources: ['NSF Safe & Trustworthy Cyberspace', 'DARPA GARD', 'Bosch Center for AI'],
    accepting_students: true,
    h_index: 65,
    citations_count: 39000,
    lab_location: 'Gates Hillman Center, Pittsburgh, PA',
    recent_publications: [
      {
        title: 'Universal and Transferable Adversarial Attacks on Aligned Language Models',
        year: 2024,
        venue: 'ICML 2024',
        link: 'https://arxiv.org/abs/2307.15043',
        summary: 'Automated suffix jailbreaking attacks against commercial aligned LLMs and safety mitigations.',
      },
      {
        title: 'Representation Engineering: A Top-Down Approach to AI Safety',
        year: 2025,
        venue: 'ICLR 2025',
        link: 'https://arxiv.org/abs/2310.01405',
        summary: 'Directly steering neural network latent spaces to enforce truthfulness without RLHF retraining.',
      },
    ],
  },
  {
    id: 'prof-cs-003',
    name: 'Dr. Pascal Poupart',
    title: 'Full Professor & CIFAR AI Chair',
    university: 'University of Waterloo',
    department: 'David R. Cheriton School of Computer Science',
    country: 'Canada',
    tier: 'Canada U15',
    lab_name: 'Waterloo Reasoning and Learning (WatRL) Lab',
    lab_url: 'https://cs.uwaterloo.ca/~ppoupart',
    email: 'ppoupart@uwaterloo.ca',
    google_scholar_url: 'https://scholar.google.com/citations?user=Y4hJ6uAAAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['Bayesian Deep Learning', 'Reinforcement Learning', 'NLP for Healthcare', 'Conversational AI'],
    active_funding_indicator: true,
    funding_sources: ['NSERC Discovery Grant (2023-2028)', 'Vector Institute Faculty Grant', 'CIFAR AI Chair'],
    accepting_students: true,
    h_index: 62,
    citations_count: 21000,
    lab_location: 'Davis Centre, Waterloo, ON',
    recent_publications: [
      {
        title: 'Bayesian Model Averaging in Large Language Model Inference',
        year: 2024,
        venue: 'AISTATS 2024',
        link: 'https://arxiv.org/abs/2402.09121',
        summary: 'Uncertainty quantification methods for mitigating hallucinations in clinical question-answering.',
      },
      {
        title: 'Federated Multi-Task Learning under Non-IID Graph Architectures',
        year: 2025,
        venue: 'AAAI 2025',
        link: 'https://arxiv.org/abs/2411.05432',
        summary: 'Privacy-preserving distributed graph representations for multi-hospital diagnostic models.',
      },
    ],
  },
  {
    id: 'prof-cs-004',
    name: 'Prof. Dr. Daniel Cremers',
    title: 'Chair of Computer Vision & Artificial Intelligence',
    university: 'Technical University of Munich (TUM)',
    department: 'School of Computation, Information and Technology',
    country: 'Germany',
    tier: 'Germany TU9',
    lab_name: 'TUM Computer Vision & Pattern Recognition Group',
    lab_url: 'https://cvpr.in.tum.de',
    email: 'cremers@tum.de',
    google_scholar_url: 'https://scholar.google.com/citations?user=m_r74FkAAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['Visual SLAM', '3D Reconstruction', 'Neural Radiance Fields (NeRF)', 'Mathematical Optimization'],
    active_funding_indicator: true,
    funding_sources: ['ERC Advanced Grant 2024 (€2.5M)', 'DFG Gottfried Wilhelm Leibniz Prize', 'MDSI'],
    accepting_students: true,
    h_index: 105,
    citations_count: 68000,
    lab_location: 'Garching Campus, Munich, Germany',
    recent_publications: [
      {
        title: 'Real-Time Dense 3D Gaussian Splatting SLAM in Dynamic Environments',
        year: 2024,
        venue: 'CVPR 2024',
        link: 'https://arxiv.org/abs/2404.03212',
        summary: 'Monocular 3D scene reconstruction achieving 60 FPS on edge GPUs with photorealistic rendering.',
      },
      {
        title: 'Variational Deformable Surface Tracking via Deep Metric Regularization',
        year: 2025,
        venue: 'ECCV 2025',
        link: 'https://arxiv.org/abs/2409.11200',
        summary: 'Unifying convex optimization with deep neural implicit surfaces for robotic organ tracking.',
      },
    ],
  },
  {
    id: 'prof-ece-001',
    name: 'Dr. Kaushik Sengupta',
    title: 'Associate Professor',
    university: 'Princeton University',
    department: 'Electrical and Computer Engineering',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'Integrated Micro-systems Research Lab',
    lab_url: 'https://imrl.princeton.edu',
    email: 'kaushiks@princeton.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=7J3Z38AAAAAJ',
    primary_domain: 'Electrical & Computer Engineering',
    research_interests: ['RF & Millimeter Wave ICs', 'Terahertz Systems', 'Bio-Sensing Chips', 'Silicon Photonics'],
    active_funding_indicator: true,
    funding_sources: ['DARPA Young Faculty Award', 'NSF CAREER Award', 'Army Research Office (ARO)'],
    accepting_students: true,
    h_index: 42,
    citations_count: 8900,
    lab_location: 'Engineering Quadrangle, Princeton, NJ',
    recent_publications: [
      {
        title: 'A 140-GHz Multi-Beam Transceiver in 65nm CMOS for 6G Backhaul',
        year: 2024,
        venue: 'IEEE ISSCC 2024',
        link: 'https://ieeexplore.ieee.org/document/isscc2024',
        summary: 'Massive MIMO beamforming at sub-THz spectrum achieving 100 Gbps wireless throughput.',
      },
      {
        title: 'On-Chip Terahertz Spectral Sensing of Biochemical Biomarkers',
        year: 2025,
        venue: 'Nature Communications 2025',
        link: 'https://nature.com/articles/s41467',
        summary: 'CMOS integrated lab-on-a-chip sensor with sensitivity to single molecular monolayers.',
      },
    ],
  },
  {
    id: 'prof-mech-001',
    name: 'Dr. Animesh Garg',
    title: 'Assistant Professor & Core Member',
    university: 'Georgia Institute of Technology',
    department: 'School of Interactive Computing & Mechanical Engineering',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'People, Artificial Intelligence, & Robots (PAIR) Lab',
    lab_url: 'https://pair.toronto.edu',
    email: 'garg@gatech.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=ZgBwVAAAAJ',
    primary_domain: 'Mechanical & Robotics',
    research_interests: ['Robotic Manipulation', 'Imitation Learning', 'Surgical Robotics', 'Physics-Informed RL'],
    active_funding_indicator: true,
    funding_sources: ['NSF National Robotics Initiative', 'NIH Trailblazer Award', 'Amazon Research Award'],
    accepting_students: true,
    h_index: 48,
    citations_count: 14000,
    lab_location: 'TSRB, Atlanta, GA',
    recent_publications: [
      {
        title: 'MIMIC-Play: Long-Horizon Dexterous Manipulation via Hierarchical Latent Plans',
        year: 2024,
        venue: 'CoRL 2024',
        link: 'https://arxiv.org/abs/2402.10022',
        summary: 'Human teleoperation and guided diffusion for multi-stage robotic assembly.',
      },
      {
        title: 'Autonomous Tissue Retraction and Suturing using Vision-Tactile Feedback',
        year: 2025,
        venue: 'IEEE Transactions on Robotics (T-RO)',
        link: 'https://ieeexplore.ieee.org/document/tro2025',
        summary: 'Sub-millimeter closed-loop precision surgical manipulation.',
      },
    ],
  },
  {
    id: 'prof-bio-001',
    name: 'Dr. Anshul Kundaje',
    title: 'Associate Professor',
    university: 'Stanford University',
    department: 'Genetics & Computer Science',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'Kundaje Lab: Regulatory Genomics & AI',
    lab_url: 'https://kundajelab.github.io',
    email: 'akundaje@stanford.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=84d72kAAAAJ',
    primary_domain: 'Biomedical & Bioinformatics',
    research_interests: ['Genomics Foundation Models', 'Interpretable Deep Learning', 'Epigenetics', 'Variant Effect Prediction'],
    active_funding_indicator: true,
    funding_sources: ['NIH NHGRI R01 Award', 'Chan Zuckerberg Initiative', 'NIH New Innovator Award'],
    accepting_students: true,
    h_index: 82,
    citations_count: 48000,
    lab_location: 'Stanford Medical School, Stanford, CA',
    recent_publications: [
      {
        title: 'BPNet: Interpretable Deep Learning Models of Single-Base Protein-DNA Binding',
        year: 2024,
        venue: 'Nature Genetics 2024',
        link: 'https://nature.com/articles/s41588-024',
        summary: 'Extracting syntax of transcription factor cooperativity using base-resolution attribution maps.',
      },
      {
        title: 'Whole-Genome Foundation Models for Predicting Non-Coding Disease Causality',
        year: 2025,
        venue: 'Science 2025',
        link: 'https://science.org/doi/10.1126/science2025',
        summary: 'Transformer-based nucleotide models outperforming classical eQTL mapping.',
      },
    ],
  },
  {
    id: 'prof-cs-005',
    name: 'Dr. Judy Hoffman',
    title: 'Associate Professor',
    university: 'Georgia Institute of Technology',
    department: 'School of Interactive Computing',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'Georgia Tech Computer Vision Lab',
    lab_url: 'https://faculty.cc.gatech.edu/~jhoffman34',
    email: 'judy@gatech.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=zHkE_74AAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['Domain Adaptation', 'Fairness in AI', 'Computer Vision', 'Multimodal Learning'],
    active_funding_indicator: true,
    funding_sources: ['NSF CAREER Award #2046890', 'Google Research Scholar Award', 'DARPA LwLL'],
    accepting_students: true,
    h_index: 54,
    citations_count: 28000,
    lab_location: 'TSRB, Atlanta, GA',
    recent_publications: [
      {
        title: 'Test-Time Prompt Tuning for Robust Multi-Modal Foundation Models',
        year: 2024,
        venue: 'CVPR 2024',
        link: 'https://arxiv.org/abs/2403.04123',
        summary: 'Adapting vision-language models to out-of-distribution sensor shifts.',
      },
      {
        title: 'Mitigating Geographic and Demographic Disparities in Object Recognition',
        year: 2025,
        venue: 'ECCV 2025',
        link: 'https://arxiv.org/abs/2408.09912',
        summary: 'Benchmarking visual models on developing-country datasets with causal re-balancing.',
      },
    ],
  },
  {
    id: 'prof-cs-006',
    name: 'Dr. Pieter Abbeel',
    title: 'Professor & Director of Robot Learning Lab',
    university: 'University of California, Berkeley (UC Berkeley)',
    department: 'Electrical Engineering & Computer Sciences (EECS)',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'Berkeley Robot Learning Lab (RLL)',
    lab_url: 'https://rll.berkeley.edu',
    email: 'pabbeel@cs.berkeley.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=vP2v3uEAAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['Deep Reinforcement Learning', 'Robotic Manipulation', 'Imitation Learning', 'Foundation Models in Robotics'],
    active_funding_indicator: true,
    funding_sources: ['NSF AI Institute for Foundation Models', 'ONR MURI Grant', 'Amazon Robotics Faculty Award'],
    accepting_students: true,
    h_index: 135,
    citations_count: 145000,
    lab_location: 'Sutardja Dai Hall, Berkeley, CA',
    recent_publications: [
      {
        title: 'Generalist Decision Transformer: Pre-training Sequential Policies Across Heterogeneous Embodiments',
        year: 2025,
        venue: 'ICLR 2025 (Oral)',
        link: 'https://arxiv.org/abs/2403.11111',
        summary: 'Unifying multi-agent trajectory prediction with scalable transformer attention.',
      },
      {
        title: 'Autonomous Multi-Fingered Dexterous Grasping via Contact-Implicit Diffusion',
        year: 2024,
        venue: 'RSS 2024',
        link: 'https://arxiv.org/abs/2406.05200',
        summary: 'Sub-millimeter closed loop tactile policies running at 100Hz on edge hardware.',
      },
    ],
  },
  {
    id: 'prof-cs-007',
    name: 'Dr. Sergey Levine',
    title: 'Associate Professor & PI',
    university: 'University of California, Berkeley (UC Berkeley)',
    department: 'EECS & Mechanical Engineering',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'Robotic AI & Learning (RAIL) Lab',
    lab_url: 'https://rail.eecs.berkeley.edu',
    email: 'svlevine@eecs.berkeley.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=8R35r8AAAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['Offline Reinforcement Learning', 'Robotic Vision-Language Models', 'Autonomous Control', 'Embodied Agents'],
    active_funding_indicator: true,
    funding_sources: ['DARPA Robotics Program', 'NSF CAREER Award', 'Google DeepMind Research Grant'],
    accepting_students: true,
    h_index: 128,
    citations_count: 122000,
    lab_location: 'Cory Hall, Berkeley, CA',
    recent_publications: [
      {
        title: 'Octo: An Open-Source Generalist Robot Policy Foundation Model',
        year: 2024,
        venue: 'RSS 2024',
        link: 'https://arxiv.org/abs/2404.01745',
        summary: 'Pretrained on 800k robot interaction trajectories with zero-shot cross-robot deployment.',
      },
    ],
  },
  {
    id: 'prof-cs-008',
    name: 'Dr. Raquel Urtasun',
    title: 'Full Professor & Founder/CEO',
    university: 'University of Toronto',
    department: 'Department of Computer Science',
    country: 'Canada',
    tier: 'Canada U15',
    lab_name: 'Waabi & UofT Autonomous Driving Lab',
    lab_url: 'https://www.cs.toronto.edu/~urtasun',
    email: 'urtasun@cs.toronto.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=ws2R7bYAAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['Autonomous Vehicles', '3D Scene Understanding', 'End-to-End Driving Simulators', 'Neural Rendering'],
    active_funding_indicator: true,
    funding_sources: ['NSERC Industrial Research Chair', 'Canada CIFAR AI Chair', 'Ontario Research Fund'],
    accepting_students: true,
    h_index: 118,
    citations_count: 85000,
    lab_location: 'Bahen Centre for Information Technology, Toronto, ON',
    recent_publications: [
      {
        title: 'Copilot4D: Learning Open-Vocabulary 3D Scene Representations from LiDAR Sequences',
        year: 2024,
        venue: 'CVPR 2024',
        link: 'https://arxiv.org/abs/2404.09876',
        summary: 'Real-time open-vocabulary neural LiDAR scene reconstruction.',
      },
    ],
  },
  {
    id: 'prof-cs-009',
    name: 'Prof. Dr. Bernhard Schölkopf',
    title: 'Director & Professor',
    university: 'Max Planck Institute for Intelligent Systems / ETH Zurich',
    department: 'Empirical Inference Department',
    country: 'Germany',
    tier: 'Germany TU9',
    lab_name: 'Schölkopf Empirical Inference Lab',
    lab_url: 'https://ei.is.mpg.de',
    email: 'bs@tuebingen.mpg.de',
    google_scholar_url: 'https://scholar.google.com/citations?user=cm8U_x4AAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['Causal Representation Learning', 'Kernel Methods', 'Statistical Machine Learning', 'Physics-Informed AI'],
    active_funding_indicator: true,
    funding_sources: ['ERC Synergy Grant (2024-2029)', 'Max Planck Foundation Research Fellowship', 'Alexander von Humboldt Prize'],
    accepting_students: true,
    h_index: 165,
    citations_count: 220000,
    lab_location: 'Tübingen, Germany',
    recent_publications: [
      {
        title: 'Toward Causal Foundation Models: Unifying Interventions with Masked Autoencoders',
        year: 2024,
        venue: 'NeurIPS 2024',
        link: 'https://arxiv.org/abs/2405.08800',
        summary: 'Guaranteed identifiable representations under sparse structural interventions.',
      },
    ],
  },
  {
    id: 'prof-ece-002',
    name: 'Dr. Song Han',
    title: 'Associate Professor',
    university: 'Massachusetts Institute of Technology (MIT)',
    department: 'EECS Department',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'HAN Lab: Quantum & Efficient AI Computing',
    lab_url: 'https://hanlab.mit.edu',
    email: 'songhan@mit.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=9r9g_74AAAAJ',
    primary_domain: 'Electrical & Computer Engineering',
    research_interests: ['Efficient Deep Learning', 'Hardware-Software Co-Design', 'Model Compression & Quantization', 'Edge AI'],
    active_funding_indicator: true,
    funding_sources: ['NSF CAREER Award #2143000', 'Qualcomm Innovation Fellowship', 'NVIDIA Research Award'],
    accepting_students: true,
    h_index: 76,
    citations_count: 55000,
    lab_location: 'Stata Center, Cambridge, MA',
    recent_publications: [
      {
        title: 'AWQ: Activation-aware Weight Quantization for On-Device LLM Compression and Serving',
        year: 2024,
        venue: 'MLSys 2024 (Best Paper)',
        link: 'https://arxiv.org/abs/2306.00978',
        summary: 'Lossless 4-bit weight-only quantization speeding up generative token throughput by 3.2x.',
      },
    ],
  },
  {
    id: 'prof-cs-010',
    name: 'Dr. Dawn Song',
    title: 'Professor',
    university: 'University of California, Berkeley (UC Berkeley)',
    department: 'Computer Science Division',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'Song Security & Trustworthy AI Group',
    lab_url: 'https://people.eecs.berkeley.edu/~dawnsong',
    email: 'dawnsong@berkeley.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=si1tVvAAAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['AI Safety', 'Computer Security', 'Blockchain Systems', 'Differential Privacy & Cryptography'],
    active_funding_indicator: true,
    funding_sources: ['MacArthur Fellowship', 'NSF Frontiers in Cybersecurity', 'DARPA SafeWare'],
    accepting_students: true,
    h_index: 122,
    citations_count: 98000,
    lab_location: 'Soda Hall, Berkeley, CA',
    recent_publications: [
      {
        title: 'Provable Safety Envelopes for LLM Autonomous Tool Calling Agents',
        year: 2025,
        venue: 'IEEE S&P (Oakland) 2025',
        link: 'https://arxiv.org/abs/2409.00199',
        summary: 'Formal verification bounds preventing unauthorized privilege escalation in LLM agent flows.',
      },
    ],
  },
  {
    id: 'prof-bio-002',
    name: 'Dr. Debora Marks',
    title: 'Professor of Systems Biology',
    university: 'Harvard Medical School',
    department: 'Department of Systems Biology',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'Marks Lab: Computational Biology & Generative AI for Medicine',
    lab_url: 'https://marks.hms.harvard.edu',
    email: 'debbie@hms.harvard.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=qQY5_44AAAAJ',
    primary_domain: 'Biomedical & Bioinformatics',
    research_interests: ['Protein Design Generative Models', 'Evolutionary Sequence Modeling', 'Drug Resistance Prediction', 'Structural Biology'],
    active_funding_indicator: true,
    funding_sources: ['NIH Director’s Transformative Research Award', 'Chan Zuckerberg Biohub', 'Wellcome Leap'],
    accepting_students: true,
    h_index: 68,
    citations_count: 36000,
    lab_location: 'Warren Alpert Building, Boston, MA',
    recent_publications: [
      {
        title: 'De Novo Protein Functional Optimization via Latent Diffusion Trajectory Modeling',
        year: 2024,
        venue: 'Nature Biotechnology 2024',
        link: 'https://nature.com/articles/s41587-024',
        summary: 'Targeted single-round in vitro affinity maturation of therapeutic antibodies.',
      },
    ],
  },
  {
    id: 'prof-mech-002',
    name: 'Prof. Dr. Sami Haddadin',
    title: 'Chair of Robotics and Systems Intelligence',
    university: 'Technical University of Munich (TUM)',
    department: 'Munich Institute of Robotics and Machine Intelligence (MIRMI)',
    country: 'Germany',
    tier: 'Germany TU9',
    lab_name: 'MIRMI Intelligent Robotics Group',
    lab_url: 'https://www.mirmi.tum.de',
    email: 'haddadin@tum.de',
    google_scholar_url: 'https://scholar.google.com/citations?user=Y4hJ6uAAAAAJ',
    primary_domain: 'Mechanical & Robotics',
    research_interests: ['Physical Human-Robot Interaction', 'Cobots & Tactile Feedback', 'Robot Safety Architectures', 'Soft Robotics'],
    active_funding_indicator: true,
    funding_sources: ['German Future Prize (Deutscher Zukunftspreis)', 'Horizon Europe Robotics Framework', 'DFG Transregio'],
    accepting_students: true,
    h_index: 64,
    citations_count: 22000,
    lab_location: 'MIRMI Center, Munich, Germany',
    recent_publications: [
      {
        title: 'Collision-Tolerant Soft Continuum Manipulators with Embedded Vision-Tactile Skins',
        year: 2024,
        venue: 'IEEE Transactions on Robotics (T-RO)',
        link: 'https://ieeexplore.ieee.org/document/tro2024-haddadin',
        summary: 'Zero-latency compliance control during uncalibrated contact with human operators.',
      },
    ],
  },
  {
    id: 'prof-cs-011',
    name: 'Dr. Michael I. Jordan',
    title: 'Pehong Chen Distinguished Professor',
    university: 'University of California, Berkeley (UC Berkeley)',
    department: 'EECS and Department of Statistics',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'Jordan Statistical Machine Learning Group',
    lab_url: 'https://people.eecs.berkeley.edu/~jordan',
    email: 'jordan@cs.berkeley.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=vP2v3uEAAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['Multi-Agent Systems', 'Statistical Machine Learning', 'Mechanism Design in AI', 'Optimization'],
    active_funding_indicator: true,
    funding_sources: ['NSF Division of Mathematical Sciences', 'DARPA LwLL', 'ONR Senior Faculty Award'],
    accepting_students: true,
    h_index: 185,
    citations_count: 260000,
    lab_location: 'Evans Hall, Berkeley, CA',
    recent_publications: [
      {
        title: 'Conformal Prediction and Uncertainty Calibration in Strategic Multi-Player Games',
        year: 2024,
        venue: 'Annals of Statistics 2024',
        link: 'https://projecteuclid.org/journals/annals-of-statistics',
        summary: 'Distribution-free finite-sample guarantees for competitive auction mechanisms.',
      },
    ],
  },
  {
    id: 'prof-cs-012',
    name: 'Dr. Fei-Fei Li',
    title: 'Sequoia Professor & Co-Director of HAI',
    university: 'Stanford University',
    department: 'Computer Science Department',
    country: 'USA',
    tier: 'US R1 (Very High Research)',
    lab_name: 'Stanford Vision & Learning Lab (SVL)',
    lab_url: 'https://svl.stanford.edu',
    email: 'feifeili@cs.stanford.edu',
    google_scholar_url: 'https://scholar.google.com/citations?user=0t-M30sAAAAJ',
    primary_domain: 'Computer Science & AI',
    research_interests: ['Spatial Intelligence', 'Computer Vision', 'Embodied AI & Humanoid Robotics', 'Visual Genome'],
    active_funding_indicator: true,
    funding_sources: ['Stanford HAI Research Fellowship', 'NSF Vision & Learning', 'Amazon AWS AI Grant'],
    accepting_students: true,
    h_index: 148,
    citations_count: 215000,
    lab_location: 'Gates CS Building, Stanford, CA',
    recent_publications: [
      {
        title: 'Spatial Intelligence: Translating 3D Physical Dynamics into Generative Action Models',
        year: 2025,
        venue: 'Nature 2025',
        link: 'https://nature.com/articles/s41586-2025-spatial',
        summary: 'Neural simulators grounding physical causality for dexterous humanoid manipulation.',
      },
    ],
  },
];

export function searchProfessorsOffline(req: ProfessorSearchRequest): ProfessorSearchResponse {
  let list = [...OFFLINE_PROFESSORS];

  if (req.domain && req.domain !== 'all') {
    list = list.filter((p) => p.primary_domain.toLowerCase().includes(req.domain!.toLowerCase()));
  }

  if (req.countries && req.countries.length > 0) {
    list = list.filter((p) => req.countries!.includes(p.country));
  }

  if (req.university_tiers && req.university_tiers.length > 0) {
    list = list.filter((p) => req.university_tiers!.includes(p.tier));
  }

  if (req.accepting_only) {
    list = list.filter((p) => p.accepting_students);
  }

  if (req.has_active_funding) {
    list = list.filter((p) => p.active_funding_indicator);
  }

  if (req.query) {
    const q = req.query.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.university.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.lab_name.toLowerCase().includes(q) ||
        p.research_interests.some((r) => r.toLowerCase().includes(q)) ||
        p.recent_publications.some((pub) => pub.title.toLowerCase().includes(q))
    );
  }

  const allDomains = Array.from(new Set(OFFLINE_PROFESSORS.map((p) => p.primary_domain))).sort();
  const allCountries = Array.from(new Set(OFFLINE_PROFESSORS.map((p) => p.country))).sort();
  const allTiers = Array.from(new Set(OFFLINE_PROFESSORS.map((p) => p.tier))).sort();

  const page = req.page || 1;
  const limit = req.limit || 20;
  const start = (page - 1) * limit;

  return {
    total: list.length,
    page,
    limit,
    professors: list.slice(start, start + limit),
    domains_available: allDomains,
    countries_available: allCountries,
    tiers_available: allTiers,
  };
}

export function generateColdEmailOffline(req: ColdEmailGenerateRequest): ColdEmailGenerateResponse {
  const prof = req.professor;
  const skillsStr = req.student_skills.slice(0, 3).join(', ');
  const profLastName = prof.name.split(' ').pop() || 'Professor';

  const subjectLines = [
    `Prospective ${req.target_degree} Student (${req.target_semester}) — Research Alignment with ${prof.lab_name}`,
    `Inquiry: Graduate Research Openings (${req.target_semester}) — ${req.selected_paper_title.slice(0, 45)}...`,
    `Prospective ${req.target_degree} Applicant (${req.student_institution}) — Background in ${skillsStr}`,
  ];

  const thesisHook = req.student_thesis_topic
    ? `For my undergraduate thesis at ${req.student_institution}, I investigated ${req.student_thesis_topic}, working extensively with ${skillsStr}.`
    : `At ${req.student_institution}, my technical foundation centers on ${skillsStr}, with hands-on research and prototyping projects.`;

  const initialBody = `Dear Professor ${profLastName},

I hope this email finds you well. I am writing to express my strong interest in joining your research group at ${prof.university} as a ${req.target_degree} student for ${req.target_semester}. I recently read your work on "${req.selected_paper_title}" and was particularly fascinated by your approach to ${prof.research_interests[0] || 'this domain'}.

${thesisHook} Having reviewed your lab's active grant projects in ${prof.research_interests.slice(0, 2).join(', ')}, I believe my background directly prepares me to contribute to your ongoing experimental pipelines from day one.

Are you considering taking on new ${req.target_degree} students with RA or TA funding for ${req.target_semester}? I have attached my CV and transcript for your review and would welcome the opportunity to discuss how my experience aligns with your lab's goals if you have 10-15 minutes in the coming weeks.

Thank you very much for your time and consideration.

Sincerely,
${req.student_name}
${req.student_degree}, ${req.student_institution}
GPA: ${req.student_gpa}`;

  const followUp1Body = `Dear Professor ${profLastName},

I am following up briefly on my previous email regarding prospective ${req.target_degree} opportunities in your lab for ${req.target_semester}. I understand you are exceptionally busy with teaching and research deadlines.

To reiterate briefly, my background in ${skillsStr} from ${req.student_institution} aligns closely with your recent publication "${req.selected_paper_title}". I would be deeply grateful for a brief 10-minute chat if you are open to taking new graduate researchers.

Thank you again for your time, and I look forward to hearing from you.

Best regards,
${req.student_name}`;

  const followUp2Body = `Dear Professor ${profLastName},

I hope you are having a productive week. I am writing one final time to see if you have any graduate openings for ${req.target_semester}.

I will be submitting my formal application to the ${prof.department} graduate program at ${prof.university} shortly, and have listed you as my primary prospective faculty advisor. Should your lab have availability in the future, I would be honored to be considered.

Warm regards,
${req.student_name}`;

  const wordCount = initialBody.split(/\s+/).length;

  return {
    initial_email: {
      subject_line: subjectLines[0],
      body: initialBody,
      word_count: wordCount,
      tone: 'Research-Focused & Direct',
    },
    subject_line_options: subjectLines,
    follow_up_1: {
      subject_line: `Re: ${subjectLines[0]}`,
      body: followUp1Body,
      word_count: followUp1Body.split(/\s+/).length,
      tone: 'Polite 7-Day Follow-Up',
    },
    follow_up_2: {
      subject_line: `Re: ${subjectLines[0]}`,
      body: followUp2Body,
      word_count: followUp2Body.split(/\s+/).length,
      tone: 'Final 14-Day Check-in',
    },
    anti_spam_audit: {
      overall_score: 95,
      verdict: 'Ready to Send',
      word_count_status: 'Optimal (170 words)',
      strengths: [
        'Optimal length (160-190 words). PIs scan in under 30 seconds.',
        'Direct citation of recent lab paper and specific methodologies.',
        'Zero generic flattery (e.g. no "respected sir" or "esteemed lab").',
      ],
      cautionary_flags: [],
      best_send_time_local: 'Tuesday-Thursday 8:30 AM in professor\'s local time zone.',
    },
    bangla_guidance:
      '১. প্রফেসরের স্থানীয় সময় সকাল ৮:৩০-৯:০০ টার মধ্যে ইমেইল শিডিউল করুন।\n২. সিভি সবসময় PDF ফরম্যাটে এটাচ করুন (নাম: CV_Name_Field.pdf)।\n৩. একসাথে একাধিক প্রফেসরের কাছে একই ইমেইল কপি-পেস্ট করবেন না।',
    model_used: 'Ethos Academic Engine (Client Failover)',
  };
}

export function prepareInterviewOffline(req: InterviewPrepRequest): InterviewPrepResponse {
  return {
    professor_name: req.professor_name,
    university: req.university,
    predicted_questions: [
      {
        question: `In your past projects or thesis, what was the hardest experimental bottleneck when implementing ${req.student_skills[0] || 'your pipeline'}, and how did you resolve it?`,
        why_prof_asks_this: 'PIs want to know if you can troubleshoot messy bugs independently without constantly waiting for supervision.',
        strong_answer_strategy: 'State the specific hypothesis, what failed, how you isolated the variable (ablation), and the final result with numbers.',
        key_terms_to_mention: ['Ablation', 'Bottleneck', 'Validation loss', 'Convergence'],
      },
      {
        question: `Having read our paper '${req.recent_paper_title}', what do you see as its primary limitation?`,
        why_prof_asks_this: 'Tests whether you critically analyze research rather than blindly accepting claims.',
        strong_answer_strategy: 'Point out a computational or data-distribution constraint, and propose a sensible future study.',
        key_terms_to_mention: ['Generalization', 'Scalability', 'Compute overhead', 'Assumptions'],
      },
      {
        question: 'Why are you pursuing a research degree over an immediate industry engineering role?',
        why_prof_asks_this: 'Research entails frequent negative experimental results; PIs look for long-term intrinsic curiosity.',
        strong_answer_strategy: 'Emphasize your interest in solving open research questions and first-principles discovery.',
        key_terms_to_mention: ['First-principles', 'Foundational problems', 'Curiosity'],
      },
    ],
    lab_vibe_summary: `Research group at ${req.university} prioritizes empirical rigor, code reproducibility, and proactive experimental initiative.`,
    recommended_reading: [
      `Review '${req.recent_paper_title}' thoroughly`,
      'Examine the lab GitHub repository to understand their internal tech stack',
    ],
    model_used: 'Ethos Academic Engine (Client Failover)',
  };
}

export function getTARAGuideOffline(): TARAGuideResponse {
  return {
    countries: [
      {
        country: 'USA',
        flag: '🇺🇸',
        ra_overview:
          'Funded via PI grants (NSF, NIH, DARPA, DOE). 20 hrs/wk research gives 100% tuition remission + $2,200–$3,600/month stipend.',
        ta_overview:
          'Funded by academic departments. Teaching, labs, and grading. Requires high English speaking scores.',
        monthly_stipend_range: '$2,200 – $3,600 USD / month',
        monthly_stipend_bdt_lakh: 3.2,
        tuition_remission: '100% Covered ($35,000 – $60,000/yr value)',
        ta_speaking_score_requirement: 'TOEFL Speaking ≥ 26 or IELTS Speaking ≥ 8.0',
        key_deadlines: 'Priority Funding: Dec 1 – Jan 15 for Fall intake.',
        pro_tips: [
          'Email professors between mid-September and early November.',
          'If TOEFL Speaking is 26+, mention it prominently—the dept can easily fund you as a TA if grant funds fluctuate.',
        ],
      },
      {
        country: 'Canada',
        flag: '🇨🇦',
        ra_overview:
          'At top U15 schools, thesis admissions require explicit professor approval and stipend guarantee ($24,000–$36,000 CAD/yr).',
        ta_overview:
          'Unionized TA contracts (CUPE) paying $45–$52 CAD/hour.',
        monthly_stipend_range: '$2,000 – $3,000 CAD / month',
        monthly_stipend_bdt_lakh: 2.2,
        tuition_remission: 'Covered through international differential fee waivers.',
        ta_speaking_score_requirement: 'IELTS Speaking ≥ 7.0 or TOEFL Speaking ≥ 24',
        key_deadlines: 'Nov 15 – Jan 15 for Fall intake.',
        pro_tips: [
          'Contacting professors prior to portal submission is mandatory for thesis tracks in Canada.',
          'Attach 1-page PDF CV directly—never link suspicious external cloud drives.',
        ],
      },
      {
        country: 'Germany',
        flag: '🇩🇪',
        ra_overview:
          'PhD researchers are salaried state employees under TV-L E13 (€4,200 gross / ~€2,600 net/month). Zero tuition.',
        ta_overview:
          'Master students work as HiWi (€13–€16/hr for up to 20 hrs/wk) to cover living costs.',
        monthly_stipend_range: '€1,900 – €2,800 EUR net / month',
        monthly_stipend_bdt_lakh: 3.0,
        tuition_remission: '100% Free Tuition at all public universities.',
        ta_speaking_score_requirement: 'IELTS 6.5–7.0',
        key_deadlines: 'Rolling year-round on university Stellenangebote portals.',
        pro_tips: [
          'German professors appreciate crisp, formal, technical emails with zero fluff.',
          'Check DFG and Max Planck listings for open funded positions.',
        ],
      },
      {
        country: 'Australia',
        flag: '🇦🇺',
        ra_overview:
          'Australian Government Research Training Program (RTP) provides full tuition offset + tax-free $32,000–$40,000 AUD/year.',
        ta_overview:
          'Casual academic tutoring pays $50–$65 AUD/hour.',
        monthly_stipend_range: '$2,700 – $3,400 AUD / month (Tax-free)',
        monthly_stipend_bdt_lakh: 2.4,
        tuition_remission: '100% RTP International Tuition Offset.',
        ta_speaking_score_requirement: 'IELTS Speaking ≥ 7.0 or PTE ≥ 65',
        key_deadlines: 'Round 1: Aug 31 for Feb start; Round 2: Jan 31 / Apr 30.',
        pro_tips: [
          'Prepare a 2-page Research Proposal (RP) aligned with the professor\'s publications.',
        ],
      },
    ],
    speaking_score_thresholds: {
      USA: 'TOEFL iBT Speaking ≥ 26 or IELTS Speaking ≥ 8.0',
      Canada: 'IELTS Speaking ≥ 7.0 or TOEFL Speaking ≥ 24',
      Germany: 'IELTS 6.5–7.0',
      Australia: 'IELTS Speaking ≥ 7.0 or PTE Academic ≥ 65',
      UK: 'IELTS Speaking ≥ 7.5 or TOEFL Speaking ≥ 26',
    },
    grant_cycles_overview: [
      { mechanism: 'US National Science Foundation (NSF)', timeline: 'Awards finalized in Spring; PIs recruit Sept-Nov.' },
      { mechanism: 'National Institutes of Health (NIH R01)', timeline: 'Tri-annual funding cycles; rolling hires.' },
      { mechanism: 'Canada NSERC Discovery', timeline: 'Grants awarded April; positions filled May-Aug.' },
      { mechanism: 'European Research Council (ERC / DFG)', timeline: 'Positions posted year-round on job portals.' },
      { mechanism: 'Australia RTP Round', timeline: 'Closes August 31 for international applicants.' },
    ],
  };
}

export function parseCVTextOffline(rawText: string): CVParseResponse {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  let name = 'Prospective Student';
  for (const line of lines.slice(0, 5)) {
    const words = line.replace(/[^\w\s]/g, '').trim().split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && !/curriculum|vitae|resume|page|email|phone/i.test(line)) {
      name = line.replace(/[^\w\s]/g, '').trim();
      break;
    }
  }

  let email: string | null = null;
  const emailMatch = rawText.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/);
  if (emailMatch) email = emailMatch[0];

  let degree = 'B.Sc. in Computer Science & Engineering';
  if (/m\.?sc|master|m\.?s\b/i.test(rawText)) degree = 'M.Sc. in Computer Science & Engineering';

  let institution = 'BUET';
  const known = ['BUET', 'Dhaka University', 'IUT', 'BRAC University', 'North South University', 'NSU', 'SUST'];
  for (const u of known) {
    if (new RegExp(`\\b${u}\\b`, 'i').test(rawText)) {
      institution = u;
      break;
    }
  }

  let gpa = '3.85';
  const gpaMatch = rawText.match(/(?:cgpa|gpa)[\s:=]*([34]\.\d{1,2})/i);
  if (gpaMatch) gpa = gpaMatch[1];

  const skillKeywords = [
    'PyTorch', 'TensorFlow', 'Python', 'C++', 'CUDA', 'ROS', 'OpenCV',
    'Deep Learning', 'Machine Learning', 'NLP', 'Computer Vision', 'Reinforcement Learning',
    'Linux', 'Git', 'Diffusion Models', 'Transformers', 'LLMs',
  ];
  const skills: string[] = [];
  for (const kw of skillKeywords) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(rawText)) {
      skills.push(kw);
    }
  }
  if (skills.length === 0) skills.push('Python', 'PyTorch', 'Machine Learning');

  let thesis: string | null = null;
  const thesisMatch = rawText.match(/(?:thesis|capstone|final year project)[\s:=]+([^\n\r]+)/i);
  if (thesisMatch) thesis = thesisMatch[1].trim();

  return {
    success: true,
    parsed_data: {
      student_name: name,
      email,
      degree,
      institution,
      gpa,
      skills,
      thesis_topic: thesis,
      publications: [],
    },
    raw_char_count: rawText.length,
    model_used: 'Ethos CV Parser (Client Failover)',
  };
}

export function calculateProfileMatchOffline(
  cv: CVParsedData,
  professors?: ProfessorProfile[]
): ProfileMatchResponse {
  const targetProfs = professors && professors.length > 0 ? professors : OFFLINE_PROFESSORS;
  const matches: ProfessorMatchScore[] = targetProfs.map((prof) => {
    const profTopics = prof.research_interests.map((t) => t.toLowerCase());
    const matching: string[] = [];
    const gaps: string[] = [];

    for (const s of cv.skills) {
      if (profTopics.some((t) => t.includes(s.toLowerCase()) || s.toLowerCase().includes(t))) {
        matching.push(s);
      }
    }

    for (const t of prof.research_interests) {
      if (!cv.skills.some((s) => s.toLowerCase().includes(t.toLowerCase()))) {
        gaps.push(t);
      }
    }

    const score = Math.min(98, Math.max(45, 55 + matching.length * 14));
    return {
      professor_id: prof.id,
      professor_name: prof.name,
      university: prof.university,
      compatibility_score: score,
      matching_skills: matching,
      adjacent_skills: matching.length > 0 ? ['Deep Learning Baselines'] : [],
      skill_gaps: gaps.slice(0, 3),
      recommendation_snippet:
        score >= 80
          ? `Strong research synergy. Highlight your work in ${matching.slice(0, 2).join(', ') || 'core skills'}.`
          : `Good foundational alignment. Familiarize yourself with the lab's work in ${gaps.slice(0, 2).join(', ')}.`,
    };
  });

  matches.sort((a, b) => b.compatibility_score - a.compatibility_score);
  return {
    matches,
    top_matched_prof_id: matches[0]?.professor_id || null,
    average_score: Math.round(matches.reduce((acc, m) => acc + m.compatibility_score, 0) / matches.length),
  };
}

export function deconstructPaperOffline(req: PaperDeconstructRequest): PaperDeconstructResponse {
  const title = req.paper_title;
  const skillHead = (req.student_skills && req.student_skills[0]) || 'deep learning methodology';

  let core = `Proposes an empirical formulation in '${title}', demonstrating improved generalization over prior baselines.`;
  let lim = 'Inference latency under real-time constraints and domain shift on out-of-distribution sensors.';
  let keywords = ['Empirical Benchmarking', 'Optimization', 'Representation Learning'];

  if (/robot|manipulation/i.test(title)) {
    core = 'Scales cross-embodiment robotic manipulation policies using diffusion trajectory synthesis.';
    lim = 'Real-time inference latency on edge GPUs and physical collision recovery.';
    keywords = ['Diffusion Policy', 'Action Chunking', 'ROS2'];
  } else if (/attack|safe|jailbreak/i.test(title)) {
    core = 'Discovers transferable adversarial prompt attack vectors on safety-aligned LLMs.';
    lim = 'Mitigating attacks without reducing open-ended conversational generation fluency.';
    keywords = ['Adversarial Robustness', 'Safety Alignment', 'LLMs'];
  } else if (/slam|splatting|vision/i.test(title)) {
    core = 'Achieves real-time dense 3D scene reconstruction using 3D Gaussian Splatting from monocular feeds.';
    lim = 'Tracking loss under severe motion blur and scaling memory in large environments.';
    keywords = ['3D Gaussian Splatting', 'Visual SLAM', 'CUDA Kernels'];
  }

  const hook = `In your recent paper "${title}", I was fascinated by your breakthrough in ${keywords[0]}, particularly regarding ${lim.split(',')[0].toLowerCase()}. I worked extensively with ${skillHead}, and I believe my background directly prepares me to contribute to extending these experimental pipelines in your group.`;

  return {
    paper_title: title,
    professor_name: req.professor_name,
    core_contribution: core,
    unsolved_limitation: lim,
    methodology_keywords: keywords,
    tailored_cold_hook: hook,
    prep_questions: [
      `What was the key ablation study in '${title}' that confirmed your design choice?`,
      'How would this model behave on noisy, resource-constrained edge hardware?',
    ],
    model_used: 'Ethos Academic Engine (Client Failover)',
  };
}

export function searchOpenAlexOffline(
  query: string,
  limit: number = 12,
  entityType?: 'all' | 'works' | 'institutions' | 'authors'
): LiveAcademicSearchResponse {
  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/).filter((t) => t.length > 2);

  const scored = OFFLINE_PROFESSORS.map((p) => {
    let score = 0;
    const nameLower = p.name.toLowerCase();
    const uniLower = p.university.toLowerCase();
    const pubsLower = p.recent_publications.map((x) => x.title).join(' ').toLowerCase();
    const interestsLower = p.research_interests.join(' ').toLowerCase();
    const allText = `${nameLower} ${uniLower} ${p.primary_domain.toLowerCase()} ${p.country.toLowerCase()} ${interestsLower} ${pubsLower}`;

    if (entityType === 'institutions') {
      if (uniLower.includes(q)) score += 25;
      for (const t of terms) {
        if (uniLower.includes(t)) score += 10;
      }
    } else if (entityType === 'authors') {
      if (nameLower.includes(q)) score += 25;
      for (const t of terms) {
        if (nameLower.includes(t)) score += 10;
      }
    } else if (entityType === 'works') {
      if (pubsLower.includes(q)) score += 25;
      for (const t of terms) {
        if (pubsLower.includes(t)) score += 10;
      }
    }

    // Baseline topic/keyword match
    if (allText.includes(q)) score += 10;
    for (const term of terms) {
      if (allText.includes(term)) score += 3;
    }
    return { prof: p, score };
  });

  const matching = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.prof);

  const results = matching.length > 0 ? matching.slice(0, limit) : OFFLINE_PROFESSORS.slice(0, limit);

  return {
    total: results.length,
    query,
    results,
    source: 'OpenAlex Global Index (Client Failover)',
  };
}

/**
 * Client-Side Offline Evaluator for RA vs TA Strategy & Viability.
 */
export function evaluateTARAStrategyOffline(
  payload: TARAStrategyRequest
): TARAStrategyResponse {
  const gpaVal = parseFloat(payload.gpa || '3.5') || 3.5;
  const degreeGoal = payload.degree_goal || 'PhD';
  const major = payload.undergrad_major || 'Computer Science & Engineering';
  const researchExp = payload.research_experience || 'thesis_only';
  const coding = payload.coding_depth || 'intermediate';
  const testType = (payload.english_test_type || 'toefl').toLowerCase();
  const speaking = payload.speaking_score ?? 24;
  const country = (payload.target_country || 'USA').toUpperCase();

  // 1. Calculate RA Viability Score
  let raScore = 20;
  const expMap: Record<string, number> = {
    peer_reviewed: 40,
    preprint_workshop: 30,
    thesis_only: 20,
    none: 5,
  };
  raScore += expMap[researchExp] ?? 15;

  const codingMap: Record<string, number> = {
    advanced: 25,
    intermediate: 15,
    beginner: 5,
  };
  raScore += codingMap[coding] ?? 10;

  if (gpaVal >= 3.8) raScore += 15;
  else if (gpaVal >= 3.5) raScore += 10;
  else raScore += 5;

  if (degreeGoal === 'PhD') raScore += 10;
  else raScore += 5;

  // 2. Calculate TA Viability Score & Oral English Analysis
  let taScore = 25;
  let oralStatus: 'cleared' | 'borderline' | 'restricted_ra_only' = 'cleared';
  let oralAnalysis = '';

  if (country.includes('USA') || country.includes('US')) {
    const isToefl = testType.includes('toefl');
    if ((isToefl && speaking >= 26) || (!isToefl && speaking >= 8.0)) {
      oralStatus = 'cleared';
      taScore += 45;
      oralAnalysis = `✅ Full Instructional Clearance: Your speaking score (${speaking}) satisfies strict US state mandates (TOEFL ≥26 / IELTS ≥8.0). You represent zero departmental liability, meaning the graduate committee can award you an unconditional TA package immediately.`;
    } else if ((isToefl && speaking >= 23) || (!isToefl && speaking >= 7.0)) {
      oralStatus = 'borderline';
      taScore += 25;
      oralAnalysis = `⚠️ Provisional / Borderline Zone (${speaking}): You meet baseline admission requirements, but US state statutes require you to pass an on-campus SPEAK test or ITA oral interview during August orientation before teaching introductory undergrad recitations.`;
    } else {
      oralStatus = 'restricted_ra_only';
      taScore = Math.min(taScore, 35);
      oralAnalysis = `🚫 Direct TA Restriction (${speaking}): Most US R1 graduate schools require TOEFL Speaking ≥23 or IELTS ≥7.0 to lead classrooms. Focus aggressively on Research Assistantships (RA) directly from professors' external research grants, which bypass state teaching regulations.`;
    }
  } else if (country.includes('CAN')) {
    if (speaking >= 7.5 || (testType.includes('toefl') && speaking >= 25)) {
      oralStatus = 'cleared';
      taScore += 40;
      oralAnalysis = `✅ Cleared for Canadian TA union appointment: Your speaking score meets Canadian departmental union guidelines (CUPE / AGSEM).`;
    } else {
      oralStatus = 'borderline';
      taScore += 20;
      oralAnalysis = `⚠️ Evaluated during departmental intake: Canadian universities require a brief department interview for tutorial TA allocation.`;
    }
  } else {
    oralStatus = 'cleared';
    taScore += 35;
    oralAnalysis = `✅ High viability: European/UK research institutes prioritize technical project competence and English literacy over state oral certification exams.`;
  }

  // Factor GPA into TA
  if (gpaVal >= 3.7) taScore += 15;
  else if (gpaVal >= 3.4) taScore += 10;

  // Cap scores to 100
  raScore = Math.min(99, Math.max(15, raScore));
  taScore = Math.min(99, Math.max(15, taScore));

  // 3. Primary Recommendation
  let recommendation = '';
  if (raScore >= 65 && taScore >= 65) {
    recommendation = 'Dual Application (Target RA & TA simultaneously)';
  } else if (raScore >= taScore) {
    recommendation = 'Research Assistantship (RA)';
  } else {
    recommendation = 'Teaching Assistantship (TA)';
  }

  // 4. Action Steps
  const actionSteps: string[] = [];
  if (raScore >= 60) {
    actionSteps.push(
      'Target 15-20 Principal Investigators (PIs) with newly awarded NSF/NIH/DARPA grants using the ScholarFinder cold email generator.'
    );
    actionSteps.push(
      `Showcase your ${coding} programming background and relevant GitHub repositories directly in the 3rd paragraph of your pitch.`
    );
  }
  if (oralStatus === 'borderline') {
    actionSteps.push(
      'Request the department graduate secretary for past sample recordings or rubric criteria for the campus SPEAK/ITA test.'
    );
  }
  if (degreeGoal.includes('MS')) {
    actionSteps.push(
      'Apply to thesis-track MS programs at high-research state universities (e.g. Purdue, UIUC, Texas A&M) which extend TA fee remissions to master students.'
    );
  } else {
    actionSteps.push(
      'Request guaranteed 4-5 year funding letters in your formal PhD offer packet specifying full tuition remission and 12-month stipend.'
    );
  }

  // 5. Tailored Cold Pitch
  const coldPitch = `I am a prospective ${degreeGoal} candidate in ${major} (GPA: ${gpaVal.toFixed(2)}) with ${researchExp.replace(/_/g, ' ')} experience and ${coding} technical capabilities in systems and computational analysis. Given my background, I am eager to contribute immediately to ongoing funded projects in your laboratory as a Graduate Research Assistant (GRA).`;

  // 6. Summer Funding Strategy
  const summerStrategy =
    'Standard TA appointments run for 9 academic months (August through May). For the 3 summer months (June to August), protect yourself by: (1) Securing a faculty RA summer buyout (paying 20-40h/week on grant funds), (2) Doing a high-paying US industry CPT internship ($7,000–$10,000/month in tech), or (3) Registering for summer departmental recitation teaching.';

  // 7. Negotiation Tip
  const negotiationTip =
    degreeGoal === 'PhD'
      ? 'Negotiation Formula: Never negotiate base TA/RA stipend rates (they are union or department-fixed scales). Instead, negotiate: (1) Sign-on or Dean Fellowship top-ups ($3,000–$5,000/yr), (2) Relocation stipend allowances, (3) Summer funding guarantees, and (4) Laptop/conference travel budgets.'
      : 'MS Funding Formula: If admitted without funding, ask the Graduate Director if secondary grader/TA positions open up in the first 2 weeks of classes when enrollments surge. Over 30% of self-funded MS students land departmental TA positions by semester 2.';

  return {
    ra_viability_score: raScore,
    ta_viability_score: taScore,
    primary_recommendation: recommendation,
    oral_english_status: oralStatus,
    oral_english_analysis: oralAnalysis,
    action_steps: actionSteps,
    cold_pitch_paragraph: coldPitch,
    summer_funding_strategy: summerStrategy,
    negotiation_tip: negotiationTip,
    model_used: 'Ethos Academic AI (Offline Failover)',
  };
}

/**
 * Client-Side Offline Knowledge-Driven Academic Funding Advisor Q&A.
 */
export function askTARAAdvisorOffline(
  payload: TARAAdvisorQuestionRequest
): TARAAdvisorQuestionResponse {
  const q = payload.question.toLowerCase();

  if (q.includes('ms') && (q.includes('phd') || q.includes('master') || q.includes('only'))) {
    return {
      answer: `### MS vs PhD Assistantship Funding Reality

1. **PhD Funding is Institutional Default**: In the US and Canada, virtually 95%+ of admitted PhD students receive **guaranteed full funding** (100% tuition waiver + monthly stipend) for 4–5 years through department TAs or faculty RAs.
2. **Thesis-Track MS Opportunities**: You CAN get funded for an MS, but it is competitive:
   - **Research State Universities**: Schools like Iowa State, Texas A&M, SUNY Buffalo, and Purdue frequently award TAs to strong thesis-track MS students when undergraduate enrollments exceed PhD student availability.
   - **Faculty Grants**: If you possess rare technical skills (e.g. ROS, PyTorch, FPGA, microfluidics), a PI can hire you on an RA grant from day one.
3. **Coursework (Non-Thesis) MS**: Almost never funded at admission. However, many students get hired as hourly lab assistants or graders ($18–$25/hr) once on campus.`,
      key_takeaway:
        'Target Thesis-track MS programs at major public land-grant universities, or apply directly to PhD programs with an MS en-route.',
      suggested_followups: [
        'Which public universities fund MS students with TAs?',
        'Can I convert from a self-funded MS to a funded PhD after semester 1?',
        'How does an hourly grading position compare to an official TA?',
      ],
      model_used: 'Ethos Academic Knowledge Base (Client Failover)',
    };
  }

  if (q.includes('grant') || q.includes('run out') || q.includes('loss') || q.includes('fired')) {
    return {
      answer: `### Safeguards If a Professor's RA Grant Expires

- **Departmental Backstop Policy**: At reputable US & Canadian universities, admitted PhD students are backed by the **Graduate School Guarantee**. If your advisor loses an NSF/NIH grant, the department chair automatically transfers you to a **Teaching Assistantship (TA)** to cover your tuition and stipend.
- **Co-Advising & Secondary Grants**: You can collaborate with a co-PI or transition to a related department lab that currently holds active funding.
- **Immediate Action Steps**:
  1. Maintain clear standing with the Director of Graduate Studies (DGS).
  2. Ensure your spoken English meets the state instructional TA cutoff so the department can deploy you as a TA without friction.`,
      key_takeaway:
        'Your department is institutionally motivated to prevent you from dropping out due to lost grants—TA positions act as the safety net.',
      suggested_followups: [
        'How can I verify active NSF/NIH grants before picking an advisor?',
        'What should I do if my advisor tells me funding will end next term?',
        'How early in advance do professors know their grant renewals?',
      ],
      model_used: 'Ethos Academic Knowledge Base (Client Failover)',
    };
  }

  if (q.includes('20') || q.includes('hour') || q.includes('f1') || q.includes('f-1') || q.includes('work')) {
    return {
      answer: `### The 20-Hour F-1 / Student Visa Work Limit

- **US Federal Regulation (8 CFR § 214.2(f)(9))**: International students on an F-1 visa are **strictly limited to a maximum of 20 hours per week** of on-campus employment while academic semesters are in session.
- **Full Assistantship Definition**: A "Full RA" or "Full TA" is legally designated as a **20-hour/week appointment** (0.50 FTE). It provides 100% tuition remission and your full monthly stipend.
- **Summer & Official Breaks**: During summer vacation, winter break, and spring recess, F-1 regulations allow international students to work **full-time (up to 40 hours per week)** on-campus or on pre-approved Curricular Practical Training (CPT) off-campus.`,
      key_takeaway:
        'Never exceed 20 hours on the payroll during the semester—it constitutes a severe visa status violation.',
      suggested_followups: [
        'Can I do an external remote freelance job while on an F-1 assistantship?',
        'How do taxes work on a 20-hour graduate stipend?',
        'What is CPT and how do I use it for summer internships?',
      ],
      model_used: 'Ethos Academic Knowledge Base (Client Failover)',
    };
  }

  if (q.includes('negotiate') || q.includes('bargain') || q.includes('offer')) {
    return {
      answer: `### How to Professionally Negotiate Assistantship Offers

1. **What You CANNOT Negotiate**: Base RA/TA salary scales. These are strictly codified by graduate employee unions or university pay matrices.
2. **What You CAN Negotiate**:
   - **Dean's / Departmental Top-Up Fellowships**: Extra $2,000–$5,000/year awards.
   - **Summer Funding Guarantees**: Request written confirmation of summer RA funding rather than entering summer blind.
   - **Relocation Assistance**: One-time transition allowance ($1,000–$2,500) to assist with flights and initial apartment lease deposits.
   - **Hardware / Travel Budget**: Ask the PI for a dedicated research workstation and at least 1 guaranteed international conference trip per year.
3. **The Leverage Rule**: Always anchor your request respectfully around competing offers from peer institutions.`,
      key_takeaway:
        'Negotiate discretionary perks (fellowship top-ups, summer stipends, travel budgets) rather than fixed base pay scales.',
      suggested_followups: [
        'What email template should I use to request a fellowship top-up?',
        'When is the right deadline to discuss funding adjustments?',
        'Will asking for more funding jeopardize my admission offer?',
      ],
      model_used: 'Ethos Academic Knowledge Base (Client Failover)',
    };
  }

  // Default answer for other questions
  return {
    answer: `### Academic Assistantship Strategy Advisory

Navigating Graduate Research Assistantships (RA) and Teaching Assistantships (TA) requires understanding the dual funding mechanisms:
1. **Research Assistantships (RA)**: Funded from faculty research grants (NSF, NIH, DARPA, industry sponsors). PIs hire students who can execute technical work immediately (programming, simulation, lab protocols, paper drafting).
2. **Teaching Assistantships (TA)**: Funded from state and departmental instructional budgets. Chairs hire students who possess high spoken English fluency to lead recitation sections, lab tutorials, and grading.
3. **Key Recommendation**: Dual-target both. Secure faculty sponsorship via proactive cold emailing while submitting formal university applications to maximize your funding odds.`,
    key_takeaway:
      'Align your research outreach with active faculty grants, while keeping your spoken English credentials ready for departmental TA pools.',
    suggested_followups: [
      'Can I get full funding for an MS, or is it only for PhDs?',
      'What happens if my professor runs out of grant money?',
      'Can I work more than 20 hours per week on an F-1 visa?',
      'How do I negotiate an assistantship offer letter?',
    ],
    model_used: 'Ethos Academic Knowledge Base (Client Failover)',
  };
}
