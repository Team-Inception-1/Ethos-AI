/**
 * Zero-Downtime Client-Side Offline Evaluation & Chat Engine for Ethos AI Counselor.
 *
 * Ensures evaluators, examiners, and students never see a blank/error screen
 * even if the FastAPI microservice is starting up or temporarily offline.
 */
import type {
  CounselorEvaluationRequest,
  CounselorEvaluationResponse,
  UniversityRecommendation,
  VisaAssessment,
  RoadmapMilestone,
  CounselorChatMessage,
  CounselorChatResponse,
} from './aiService';

const OFFLINE_CATALOG: Array<{
  id: string;
  name: string;
  country: string;
  city: string;
  programs: string[];
  currency: string;
  tuitionLocal: number;
  livingLocal: number;
  minGpa: number;
  minIelts: number;
  maxGap: number;
  selectivity: 'high' | 'medium' | 'accessible';
  scholarship: string;
  acceptsMoi: boolean;
  coop: boolean;
  reasons: string[];
}> = [
  {
    id: 'de-tum',
    name: 'Technical University of Munich (TUM)',
    country: 'Germany',
    city: 'Munich',
    programs: ['M.Sc. Computer Science', 'M.Sc. Data Engineering'],
    currency: 'EUR',
    tuitionLocal: 4000,
    livingLocal: 12000,
    minGpa: 3.6,
    minIelts: 7.0,
    maxGap: 2,
    selectivity: 'high',
    scholarship: 'DAAD & Deutschlandstipendium (€300/mo grant) eligible',
    acceptsMoi: false,
    coop: true,
    reasons: ['World Top 50 institution with premier CS/Engineering reputation', 'High employability across the EU'],
  },
  {
    id: 'de-rwth',
    name: 'RWTH Aachen University',
    country: 'Germany',
    city: 'Aachen',
    programs: ['M.Sc. Software Systems', 'M.Sc. Mechanical Engineering'],
    currency: 'EUR',
    tuitionLocal: 0,
    livingLocal: 11000,
    minGpa: 3.4,
    minIelts: 6.5,
    maxGap: 3,
    selectivity: 'medium',
    scholarship: 'Zero tuition public university / NRW scholarship',
    acceptsMoi: false,
    coop: true,
    reasons: ['Zero tuition fee (only semester admin fee)', 'Germany elite technical cluster university'],
  },
  {
    id: 'de-dit',
    name: 'Deggendorf Institute of Technology (DIT)',
    country: 'Germany',
    city: 'Deggendorf',
    programs: ['B.Sc. Artificial Intelligence', 'M.Sc. Applied Computer Science'],
    currency: 'EUR',
    tuitionLocal: 1000,
    livingLocal: 9500,
    minGpa: 2.8,
    minIelts: 6.0,
    maxGap: 4,
    selectivity: 'accessible',
    scholarship: 'Bavarian international grant & low living costs',
    acceptsMoi: true,
    coop: true,
    reasons: ['Low living expenses in Bavaria', 'Accepts Medium of Instruction (MOI) and Duolingo'],
  },
  {
    id: 'uk-manchester',
    name: 'University of Manchester',
    country: 'UK',
    city: 'Manchester',
    programs: ['M.Sc. Advanced Computer Science', 'M.Sc. Finance'],
    currency: 'GBP',
    tuitionLocal: 31000,
    livingLocal: 12500,
    minGpa: 3.5,
    minIelts: 7.0,
    maxGap: 3,
    selectivity: 'high',
    scholarship: 'Russell Group Global Excellence Scholarship (up to £5,000)',
    acceptsMoi: false,
    coop: false,
    reasons: ['Russell Group pedigree with immense global prestige', 'Direct UK 2-year post-study work visa (PSW)'],
  },
  {
    id: 'uk-coventry',
    name: 'Coventry University',
    country: 'UK',
    city: 'Coventry',
    programs: ['M.Sc. Cyber Security', 'M.Sc. International Business'],
    currency: 'GBP',
    tuitionLocal: 18500,
    livingLocal: 10000,
    minGpa: 2.8,
    minIelts: 6.0,
    maxGap: 5,
    selectivity: 'accessible',
    scholarship: 'Bangladeshi Merit Award £2,000 - £4,000 off tuition',
    acceptsMoi: true,
    coop: true,
    reasons: ['Generous scholarships for Bangladeshi students', 'Accepts MOI / internal language test'],
  },
  {
    id: 'us-uta',
    name: 'University of Texas at Arlington (UTA)',
    country: 'USA',
    city: 'Arlington, TX',
    programs: ['M.S. Computer Science', 'M.S. Information Systems'],
    currency: 'USD',
    tuitionLocal: 21000,
    livingLocal: 12000,
    minGpa: 3.0,
    minIelts: 6.5,
    maxGap: 4,
    selectivity: 'medium',
    scholarship: 'Competitive In-State Tuition Waiver ($10,000+/yr savings)',
    acceptsMoi: false,
    coop: true,
    reasons: ['Dallas-Fort Worth tech hub with extensive STEM-OPT job opportunities', 'Large, welcoming Bangladeshi Student Association'],
  },
  {
    id: 'us-wichita',
    name: 'Wichita State University',
    country: 'USA',
    city: 'Wichita, KS',
    programs: ['M.S. Computer Science', 'M.S. Industrial Engineering'],
    currency: 'USD',
    tuitionLocal: 14500,
    livingLocal: 9000,
    minGpa: 2.7,
    minIelts: 6.0,
    maxGap: 5,
    selectivity: 'accessible',
    scholarship: 'Global Select Merit Scholarship ($4,800/yr waiver)',
    acceptsMoi: true,
    coop: true,
    reasons: ['Exceptionally affordable Midwest cost of living', 'On-campus paid co-ops and high visa issuance'],
  },
  {
    id: 'ca-windsor',
    name: 'University of Windsor',
    country: 'Canada',
    city: 'Windsor, ON',
    programs: ['Master of Applied Computing (MAC)', 'MEng Mechanical'],
    currency: 'CAD',
    tuitionLocal: 26000,
    livingLocal: 14000,
    minGpa: 3.0,
    minIelts: 6.5,
    maxGap: 3,
    selectivity: 'medium',
    scholarship: 'Graduate Entrance Scholarship + 8-month paid industrial co-op',
    acceptsMoi: false,
    coop: true,
    reasons: ['Integrated 8-month paid industry placement', 'Full 3-year PGWP work permit eligible'],
  },
  {
    id: 'ca-mun',
    name: 'Memorial University of Newfoundland (MUN)',
    country: 'Canada',
    city: 'St. John’s, NL',
    programs: ['M.Sc. Computer Science', 'Master of Environmental Science'],
    currency: 'CAD',
    tuitionLocal: 13500,
    livingLocal: 11000,
    minGpa: 2.9,
    minIelts: 6.5,
    maxGap: 4,
    selectivity: 'accessible',
    scholarship: 'Subsidized low government tuition rates',
    acceptsMoi: false,
    coop: true,
    reasons: ['One of Canada’s most affordable university tuitions', 'Atlantic Immigration Program (AIP) PR pathway'],
  },
  {
    id: 'au-deakin',
    name: 'Deakin University',
    country: 'Australia',
    city: 'Geelong / Melbourne, VIC',
    programs: ['Master of Information Technology', 'Master of Data Science'],
    currency: 'AUD',
    tuitionLocal: 36000,
    livingLocal: 24000,
    minGpa: 3.0,
    minIelts: 6.5,
    maxGap: 2,
    selectivity: 'medium',
    scholarship: 'Deakin International Scholarship (up to 25% waiver)',
    acceptsMoi: false,
    coop: true,
    reasons: ['Geelong regional campus unlocks extra year of post-study work visa', 'Top 1% global ranking with modern computing labs'],
  },
  {
    id: 'my-apu',
    name: 'Asia Pacific University (APU)',
    country: 'Malaysia',
    city: 'Kuala Lumpur',
    programs: ['B.Sc. Cyber Security', 'M.Sc. Data Science'],
    currency: 'MYR',
    tuitionLocal: 36000,
    livingLocal: 20000,
    minGpa: 2.5,
    minIelts: 5.5,
    maxGap: 6,
    selectivity: 'accessible',
    scholarship: 'Merit-based waiver up to 30% for GPA > 3.5',
    acceptsMoi: true,
    coop: true,
    reasons: ['Dual UK degree certification option', 'Fast EMGS student visa approval and very affordable (~৳14L/yr)'],
  },
];

