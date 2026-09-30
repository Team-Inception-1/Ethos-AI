/**
 * Ethos AI — System Chatbot Navigation & Human Conversational Engine
 * 
 * Provides direct, human-like answers grounded in Verified Agency & Cost Data,
 * with 1-click navigation actions in English and Bangla.
 */
import { VerifiedKnowledgeEngine } from './verifiedKnowledgeStore';
import { OFFLINE_DEMO_ENABLED } from './ai/demo';

export interface NavAction {
  label: string;
  labelBn: string;
  href: string;
  icon: string;
  description?: string;
  descriptionBn?: string;
}

export interface BotResponse {
  text: string;
  textBn: string;
  actions?: NavAction[];
  suggestions?: { en: string; bn: string }[];
  category?: 'qa' | 'greeting' | 'explainer' | 'empathy' | 'country' | 'directory' | 'compare' | 'ai-tools' | 'counselor' | 'escrow' | 'guardian' | 'roles' | 'polite' | 'general';
}

export interface QuickCategory {
  id: string;
  icon: string;
  titleEn: string;
  titleBn: string;
  promptEn: string;
  promptBn: string;
}

export const QUICK_CATEGORIES: QuickCategory[] = [
  {
    id: 'directory',
    icon: '🏢',
    titleEn: 'Find Agencies',
    titleBn: 'এজেন্সি খুঁজুন',
    promptEn: 'How can I find verified study-abroad agencies?',
    promptBn: 'যাচাইকৃত বিশ্বস্ত এজেন্সি কীভাবে খুঁজব?',
  },
  {
    id: 'compare',
    icon: '⚖️',
    titleEn: 'Compare Fees',
    titleBn: 'ফি তুলনা করুন',
    promptEn: 'How do I compare consultancy fees and hidden charges?',
    promptBn: 'এজেন্সির ফি এবং লুকানো খরচ কীভাবে তুলনা করব?',
  },
  {
    id: 'ai-tools',
    icon: '🛡️',
    titleEn: 'Verify Offer Letter',
    titleBn: 'অফার লেটার যাচাই',
    promptEn: 'How can I check if my university offer letter or contract is genuine?',
    promptBn: 'আমার অফার লেটার বা চুক্তি আসল কি না কীভাবে পরীক্ষা করব?',
  },
  {
    id: 'escrow',
    icon: '🔒',
    titleEn: 'Escrow Payments',
    titleBn: 'নিরাপদ পেমেন্ট (এসক্রো)',
    promptEn: 'How do milestone escrow payments protect my money?',
    promptBn: 'মাইলস্টোন এসক্রো পেমেন্ট কীভাবে টাকা সুরক্ষিত রাখে?',
  },
  {
    id: 'counselor',
    icon: '🎓',
    titleEn: 'AI Counselor',
    titleBn: 'এআই কাউন্সেলর',
    promptEn: 'Can the AI suggest universities based on my CGPA and IELTS?',
    promptBn: 'আমার সিজিপিএ এবং আইইএলটিএস অনুযায়ী বিশ্ববিদ্যালয় সাজেস্ট করবে?',
  },
  {
    id: 'guardian',
    icon: '👨‍👩‍👦',
    titleEn: 'Parent Portal',
    titleBn: 'অভিভাবক পোর্টাল',
    promptEn: 'Can parents see payment receipts in Bangla?',
    promptBn: 'অভিভাবকরা কি বাংলায় পেমেন্ট রসিদ দেখতে পারবেন?',
  },
];

/**
 * Contextual suggestion generator based on current page URL
 */
export function getContextualSuggestions(pathname: string, lang: 'en' | 'bn'): { text: string; action?: NavAction }[] {
  if (pathname === '/directory') {
    return lang === 'en'
      ? [
          { text: 'How do I compare fees between agencies?', action: { label: 'Compare Agencies', labelBn: 'এজেন্সি তুলনা', href: '/compare', icon: '⚖️' } },
          { text: 'How does Ethos AI verify an agency license?', action: { label: 'Learn Verification', labelBn: 'যাচাই প্রক্রিয়া', href: '/ai-tools', icon: '🛡️' } },
        ]
      : [
          { text: 'এজেন্সিদের ফি ও শর্ত কীভাবে পাশাপাশি তুলনা করব?', action: { label: 'তুলনা করুন', labelBn: 'তুলনা করুন', href: '/compare', icon: '⚖️' } },
          { text: 'Ethos AI কীভাবে এজেন্সির বৈধতা যাচাই করে?', action: { label: 'যাচাইকরণ দেখুন', labelBn: 'যাচাইকরণ দেখুন', href: '/ai-tools', icon: '🛡️' } },
        ];
  }

  if (pathname === '/compare') {
    return lang === 'en'
      ? [
          { text: 'What are the refund terms under Escrow protection?', action: { label: 'View Escrow Terms', labelBn: 'এসক্রো শর্তাবলী', href: '/dashboard/payments', icon: '🔒' } },
          { text: 'Return to verified directory to pick more agencies', action: { label: 'Browse Directory', labelBn: 'ডিরেক্টরি দেখুন', href: '/directory', icon: '🔍' } },
        ]
      : [
          { text: 'এসক্রো পেমেন্টে রিফান্ডের নিশ্চয়তা কীভাবে কাজ করে?', action: { label: 'এসক্রো জানুন', labelBn: 'এসক্রো জানুন', href: '/dashboard/payments', icon: '🔒' } },
          { text: 'নতুন এজেন্সি বেছে নিতে ডিরেক্টরিতে ফিরে যান', action: { label: 'ডিরেক্টরি ব্রাউজ করুন', labelBn: 'ডিরেক্টরি ব্রাউজ করুন', href: '/directory', icon: '🔍' } },
        ];
  }

  if (pathname === '/ai-tools') {
    return lang === 'en'
      ? [
          { text: 'Check an offer letter for forged letterhead or emails', action: { label: 'Offer Scanner', labelBn: 'অফার স্ক্যানার', href: '/ai-tools?tool=offer', icon: '📄' } },
          { text: 'Analyze agency contract for hidden cancellation penalties', action: { label: 'Agreement Analyzer', labelBn: 'চুক্তি বিশ্লেষক', href: '/ai-tools?tool=agreement', icon: '⚖️' } },
        ]
      : [
          { text: 'বিশ্ববিদ্যালয়ের অফার লেটার ও ডোমেইন আসল কি না যাচাই করুন', action: { label: 'অফার স্ক্যানার', labelBn: 'অফার স্ক্যানার', href: '/ai-tools?tool=offer', icon: '📄' } },
          { text: 'এজেন্সির চুক্তিতে লুকানো কোনো জরিমানা বা ফাঁদ আছে কি না দেখুন', action: { label: 'চুক্তি বিশ্লেষক', labelBn: 'চুক্তি বিশ্লেষক', href: '/ai-tools?tool=agreement', icon: '⚖️' } },
        ];
  }

  if (pathname.startsWith('/dashboard')) {
    return lang === 'en'
      ? [
          { text: 'View milestone escrow payments & digital receipts', action: { label: 'Escrow Ledger', labelBn: 'এসক্রো লেজার', href: '/dashboard/payments', icon: '💳' } },
          { text: 'Get Guardian Link Code for parents', action: { label: 'Guardian Code', labelBn: 'গার্ডিয়ান কোড', href: '/profile', icon: '👨‍👩‍👧' } },
        ]
      : [
          { text: 'সুরক্ষিত মাইলস্টোন এসক্রো লেনদেন ও ডিজিটাল রসিদ দেখুন', action: { label: 'এসক্রো লেজার', labelBn: 'এসক্রো লেজার', href: '/dashboard/payments', icon: '💳' } },
          { text: 'বাবা-মার জন্য গার্ডিয়ান লিংক কোড সংগ্রহ করুন', action: { label: 'গার্ডিয়ান কোড', labelBn: 'গার্ডিয়ান কোড', href: '/profile', icon: '👨‍👩‍👧' } },
        ];
  }

  // Default suggestions for home / other pages
  return lang === 'en'
    ? [
        { text: 'How to find verified consultancies?', action: { label: 'Find Agencies', labelBn: 'এজেন্সি খুঁজুন', href: '/directory', icon: '🏢' } },
        { text: 'Test offer letter or contract for fraud', action: { label: 'AI Fraud Tools', labelBn: 'এআই টুলস', href: '/ai-tools', icon: '🛡️' } },
        { text: 'How does Escrow protect my money?', action: { label: 'Escrow Payments', labelBn: 'এসক্রো পেমেন্ট', href: '/dashboard/payments', icon: '🔒' } },
      ]
    : [
        { text: 'বিশ্বস্ত ও লাইসেন্সপ্রাপ্ত এজেন্সি কীভাবে খুঁজব?', action: { label: 'এজেন্সি খুঁজুন', labelBn: 'এজেন্সি খুঁজুন', href: '/directory', icon: '🏢' } },
        { text: 'অফার লেটার ও চুক্তির শর্ত যাচাই করার উপায় কী?', action: { label: 'এআই টুলস', labelBn: 'এআই টুলস', href: '/ai-tools', icon: '🛡️' } },
        { text: 'এসক্রো পেমেন্ট কীভাবে টাকা প্রতারণা থেকে বাঁচায়?', action: { label: 'এসক্রো পেমেন্ট', labelBn: 'এসক্রো পেমেন্ট', href: '/dashboard/payments', icon: '🔒' } },
      ];
}

/**
 * Natural Conversational Trigger Patterns
 */
const GREETING_PATTERNS = [
  'hi', 'hlw', 'hello', 'hey', 'heyy', 'yo', 'hola',
  'good morning', 'good evening', 'good afternoon', 'sup',
  'হাই', 'হ্যালো', 'কেমন আছেন', 'কেমন আছো', 'কি খবর'
];

const HOW_IT_WORKS_PATTERNS = [
  'how this work', 'how does this work', 'how it works', 'how does it work', 'what is this',
  'what is ethos', 'how does ethos work', 'explain ethos', 'tell me how this works',
  'কিভাবে কাজ করে', 'এটা কিভাবে চলে', 'কীভাবে কাজ করে', 'ইথোস কি', 'ইথোস এআই কিভাবে কাজ করে'
];

const WHO_ARE_YOU_PATTERNS = [
  'who are you', 'what are you', 'what is your name', 'tell me about yourself',
  'what can you do', 'what do you do', 'তুমি কে', 'তোমার নাম কি', 'তোমার কাজ কি', 'আপনি কে'
];

const SCAM_FEAR_PATTERNS = [
  'scared', 'afraid', 'fear', 'cheat', 'fraud', 'scammed', 'lose money', 'lost money',
  'worried', 'is it safe', 'can i trust', 'predatory',
  'ভয় পাচ্ছি', 'টাকা মার যাবে', 'প্রতারিত', 'ধোঁকা', 'বিশ্বাস করব কিভাবে', 'নিরাপদ কিনা'
];

