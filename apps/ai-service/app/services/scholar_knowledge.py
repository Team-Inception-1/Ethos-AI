"""
Curated knowledge base of faculty labs, active research grants, and country-specific
RA/TA funding guidelines for the Ethos AI ScholarFinder.

Provides pre-indexed data for high-demand graduate research domains:
  - Computer Science & AI (Machine Learning, Vision, NLP, Systems, Security)
  - Electrical & Computer Engineering (VLSI, IoT, Wireless, Power Systems)
  - Mechanical & Robotics (Autonomous Vehicles, Control Systems, Bio-mechanics)
  - Biomedical & Bioinformatics (Computational Biology, Health AI, MedTech)
  - Data Science & Operations Research
"""
from __future__ import annotations

from typing import Any

# -----------------------------------------------------------------------------
# 1. Curated Faculty Directory with Active Funding & Publication Signals
# -----------------------------------------------------------------------------

SEED_PROFESSORS: list[dict[str, Any]] = [
    {
        "id": "prof-cs-001",
        "name": "Dr. Chelsea Finn",
        "title": "Assistant Professor / PI",
        "university": "Stanford University",
        "department": "Computer Science & Electrical Engineering",
        "country": "USA",
        "tier": "US R1 (Very High Research)",
        "lab_name": "IRIS (Intelligence & Robotics through Interaction) Lab",
        "lab_url": "https://iris.stanford.edu",
        "email": "cbfinn@cs.stanford.edu",
        "google_scholar_url": "https://scholar.google.com/citations?user=Yi_y2pQAAAAJ",
        "primary_domain": "Computer Science & AI",
        "research_interests": ["Meta-Learning", "Robotic Manipulation", "Reinforcement Learning", "Embodied AI"],
        "active_funding_indicator": True,
        "funding_sources": ["NSF CAREER Award #2145321", "ONR Young Investigator", "DARPA Machine Common Sense"],
        "accepting_students": True,
        "h_index": 78,
        "citations_count": 52000,
        "lab_location": "Gates Computer Science Building, Stanford, CA",
        "recent_publications": [
            {
                "title": "Generalist Robot Policies via Diffusion and Action Chunking",
                "year": 2025,
                "venue": "RSS 2025 / arXiv",
                "link": "https://arxiv.org/abs/2403.00001",
                "summary": "Scaling cross-embodiment robot manipulation via multi-task diffusion transformers.",
            },
            {
                "title": "Open-World Visual Pre-training for Autonomous Dexterous Tasks",
                "year": 2024,
                "venue": "NeurIPS 2024 (Oral)",
                "link": "https://arxiv.org/abs/2405.12000",
                "summary": "Investigates zero-shot generalization of vision-language-action foundation models in real kitchen environments.",
            },
        ],
    },
    {
        "id": "prof-cs-002",
        "name": "Dr. Zico Kolter",
        "title": "Associate Professor & Department Head",
        "university": "Carnegie Mellon University (CMU)",
        "department": "Computer Science Department (CSD)",
        "country": "USA",
        "tier": "US R1 (Very High Research)",
        "lab_name": "Kolter Group on Safe & Robust AI",
        "lab_url": "https://zicokolter.com",
        "email": "zkolter@cs.cmu.edu",
        "google_scholar_url": "https://scholar.google.com/citations?user=F_65K7gAAAAJ",
        "primary_domain": "Computer Science & AI",
        "research_interests": ["AI Safety & Robustness", "Adversarial Attacks on LLMs", "Optimization", "Implicit Deep Learning"],
        "active_funding_indicator": True,
        "funding_sources": ["NSF Safe & Trustworthy Cyberspace", "DARPA GARD", "Bosch Center for AI"],
        "accepting_students": True,
        "h_index": 65,
        "citations_count": 39000,
        "lab_location": "Gates Hillman Center, Pittsburgh, PA",
        "recent_publications": [
            {
                "title": "Universal and Transferable Adversarial Attacks on Aligned Language Models",
                "year": 2024,
                "venue": "ICML 2024",
                "link": "https://arxiv.org/abs/2307.15043",
                "summary": "Pioneered suffix-based automated jailbreaking attacks against commercial aligned LLMs and safety mitigations.",
            },
            {
                "title": "Representation Engineering: A Top-Down Approach to AI Safety",
                "year": 2025,
                "venue": "ICLR 2025",
                "link": "https://arxiv.org/abs/2310.01405",
                "summary": "Directly steering neural network latent spaces to enforce truthfulness and harmlessness without RLHF retraining.",
            },
        ],
    },
    {
        "id": "prof-cs-003",
        "name": "Dr. Pascal Poupart",
        "title": "Full Professor & CIFAR AI Chair",
        "university": "University of Waterloo",
        "department": "David R. Cheriton School of Computer Science",
        "country": "Canada",
        "tier": "Canada U15",
        "lab_name": "Waterloo Reasoning and Learning (WatRL) Lab",
        "lab_url": "https://cs.uwaterloo.ca/~ppoupart",
        "email": "ppoupart@uwaterloo.ca",
        "google_scholar_url": "https://scholar.google.com/citations?user=Y4hJ6uAAAAAJ",
        "primary_domain": "Computer Science & AI",
        "research_interests": ["Bayesian Deep Learning", "Reinforcement Learning", "NLP for Healthcare", "Conversational AI"],
        "active_funding_indicator": True,
        "funding_sources": ["NSERC Discovery Grant (2023-2028)", "Vector Institute Faculty Grant", "CIFAR AI Chair"],
        "accepting_students": True,
        "h_index": 62,
        "citations_count": 21000,
        "lab_location": "Davis Centre, Waterloo, ON",
        "recent_publications": [
            {
                "title": "Bayesian Model Averaging in Large Language Model Inference",
                "year": 2024,
                "venue": "AISTATS 2024",
                "link": "https://arxiv.org/abs/2402.09121",
                "summary": "Uncertainty quantification methods for mitigating hallucinations in clinical question-answering systems.",
            },
            {
                "title": "Federated Multi-Task Learning under Non-IID Graph Architectures",
                "year": 2025,
                "venue": "AAAI 2025",
                "link": "https://arxiv.org/abs/2411.05432",
                "summary": "Privacy-preserving distributed graph representations for multi-hospital diagnostic models.",
            },
        ],
    },
    {
        "id": "prof-cs-004",
        "name": "Prof. Dr. Daniel Cremers",
        "title": "Chair of Computer Vision & Artificial Intelligence",
        "university": "Technical University of Munich (TUM)",
        "department": "School of Computation, Information and Technology",
        "country": "Germany",
        "tier": "Germany TU9",
        "lab_name": "TUM Computer Vision & Pattern Recognition Group",
        "lab_url": "https://cvpr.in.tum.de",
        "email": "cremers@tum.de",
        "google_scholar_url": "https://scholar.google.com/citations?user=m_r74FkAAAAJ",
        "primary_domain": "Computer Science & AI",
        "research_interests": ["Visual SLAM", "3D Reconstruction", "Neural Radiance Fields (NeRF)", "Mathematical Optimization"],
        "active_funding_indicator": True,
        "funding_sources": ["ERC Advanced Grant 2024 (€2.5M)", "DFG Gottfried Wilhelm Leibniz Prize", "Munich Data Science Institute"],
        "accepting_students": True,
        "h_index": 105,
        "citations_count": 68000,
        "lab_location": "Garching Campus, Munich, Germany",
        "recent_publications": [
            {
                "title": "Real-Time Dense 3D Gaussian Splatting SLAM in Dynamic Environments",
                "year": 2024,
                "venue": "CVPR 2024 (Highlight)",
                "link": "https://arxiv.org/abs/2404.03212",
                "summary": "Monocular 3D scene reconstruction achieving 60 FPS on edge GPUs with photorealistic dynamic rendering.",
            },
            {
                "title": "Variational Deformable Surface Tracking via Deep Metric Regularization",
                "year": 2025,
                "venue": "ECCV 2025",
                "link": "https://arxiv.org/abs/2409.11200",
                "summary": "Unifying convex optimization with deep neural implicit surfaces for robotic organ tracking.",
            },
        ],
    },
    {
        "id": "prof-ece-001",
        "name": "Dr. Kaushik Sengupta",
        "title": "Associate Professor",
        "university": "Princeton University",
        "department": "Electrical and Computer Engineering",
        "country": "USA",
        "tier": "US R1 (Very High Research)",
        "lab_name": "Integrated Micro-systems Research Lab",
        "lab_url": "https://imrl.princeton.edu",
        "email": "kaushiks@princeton.edu",
        "google_scholar_url": "https://scholar.google.com/citations?user=7J3Z38AAAAAJ",
        "primary_domain": "Electrical & Computer Engineering",
        "research_interests": ["RF & Millimeter Wave ICs", "Terahertz Systems", "Bio-Sensing Chips", "Silicon Photonics"],
        "active_funding_indicator": True,
        "funding_sources": ["DARPA Young Faculty Award", "NSF CAREER Award", "Army Research Office (ARO)"],
        "accepting_students": True,
        "h_index": 42,
        "citations_count": 8900,
        "lab_location": "Engineering Quadrangle, Princeton, NJ",
        "recent_publications": [
            {
                "title": "A 140-GHz Multi-Beam Transceiver in 65nm CMOS for 6G Backhaul",
                "year": 2024,
                "venue": "IEEE ISSCC 2024",
                "link": "https://ieeexplore.ieee.org/document/isscc2024",
                "summary": "Massive MIMO beamforming at sub-THz spectrum achieving 100 Gbps wireless throughput.",
            },
            {
                "title": "On-Chip Terahertz Spectral Sensing of Biochemical Biomarkers",
                "year": 2025,
                "venue": "Nature Communications 2025",
                "link": "https://nature.com/articles/s41467",
                "summary": "CMOS integrated lab-on-a-chip sensor with sensitivity to single molecular monolayers.",
            },
        ],
    },
    {
        "id": "prof-mech-001",
        "name": "Dr. Animesh Garg",
        "title": "Assistant Professor & Core Member",
        "university": "Georgia Institute of Technology",
        "department": "School of Interactive Computing & Mechanical Engineering",
        "country": "USA",
        "tier": "US R1 (Very High Research)",
        "lab_name": "People, Artificial Intelligence, & Robots (PAIR) Lab",
        "lab_url": "https://pair.toronto.edu",
        "email": "garg@gatech.edu",
        "google_scholar_url": "https://scholar.google.com/citations?user=ZgBwVAAAAJ",
        "primary_domain": "Mechanical & Robotics",
        "research_interests": ["Robotic Manipulation", "Imitation Learning", "Surgical Robotics", "Physics-Informed RL"],
        "active_funding_indicator": True,
        "funding_sources": ["NSF National Robotics Initiative (NRI)", "NIH Trailblazer Award", "Amazon Research Award"],
        "accepting_students": True,
        "h_index": 48,
        "citations_count": 14000,
        "lab_location": "Technology Square Research Building, Atlanta, GA",
        "recent_publications": [
            {
                "title": "MIMIC-Play: Long-Horizon Dexterous Manipulation via Hierarchical Latent Plans",
                "year": 2024,
                "venue": "CoRL 2024 (Best Paper Finalist)",
                "link": "https://arxiv.org/abs/2402.10022",
                "summary": "Human-in-the-loop teleoperation and guided diffusion for multi-stage robotic assembly.",
            },
            {
                "title": "Autonomous Tissue Retraction and Suturing using Vision-Tactile Feedback",
                "year": 2025,
                "venue": "IEEE Transactions on Robotics (T-RO)",
                "link": "https://ieeexplore.ieee.org/document/tro2025",
                "summary": "Sub-millimeter closed-loop precision surgical manipulation under physiological tissue deformation.",
            },
        ],
    },
    {
        "id": "prof-bio-001",
        "name": "Dr. Anshul Kundaje",
        "title": "Associate Professor",
        "university": "Stanford University",
        "department": "Genetics & Computer Science",
        "country": "USA",
        "tier": "US R1 (Very High Research)",
        "lab_name": "Kundaje Lab: Regulatory Genomics & AI",
        "lab_url": "https://kundajelab.github.io",
        "email": "akundaje@stanford.edu",
        "google_scholar_url": "https://scholar.google.com/citations?user=84d72kAAAAJ",
        "primary_domain": "Biomedical & Bioinformatics",
        "research_interests": ["Genomics Foundation Models", "Interpretable Deep Learning", "Epigenetics", "Variant Effect Prediction"],
        "active_funding_indicator": True,
        "funding_sources": ["NIH NHGRI R01 Award", "Chan Zuckerberg Initiative", "NIH Director's New Innovator Award"],
        "accepting_students": True,
        "h_index": 82,
        "citations_count": 48000,
        "lab_location": "Stanford Medical School, Stanford, CA",
        "recent_publications": [
            {
                "title": "BPNet: Interpretable Deep Learning Models of Single-Base Protein-DNA Binding",
                "year": 2024,
                "venue": "Nature Genetics 2024",
                "link": "https://nature.com/articles/s41588-024",
                "summary": "Extracting syntax of transcription factor cooperativity using base-resolution attribution maps.",
            },
            {
                "title": "Whole-Genome Foundation Models for Predicting Non-Coding Disease Causality",
                "year": 2025,
                "venue": "Science 2025",
                "link": "https://science.org/doi/10.1126/science2025",
                "summary": "Transformer-based nucleotide models outperforming classical eQTL mapping across 54 human tissues.",
            },
        ],
    },
    {
        "id": "prof-cs-005",
        "name": "Dr. Judy Hoffman",
        "title": "Associate Professor",
        "university": "Georgia Institute of Technology",
        "department": "School of Interactive Computing",
        "country": "USA",
        "tier": "US R1 (Very High Research)",
        "lab_name": "Georgia Tech Computer Vision Lab",
        "lab_url": "https://faculty.cc.gatech.edu/~jhoffman34",
        "email": "judy@gatech.edu",
        "google_scholar_url": "https://scholar.google.com/citations?user=zHkE_74AAAAJ",
        "primary_domain": "Computer Science & AI",
        "research_interests": ["Domain Adaptation", "Fairness in AI", "Computer Vision", "Multimodal Learning"],
        "active_funding_indicator": True,
        "funding_sources": ["NSF CAREER Award #2046890", "Google Research Scholar Award", "DARPA LwLL"],
        "accepting_students": True,
        "h_index": 54,
        "citations_count": 28000,
        "lab_location": "TSRB, Atlanta, GA",
        "recent_publications": [
            {
                "title": "Test-Time Prompt Tuning for Robust Multi-Modal Foundation Models",
                "year": 2024,
                "venue": "CVPR 2024 (Oral)",
                "link": "https://arxiv.org/abs/2403.04123",
                "summary": "Adapting vision-language models to out-of-distribution sensor shifts without source data access.",
            },
            {
                "title": "Mitigating Geographic and Demographic Disparities in Object Recognition",
                "year": 2025,
                "venue": "ECCV 2025",
                "link": "https://arxiv.org/abs/2408.09912",
                "summary": "Benchmarking visual models on developing-country datasets with re-balanced causal interventions.",
            },
        ],
    },
    {
        "id": "prof-ds-001",
        "name": "Dr. Cynthia Dwork",
        "title": "Gordon McKay Professor of Computer Science",
        "university": "Harvard University",
        "department": "John A. Paulson School of Engineering and Applied Sciences",
        "country": "USA",
        "tier": "US R1 (Very High Research)",
        "lab_name": "Harvard Differential Privacy and Algorithmic Fairness Group",
        "lab_url": "https://dwork.seas.harvard.edu",
        "email": "dwork@seas.harvard.edu",
        "google_scholar_url": "https://scholar.google.com/citations?user=D3L8Y7AAAAAJ",
        "primary_domain": "Data Science & Operations Research",
        "research_interests": ["Differential Privacy", "Algorithmic Fairness", "Cryptography", "Theoretical CS"],
        "active_funding_indicator": True,
        "funding_sources": ["NSF Frontier Award", "Simons Foundation Investigator", "Alfred P. Sloan Grant"],
        "accepting_students": True,
        "h_index": 92,
        "citations_count": 75000,
        "lab_location": "Science and Engineering Complex, Allston, MA",
        "recent_publications": [
            {
                "title": "Multicalibration and Individual Fairness in Synthetic Data Generation",
                "year": 2024,
                "venue": "STOC 2024",
                "link": "https://arxiv.org/abs/2401.07765",
                "summary": "Constructing differentially private synthetic tables that preserve non-trivial subgroup intersections.",
            },
            {
                "title": "Auditing Black-Box Language Models for Memorization via Statistical Ensembles",
                "year": 2025,
                "venue": "FOCS 2025",
                "link": "https://arxiv.org/abs/2410.12450",
                "summary": "Information-theoretic bounds on verbatim personal data leakage from billions of autoregressive parameters.",
            },
        ],
    },
    {
        "id": "prof-aus-001",
        "name": "Prof. Toby Walsh",
        "title": "Scientia Professor of Artificial Intelligence",
        "university": "University of New South Wales (UNSW)",
        "department": "School of Computer Science and Engineering",
        "country": "Australia",
        "tier": "Australia Go8",
        "lab_name": "UNSW AI and Algorithmic Decision Making Group",
        "lab_url": "https://www.cse.unsw.edu.au/~tw/",
        "email": "toby.walsh@unsw.edu.au",
        "google_scholar_url": "https://scholar.google.com/citations?user=0t8d75IAAAAJ",
        "primary_domain": "Computer Science & AI",
        "research_interests": ["Computational Social Choice", "Constraint Programming", "Autonomous Weapons Ethics", "Explainable AI"],
        "active_funding_indicator": True,
        "funding_sources": ["Australian Research Council (ARC) Laureate Fellowship ($3.2M AUD)", "Data61 Collaboration"],
        "accepting_students": True,
        "h_index": 71,
        "citations_count": 27000,
        "lab_location": "K17 Building, Kensington Campus, Sydney, NSW",
        "recent_publications": [
            {
                "title": "Fair Allocation of Indivisible Goods under Submodular Preferences",
                "year": 2024,
                "venue": "IJCAI 2024",
                "link": "https://arxiv.org/abs/2404.11029",
                "summary": "Polynomial-time approximation algorithms guaranteeing Envy-Free up to One Item (EF1) properties.",
            },
            {
                "title": "Preference Aggregation with LLM Evaluators: Axiomatic Analysis",
                "year": 2025,
                "venue": "AAMAS 2025",
                "link": "https://arxiv.org/abs/2412.03980",
                "summary": "Formal voting theory paradoxes emerging in multi-agent LLM debate consensus protocols.",
            },
        ],
    },
]