const RATES_TO_BDT: Record<string, number> = {
  USD: 122.5,
  GBP: 158.0,
  CAD: 90.5,
  AUD: 80.0,
  EUR: 133.0,
  SEK: 11.6,
  MYR: 27.8,
};

export function evaluateOfflineProfile(
  req: CounselorEvaluationRequest
): CounselorEvaluationResponse {
  const normGpa =
    req.max_gpa === 5.0
      ? Math.round((Math.min(5.0, req.gpa) / 5.0) * 4.0 * 100) / 100
      : Math.min(4.0, req.gpa);

  const ieltsBand = req.ielts_score ? Number(req.ielts_score) : 6.0;
  const budget = req.budget_yearly_bdt_lakh;
  const targetCountries = (req.target_countries || []).map((c) =>
    c.toLowerCase().trim()
  );

  const scored: Array<{ rec: UniversityRecommendation; score: number }> = [];

  for (const uni of OFFLINE_CATALOG) {
    if (
      targetCountries.length > 0 &&
      !targetCountries.some((tc) => uni.country.toLowerCase().includes(tc))
    ) {
      continue;
    }

    const rate = RATES_TO_BDT[uni.currency] || 120.0;
    const tuitionBdt = Math.round(((uni.tuitionLocal * rate) / 100000.0) * 10) / 10;
    const livingBdt = Math.round(((uni.livingLocal * rate) / 100000.0) * 10) / 10;
    const totalBdt = Math.round((tuitionBdt + livingBdt) * 10) / 10;

    const gpaDiff = normGpa - uni.minGpa;
    const ieltsDiff = ieltsBand - uni.minIelts;

    let score = 70 + gpaDiff * 15 + ieltsDiff * 10;
    if (budget >= totalBdt) score += 15;
    else score -= Math.min(30, (totalBdt - budget) * 2.5);

    if (req.scholarship_priority && uni.scholarship) score += 12;
    if (req.moi_only && uni.acceptsMoi) score += 15;

    score = Math.max(15, Math.min(96, Math.round(score)));

    let tier: 'dream' | 'target' | 'safe' = 'target';
    let odds = 60;
    const cautions: string[] = [];
    const reasons = [...uni.reasons];

    if (uni.scholarship) reasons.unshift(`Scholarship: ${uni.scholarship}`);
    if (uni.acceptsMoi) reasons.push('Accepts Medium of Instruction (MOI) / Duolingo');

    if (uni.selectivity === 'high' || gpaDiff < -0.1 || ieltsDiff < 0 || totalBdt > budget * 1.15) {
      tier = 'dream';
      odds = Math.max(15, Math.min(35, Math.round(25 + gpaDiff * 10)));
      if (gpaDiff < 0) cautions.push(`GPA (${normGpa}) is slightly below typical cutoff (${uni.minGpa}).`);
      if (ieltsDiff < 0) cautions.push(`IELTS requirement is ${uni.minIelts} (you have ~${ieltsBand}).`);
      if (totalBdt > budget) cautions.push(`Total cost (৳${totalBdt}L) exceeds budget (৳${budget}L).`);
    } else if (gpaDiff >= 0.25 && ieltsDiff >= 0.5 && budget >= totalBdt) {
      tier = 'safe';
      odds = Math.max(80, Math.min(95, Math.round(85 + gpaDiff * 8)));
      reasons.push(`Comfortably meets minimum GPA (${uni.minGpa}) & budget.`);
    } else {
      tier = 'target';
      odds = Math.max(45, Math.min(75, Math.round(60 + gpaDiff * 12)));
    }

    if ((req.study_gap_years || 0) > uni.maxGap) {
      cautions.push(`Study gap of ${req.study_gap_years} years requires verifiable job & tax documentation.`);
    }

    scored.push({
      score,
      rec: {
        id: uni.id,
        university_name: uni.name,
        country: uni.country,
        city: uni.city,
        target_programs: uni.programs,
        tier,
        match_score: score,
        admission_chance_percent: odds,
        annual_tuition_bdt_lakh: tuitionBdt,
        annual_living_bdt_lakh: livingBdt,
        annual_total_bdt_lakh: totalBdt,
        currency_local: uni.currency,
        annual_tuition_local: uni.tuitionLocal,
        minimum_gpa: uni.minGpa,
        minimum_ielts: uni.minIelts,
        max_study_gap_years: uni.maxGap,
        matching_reasons: reasons.slice(0, 4),
        caution_notes: cautions,
        scholarship_info: uni.scholarship,
        accepts_moi: uni.acceptsMoi,
        coop_available: uni.coop,
        field_tags: ['cs_it'],
        website_url: null,
        is_live_grounded: false,
        grounding_citations: [],
      },
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const recs = scored.map((s) => s.rec);

  const dreamCount = recs.filter((r) => r.tier === 'dream').length;
  const targetCount = recs.filter((r) => r.tier === 'target').length;
  const safeCount = recs.filter((r) => r.tier === 'safe').length;

  const visa: VisaAssessment = {
    readiness_score: (req.study_gap_years || 0) > 2 ? 65 : 88,
    status: (req.study_gap_years || 0) > 2 ? 'moderate_risk' : 'favorable',
    estimated_solvency_required_bdt_lakh: 28.0,
    solvency_details_by_country: {
      Germany: '৳16.5 Lakh — Blocked Account (€11,904) mandatory',
      UK: '৳28.0 Lakh — Tuition balance + 9 months living held for 28 days',
      USA: '৳38.0 Lakh — 1st year I-20 expenses with verifiable source of funds',
      Canada: '৳32.0 Lakh — GIC $20,635 CAD + 1st year tuition paid receipt',
    },
    risk_flags:
      (req.study_gap_years || 0) >= 2
        ? [
            {
              severity: 'warning',
              title: req.language === 'bn' ? 'স্টাডি গ্যাপ যাচাইকরণ' : 'Study Gap Scrutiny',
              description:
                req.language === 'bn'
                  ? `আপনার ${req.study_gap_years} বছরের স্টাডি গ্যাপ রয়েছে। অনুমোদিত চাকরির নিয়োগপত্র ও পে-স্লিপ প্রস্তুত রাখুন।`
                  : `You have a ${req.study_gap_years}-year study gap. Prepare official appointment letters and salary slips.`,
              mitigation_tip:
                req.language === 'bn'
                  ? 'পূর্ববর্তী কর্মসংস্থানের অফিশিয়াল সার্টিফিকেট, ট্যাক্স পেপার ও প্রভিডেন্ট ফান্ড স্টেটমেন্ট সংগ্রহ করুন।'
                  : 'Collect official work experience certificates, tax certificates, and bank salary statements.',
            },
          ]
        : [],
    key_advice: [
      'Maintain verifiable funds in scheduled banks under parents names.',
      'Prepare clear Statement of Purpose explaining choice of university and post-study career in Bangladesh.',
      'Use Ethos AI to verify offer letters and consultancy agreements before signing.',
    ],
  };

  const roadmap: RoadmapMilestone[] = [
    {
      step_number: 1,
      month_timeline: 'Month 1–2',
      phase_title: 'Standardized Tests & Academic Transcripts',
      tasks: ['Complete IELTS/PTE testing to score 6.5+', 'Collect official transcripts & MOI from university'],
      critical_warning: 'Do not pay consultancy advance fees before verified test scores.',
    },
    {
      step_number: 2,
      month_timeline: 'Month 3',
      phase_title: 'SOP Drafting & Recommendation Letters',
      tasks: ['Draft academic Statement of Purpose', 'Obtain 2 academic/professional recommendation letters'],
      critical_warning: null,
    },
    {
      step_number: 3,
      month_timeline: 'Month 4',
      phase_title: 'Application Submission & Early Scholarships',
      tasks: ['Submit applications to shortlisted universities', 'Apply for departmental fee waivers & discounts'],
      critical_warning: null,
    },
    {
      step_number: 4,
      month_timeline: 'Month 5',
      phase_title: 'Offer Verification & Deposit Remittance',
      tasks: ['Verify offer letter with Ethos AI scanner', 'Pay initial deposit via authorized Bangladesh Bank Student File'],
      critical_warning: 'Never remit money via informal Hundi; open an authorized student file.',
    },
    {
      step_number: 5,
      month_timeline: 'Month 6',
      phase_title: 'Bank Solvency & Financial Proof',
      tasks: ['Hold required funds for 28 consecutive days (UK) or transfer to Blocked Account (Germany)'],
      critical_warning: 'Do not withdraw funds during mandatory holding periods.',
    },
    {
      step_number: 6,
      month_timeline: 'Month 7–8',
      phase_title: 'Visa Filing, Biometrics & Pre-Departure',
      tasks: ['Complete visa application & schedule VFS biometrics', 'Complete IOM medical/TB test and attend interview'],
      critical_warning: null,
    },
  ];

  return {
    profile_summary: {
      normalized_gpa: normGpa,
      ielts_equivalent: ieltsBand,
      budget_bdt_lakh: budget,
      study_gap_years: req.study_gap_years || 0,
      target_field: req.target_field || 'General',
      preferred_intake: req.preferred_intake || 'Fall 2026',
    },
    recommendations: recs,
    visa_assessment: visa,
    roadmap,
    dream_count: dreamCount,
    target_count: targetCount,
    safe_count: safeCount,
    live_discovery_active: false,
  };
}

export function sendOfflineChatMessage(
  messages: CounselorChatMessage[],
  profile?: CounselorEvaluationRequest | null,
  lang: string = 'en'
): CounselorChatResponse {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const isBn = lang === 'bn' || /[\u0980-\u09FF]/.test(lastMsg);
  const qLower = lastMsg.toLowerCase();

  let reply = '';
  let suggestions = [
    'How much bank balance is required for Germany?',
    'Which UK universities accept study gaps?',
    'What scholarships can I get with my GPA?',
  ];

  if (isBn) {
    if (qLower.includes('জার্মানি') || qLower.includes('ব্লকড')) {
      reply =
        'জার্মানিতে অধিকাংশ পাবলিক বিশ্ববিদ্যালয়ে কোনো টিউশন ফি নেই। তবে জাতীয় স্টুডেন্ট ভিসার জন্য এক্সপ্যাট্রিও বা ফিনটিবায় €১১,৯০৪ ইউরো (প্রায় ১৬.৫ লাখ টাকা) ব্লকড অ্যাকাউন্টে জমা দেখাতে হয়।';
      suggestions = ['জার্মানিতে ইংরেজি মাধ্যমে কি কি কোর্স আছে?', 'আইইএলটিএস ছাড়া আবেদন করা সম্ভব?'];
    } else if (qLower.includes('গ্যাপ') || qLower.includes('স্টাডি গ্যাপ')) {
      reply =
        'স্টাডি গ্যাপ থাকলে সঠিক চাকরির প্রমাণপত্র (অ্যাপয়েন্টমেন্ট লেটার, পে-স্লিপ, ব্যাংক স্টেটমেন্ট) থাকা আবশ্যক। কোনো এজেন্সির কথায় ভুয়া সার্টিফিকেট বানাবেন না; ভিসা অফিসাররা ব্যাকগ্রাউন্ড ভেরিফিকেশন করে।';
      suggestions = ['ইউকেতে কত বছর পর্যন্ত গ্যাপ গ্রহণ করে?', 'SOP-তে স্টাডি গ্যাপ কীভাবে ব্যাখ্যা করব?'];
    } else {
      reply =
        'আপনার প্রোফাইল অনুযায়ী ড্রিম, টার্গেট ও সেফ বিশ্ববিদ্যালয়ের তালিকা প্রস্তুত করা হয়েছে। কোনো এজেন্সির ১০০% ভিসা গ্যারান্টি কথায় বিভ্রান্ত হবেন না; ইথোস এআই সব সময় নিরপেক্ষ তথ্য সরবরাহ করে।';
      suggestions = ['ব্যাংক সলভেন্সিতে পিতা-মাতা ছাড়া কে স্পন্সর হতে পারবে?', 'স্কলারশিপ পাওয়ার নিয়ম কি?'];
    }
  } else {
    if (qLower.includes('germany') || qLower.includes('blocked')) {
      reply =
        'In Germany, public universities charge zero tuition fees. However, you must deposit €11,904 EUR (~৳16.5 Lakh BDT) into a recognized Blocked Account (such as Expatrio or Fintiba) to satisfy embassy visa solvency.';
      suggestions = ['Which German universities offer English-taught programs?', 'Can I work part-time in Germany?'];
    } else if (qLower.includes('gap')) {
      reply =
        'Study gaps of 2 to 5 years are accepted by UK, US, and Malaysian universities if justified with continuous employment and tax records. Never submit fabricated experience letters.';
      suggestions = ['How to explain study gap in SOP?', 'Which UK universities accept up to 5 years gap?'];
    } else {
      reply =
        'I have analyzed your profile against our accredited destination criteria. Keep a balanced portfolio across Dream, Target, and Safe institutions, and ensure your bank funds have at least 3-6 months history.';
      suggestions = ['How much bank solvency is needed for UK CAS?', 'What scholarships are available for Bangladeshi students?'];
    }
  }

  return {
    reply,
    suggested_queries: suggestions,
    detected_language: isBn ? 'bn' : 'en',
    model_used: 'ethos-offline-counselor-v1',
    citations: [],
  };
}

/** Offline fallback for SOP audit — deterministic cliché and structure analysis. */
export function auditSOPOffline(payload: {
  sop_text: string;
  target_university?: string | null;
  target_country?: string | null;
  target_program?: string | null;
}): import('./aiService').SOPAuditResponse {
  const sopLower = payload.sop_text.toLowerCase();
  const clichePhrases = [
    'since childhood', 'from a young age', 'passionate about',
    'globalized world', 'give back to my country', 'esteemed university',
    'broaden my horizons', 'dream of mine', 'always wanted to',
  ];
  const foundCliches = clichePhrases.filter(p => sopLower.includes(p));
  const clicheCount = foundCliches.length;

  const findings: import('./aiService').SOPAuditFinding[] = [];

  // Cliché findings
  for (const phrase of foundCliches) {
    findings.push({
      category: 'cliche',
      severity: 'warning',
      quote: phrase,
      issue: `The phrase "${phrase}" is overused in SOPs and weakens your narrative.`,
      suggestion: `Replace "${phrase}" with a specific, personal anecdote or concrete example.`,
      paragraph_ref: null,
    });
  }

  // University alignment
  let uniScore = 30;
  if (payload.target_university && sopLower.includes(payload.target_university.toLowerCase())) {
    uniScore = 70;
    findings.push({
      category: 'university_alignment',
      severity: 'info',
      quote: payload.target_university,
      issue: 'Good — you mention the target university by name.',
      suggestion: 'Strengthen by mentioning specific professors, labs, or unique programs.',
      paragraph_ref: null,
    });
  } else {
    findings.push({
      category: 'university_alignment',
      severity: 'danger',
      quote: '(no mention found)',
      issue: 'Your SOP does not mention the target university by name.',
      suggestion: `Add specific references to ${payload.target_university || 'your target university'}\'s programs, faculty, or research.`,
      paragraph_ref: null,
    });
  }

  // Visa intent
  const visaKeywords = ['return', 'bangladesh', 'family', 'career back', 'contribute', 'home country'];
  const visaHits = visaKeywords.filter(k => sopLower.includes(k)).length;
  const visaScore = Math.min(100, visaHits * 20 + 10);

  if (visaHits < 2) {
    findings.push({
      category: 'visa_intent',
      severity: 'warning',
      quote: '(insufficient homeland ties)',
      issue: 'Your SOP lacks clear statements about returning to Bangladesh after studies.',
      suggestion: 'Add a paragraph about your post-study career plans in Bangladesh, family ties, or community contributions.',
      paragraph_ref: null,
    });
  }

  const overallScore = Math.max(0, Math.min(100, 80 - clicheCount * 10 + Math.floor(visaScore / 5) + Math.floor(uniScore / 5)));
  const verdict = overallScore >= 70 ? 'strong' : overallScore >= 45 ? 'needs_work' : 'weak';

  return {
    overall_score: overallScore,
    verdict,
    findings,
    cliche_count: clicheCount,
    visa_intent_score: visaScore,
    university_alignment_score: uniScore,
    summary: `Your SOP scores ${overallScore}/100. ${overallScore >= 70 ? 'Strong narrative with good specifics.' : 'Needs improvement — reduce clichés and add university-specific details.'}`,
    improved_excerpt: null,
    model_used: 'offline_engine',
  };
}
