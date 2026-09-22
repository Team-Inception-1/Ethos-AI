export interface AgencyDetail {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  reviews: number;
  success: number;
  fee: string;
  feeMin: number;
  feeMax: number;
  refund: string;
  refundDays: number;
  response: string;
  countries: string;
  countryCodes: string[];
  licenseNo: string;
  address: string;
  strengthsEn: string[];
  strengthsBn: string[];
}

export const ALL_AGENCIES: AgencyDetail[] = [
  {
    id: 'agt-001',
    name: 'Global Edu BD',
    verified: true,
    rating: 4.8,
    reviews: 234,
    success: 94,
    fee: '৳25K–৳80K',
    feeMin: 25000,
    feeMax: 80000,
    refund: 'Full refund within 30 days',
    refundDays: 30,
    response: '< 2 hours',
    countries: '🇨🇦 🇬🇧 🇦🇺',
    countryCodes: ['CAN', 'GBR', 'AUS'],
    licenseNo: 'TRAD/DNCC/041289/2022',
    address: 'House 42, Road 11, Banani, Dhaka-1213',
    strengthsEn: [
      'Highest overall verified student satisfaction score (4.8/5.0 across 234 reviews).',
      'Low initial fee threshold (৳25K starting) with mandatory Milestone Escrow protection.',
      'Full unconditional refund within 30 days if university admission is not secured.',
      'Rapid response time (< 2 hours) with certified counselors for Canada, UK, and Australia.',
    ],
    strengthsBn: [
      'শিক্ষার্থীদের সর্বোচ্চ সন্তুষ্টি স্কোর (২৩৪টি সফল আবেদনের ভিত্তিতে ৪.৮/৫.০)।',
      'সাশ্রয়ী ফি কাঠামো (৳২৫,০০০ থেকে শুরু) এবং বাধ্যতামূলক মাইলস্টোন এসক্রো সুরক্ষা।',
      'বিশ্ববিদ্যালয়ে অফার লেটার না পেলে ৩০ দিনের মধ্যে সম্পূর্ণ ১০০% ফি ফেরত পাওয়ার নিশ্চয়তা।',
      'দ্রুত রেসপন্স সময় (২ ঘণ্টার নিচে) এবং কানাডা, যুক্তরাজ্য ও অস্ট্রেলিয়ার সার্টিফাইড কাউন্সিলর।',
    ],
  },
  {
    id: 'agt-002',
    name: 'Dream Abroad Ltd',
    verified: true,
    rating: 4.6,
    reviews: 187,
    success: 89,
    fee: '৳30K–৳100K',
    feeMin: 30000,
    feeMax: 100000,
    refund: '50% refund within 14 days',
    refundDays: 14,
    response: '< 6 hours',
    countries: '🇺🇸 🇩🇪 🇳🇱',
    countryCodes: ['USA', 'DEU', 'NLD'],
    licenseNo: 'MOE-BD-2023-412',
    address: 'Level 6, Navana Tower, Gulshan-1, Dhaka-1212',
    strengthsEn: [
      'Specialized in US STEM programs and German public university admissions.',
      'Established since 2017 with 187 verified international student placements.',
      'Moderate entry fees with partial milestone refund coverage.',
      'Solid European network with dedicated counselor desks for Netherlands & Germany.',
    ],
    strengthsBn: [
      'ইউএস স্টেম (STEM) এবং জার্মান পাবলিক বিশ্ববিদ্যালয় ভর্তিতে বিশেষ পারদর্শিতা।',
      '২০১৭ সাল থেকে ১৮৭টি যাচাইকৃত আন্তর্জাতিক স্টুডেন্ট প্লেসমেন্ট রেকর্ড।',
      'আংশিক মাইলস্টোন রিফান্ড কভারেজ সহ সুনির্দিষ্ট ফি কাঠামো।',
      'জার্মানি ও নেদারল্যান্ডসের উচ্চশিক্ষার জন্য ডেডিকেটেড কাউন্সিলর সহায়তা।',
    ],
  },
  {
    id: 'agt-003',
    name: 'EduPath Global',
    verified: true,
    rating: 4.5,
    reviews: 103,
    success: 91,
    fee: '৳20K–৳70K',
    feeMin: 20000,
    feeMax: 70000,
    refund: 'Full refund within 30 days',
    refundDays: 30,
    response: '< 3 hours',
    countries: '🇨🇦 🇳🇿 🇸🇪',
    countryCodes: ['CAN', 'NZL', 'SWE'],
    licenseNo: 'MOE-BD-2024-105',
    address: 'Green Grandeur, Plot 58, Kamal Ataturk Ave, Banani, Dhaka',
    strengthsEn: [
      'Strong track record in Scandinavian (Sweden) and New Zealand admissions.',
      'Highly competitive entry fee (৳20K starting) with clear cost breakdown.',
      'Impressive 91% visa success rate backed by transparent documentation.',
      'Prompt counseling response within 3 hours with direct portal updates.',
    ],
    strengthsBn: [
      'স্ক্যান্ডিনেভিয়ান (সুইডেন) ও নিউজিল্যান্ডের বিশ্ববিদ্যালয়ে ভর্তিতে বিশেষ সাফল্য।',
      'অত্যন্ত সাশ্রয়ী প্রাথমিক ফি (৳২০,০০০ থেকে শুরু) ও স্বচ্ছ চার্জ কাঠামো।',
      'সঠিক ডকুমেন্টেশনের মাধ্যমে ৯১% ভিসা সাফল্যের চমৎকার রেকর্ড।',
      'গড়ে ৩ ঘণ্টার মধ্যে দ্রুত কাউন্সেলিং রেসপন্স ও পোর্টাল আপডেট।',
    ],
  },
  {
    id: 'agt-004',
    name: 'Skyline Consultancy',
    verified: false,
    rating: 3.2,
    reviews: 45,
    success: 62,
    fee: '৳15K–৳60K',
    feeMin: 15000,
    feeMax: 60000,
    refund: 'Disputed / No written refund policy',
    refundDays: 0,
    response: '> 24 hours',
    countries: '🇬🇧 🇮🇪',
    countryCodes: ['GBR', 'IRL'],
    licenseNo: 'MOE-BD-2025-991 (Audit Pending)',
    address: 'Motijheel C/A, Dhaka-1000',
    strengthsEn: [
      'Lowest nominal application fee in the market (৳15K starting).',
      'Focuses primarily on regional UK & Ireland partner institutions.',
      'Caution: Currently under verification audit due to delayed refund disputes.',
    ],
    strengthsBn: [
      'বাজারে নামমাত্র সবচেয়ে কম শুরুর ফি (৳১৫,০০০ থেকে)।',
      'প্রধানত যুক্তরাজ্য ও আয়ারল্যান্ডের রিজিওনাল প্রতিষ্ঠানে আবেদন সহায়তা।',
      'সতর্কতা: রিফান্ড সংক্রান্ত অভিযোগের কারণে এখনও পূর্ণ যাচাইকরণ সম্পন্ন হয়নি।',
    ],
  },
  {
    id: 'agt-005',
    name: 'StudyBridge BD',
    verified: true,
    rating: 4.7,
    reviews: 312,
    success: 96,
    fee: '৳35K–৳90K',
    feeMin: 35000,
    feeMax: 90000,
    refund: 'Full refund within 45 days',
    refundDays: 45,
    response: '< 1 hour',
    countries: '🇨🇦 🇦🇺 🇺🇸',
    countryCodes: ['CAN', 'AUS', 'USA'],
    licenseNo: 'MOE-BD-2022-301',
    address: 'Dhanmondi 27, Dhaka-1209',
    strengthsEn: [
      'Highest verified visa success rate across all evaluated agencies (96%).',
      'Safest refund window in the industry (45 days full refund if visa refused).',
      'Fastest counselor responsiveness (< 1 hour) with direct institution ties.',
      'Extensive placement history with 312 verified student testimonials.',
    ],
    strengthsBn: [
      'যাচাইকৃত সকল এজেন্সির মধ্যে সর্বোচ্চ ভিসা সফলতার হার (৯৬%)।',
      'শিল্পের সবচেয়ে নিরাপদ ৪৫ দিনের সম্পূর্ণ রিফান্ড গ্যারান্টি।',
      'দ্রুততম রেসপন্স সময় (১ ঘণ্টার নিচে) ও শীর্ষ বিশ্ববিদ্যালয়ে সরাসরি সংযোগ।',
      '৩১২টিরও বেশি সফল শিক্ষার্থী প্লেসমেন্ট ও প্রশংসাপত্র।',
    ],
  },
  {
    id: 'agt-006',
    name: 'AbroadX Partners',
    verified: true,
    rating: 4.3,
    reviews: 78,
    success: 85,
    fee: '৳22K–৳65K',
    feeMin: 22000,
    feeMax: 65000,
    refund: '70% refund within 21 days',
    refundDays: 21,
    response: '< 4 hours',
    countries: '🇩🇪 🇸🇪 🇫🇮',
    countryCodes: ['DEU', 'SWE', 'FIN'],
    licenseNo: 'MOE-BD-2023-774',
    address: 'Uttara Sector 3, Dhaka-1230',
    strengthsEn: [
      'Specialized in tuition-free European and scholarship programs (Germany, Finland).',
      'Budget-friendly consultation packages starting from ৳22K.',
      '85% visa grant rate with comprehensive blocked account support.',
      'Dedicated counseling for post-graduation work rights and residence.',
    ],
    strengthsBn: [
      'টিউশন-ফি ছাড়া ইউরোপীয় ও স্কলারশিপ প্রোগ্রামে (জার্মানি, ফিনল্যান্ড) বিশেষজ্ঞ।',
      '৳২২,০০০ থেকে শুরু হওয়া বাজেট-বান্ধব কনসালটেশন প্যাকেজ।',
      'ব্লকড অ্যাকাউন্ট সহায়তা সহ ৮৫% ভিসা প্রাপ্তির হার।',
      'গ্র্যাজুয়েশন পরবর্তী জব ও ভিসা সংক্রান্ত পরামর্শ সহায়তা।',
    ],
  },
];

export const DEFAULT_COMPARE_IDS = ['agt-001', 'agt-002', 'agt-005'];

export function getAgencyById(id: string): AgencyDetail | undefined {
  return ALL_AGENCIES.find(a => a.id === id);
}

export function getAgenciesByIds(ids: string[]): AgencyDetail[] {
  if (!ids || ids.length === 0) {
    return DEFAULT_COMPARE_IDS.map(id => getAgencyById(id)!).filter(Boolean);
  }
  const matched = ids.map(id => getAgencyById(id.trim())!).filter(Boolean);
  return matched.length > 0 ? matched : DEFAULT_COMPARE_IDS.map(id => getAgencyById(id)!).filter(Boolean);
}