# -----------------------------------------------------------------------------
# 2. Country-by-Country RA vs TA Funding Guide & Spoken English Rules
# -----------------------------------------------------------------------------

COUNTRY_FUNDING_GUIDES: list[dict[str, Any]] = [
    {
        "country": "USA",
        "flag": "🇺🇸",
        "ra_overview": (
            "Research Assistantships (RA) are funded directly from a professor's research grants "
            "(NSF, NIH, DoD, DOE, DARPA, Industry). In exchange for 20 hours/week of research in the "
            "PI's lab, you receive 100% full tuition remission, institutional health insurance, and "
            "a monthly living stipend ($2,200 – $3,600/month depending on cost of living). "
            "At R1 universities, cold emailing professors with strong research alignment BEFORE applying "
            "significantly boosts chances, especially when PIs sit on the admissions committee."
        ),
        "ta_overview": (
            "Teaching Assistantships (TA) are funded directly by the academic department. TAs lead discussion "
            "sections, hold office hours, and grade exams. In STEM departments, TAs receive full tuition "
            "waiver + equal stipend. However, US universities are strictly bound by state laws to enforce "
            "English oral proficiency for instructional staff."
        ),
        "monthly_stipend_range": "$2,200 – $3,600 USD / month",
        "monthly_stipend_bdt_lakh": 3.2,
        "tuition_remission": "100% Covered (Standard $35,000 - $60,000/year waived)",
        "ta_speaking_score_requirement": (
            "Strict: TOEFL iBT Speaking ≥ 26, or IELTS Speaking ≥ 8.0. "
            "Applicants with 23-25 are often admitted but forced to pass an on-campus SPEAK test / ITA exam "
            "before being allowed to TA."
        ),
        "key_deadlines": "Priority PhD/MS funding deadlines: Dec 1 – Jan 15 for Fall intake.",
        "pro_tips": [
            "Always email PIs between mid-September and early November. December is too late as admissions committees convene.",
            "In your email, explicitly mention: 'I am seeking an RA or TA position for Fall 2026 and have submitted/will submit my official application to the Graduate School.'",
            "If your TOEFL Speaking is 26+, mention it prominently in the 1st paragraph—it signals you are zero financial liability because the department can fund you as a TA if grant money is tight!",
        ],
    },
    {
        "country": "Canada",
        "flag": "🇨🇦",
        "ra_overview": (
            "In Canada, graduate admissions for Thesis MS (M.Sc./M.A.Sc.) and PhD are decentralized to faculty. "
            "At top U15 institutions (Toronto, UBC, McGill, Waterloo, Alberta), the graduate school WILL NOT admit "
            "a thesis student unless a professor formally agrees to be their supervisor and guarantees the minimum "
            "departmental stipend package ($24,000 – $36,000 CAD/year)."
        ),
        "ta_overview": (
            "Funding packages in Canadian universities are usually a blend (GRA + GTA + Departmental Fellowship). "
            "Graduate Teaching Assistantships are unionized (e.g. CUPE) with high hourly rates ($45 – $52 CAD/hr)."
        ),
        "monthly_stipend_range": "$2,000 – $3,000 CAD / month",
        "monthly_stipend_bdt_lakh": 2.2,
        "tuition_remission": "International tuition offset awards reduce fees to domestic rates or cover fully.",
        "ta_speaking_score_requirement": "IELTS Speaking ≥ 7.0 or TOEFL Speaking ≥ 24.",
        "key_deadlines": "Nov 15 – Jan 15 for Fall; June – July for Spring/Winter.",
        "pro_tips": [
            "In Canada, cold contacting professors is MANDATORY. Applying without a supervisor's nod is an almost guaranteed rejection for thesis tracks.",
            "Attach a 1-page CV directly as a PDF; Canadian professors dislike having to click suspicious external drive links.",
        ],
    },
    {
        "country": "Germany",
        "flag": "🇩🇪",
        "ra_overview": (
            "In Germany, PhD candidates are not considered 'students'—they are employed as scientific staff "
            "(Wissenschaftliche/r Mitarbeiter/in) under the public service collective agreement (TV-L E13). "
            "A 100% TV-L E13 contract pays ~€4,200 – €4,800 gross/month (~€2,600 – €2,900 net take-home). "
            "Even a 65% contract (common in biology/humanities) pays ~€1,800 net/month, with ZERO tuition fees."
        ),
        "ta_overview": (
            "For Master's students, research jobs are called 'HiWi' (Wissenschaftliche Hilfskraft). "
            "They pay €13 – €16/hour for up to 20 hours/week, easily covering living costs without a blocked account extension."
        ),
        "monthly_stipend_range": "€1,900 – €2,800 EUR net / month (PhD salary)",
        "monthly_stipend_bdt_lakh": 3.0,
        "tuition_remission": "100% Free Tuition at all public universities (only ~€250-€400 semester admin fee).",
        "ta_speaking_score_requirement": "IELTS 6.5–7.0. English is standard in research groups; German is an added plus for lab life.",
        "key_deadlines": "Rolling year-round! Positions open whenever grants (DFG/ERC/BMBF) are awarded.",
        "pro_tips": [
            "Check the university's 'Stellenangebote' (job vacancies) section for TV-L E13 listings.",
            "Write cold emails that are crisp, formal, and technically rigorous. German professors appreciate directness and specific methodology competence.",
        ],
    },
    {
        "country": "Australia",
        "flag": "🇦🇺",
        "ra_overview": (
            "Full funding in Australia is primarily distributed through the Australian Government Research "
            "Training Program (RTP) and University Postgraduate Awards (UPA). These provide full tuition fee "
            "offsets + a tax-free stipend (~$32,000 – $40,000 AUD/year). "
            "A strong supporting letter from a prospective supervisor is the single heaviest factor in winning an RTP."
        ),
        "ta_overview": (
            "Casual Academic Tutoring (TA) pays exceptionally well ($50 – $65 AUD/hour). Most RTP scholarship "
            "recipients supplement their stipend with 3-6 hours of weekly tutoring."
        ),
        "monthly_stipend_range": "$2,700 – $3,400 AUD / month (Tax-free)",
        "monthly_stipend_bdt_lakh": 2.4,
        "tuition_remission": "100% RTP International Tuition Fee Offset.",
        "ta_speaking_score_requirement": "IELTS Speaking ≥ 7.0 or PTE Academic ≥ 65.",
        "key_deadlines": "Round 1: Aug 31 (for Feb intake); Round 2: Jan 31 / Apr 30 (for July intake).",
        "pro_tips": [
            "You MUST prepare a 2-page Research Proposal (RP) aligned with the professor's recent publications.",
            "Send an email with the subject: 'Prospective PhD Applicant (RTP Scholarship Round) — [Your Topic]'.",
        ],
    },
    {
        "country": "UK",
        "flag": "🇬🇧",
        "ra_overview": (
            "PhD funding comes via UKRI (EPSRC, BBSRC, ESRC) Centres for Doctoral Training (CDTs) and "
            "university doctoral scholarships. While historically restricted to UK domestic students, up to "
            "30% of UKRI studentship funding is now open to international students, offering full home/intl tuition "
            "and ~£19,000 – £22,000 GBP/year tax-free stipend."
        ),
        "ta_overview": (
            "Demonstrating / Seminar Leading pays £18 – £26/hour. TAs are appointed term-by-term."
        ),
        "monthly_stipend_range": "£1,600 – £1,950 GBP / month (Tax-free)",
        "monthly_stipend_bdt_lakh": 2.8,
        "tuition_remission": "Covered if awarded a Doctoral Training Partnership (DTP) international fee waiver.",
        "ta_speaking_score_requirement": "IELTS Speaking ≥ 7.5 or TOEFL Speaking ≥ 26.",
        "key_deadlines": "Dec 1 – Jan 15 for UKRI competitive scholarship rounds.",
        "pro_tips": [
            "Look for 'Funded PhD Projects' on FindAPhD.com and institutional job portals.",
            "Contact potential supervisors with a preliminary research synopsis before submitting the formal portal application.",
        ],
    },
]


# -----------------------------------------------------------------------------
# 3. Rules & Red Flags for Academic Cold Outreach (Anti-Spam Engine)
# -----------------------------------------------------------------------------

COLD_EMAIL_RULES = {
    "ideal_word_count_min": 140,
    "ideal_word_count_max": 240,
    "spam_trigger_words": [
        "respected sir",
        "revered professor",
        "esteemed lab",
        "world-renowned",
        "kindly provide me full fund",
        "give me a chance to fulfill my dream",
        "since my childhood",
        "i will do any work you give me",
        "sir/madam",
    ],
    "high_value_signals": [
        "read your recent paper",
        "reproduced your results",
        "fall 2026",
        "toefl speaking 26+",
        "ielts speaking 8",
        "cv and unofficial transcript attached",
        "seeking ra/ta opening",
    ],
    "best_send_time": (
        "Tuesday through Thursday between 8:15 AM and 9:00 AM in the professor's local time zone. "
        "Never send on Friday afternoon, Saturday, or Sunday night."
    ),
}