const POLITE_PATTERNS = [
  'thank you', 'thanks', 'thx', 'thank u', 'appreciate it', 'great job', 'awesome', 'cool',
  'ok', 'okay', 'got it', 'bye', 'goodbye', 'see you',
  'ধন্যবাদ', 'থ্যাঙ্কস', 'ঠিক আছে', 'আচ্ছা', 'বাই', 'বিদায়'
];

/**
 * Intelligent Intent Matcher: DIRECT, Human-like Q&A Engine
 */
export function queryNavigationAssistant(query: string, currentPath: string = '/'): BotResponse {
  void currentPath;
  if (!OFFLINE_DEMO_ENABLED) {
    const destinations = QUICK_CATEGORIES.filter(item =>
      query.toLowerCase().includes(item.id) || query.toLowerCase().includes(item.titleEn.toLowerCase().split(' ')[0]));
    return {
      category: 'general',
      text: 'I can help you find the right section. Use the published directory for agency details and the AI tools for document analysis. Current costs and payment terms should be checked with their official source.',
      textBn: 'সঠিক বিভাগ খুঁজে নিতে সাহায্য করতে পারি। এজেন্সির তথ্যের জন্য প্রকাশিত ডিরেক্টরি এবং নথি বিশ্লেষণের জন্য এআই টুল ব্যবহার করুন। বর্তমান খরচ ও পেমেন্টের শর্ত অফিসিয়াল উৎস থেকে যাচাই করুন।',
      actions: (destinations.length ? destinations : QUICK_CATEGORIES.slice(0, 3)).map(item => ({
        label: item.titleEn, labelBn: item.titleBn, icon: item.icon,
        href: ({ directory: '/directory', compare: '/compare', 'ai-tools': '/ai-tools', counselor: '/counselor', escrow: '/dashboard/escrow', guardian: '/dashboard' } as Record<string, string>)[item.id] || '/directory',
      })),
    };
  }
  const rawQ = query.trim();
  const q = rawQ.toLowerCase();

  // Normalize punctuation for matching
  const cleanQ = q.replace(/[.,?!;:_~]/g, ' ').replace(/\s+/g, ' ').trim();

  // ─────────────────────────────────────────────────────────────────────────────
  // 0. OFFLINE DEMO AGENCY & COUNTRY COST MATCHER
  // Illustrative fixtures only; this branch is disabled outside explicit offline-demo mode.
  // ─────────────────────────────────────────────────────────────────────────────
  const matchedCountry = VerifiedKnowledgeEngine.getCountryCost(cleanQ);
  const isAskingCostOrAgency = 
    cleanQ.includes('cost') || cleanQ.includes('fee') || cleanQ.includes('expense') || cleanQ.includes('budget') ||
    cleanQ.includes('khoroch') || cleanQ.includes('taka') || cleanQ.includes('খরচ') || cleanQ.includes('টাকা') ||
    cleanQ.includes('ফি') || cleanQ.includes('বাজেট') || cleanQ.includes('agency') || cleanQ.includes('agencies') ||
    cleanQ.includes('consultan') || cleanQ.includes('এজেন্সি') || cleanQ.includes('যাচাই') || cleanQ.includes('verified') ||
    cleanQ.includes('process') || cleanQ.includes('requirements') || cleanQ.includes('ভিসা') || cleanQ.includes('visa');

  if (matchedCountry && (isAskingCostOrAgency || cleanQ.split(' ').length <= 3)) {
    const verifiedAgencies = VerifiedKnowledgeEngine.getVerifiedAgenciesForCountry(matchedCountry.country);
    const agencyListEn = verifiedAgencies
      .map(a => `• **${a.name}** (License: \`${a.licenseNo}\`, Success: ${a.successRate}%, Fee: ৳${(a.feeMinBdt / 1000).toFixed(0)}K–৳${(a.feeMaxBdt / 1000).toFixed(0)}K)`)
      .join('\n');
    const agencyListBn = verifiedAgencies
      .map(a => `• **${a.nameBn || a.name}** (লাইসেন্স: \`${a.licenseNo}\`, সাফল্যের হার: ${a.successRate}%, সার্ভিস ফি: ৳${(a.feeMinBdt / 1000).toFixed(0)}K–৳${(a.feeMaxBdt / 1000).toFixed(0)}K)`)
      .join('\n');

    return {
      category: 'country',
      text: `🧪 **Offline demo: illustrative cost & agency sheet for ${matchedCountry.flag} ${matchedCountry.country}**
*(Static sample data — not live, production-verified, or a substitute for official sources.)*

💰 **Estimated 1st-Year Budget:** ৳${(matchedCountry.totalFirstYearEstBdt.min / 100000).toFixed(1)}L – ৳${(matchedCountry.totalFirstYearEstBdt.max / 100000).toFixed(1)}L BDT

📌 **Detailed Cost Breakdown:**
1. **Tuition Fee:** ${matchedCountry.tuitionYearlyBdt.label}
2. **Living / Blocked Fund:** ${matchedCountry.livingOrBlockedBdt.label}
3. **Visa & Biometrics Fee:** ${matchedCountry.visaAndBiometricsBdt.label}
4. **Health Insurance:** ${matchedCountry.healthInsuranceYearlyBdt.label}
5. **Illustrative Agency Fee:** ৳${matchedCountry.escrowAgencyFeeBdt.min.toLocaleString()} – ৳${matchedCountry.escrowAgencyFeeBdt.max.toLocaleString()} BDT

🏢 **Illustrative demo agencies for ${matchedCountry.country}:**
${agencyListEn}

🛡️ *Remember: Never pay an agency full fee upfront. Use Ethos Milestone Escrow to protect your funds.*`,
      textBn: `🧪 **অফলাইন ডেমো: ${matchedCountry.flag} ${matchedCountry.countryBn}-র নমুনা খরচ ও এজেন্সি তথ্য**
*(স্থির নমুনা তথ্য—লাইভ বা প্রোডাকশন-যাচাইকৃত নয়; অফিসিয়াল উৎসে নিশ্চিত করুন।)*

💰 **১ম বছরের আনুমানিক মোট বাজেট:** ৳${(matchedCountry.totalFirstYearEstBdt.min / 100000).toFixed(1)} লাখ – ৳${(matchedCountry.totalFirstYearEstBdt.max / 100000).toFixed(1)} লাখ BDT

📌 **সুনির্দিষ্ট খরচের বিভাজন:**
১. **টিউশন ফি:** ${matchedCountry.tuitionYearlyBdt.labelBn}
২. **লিভিং / ব্লকড ফান্ড:** ${matchedCountry.livingOrBlockedBdt.labelBn}
৩. **ভিসা ও বায়োমেট্রিক্স ফি:** ${matchedCountry.visaAndBiometricsBdt.labelBn}
৪. **স্বাস্থ্য বীমা:** ${matchedCountry.healthInsuranceYearlyBdt.labelBn}
৫. **নমুনা এজেন্সি ফি:** ৳${matchedCountry.escrowAgencyFeeBdt.min.toLocaleString()} – ৳${matchedCountry.escrowAgencyFeeBdt.max.toLocaleString()} টাকা

🏢 **${matchedCountry.countryBn}-র জন্য ডেমো এজেন্সির নমুনা:**
${agencyListBn}

🛡️ *সতর্কতা: কোনো এজেন্সিকে কখনোই এককালীন সব টাকা আগে দেবেন না। আপনার টাকা নিরাপদ রাখতে Ethos মাইলস্টোন এসক্রো ব্যবহার করুন।*`,
      actions: [
        {
          label: `Compare ${matchedCountry.country} Agencies`,
          labelBn: `${matchedCountry.countryBn} এজেন্সি তুলনা করুন`,
          href: `/compare`,
          icon: '⚖️',
          description: `Side-by-side fee and refund comparison for ${matchedCountry.country}.`,
          descriptionBn: `${matchedCountry.countryBn}-র এজেন্সিদের ফি ও রিফান্ড পলিসি তুলনা।`,
        },
        {
          label: 'Agency Directory',
          labelBn: 'এজেন্সি ডিরেক্টরি',
          href: '/directory',
          icon: '🏢',
          description: 'Browse the directory and independently confirm current credentials.',
          descriptionBn: 'ডিরেক্টরি দেখুন এবং বর্তমান পরিচয়পত্র স্বাধীনভাবে নিশ্চিত করুন।',
        },
        {
          label: `${matchedCountry.country} Student Network`,
          labelBn: `${matchedCountry.countryBn} স্টুডেন্ট নেটওয়ার্ক`,
          href: '/community',
          icon: '🎓',
          description: `Connect with Bangladeshi students in ${matchedCountry.country}.`,
          descriptionBn: `${matchedCountry.countryBn}-তে অবস্থানরত শিক্ষার্থীদের সাথে যুক্ত হন।`,
        },
      ],
      suggestions: [
        { en: `What are the visa requirements for ${matchedCountry.country}?`, bn: `${matchedCountry.countryBn}-র ভিসার প্রধান শর্তগুলো কি কি?` },
        { en: 'How does milestone escrow protect my money?', bn: 'মাইলস্টোন এসক্রো কীভাবে আমার টাকা সুরক্ষিত রাখে?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SPECIFIC QUESTION MATCHERS (Direct answers first, no generic bot templates)
  // ─────────────────────────────────────────────────────────────────────────────

  // Question 1: "Can parents see payment receipts in Bangla?"
  if (
    (cleanQ.includes('parent') || cleanQ.includes('guardian') || cleanQ.includes('father') || cleanQ.includes('mother') || cleanQ.includes('অভিভাবক') || cleanQ.includes('বাবা') || cleanQ.includes('মা')) &&
    (cleanQ.includes('receipt') || cleanQ.includes('payment') || cleanQ.includes('bangla') || cleanQ.includes('see') || cleanQ.includes('view') || cleanQ.includes('রসিদ') || cleanQ.includes('বাংলা'))
  ) {
    return {
      category: 'qa',
      text: `Yes, absolutely! Parents can view all milestone payment receipts, fee breakdowns, and transaction records in clear, simple Bangla directly inside the Parent Portal.

Each receipt displays the exact amount in BDT (and poisha), transaction date, and verified milestone status so families have complete financial visibility without technical confusion.

To enable this for your parents:
1. Go to your Profile page and copy your Guardian Link Code (e.g. ETHOS-STU-8821).
2. Share the code with your parents so they can link their account in the Parent Portal.`,
      textBn: `হ্যাঁ, অবশ্যই! অভিভাবকরা সরাসরি অভিভাবক পোর্টালে গিয়ে সহজ বাংলায় প্রতিটি মাইলস্টোন পেমেন্ট রসিদ, মোট খরচের হিসাব এবং লেনদেনের স্ট্যাটাস দেখতে পারেন।

প্রতিটি রসিদে বিডিটি ও পয়সা পর্যন্ত সঠিক পরিমাণ, পেমেন্টের তারিখ এবং অনুমোদিত মাইলস্টোনের তথ্য উল্লেখ থাকে যাতে পরিবারের কাছে সম্পূর্ণ আর্থিক স্বচ্ছতা থাকে।

অভিভাবককে যুক্ত করার নিয়ম:
১. আপনার Profile পেজে যান এবং আপনার ইউনিক গার্ডিয়ান লিংক কোডটি (যেমন: ETHOS-STU-8821) কপি করুন।
২. কোডটি আপনার বাবা-মাকে দিন যাতে তারা অভিভাবক পোর্টালে কানেক্ট হতে পারেন।`,
      actions: [
        {
          label: 'View Guardian Link Code',
          labelBn: 'গার্ডিয়ান লিংক কোড দেখুন',
          href: '/profile',
          icon: '👨‍👩‍👧',
          description: 'Copy your student code to link parent account.',
          descriptionBn: 'অভিভাবক যুক্ত করতে আপনার কোড কপি করুন।',
        },
        {
          label: 'View Payment Receipts',
          labelBn: 'পেমেন্ট রসিদ দেখুন',
          href: '/dashboard/payments',
          icon: '💳',
          description: 'View active escrow milestones and receipts.',
          descriptionBn: 'চলমান এসক্রো মাইলস্টোন ও রসিদ দেখুন।',
        },
      ],
      suggestions: [
        { en: 'How do I release milestone payment?', bn: 'মাইলস্টোন পেমেন্ট রিলিজ করব কীভাবে?' },
        { en: 'Can I get a refund if visa is rejected?', bn: 'ভিসা না হলে কি টাকা ফেরত পাব?' },
      ],
    };
  }

  // Question 2: "Can I get a refund if visa is rejected?" / "What happens if visa fails?"
  if (
    (cleanQ.includes('refund') || cleanQ.includes('reject') || cleanQ.includes('refus') || cleanQ.includes('denied') || cleanQ.includes('ফেরত') || cleanQ.includes('রিজেক্ট') || cleanQ.includes('বাতিল')) &&
    (cleanQ.includes('visa') || cleanQ.includes('money') || cleanQ.includes('payment') || cleanQ.includes('ভিসা') || cleanQ.includes('টাকা'))
  ) {
    return {
      category: 'qa',
      text: `Yes, you are fully protected. Under Ethos AI Milestone Escrow rules:

1. Unreleased Funds: If your visa is rejected or an agency breaches their contract, any funds remaining in escrow are automatically refunded to you.
2. Verified Work Only: The agency is only paid for milestones that were genuinely completed and verified prior to the visa decision.
3. No Upfront Loss: Because you never pay 100% upfront, an agency cannot hold your entire budget hostage.`,
      textBn: `হ্যাঁ, আপনি সম্পূর্ণ সুরক্ষিত। Ethos AI মাইলস্টোন এসক্রো-র নিয়ম অনুযায়ী:

১. রিফান্ডের নিশ্চয়তা: ভিসা রিজেক্ট হলে বা এজেন্সি চুক্তি ভঙ্গ করলে এসক্রোতে থাকা অপ্রদানকৃত সম্পূর্ণ অর্থ আপনাকে ফেরত দেওয়া হয়।
২. কাজের ভিত্তিতে পেমেন্ট: এজেন্সি কেবল সেই ধাপগুলোর জন্যই টাকা পায় যা তারা বাস্তবে প্রমাণসহ সম্পন্ন করতে পেরেছে।
৩. কোনো এককালীন ঝুঁকি নেই: যেহেতু পুরো ফি আগে দেওয়া হয় না, তাই ভিসা না হলে সব টাকা আটকে থাকার কোনো ভয় থাকে না।`,
      actions: [
        {
          label: 'Open Escrow Ledger',
          labelBn: 'এসক্রো লেজার দেখুন',
          href: '/dashboard/payments',
          icon: '🔒',
          description: 'Review milestone escrow rules and active balances.',
          descriptionBn: 'এসক্রো নীতিমালা ও বর্তমান ব্যালেন্স দেখুন।',
        },
        {
          label: 'Compare Refund Terms',
          labelBn: 'রিফান্ড শর্তাবলী তুলনা',
          href: '/compare',
          icon: '⚖️',
          description: 'Compare refund policies across agencies.',
          descriptionBn: 'বিভিন্ন এজেন্সির রিফান্ড পলিসি তুলনা করুন।',
        },
      ],
      suggestions: [
        { en: 'Do I have to pay the agency upfront?', bn: 'শুরুতেই কি পুরো টাকা দিতে হবে?' },
        { en: 'How do I release milestone payments?', bn: 'মাইলস্টোন পেমেন্ট রিলিজ করব কীভাবে?' },
      ],
    };
  }

  // Question 3: "Do I have to pay the agency upfront?" / "Should I pay money in advance?"
  if (
    (cleanQ.includes('upfront') || cleanQ.includes('advance') || cleanQ.includes('in advance') || cleanQ.includes('full money') || cleanQ.includes('all money') || cleanQ.includes('অগ্রিম') || cleanQ.includes('একবারে') || cleanQ.includes('আগে')) &&
    (cleanQ.includes('pay') || cleanQ.includes('money') || cleanQ.includes('fee') || cleanQ.includes('cost') || cleanQ.includes('টাকা') || cleanQ.includes('পেমেন্ট'))
  ) {
    return {
      category: 'qa',
      text: `No, you should never pay 100% upfront to an agency.

On Ethos AI, you deposit fees into Milestone Escrow in structured stages (such as Offer Letter Milestone, Visa Milestone). The money stays locked in escrow and is only released to the agency once verified proof of each milestone is confirmed.

If an agency insists on 100% cash advance outside of escrow, that is an immediate red flag.`,
      textBn: `না, কোনো এজেন্সিকে কখনোই সম্পূর্ণ টাকা অগ্রিম দেওয়া উচিত নয়।

Ethos AI-তে টাকা ধাপে ধাপে মাইলস্টোন এসক্রোতে জমা দিতে হয় (যেমন: অফার লেটার প্রাপ্তি, ভিসা আবেদন)। টাকা এসক্রোতে নিরাপদ থাকে এবং প্রতিটি কাজের সুনির্দিষ্ট প্রমাণ যাচাই হলেই কেবল সেই ধাপের টাকা এজেন্সির হাতে যায়।

কোনো এজেন্সি যদি এসক্রোর বাইরে একবারে পুরো টাকা অগ্রিম চায়, তবে শুরুতেই সতর্ক হোন।`,
      actions: [
        {
          label: 'View Escrow Payments',
          labelBn: 'এসক্রো পেমেন্ট দেখুন',
          href: '/dashboard/payments',
          icon: '🔒',
          description: 'See how milestone payments protect your savings.',
          descriptionBn: 'মাইলস্টোন পেমেন্ট কীভাবে টাকা সুরক্ষিত রাখে তা দেখুন।',
        },
        {
          label: 'Browse Verified Agencies',
          labelBn: 'যাচাইকৃত এজেন্সি খুঁজুন',
          href: '/directory',
          icon: '🏢',
          description: 'Find agencies committed to transparent escrow terms.',
          descriptionBn: 'স্বচ্ছ ফি-যুক্ত বিশ্বস্ত এজেন্সি খুঁজুন।',
        },
      ],
      suggestions: [
        { en: 'Can I get a refund if visa is rejected?', bn: 'ভিসা না হলে কি টাকা ফেরত পাব?' },
        { en: 'How can my parents view payment receipts?', bn: 'অভিভাবক কীভাবে পেমেন্ট রসিদ দেখবেন?' },
      ],
    };
  }

  // Question 4: "Can I study abroad without IELTS?" / "Is IELTS mandatory?"
  if (
    cleanQ.includes('without ielts') ||
    (cleanQ.includes('ielts') && (cleanQ.includes('mandatory') || cleanQ.includes('required') || cleanQ.includes('need') || cleanQ.includes('দরকার') || cleanQ.includes('ছাড়া') || cleanQ.includes('বাধ্যতামূলক')))
  ) {
    return {
      category: 'qa',
      text: `It depends on the country and university:

1. Flexible Alternatives: Some institutions in the UK, Malaysia, or private European universities accept Duolingo, PTE, or Medium of Instruction (MOI) certificates from your previous degree.
2. Embassy Requirements: Even if a university waives IELTS, visa officers in countries like Canada (SDS) or the USA evaluate your English proficiency during document review or interviews.
3. Scam Warning: Be extremely wary of agencies advertising '100% Guaranteed Visa Without IELTS' — this is a classic predatory marketing trap. You can scan such advertisements in our Scam Alert tool.`,
      textBn: `এটি মূলত দেশ ও বিশ্ববিদ্যালয়ের নিয়মের ওপর নির্ভর করে:

১. বিকল্প মাধ্যম: যুক্তরাজ্য, মালয়েশিয়া বা ইউরোপের কিছু প্রতিষ্ঠান ডুওলিঙ্গো (Duolingo), পিটিই (PTE) কিংবা আগের ডিগ্রির ইংরেজি মাধ্যমের সনদ (MOI) গ্রহণ করে।
২. এম্বাসির নিয়ম: বিশ্ববিদ্যালয় ছাড় দিলেও কানাডা বা আমেরিকার মতো দেশে ভিসা অফিসাররা ইংরেজি দক্ষতার ওপর বিশেষ গুরুত্ব দেন।
৩. প্রতারণা সতর্কতা: 'বিনা আইইএলটিএসে ১০০% ভিসা গ্যারান্টি'—এ জাতীয় চটকদার বিজ্ঞাপন থেকে সতর্ক থাকুন। আমাদের স্ক্যাম ডিটেক্টরে এমন বিজ্ঞাপন যাচাই করে নিতে পারেন।`,
      actions: [
        {
          label: 'Evaluate Admission with Counselor',
          labelBn: 'কাউন্সেলরে যোগ্যতা যাচাই',
          href: '/counselor',
          icon: '🎓',
          description: 'Test your admission chances with current test scores.',
          descriptionBn: 'বর্তমান স্কোর দিয়ে ভর্তির সম্ভাবনা যাচাই করুন।',
        },
        {
          label: 'Scan Promotional Claims',
          labelBn: 'বিজ্ঞাপন যাচাই করুন',
          href: '/ai-tools',
          icon: '🛡️',
          description: 'Test agency claims for scam red flags.',
          descriptionBn: 'এজেন্সির কোনো দাবি ভুয়া কি না স্ক্যান করুন।',
        },
      ],
      suggestions: [
        { en: 'Which universities accept Duolingo or MOI?', bn: 'কোন কোন বিশ্ববিদ্যালয় ডুওলিঙ্গো বা এমওআই গ্রহণ করে?' },
        { en: 'Find verified agencies for Canada or Germany', bn: 'কানাডা বা জার্মানির বিশ্বস্ত এজেন্সি খুঁজুন' },
      ],
    };
  }

  // Question 5: "Where do I find my Guardian Link Code?" / "How do I connect my parents?"
  if (
    cleanQ.includes('link code') || cleanQ.includes('guardian code') || cleanQ.includes('লিংক কোড') ||
    (cleanQ.includes('কোড') && cleanQ.includes('কোথায়'))
  ) {
    return {
      category: 'qa',
      text: `Your Guardian Link Code is located inside your Profile:

1. Click on Profile from the navigation menu or use the button below.
2. Under Guardian Synchronization, copy your unique code (e.g. ETHOS-STU-8821).
3. Give this code to your parents so they can link their dashboard and view updates in Bangla.`,
      textBn: `আপনার গার্ডিয়ান লিংক কোডটি Profile পেজে সংরক্ষিত রয়েছে:

১. মেনু থেকে Profile পেজে যান অথবা নিচের বাটনে ক্লিক করুন।
২. Guardian Synchronization সেকশনে আপনার ইউনিক কোডটি (যেমন: ETHOS-STU-8821) দেখতে পাবেন।
৩. কোডটি কপি করে আপনার বাবা-মাকে দিন যাতে তারা অভিভাবক পোর্টালে যুক্ত হতে পারেন।`,
      actions: [
        {
          label: 'Open Profile for Link Code',
          labelBn: 'প্রোফাইলে লিংক কোড দেখুন',
          href: '/profile',
          icon: '👨‍👩‍👧',
          description: 'Copy your student linking code.',
          descriptionBn: 'আপনার স্টুডেন্ট লিংক কোড কপি করুন।',
        },
        {
          label: 'Open Student Dashboard',
          labelBn: 'ড্যাশবোর্ড দেখুন',
          href: '/dashboard',
          icon: '📊',
          description: 'View active application stages.',
          descriptionBn: 'চলমান আবেদনের অবস্থা দেখুন।',
        },
      ],
      suggestions: [
        { en: 'Can parents see payment receipts in Bangla?', bn: 'অভিভাবকরা কি বাংলায় পেমেন্ট রসিদ দেখতে পারবেন?' },
        { en: 'How do milestone payments work?', bn: 'মাইলস্টোন পেমেন্ট কীভাবে কাজ করে?' },
      ],
    };
  }

  // Question 6: "Can an agency guarantee my visa?" / "Is visa guaranteed?"
  if (
    cleanQ.includes('guarantee visa') || cleanQ.includes('visa guarantee') || cleanQ.includes('guaranteed visa') ||
    (cleanQ.includes('visa') && (cleanQ.includes('guarantee') || cleanQ.includes('গ্যারান্টি') || cleanQ.includes('নিশ্চিত')))
  ) {
    return {
      category: 'qa',
      text: `No. Being 100% honest with you: NO agency, consultant, or platform on earth can guarantee a visa.

Visa decisions are made solely by embassy consular officers based on official immigration laws, your financial solvency, and interview performance.

Any consultancy claiming a '100% Guaranteed Visa' is making a fraudulent claim. Ethos AI does not guarantee visa approval, but we protect your money: your service fees remain safely locked in Milestone Escrow and are only released for verified progress. If the visa is rejected, unreleased milestone funds are refunded to you.`,
      textBn: `না। শতভাগ সততার সাথে বলতে গেলে: পৃথিবীর কোনো এজেন্সি, কনসালটেন্ট বা প্ল্যাটফর্ম ভিসার গ্যারান্টি দিতে পারে না।

ভিসা প্রদানের সিদ্ধান্ত সম্পূর্ণভাবে সংশ্লিষ্ট দেশের এম্বাসির ভিসা অফিসারদের এখতিয়ারাধীন। এটি আপনার যোগ্যতা, সঠিক ব্যাংক সলভেন্সি এবং ইন্টারভিউয়ের ওপর নির্ভর করে।

কোনো এজেন্সি যদি '১০০% ভিসা গ্যারান্টি' দাবি করে, তবে তা সম্পূর্ণ প্রতারণামূলক। Ethos AI ভিসার গ্যারান্টি দেয় না, বরং আপনার টাকার নিরাপত্তা দেয়: টাকা এসক্রোতে আটকে থাকে এবং ভিসা না হলে অপ্রদানকৃত অর্থ রিফান্ড করা হয়।`,
      actions: [
        {
          label: 'Scan Scam Claims',
          labelBn: 'বিজ্ঞাপন যাচাই করুন',
          href: '/ai-tools',
          icon: '🛡️',
          description: 'Scan marketing claims for fraud red flags.',
          descriptionBn: 'চটকদার বিজ্ঞাপনের ঝুঁকি পরীক্ষা করুন।',
        },
        {
          label: 'View Escrow Policy',
          labelBn: 'এসক্রো পলিসি দেখুন',
          href: '/dashboard/payments',
          icon: '🔒',
          description: 'See how escrow protects against visa rejection.',
          descriptionBn: 'ভিসা না হলে এসক্রো কীভাবে টাকা বাঁচায়।',
        },
      ],
      suggestions: [
        { en: 'Can I get a refund if visa is rejected?', bn: 'ভিসা না হলে কি টাকা ফেরত পাব?' },
        { en: 'How do I compare consultancy fees?', bn: 'এজেন্সিদের ফি কীভাবে তুলনা করব?' },
      ],
    };
  }

  // Question 7: "Does Ethos AI guarantee admission or scholarship?"
  if (
    cleanQ.includes('guarantee admission') || cleanQ.includes('guaranteed admission') || cleanQ.includes('guarantee scholarship') ||
    (cleanQ.includes('admission') && cleanQ.includes('guarantee')) ||
    (cleanQ.includes('scholarship') && (cleanQ.includes('guarantee') || cleanQ.includes('নিশ্চিত')))
  ) {
    return {
      category: 'qa',
      text: `No. Admission and scholarships are decided exclusively by the university admissions committee based on your academic transcript, SOP, and test scores.

There are no secret backdoors or agency quotas. What Ethos AI provides is honest evaluation: our AI Counselor analyzes your profile to recommend realistic Dream, Target, and Safe institutions so you apply where your odds are strongest without wasting application fees.`,
      textBn: `না। ভর্তি বা স্কলারশিপ সম্পূর্ণভাবে বিশ্ববিদ্যালয়ের অ্যাডমিশন কমিটির ওপর নির্ভর করে—যা আপনার সিজিপিএ, আইইএলটিএস, এসওপি এবং প্রোফাইলের ওপর ভিত্তি করে নির্ধারিত হয়।

কোনো এজেন্সির কোনো গোপন কোটা থাকে না। Ethos AI আপনাকে নিরপেক্ষ তথ্য দেয়: আমাদের এআই কাউন্সেলর আপনার প্রোফাইল বিশ্লেষণ করে বাস্তবসম্মত ড্রিম, টার্গেট ও সেফ বিশ্ববিদ্যালয় সাজেস্ট করে যাতে আপনার আবেদনের ফি নষ্ট না হয়।`,
      actions: [
        {
          label: 'Evaluate Admission Odds',
          labelBn: 'ভর্তির সম্ভাবনা যাচাই করুন',
          href: '/counselor',
          icon: '🎓',
          description: 'Calculate realistic university recommendations.',
          descriptionBn: 'বাস্তবসম্মত বিশ্ববিদ্যালয়ের তালিকা দেখুন।',
        },
        {
          label: 'Browse Verified Agencies',
          labelBn: 'এজেন্সি ডিরেক্টরি',
          href: '/directory',
          icon: '🏢',
          description: 'Find licensed agencies for application processing.',
          descriptionBn: 'আবেদনের জন্য বিশ্বস্ত এজেন্সি খুঁজুন।',
        },
      ],
      suggestions: [
        { en: 'What IELTS score is safe for university scholarships?', bn: 'স্কলারশিপের জন্য কত আইইএলটিএস স্কোর নিরাপদ?' },
        { en: 'Can an agency guarantee my visa?', bn: 'এজেন্সি কি ভিসার গ্যারান্টি দিতে পারে?' },
      ],
    };
  }

  // Question 8: "What if I pay an agency in cash or outside Ethos AI?"
  if (
    (cleanQ.includes('outside') || cleanQ.includes('in cash') || cleanQ.includes('direct pay') || cleanQ.includes('bkash') || cleanQ.includes('বাইরে') || cleanQ.includes('ক্যাশ')) &&
    (cleanQ.includes('pay') || cleanQ.includes('money') || cleanQ.includes('টাকা'))
  ) {
    return {
      category: 'qa',
      text: `If you pay an agency directly in cash, personal bKash/Nagad, or bank transfer outside Ethos AI, we cannot protect or refund your money.

Our Milestone Escrow, dispute arbitration, and refund guarantees only function when funds are deposited through the platform. Never make unrecorded cash payments to an agency.`,
      textBn: `আপনি যদি Ethos AI প্ল্যাটফর্মের বাইরে কোনো এজেন্সিকে সরাসরি ক্যাশ, ব্যক্তিগত বিকাশ বা সরাসরি ব্যাংক অ্যাকাউন্টে টাকা দেন, তবে সেই টাকার কোনো নিরাপত্তা বা রিফান্ড দেওয়ার সুযোগ আমাদের থাকবে না।

আমাদের মাইলস্টোন এসক্রো ও রিফান্ডের নিশ্চয়তা কেবল তখনই কার্যকর থাকে যখন টাকা প্ল্যাটফর্মের মাধ্যমে এসক্রোতে জমা হয়। কখনোই প্ল্যাটফর্মের বাইরে লেনদেন করবেন না।`,
      actions: [
        {
          label: 'Learn Escrow Protection',
          labelBn: 'এসক্রো সুরক্ষা জানুন',
          href: '/dashboard/payments',
          icon: '🔒',
          description: 'Understand how platform payments are secured.',
          descriptionBn: 'প্ল্যাটফর্মের মাধ্যমে পেমেন্ট সুরক্ষার নিয়ম।',
        },
      ],
      suggestions: [
        { en: 'Do I have to pay the agency upfront?', bn: 'শুরুতেই কি পুরো টাকা দিতে হবে?' },
        { en: 'Can I get a refund if visa is rejected?', bn: 'ভিসা না হলে কি টাকা ফেরত পাব?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. NATURAL GREETINGS ("hi", "hlw", "hello", "hey")
  // ─────────────────────────────────────────────────────────────────────────────
  const isGreeting = GREETING_PATTERNS.some(g => {
    return cleanQ === g || cleanQ.startsWith(`${g} `) || cleanQ.endsWith(` ${g}`) || cleanQ === `${g}!`;
  });

  if (isGreeting && cleanQ.length <= 25) {
    const greetingsEn = [
      `Hello! I am your Ethos study-abroad guide and navigator.\n\nWhether you are looking for a verified agency, comparing processing fees, or verifying an offer letter for authenticity, I am here to assist you.\n\nWhat stage of your application are you currently preparing for?`,
      `Welcome to Ethos AI. I am here to help you navigate your study abroad journey safely without unverified agency fees or document fraud.\n\nAre you planning to apply for a specific country (such as Canada, the USA, the UK, or Germany), or would you like to search verified agencies?`,
      `Hello! I am your personal Ethos guide. Feel free to ask about finding verified consultancies, using Milestone Escrow for secure payments, or evaluating your university admission chances.\n\nWhere would you like to begin?`
    ];

    const greetingsBn = [
      `হ্যালো! আমি আপনার Ethos AI উচ্চশিক্ষা সহায়ক ও ন্যাভিগেটর।\n\nবিশ্বস্ত লাইসেন্সপ্রাপ্ত এজেন্সি খোঁজা, ফি তুলনা করা কিংবা অফার লেটার ও চুক্তির শর্ত যাচাই করা—যেকোনো ধাপে আমি আপনাকে সঠিক দিকনির্দেশনা দেব।\n\nআপনি কি কোনো নির্দিষ্ট দেশে (যেমন: কানাডা, ইউকে, জার্মানি) আবেদন করতে চাচ্ছেন?`,
      `হ্যালো! Ethos AI প্ল্যাটফর্মে আপনাকে স্বাগতম। বিদেশে উচ্চশিক্ষায় শিক্ষার্থীদের আর্থিক নিরাপত্তা ও স্বচ্ছতা নিশ্চিত করতেই এই প্ল্যাটফর্ম।\n\nআপনি কি যাচাইকৃত এজেন্সির তালিকা দেখতে চান, নাকি আপনার সিজিপিএ অনুযায়ী বিশ্ববিদ্যালয়ের তালিকা বিশ্লেষণ করতে চান?`,
      `হ্যালো! আশা করি ভালো আছেন। বিদেশে পড়াশোনার পুরো প্রক্রিয়া নিরাপদ ও স্বচ্ছ করতে আমি আপনার পাশে আছি। আপনার যেকোনো প্রশ্ন বা জিজ্ঞাসা নির্দ্বিধায় জানান।`
    ];

    const idx = Math.floor(Math.random() * greetingsEn.length);

    return {
      category: 'greeting',
      text: greetingsEn[idx],
      textBn: greetingsBn[idx],
      actions: [
        { label: 'Browse Verified Agencies', labelBn: 'যাচাইকৃত এজেন্সি খুঁজুন', href: '/directory', icon: '🏢' },
        { label: 'AI Study Counselor', labelBn: 'এআই কাউন্সেলর দেখুন', href: '/counselor', icon: '🎓' },
        { label: 'How Escrow Protects Money', labelBn: 'এসক্রো সুরক্ষা জানুন', href: '/dashboard/payments', icon: '🔒' },
      ],
      suggestions: [
        { en: 'How does Ethos AI protect me from fake agencies?', bn: 'Ethos AI কীভাবে আমাকে ভুয়া এজেন্সি থেকে বাঁচায়?' },
        { en: 'Can parents see payment receipts in Bangla?', bn: 'অভিভাবকরা কি বাংলায় পেমেন্ট রসিদ দেখতে পারবেন?' },
        { en: 'Suggest universities for my CGPA and IELTS', bn: 'আমার সিজিপিএ ও আইইএলটিএস দিয়ে বিশ্ববিদ্যালয় খুঁজুন' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. EXPLAINER ("How this work", "How does this work", "what is ethos")
  // ─────────────────────────────────────────────────────────────────────────────
  const isHowItWorks = HOW_IT_WORKS_PATTERNS.some(p => cleanQ.includes(p));
  if (isHowItWorks) {
    return {
      category: 'explainer',
      text: `Ethos AI provides a structured, transparent framework to protect students from unfair upfront charges, hidden penalties, and forged documents:

1. Verified Consultancy Directory: Every agency's government license, visa track record, and genuine student reviews are audited before listing.
2. Milestone Escrow Protection: You do not pay 100% upfront. Payments are deposited into third-party escrow and only released when verified milestones (Offer Letter, Visa Approval) are achieved.
3. AI Fraud & Agreement Scanners: Upload offer letters to detect forged registrar credentials, and scan contracts for hidden cancellation penalty clauses.
4. Parent Portal: Parents can track application progress and verified payment receipts in simplified Bangla.

Which area would you like to explore first?`,
      textBn: `Ethos AI শিক্ষার্থীদের অপ্রয়োজনীয় অগ্রিম ফি, লুকানো জরিমানা এবং ভুয়া কাগজপত্র থেকে সুরক্ষিত রাখতে ৪টি মূল স্তম্ভের মাধ্যমে কাজ করে:

১. যাচাইকৃত এজেন্সি ডিরেক্টরি: প্রতিটি এজেন্সির সরকারি ট্রেড লাইসেন্স, পূর্ববর্তী ভিসার রেকর্ড এবং বাস্তব শিক্ষার্থীদের রিভিউ যাচাই করা থাকে।
২. মাইলস্টোন এসক্রো সুরক্ষা: সম্পূর্ণ ফি কখনো আগে পরিশোধ করতে হয় না। টাকা নিরাপদ এসক্রোতে থাকে এবং কাজের প্রতিটি পর্যায় সম্পন্ন হলে ধাপে ধাপে রিলিজ হয়।
৩. এআই ফ্রড ও চুক্তি বিশ্লেষক: অফার লেটার আপলোড করে জালিয়াতি পরীক্ষা করা যায় এবং এজেন্সির চুক্তির লুকানো শর্ত উন্মোচন করা যায়।
৪. প্যারেন্ট পোর্টাল: অভিভাবকরা কোনো জটিলতা ছাড়াই সহজ বাংলায় আবেদনের অগ্রগতি ও পেমেন্ট রসিদ দেখতে পান।

আপনি কোন বিষয়টি দিয়ে শুরু করতে চান?`,
      actions: [
        { label: 'Explore Verified Agencies', labelBn: 'এজেন্সি ডিরেক্টরি দেখুন', href: '/directory', icon: '🏢' },
        { label: 'Test AI Offer/Contract Scanner', labelBn: 'এআই ফ্রড টুলস টেস্ট করুন', href: '/ai-tools', icon: '🛡️' },
        { label: 'Learn Milestone Escrow', labelBn: 'এসক্রো পেমেন্ট পদ্ধতি', href: '/dashboard/payments', icon: '🔒' },
      ],
      suggestions: [
        { en: 'How do I compare two agencies side-by-side?', bn: 'দুইটি এজেন্সির ফি পাশাপাশি কীভাবে তুলনা করব?' },
        { en: 'Can I upload a contract to check for traps?', bn: 'আমি কি এজেন্সির চুক্তি আপলোড করে যাচাই করতে পারি?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. SCAM FEAR & EMPATHY
  // ─────────────────────────────────────────────────────────────────────────────
  const isScamFear = SCAM_FEAR_PATTERNS.some(p => cleanQ.includes(p));
  if (isScamFear) {
    return {
      category: 'empathy',
      text: `Your caution is completely reasonable. Upfront fee losses and forged promise letters remain a widespread problem in the study-abroad sector.

Here is how you can protect yourself step-by-step:

1. Never pay full processing fees upfront. Demand Milestone Escrow so your payment is only released upon verified milestones.
2. Scan consultancy contracts before signing. Upload agreements to our AI Agreement Analyzer to detect non-refundable traps.
3. Verify offer letters independently. Run any received PDF through our Offer Letter Scanner to verify official university domains.

Do you currently have an agency agreement or offer letter you would like to inspect?`,
      textBn: `আপনার সতর্কতা অত্যন্ত সময়োপযোগী। অগ্রিম ফি নিয়ে যোগাযোগ বন্ধ করা কিংবা ভুয়া অফার লেটার দেওয়ার ঘটনা প্রায়ই ঘটে থাকে।

নিজেকে সুরক্ষিত রাখতে নিচের ৩টি পদক্ষেপ অনুসরণ করুন:

১. কখনোই শুরুতে সম্পূর্ণ ফি একবারে দেবেন না। মাইলস্টোন এসক্রো নিশ্চিত করুন যাতে কাজের প্রমাণ ছাড়া টাকা না যায়।
২. চুক্তি স্বাক্ষরের আগেই পরীক্ষা করুন। আমাদের চুক্তি বিশ্লেষকে আপলোড করে দেখুন কোনো ক্ষতিকর শর্ত বা জরিমানা রয়েছে কি না।
৩. অফার লেটার স্বাধীনভাবে যাচাই করুন। কোনো পিডিএফ পেলে আমাদের অফার স্ক্যানারে দিয়ে বিশ্ববিদ্যালয়ের সত্যতা নিশ্চিত করুন।

আপনার কি কোনো চুক্তিপত্র বা অফার লেটার যাচাই করার প্রয়োজন রয়েছে?`,
      actions: [
        { label: 'Scan Contract / Agreement', labelBn: 'চুক্তি স্ক্যান করুন', href: '/ai-tools?tool=agreement', icon: '⚖️' },
        { label: 'Verify Offer Letter', labelBn: 'অফার লেটার যাচাই করুন', href: '/ai-tools?tool=offer', icon: '📄' },
        { label: 'How Escrow Protects You', labelBn: 'এসক্রো কীভাবে বাঁচায়', href: '/dashboard/payments', icon: '🔒' },
      ],
      suggestions: [
        { en: 'What are the red flags of a fraudulent consultancy?', bn: 'ভুয়া এজেন্সির প্রধান লক্ষণগুলো কী কী?' },
        { en: 'Find verified agencies with zero hidden fees', bn: 'লুকানো ফি ছাড়া বিশ্বস্ত এজেন্সি খুঁজুন' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. WHO ARE YOU / WHAT CAN YOU DO
  // ─────────────────────────────────────────────────────────────────────────────
  const isWhoAreYou = WHO_ARE_YOU_PATTERNS.some(p => cleanQ.includes(p));
  if (isWhoAreYou) {
    return {
      category: 'greeting',
      text: `I am your Ethos AI Study-Abroad Assistant. My goal is to help students and parents navigate the application journey safely and transparently.

Here are the key capabilities I provide:
1. Agency Discovery: Find verified, licensed consultancies filtered by country, budget, and visa success rate.
2. Comparison Matrix: Compare up to 3 agencies side-by-side to expose hidden charges and refund terms.
3. Fraud & Contract OCR: Scan university offer letters and consultancy agreements for fraudulent clauses.
4. Milestone Escrow: Guide you on depositing funds securely so money is only released after verified progress.
5. Admission Odds: Categorize university recommendations into Dream, Target, and Safe tiers based on your CGPA and test scores.`,
      textBn: `আমি আপনার Ethos AI উচ্চশিক্ষা সহায়ক। শিক্ষার্থী ও অভিভাবকদের আবেদন প্রক্রিয়া নিরাপদ ও স্বচ্ছ রাখাই আমার কাজ।

আমি যেসব বিষয়ে সহায়তা প্রদান করি:
১. এজেন্সি ডিরেক্টরি: দেশ, বাজেট এবং ভিসার সাফল্যের হার অনুযায়ী লাইসেন্সপ্রাপ্ত এজেন্সি খুঁজে দেওয়া।
২. তুলনা টুল: ৩টি এজেন্সির ফি এবং রিফান্ড পলিসি পাশাপাশি তুলনা করা।
৩. এআই ফ্রড স্ক্যানার: অফার লেটার ও এজেন্সির চুক্তির ক্ষতিকর শর্ত পরীক্ষা করা।
৪. মাইলস্টোন এসক্রো: কাজ নিশ্চিত না হওয়া পর্যন্ত টাকা সুরক্ষিত রাখার নির্দেশনা দেওয়া।
৫. কাউন্সেলর অ্যানালাইসিস: আপনার সিজিপিএ ও আইইএলটিএস অনুযায়ী ড্রিম, টার্গেট ও সেফ বিশ্ববিদ্যালয় বাছাই করা।`,
      actions: [
        { label: 'Browse Agencies', labelBn: 'এজেন্সি ডিরেক্টরি', href: '/directory', icon: '🏢' },
        { label: 'AI Fraud Tools', labelBn: 'এআই ফ্রড টুলস', href: '/ai-tools', icon: '🛡️' },
        { label: 'AI University Counselor', labelBn: 'বিশ্ববিদ্যালয় কাউন্সেলর', href: '/counselor', icon: '🎓' },
      ],
      suggestions: [
        { en: 'How do milestone payments work?', bn: 'মাইলস্টোন পেমেন্ট কীভাবে কাজ করে?' },
        { en: 'Help me evaluate my CGPA and IELTS', bn: 'আমার সিজিপিএ ও আইইএলটিএস যাচাই করুন' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. POLITE / GRATITUDE
  // ─────────────────────────────────────────────────────────────────────────────
  const isPolite = POLITE_PATTERNS.some(p => cleanQ === p || cleanQ.startsWith(`${p} `) || cleanQ.endsWith(` ${p}`));
  if (isPolite && cleanQ.length <= 30) {
    return {
      category: 'polite',
      text: `You are welcome. Feel free to open this helper at any time by clicking the bottom button or pressing Ctrl + /.\n\nTake your time to compare agencies and review contracts carefully before making payments.`,
      textBn: `আপনাকে ধন্যবাদ। যেকোনো সময় স্ক্রিনের নিচের বাটনে ক্লিক করে বা Ctrl + / চেপে এই সহায়ক ব্যবহার করতে পারেন।\n\nযেকোনো পেমেন্টের পূর্বে এজেন্সি নির্বাচন ও চুক্তিপত্র সতর্কতার সাথে যাচাই করে নিন।`,
      actions: [
        { label: 'Directory', labelBn: 'ডিরেক্টরি', href: '/directory', icon: '🏢' },
        { label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', href: '/dashboard', icon: '📊' },
      ],
      suggestions: [
        { en: 'I have another question about fees', bn: 'ফি সংক্রান্ত আরেকটি প্রশ্ন আছে' },
        { en: 'How do I link my parents to my account?', bn: 'বাবা-মাকে কীভাবে একাউন্টে যুক্ত করব?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. COUNTRY ADVICE (Canada, USA, Germany, UK, Australia)
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    cleanQ.includes('canada') ||
    cleanQ.includes('germany') ||
    cleanQ.includes('usa') ||
    cleanQ.includes('united states') ||
    cleanQ.includes('uk') ||
    cleanQ.includes('united kingdom') ||
    cleanQ.includes('australia') ||
    cleanQ.includes('malaysia') ||
    cleanQ.includes('japan') ||
    cleanQ.includes('কানাডা') ||
    cleanQ.includes('জার্মানি') ||
    cleanQ.includes('আমেরিকা') ||
    cleanQ.includes('ইউকে') ||
    cleanQ.includes('অস্ট্রেলিয়া')
  ) {
    let countryName = 'abroad';
    let countryBn = 'বিদেশে';
    if (cleanQ.includes('canada') || cleanQ.includes('কানাডা')) { countryName = 'Canada'; countryBn = 'কানাডা'; }
    else if (cleanQ.includes('germany') || cleanQ.includes('জার্মানি')) { countryName = 'Germany'; countryBn = 'জার্মানি'; }
    else if (cleanQ.includes('usa') || cleanQ.includes('আমেরিকা')) { countryName = 'the USA'; countryBn = 'আমেরিকা'; }
    else if (cleanQ.includes('uk') || cleanQ.includes('ইউকে')) { countryName = 'the UK'; countryBn = 'যুক্তরাজ্য'; }
    else if (cleanQ.includes('australia') || cleanQ.includes('অস্ট্রেলিয়া')) { countryName = 'Australia'; countryBn = 'অস্ট্রেলিয়া'; }

    return {
      category: 'country',
      text: `Key requirements for applying to ${countryName}:

1. Visa Solvency: Embassy proof-of-funds must meet current official thresholds.
2. Agency Scope: Confirm whether the agency fee includes university application submission, SOP guidance, and visa file handling.
3. Escrow Milestones: Ensure payments are tied to verified milestones such as Acceptance Letter and Visa Decision.

Would you like to browse verified agencies handling ${countryName}, or evaluate university admission chances first?`,
      textBn: `${countryBn}-র জন্য আবেদনের মূল বিষয়সমূহ:

১. ব্যাংক সলভেন্সি: সংশ্লিষ্ট এম্বাসির নির্ধারিত নিয়ম অনুযায়ী নির্দিষ্ট মেয়াদের ফান্ড নিশ্চিত রাখা।
২. সার্ভিস পরিধি: এজেন্সির ফি-তে আবেদন দাখিল, এসওপি সহায়তা ও ভিসা ফাইল প্রসেসিং অন্তর্ভুক্ত কি না তা জানা।
৩. এসক্রো মাইলস্টোন: পেমেন্ট যাতে অফার লেটার ও ভিসা ফলাফলের মতো সুনির্দিষ্ট ধাপে বিভক্ত থাকে।

আপনি কি ${countryBn}-র জন্য যাচাইকৃত এজেন্সি দেখতে চান, নাকি আপনার সিজিপিএ দিয়ে বিশ্ববিদ্যালয়ের সম্ভাবনা যাচাই করতে চান?`,
      actions: [
        {
          label: `Browse ${countryName} Agencies`,
          labelBn: `${countryBn} এজেন্সি ব্রাউজ করুন`,
          href: '/directory',
          icon: '🏢',
          description: `Find top consultancies with proven visa success for ${countryName}.`,
          descriptionBn: `${countryBn}-র সফল ভিসা রেকর্ডযুক্ত এজেন্সি খুঁজুন।`,
        },
        {
          label: 'Evaluate Admission Odds',
          labelBn: 'ভর্তির সম্ভাবনা যাচাই করুন',
          href: '/counselor',
          icon: '🎓',
          description: `Check Dream/Target/Safe universities for ${countryName}.`,
          descriptionBn: `${countryBn}-র বিশ্ববিদ্যালয়ের তালিকা ও রিকয়ারমেন্ট দেখুন।`,
        },
      ],
      suggestions: [
        { en: `What IELTS score is typically required for ${countryName}?`, bn: `${countryBn}-র জন্য সাধারণত কত আইইএলটিএস লাগে?` },
        { en: `Compare fees of agencies handling ${countryName}`, bn: `${countryBn}-র এজেন্সিদের ফি তুলনা করুন` },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. ESCROW & PAYMENTS INTENT
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    q.includes('escrow') ||
    q.includes('payment') ||
    q.includes('pay') ||
    q.includes('money') ||
    q.includes('milestone') ||
    q.includes('refund') ||
    q.includes('ledger') ||
    (q.includes('fee') && (q.includes('pay') || q.includes('safe') || q.includes('release'))) ||
    q.includes('টাকা') ||
    q.includes('পেমেন্ট') ||
    q.includes('এসক্রো') ||
    q.includes('রিফান্ড') ||
    q.includes('মাইলস্টোন')
  ) {
    return {
      category: 'escrow',
      text: `Ethos AI uses Milestone Escrow Protection so students never pay 100% upfront to an agency:

1. Fund Locking: Student funds are held in a secure third-party escrow account.
2. Verified Release: Money is only released when specific verified milestones (e.g. Official University Acceptance, Visa Granted) are confirmed.
3. Refund Security: If an agency breaches contract or fails to deliver, remaining funds are returned to the student.`,
      textBn: `Ethos AI মাইলস্টোন এসক্রো সুরক্ষার মাধ্যমে শিক্ষার্থীদের আর্থিক নিরাপত্তা নিশ্চিত করে:

১. নিরাপদ এসক্রো ডিপোজিট: টাকা এজেন্সির হাতে সরাসরি না দিয়ে তৃতীয় পক্ষের নিরাপদ এসক্রোতে রাখা হয়।
২. শর্তসাপেক্ষ রিলিজ: প্রতিটি কাজের ধাপ (অফার লেটার প্রাপ্তি, ভিসা অনুমোদন) আনুষ্ঠানিকভাবে নিশ্চিত হলেই টাকা রিলিজ হয়।
৩. রিফান্ড নিশ্চয়তা: এজেন্সি চুক্তি ভঙ্গ করলে বা ব্যর্থ হলে অবশিষ্ট অর্থ শিক্ষার্থীর কাছে ফেরত যায়।`,
      actions: [
        {
          label: 'Open Escrow Payments',
          labelBn: 'এসক্রো পেমেন্ট দেখুন',
          href: '/dashboard/payments',
          icon: '🔒',
          description: 'View active escrow milestones, deposit funds, or download digital receipts.',
          descriptionBn: 'চলমান এসক্রো মাইলস্টোন দেখুন, টাকা জমা দিন বা রসিদ ডাউনলোড করুন।',
        },
        {
          label: 'Compare Agency Fees',
          labelBn: 'এজেন্সির ফি তুলনা',
          href: '/compare',
          icon: '⚖️',
          description: 'Check which agencies accept Ethos Escrow and have zero hidden fees.',
          descriptionBn: 'কোন কোন এজেন্সি এসক্রো সাপোর্ট করে এবং লুকানো ফি নেই তা তুলনা করুন।',
        },
      ],
      suggestions: [
        { en: 'Can parents see payment receipts in Bangla?', bn: 'অভিভাবকরা কি বাংলায় পেমেন্ট রসিদ দেখতে পারবেন?' },
        { en: 'Can I get a refund if visa is rejected?', bn: 'ভিসা না হলে কি টাকা ফেরত পাব?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. AI FRAUD TOOLS & CONTRACT ANALYZER
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    q.includes('fake') ||
    q.includes('fraud') ||
    q.includes('scam') ||
    q.includes('offer letter') ||
    q.includes('forger') ||
    q.includes('agreement') ||
    q.includes('contract') ||
    q.includes('clause') ||
    q.includes('penalty') ||
    q.includes('detect') ||
    q.includes('ভুয়া') ||
    q.includes('জাল') ||
    q.includes('অফার লেটার') ||
    q.includes('চুক্তি') ||
    q.includes('স্ক্যাম')
  ) {
    return {
      category: 'ai-tools',
      text: `Ethos AI provides AI-powered document verification tools:

1. Offer Letter Scanner: Validates university letterhead, sender email domains, accreditation credentials, and registrar signatures against official directories.
2. Smart Agreement Analyzer: Parses consultancy contracts to detect predatory clauses, excessive cancellation penalties, or non-refundable traps.
3. Scam Alert Classifier: Flags deceptive marketing claims such as guaranteed visas without language test requirements.`,
      textBn: `Ethos AI-তে রয়েছে এআই ভিত্তিক নথি যাচাইকরণ ব্যবস্থা:

১. অফার লেটার স্ক্যানার: বিশ্ববিদ্যালয়ের প্রাতিষ্ঠানিক প্যাড, অফিসিয়াল ইমেইল ডোমেন ও রেজিস্ট্রি স্বাক্ষর যাচাই করে।
২. স্মার্ট চুক্তি বিশ্লেষক: এজেন্সির চুক্তির সূক্ষ্ম শর্ত বিশ্লেষণ করে অন্যায্য জরিমানা ও রিফান্ডহীন ধারা চিহ্নিত করে।
৩. স্ক্যাম অ্যালার্ট ক্লাসিফায়ার: আইইএলটিএস ছাড়া ভিসার ভুয়া প্রতিশ্রুতির মতো চটকদার বিজ্ঞাপনের ঝুঁকি বিশ্লেষণ করে।`,
      actions: [
        {
          label: 'Open AI Fraud Tools',
          labelBn: 'এআই ফ্রড টুলস খুলুন',
          href: '/ai-tools',
          icon: '🛡️',
          description: 'Upload your offer letter PDF or paste consultancy agreement text to inspect risk score.',
          descriptionBn: 'আপনার অফার লেটার বা চুক্তির টেক্সট আপলোড করে তাৎক্ষণিক রিস্ক স্কোর দেখুন।',
        },
        {
          label: 'Scan Offer Letter directly',
          labelBn: 'অফার লেটার স্ক্যান করুন',
          href: '/ai-tools?tool=offer',
          icon: '📄',
          description: 'Check for fake seals and tampered university credentials.',
          descriptionBn: 'জাল সিল ও বিশ্ববিদ্যালয়ের সত্যতা যাচাই করুন।',
        },
      ],
      suggestions: [
        { en: 'What is a dangerous clause in a consultancy contract?', bn: 'এজেন্সির চুক্তিতে কোন কোন শর্ত বিপজ্জনক হতে পারে?' },
        { en: 'Can I test an offer letter from Canada or USA?', bn: 'কানাডা বা ইউএসএ-র অফার লেটার কীভাবে পরীক্ষা করব?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. COMPARE AGENCIES
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    q.includes('compare') ||
    q.includes('versus') ||
    q.includes('vs') ||
    q.includes('difference') ||
    q.includes('side by side') ||
    q.includes('hidden charge') ||
    q.includes('hidden fee') ||
    q.includes('তুলনা') ||
    q.includes('পার্থক্য') ||
    q.includes('কোনটি ভালো')
  ) {
    return {
      category: 'compare',
      text: `The Agency Comparison Tool allows you to evaluate up to 3 consultancies side-by-side:

1. Total Cost Transparency: Compare initial application charges, documentation fees, and post-visa fees.
2. Refund Policies: Check the specific refund guarantees offered by each consultancy.
3. Escrow Adoption: Verify whether the agency accepts Milestone Escrow.
4. Historical Metrics: Review verified visa success rates and student feedback ratings.`,
      textBn: `এজেন্সি তুলনা টুল দিয়ে পাশাপাশি ৩টি এজেন্সির তথ্য যাচাই করা যায়:

১. স্বচ্ছ ফি তালিকা: আবেদন ফি, ডকুমেন্টেশন ফি এবং ভিসা পরবর্তী মোট খরচের তুলনা।
২. রিফান্ড পলিসি: প্রতিটি এজেন্সির লিখিত রিফান্ড শর্তাবলী পর্যালোচনা।
৩. এসক্রো গ্রহণযোগ্যতা: এজেন্সিটি মাইলস্টোন এসক্রো সমর্থন করে কি না তা জানা।
৪. ট্র্যাক রেকর্ড: পূর্ববর্তী ভিসার সাফল্যের হার এবং শিক্ষার্থীদের বাস্তব রেটিং।`,
      actions: [
        {
          label: 'Go to Agency Compare',
          labelBn: 'এজেন্সি তুলনা টুলে যান',
          href: '/compare',
          icon: '⚖️',
          description: 'Select agencies to compare side-by-side and expose hidden terms.',
          descriptionBn: 'এজেন্সি নির্বাচন করে পাশাপাশি তুলনা করুন এবং লুকানো শর্ত উন্মোচন করুন।',
        },
        {
          label: 'Browse Directory first',
          labelBn: 'আগে ডিরেক্টরি দেখুন',
          href: '/directory',
          icon: '🏢',
          description: 'Find candidate agencies to compare.',
          descriptionBn: 'তুলনা করার জন্য ডিরেক্টরি থেকে এজেন্সি বাছাই করুন।',
        },
      ],
      suggestions: [
        { en: 'Which agencies have the lowest upfront fee?', bn: 'কোন এজেন্সির শুরুতে সবচেয়ে কম ফি লাগে?' },
        { en: 'How to check if an agency has a valid license?', bn: 'এজেন্সির সরকারি লাইসেন্স আছে কি না কীভাবে বুঝব?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. DIRECTORY & FINDING AGENCIES
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    q.includes('directory') ||
    q.includes('agency') ||
    q.includes('agencies') ||
    q.includes('consultant') ||
    q.includes('consultancy') ||
    q.includes('find') ||
    q.includes('search') ||
    q.includes('এজেন্সি') ||
    q.includes('ডিরেক্টরি') ||
    q.includes('খুঁজ') ||
    q.includes('পরামর্শক') ||
    q.includes('লিস্ট')
  ) {
    return {
      category: 'directory',
      text: `The Verified Consultancy Directory lists audited agencies with transparent terms:

1. Multi-factor Filtering: Filter by destination country (USA, UK, Canada, Australia, Germany, Malaysia), budget bracket, and success rate.
2. Verification Status: Each agency displays government trade license verification and audit scores.
3. Verified Reviews: Feedback from students who completed applications through Ethos AI.`,
      textBn: `যাচাইকৃত এজেন্সি ডিরেক্টরিতে সরকার অনুমোদিত ও পরীক্ষিত এজেন্সির তালিকা রয়েছে:

১. সুনির্দিষ্ট ফিল্টারিং: দেশ (যুক্তরাষ্ট্র, যুক্তরাজ্য, কানাডা, অস্ট্রেলিয়া, জার্মানি, মালয়েশিয়া), বাজেট এবং সাফল্যের হার অনুযায়ী বাছাই।
২. বৈধতা যাচাই: সরকারি ট্রেড লাইসেন্স ও অভ্যন্তরীণ অডিট স্কোর প্রদর্শন।
৩. সত্য পরীক্ষিত রিভিউ: প্ল্যাটফর্মের মাধ্যমে আবেদন সম্পন্নকারী শিক্ষার্থীদের বাস্তব মতামত।`,
      actions: [
        {
          label: 'Browse Agency Directory',
          labelBn: 'এজেন্সি ডিরেক্টরি দেখুন',
          href: '/directory',
          icon: '🏢',
          description: 'Explore all verified consultancies with verified ratings and transparent pricing.',
          descriptionBn: 'স্বচ্ছ ফি ও রিভিউসহ সব বিশ্বস্ত এজেন্সি ব্রাউজ করুন।',
        },
        {
          label: 'Compare Selected Agencies',
          labelBn: 'এজেন্সি তুলনা করুন',
          href: '/compare',
          icon: '⚖️',
          description: 'Compare service charges and refund terms.',
          descriptionBn: 'সার্ভিস চার্জ ও রিফান্ডের শর্ত তুলনা করুন।',
        },
      ],
      suggestions: [
        { en: 'Show me verified agencies with high visa success', bn: 'উচ্চ ভিসা সাফল্যের বিশ্বস্ত এজেন্সি কোনগুলো?' },
        { en: 'Can I apply directly without paying an agency full advance?', bn: 'অগ্রিম পুরো টাকা না দিয়ে আবেদন করার নিয়ম কী?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. AI STUDY COUNSELOR
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    q.includes('counselor') ||
    q.includes('recommend') ||
    q.includes('university') ||
    q.includes('college') ||
    q.includes('cgpa') ||
    q.includes('ielts') ||
    q.includes('toefl') ||
    q.includes('gre') ||
    q.includes('scholarship') ||
    q.includes('dream') ||
    q.includes('target') ||
    q.includes('safe') ||
    q.includes('ভর্তি') ||
    q.includes('কাউন্সেলর') ||
    q.includes('বিশ্ববিদ্যালয়') ||
    q.includes('সিজিপিএ') ||
    q.includes('আইইএলটিএস') ||
    q.includes('স্কলারশিপ')
  ) {
    return {
      category: 'counselor',
      text: `The AI Study-Abroad Counselor evaluates your academic profile (CGPA, IELTS/Duolingo scores, study level, and budget) to provide a structured admission breakdown:

1. Dream Universities: Reach institutions with higher admission selectivity and prestigious academic standing.
2. Target Universities: Realistic institutions closely aligned with your academic credentials and budget.
3. Safe Universities: High-probability institutions ensuring secure admission opportunities.

The tool also features a Visa Solvency Calculator to verify embassy fund requirements for your destination.`,
      textBn: `এআই স্টাডি-অ্যাবব্রড কাউন্সেলর আপনার একাডেমিক তথ্য (সিজিপিএ, আইইএলটিএস স্কোর, ডিগ্রির স্তর এবং বাজেট) বিশ্লেষণ করে সুনির্দিষ্ট ক্যাটাগরি তৈরি করে:

১. ড্রিম ইউনিভার্সিটি (Dream): উচ্চমানের শীর্ষস্থানীয় প্রতিষ্ঠান যেখানে ভর্তির প্রতিযোগিতা বেশি।
২. টার্গেট ইউনিভার্সিটি (Target): আপনার সিজিপিএ ও বাজেটের সাথে মানানসই বাস্তবসম্মত প্রতিষ্ঠান।
৩. সেফ ইউনিভার্সিটি (Safe): যেখানে আপনার ভর্তির সম্ভাবনা অত্যন্ত দৃঢ়।

এছাড়াও এতে সংশ্লিষ্ট এম্বাসির নিয়ম অনুযায়ী প্রয়োজনীয় ব্যাংক সলভেন্সি হিসাব করার ক্যালকুলেটর সংযুক্ত রয়েছে।`,
      actions: [
        {
          label: 'Launch AI Counselor',
          labelBn: 'এআই কাউন্সেলর শুরু করুন',
          href: '/counselor',
          icon: '🎓',
          description: 'Evaluate admission odds and discover universities tailored to your profile.',
          descriptionBn: 'আপনার প্রোফাইল অনুযায়ী উপযুক্ত বিশ্ববিদ্যালয় ও ভিসার সম্ভাবনা যাচাই করুন।',
        },
      ],
      suggestions: [
        { en: 'What IELTS score is safe for university scholarships?', bn: 'স্কলারশিপের জন্য কত আইইএলটিএস স্কোর নিরাপদ?' },
        { en: 'How much bank solvency do I need for embassy proof?', bn: 'এম্বাসির জন্য কত ব্যাংক সলভেন্সি দেখাতে হয়?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. PARENT / GUARDIAN HUB
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    q.includes('parent') ||
    q.includes('guardian') ||
    q.includes('father') ||
    q.includes('mother') ||
    q.includes('link') ||
    q.includes('family') ||
    q.includes('অভিভাবক') ||
    q.includes('বাবা') ||
    q.includes('মা') ||
    q.includes('গার্ডিয়ান')
  ) {
    return {
      category: 'guardian',
      text: `Ethos AI provides guardian integration for parents and students:

1. Link Code Generation: Students copy their unique code (e.g. ETHOS-STU-8821) from their Profile.
2. Parent Synchronization: Parents sign in and enter the code to link directly to the student's file.
3. Stage Visibility: Parents view simplified admission stage progression and escrow transaction receipts in Bangla without administrative complexity.`,
      textBn: `Ethos AI শিক্ষার্থী ও অভিভাবকদের যৌথভাবে সংযুক্ত রাখার ব্যবস্থা করে:

১. লিংক কোড সংগ্রহ: শিক্ষার্থী তার প্রোফাইল পেজ থেকে একটি ইউনিক কোড (যেমন: ETHOS-STU-8821) কপি করবে।
২. অভিভাবক সংযোগ: অভিভাবক লগইন করে সেই কোডটি প্রবেশ করালে একাউন্টটি সংযুক্ত হয়ে যাবে।
৩. সহজ পর্যবেক্ষণ: অভিভাবকরা আবেদনের প্রতিটি ধাপ ও পেমেন্ট রসিদ সহজ বাংলায় দেখতে পাবেন।`,
      actions: [
        {
          label: 'View Guardian Link Code',
          labelBn: 'গার্ডিয়ান লিংক কোড দেখুন',
          href: '/profile',
          icon: '👨‍👩‍👧',
          description: 'Copy your student linking code for your parents to connect.',
          descriptionBn: 'বাবা-মার সাথে কানেক্ট করতে আপনার লিংক কোড কপি করুন।',
        },
        {
          label: 'Go to Dashboard',
          labelBn: 'ড্যাশবোর্ডে যান',
          href: '/dashboard',
          icon: '📊',
          description: 'View synced application stages.',
          descriptionBn: 'আবেদনের সকল ধাপ পর্যবেক্ষণ করুন।',
        },
      ],
      suggestions: [
        { en: 'Can parents see payment receipts in Bangla?', bn: 'অভিভাবকরা কি বাংলায় পেমেন্ট রসিদ দেখতে পারবেন?' },
        { en: 'How do parents verify that money is held in escrow?', bn: 'টাকা যে এসক্রোতে সুরক্ষিত আছে তা অভিভাবক কীভাবে নিশ্চিত হবেন?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. TRACK APPLICATION / STAGE MACHINE
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    q.includes('track') ||
    q.includes('status') ||
    q.includes('stage') ||
    q.includes('progress') ||
    q.includes('application') ||
    q.includes('update') ||
    q.includes('ট্র্যাক') ||
    q.includes('স্ট্যাটাস') ||
    q.includes('অবস্থা') ||
    q.includes('ধাপ') ||
    q.includes('অগ্রগতি')
  ) {
    return {
      category: 'general',
      text: `Applications on Ethos AI follow a 6-stage lifecycle inside the Dashboard:

1. Submitted: Initial application and profile documents delivered.
2. Under Review: Agency auditing credentials and preparing university files.
3. Offer Received: University decision received and verified.
4. Payment Pending: Escrow milestone activation for tuition deposit or visa filing.
5. Visa Processing: Embassy appointment, biometric, and file submission.
6. Completed: Visa outcome finalized and pre-departure checklist enabled.`,
      textBn: `Ethos AI ড্যাশবোর্ডে আবেদনগুলো ৬টি সুনির্দিষ্ট ধাপে পরিচালিত হয়:

১. সাবমিটেড (Submitted): আবেদন ও প্রয়োজনীয় কাগজপত্র জমা প্রদান।
২. আন্ডার রিভিউ (Under Review): এজেন্সি ফাইল ও ডকুমেন্টস প্রস্তুতকরণ।
৩. অফার রিসিভড (Offer Received): বিশ্ববিদ্যালয় থেকে অফার লেটার প্রাপ্তি ও যাচাই।
৪. পেমেন্ট পেন্ডিং (Payment Pending): এসক্রো পেমেন্ট নিশ্চিতকরণ।
৫. ভিসা প্রসেসিং (Visa Processing): এম্বাসিতে ফাইল দাখিল ও বায়োমেট্রিক।
৬. কমপ্লিটেড (Completed): ভিসা নিষ্পত্তি ও চূড়ান্ত প্রস্তুতি।`,
      actions: [
        {
          label: 'Open Application Dashboard',
          labelBn: 'আবেদন ড্যাশবোর্ড দেখুন',
          href: '/dashboard',
          icon: '📊',
          description: 'Review your current active stage and next required documents.',
          descriptionBn: 'বর্তমান স্ট্যাটাস ও পরবর্তী প্রয়োজনীয় কাজ দেখুন।',
        },
      ],
      suggestions: [
        { en: 'What documents should I upload for university review?', bn: 'বিশ্ববিদ্যালয় পর্যালোচনার জন্য কী কী নথি আপলোড করতে হবে?' },
        { en: 'How long does visa processing take?', bn: 'ভিসা প্রসেসিং হতে কত সময় লাগতে পারে?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. ROLE SWITCHER & LOGIN / DEMO ACCOUNTS
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    q.includes('role') ||
    q.includes('login') ||
    q.includes('signin') ||
    q.includes('admin') ||
    q.includes('demo') ||
    q.includes('switch') ||
    q.includes('লগইন') ||
    q.includes('অ্যাডমিন') ||
    q.includes('রোল') ||
    q.includes('একাউন্ট')
  ) {
    return {
      category: 'roles',
      text: `The Ethos AI interactive demo supports 4 dedicated user roles:

1. Student: Search agencies, compare fee structures, submit documents, and manage milestone payments.
2. Parent: Track student application status and review payment receipts in simplified Bangla.
3. Agency: Manage student application queues, verify documents, and submit milestone completion claims.
4. Admin: Audit agency trade licenses, monitor fraud detection alerts, and manage escrow settlements.`,
      textBn: `Ethos AI প্ল্যাটফর্মে ৪টি স্বতন্ত্র রোল রয়েছে:

১. স্টুডেন্ট: এজেন্সি অনুসন্ধান, ফি তুলনা, ডকুমেন্ট আপলোড ও মাইলস্টোন পেমেন্ট পরিচালনা।
২. অভিভাবক: সন্তানের আবেদনের অবস্থা পর্যবেক্ষণ ও বাংলায় পেমেন্ট রসিদ দেখা।
৩. এজেন্সি: শিক্ষার্থীদের আবেদন পরিচালনা ও কাজের অগ্রগতির প্রমাণ দাখিল।
৪. অ্যাডমিন: এজেন্সির লাইসেন্স অডিট, জালিয়াতি সতর্কতা পর্যবেক্ষণ ও বিরোধ নিষ্পত্তি।`,
      actions: [
        {
          label: 'Go to Login & Role Switcher',
          labelBn: 'লগইন ও রোল সুইচার',
          href: '/login',
          icon: '🔑',
          description: 'Switch demo accounts instantly with a single click.',
          descriptionBn: 'এক ক্লিকে বিভিন্ন ডেমো রোলে সুইচ করে পরীক্ষা করুন।',
        },
      ],
      suggestions: [
        { en: 'Switch to Agency portal to see student queue', bn: 'এজেন্সি পোর্টাল কীভাবে দেখতে পারি?' },
        { en: 'How to test the Admin audit panel?', bn: 'অ্যাডমিন অডিট প্যানেল কীভাবে টেস্ট করব?' },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. INTELLIGENT STRUCTURED FALLBACK
  // ─────────────────────────────────────────────────────────────────────────────
  return {
    category: 'general',
    text: `How can I direct you on Ethos AI?

1. Find Verified Consultancies: Browse licensed agencies filtered by destination and success rate.
2. Compare Agency Fees: Review side-by-side processing charges, escrow adoption, and refund policies.
3. AI Document Fraud Tools: Verify university offer letters and analyze consultancy agreements for penalty clauses.
4. Milestone Escrow: Deposit payments safely so funds are only released after verified milestones.
5. University Admission Odds: Calculate Dream, Target, and Safe university categories using your CGPA and test scores.`,
    textBn: `আপনাকে কীভাবে দিকনির্দেশনা দিতে পারি?

১. বিশ্বস্ত এজেন্সি অনুসন্ধান: দেশ, বাজেট এবং পূর্ববর্তী সাফল্যের হার অনুযায়ী লাইসেন্সপ্রাপ্ত এজেন্সি খুঁজুন।
২. এজেন্সি ফি তুলনা: এজেন্সিদের সার্ভিস ফি ও রিফান্ড নীতি পাশাপাশি তুলনা করুন।
৩. এআই ডকুমেন্ট ফ্রড টুলস: অফার লেটার যাচাই এবং চুক্তির লুকানো শর্ত শনাক্ত করুন।
৪. মাইলস্টোন এসক্রো: কাজ সম্পন্ন না হওয়া পর্যন্ত পেমেন্ট সুরক্ষিত রাখার নিয়ম জানুন।
৫. বিশ্ববিদ্যালয় ভর্তি সম্ভাবনা: সিজিপিএ ও আইইএলটিএস দিয়ে উপযুক্ত বিশ্ববিদ্যালয়ের ক্যাটাগরি বিশ্লেষণ করুন।`,
    actions: [
      { label: 'Browse Agencies', labelBn: 'এজেন্সি খুঁজুন', href: '/directory', icon: '🏢' },
      { label: 'AI Fraud Tools', labelBn: 'এআই ফ্রড টুলস', href: '/ai-tools', icon: '🛡️' },
      { label: 'AI Counselor', labelBn: 'এআই কাউন্সেলর', href: '/counselor', icon: '🎓' },
      { label: 'Escrow Payments', labelBn: 'এসক্রো পেমেন্ট', href: '/dashboard/payments', icon: '🔒' },
    ],
    suggestions: [
      { en: 'Can parents see payment receipts in Bangla?', bn: 'অভিভাবকরা কি বাংলায় পেমেন্ট রসিদ দেখতে পারবেন?' },
      { en: 'Can I get a refund if visa is rejected?', bn: 'ভিসা না হলে কি টাকা ফেরত পাব?' },
      { en: 'Do I have to pay the agency upfront?', bn: 'শুরুতেই কি পুরো টাকা দিতে হবে?' },
    ],
  };
}
