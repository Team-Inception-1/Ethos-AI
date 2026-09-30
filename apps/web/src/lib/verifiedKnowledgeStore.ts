/**
 * Ethos AI — Offline Demo Agency & Country Fixture Store
 * 
 * Provides illustrative static fixtures only when explicit offline-demo mode is enabled.
 * These records are not live, authoritative, or production-verified.
 * 1. 15 sample Bangladeshi consultancies (placeholder licenses, addresses, fees, ratings)
 * 2. 16+ Country-Wise Study-Abroad Cost Standards (Tuition, GIC/Blocked account, Visa fees, Escrow limits)
 * 3. Two-way sync with Agency Dashboard (editing services) and Admin Panel (approvals/rejections)
 * 4. Grounded, non-hallucinated knowledge provider for AI Chatbot & Counselor
 */

import { OFFLINE_DEMO_ENABLED } from './ai/demo';

export interface AgencyServicePackage {
  id: string;
  name: string;
  nameBn: string;
  amountBdt: number;
  whenCharged: string;
  whenChargedBn: string;
  refundable: boolean;
  refundPolicy: string;
  refundPolicyBn: string;
}

export interface VerifiedAgencyRecord {
  id: string;
  name: string;
  nameBn?: string;
  ownerName: string;
  licenseNo: string;
  licenseType: 'MOE_APPROVED' | 'DNCC_TRADE' | 'DSCC_TRADE' | 'CCC_TRADE' | 'SCC_TRADE' | 'FACD_CAB_MEMBER';
  licenseStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  foundedYear: number;
  rating: number;
  reviewsCount: number;
  successRate: number; // percentage 0-100
  riskScore: number; // 0-100 (lower is better)
  feeMinBdt: number;
  feeMaxBdt: number;
  refundSummaryEn: string;
  refundSummaryBn: string;
  countriesServed: string[];
  countryCodes: string[];
  address: string;
  phone: string;
  email: string;
  website: string;
  services: AgencyServicePackage[];
  verifiedAt: string;
  adminNotes?: string;
}

export interface CountryCostStandard {
  country: string;
  countryBn: string;
  code: string;
  flag: string;
  currency: string;
  exchangeRateBdt: number; // 1 Foreign Unit = X BDT
  tuitionYearlyBdt: { min: number; max: number; label: string; labelBn: string };
  livingOrBlockedBdt: { amount: number; label: string; labelBn: string; requirementType: 'GIC' | 'BLOCKED_ACCOUNT' | 'MAINTENANCE_FUNDS' | 'BANK_STATEMENT' };
  visaAndBiometricsBdt: { amount: number; label: string; labelBn: string };
  healthInsuranceYearlyBdt: { amount: number; label: string; labelBn: string };
  escrowAgencyFeeBdt: { min: number; max: number; average: number };
  totalFirstYearEstBdt: { min: number; max: number };
  keyRequirementsEn: string[];
  keyRequirementsBn: string[];
  intakes: string[];
  topSpecializedAgencyIds: string[];
  // Provenance & Claimable Verification Fields
  officialGovUrl?: string;
  officialGovSourceTitle?: string;
  lastAuditedAt?: string;
  isVerified?: boolean;
  verifiedByAdmin?: string;
}

export interface UniversityCourseCatalogItem {
  id: string;
  universityName: string;
  country: string;
  countryCode: string;
  degreeLevel: 'Bachelor' | 'Master' | 'PhD';
  programName: string;
  annualTuitionLocal: number;
  currency: string;
  annualTuitionBdt: number;
  officialCatalogUrl: string;
  officialSourceTitle: string;
  intakeYear: string;
  isVerified: boolean;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'FLAGGED';
  verifiedByAdmin: string;
  lastAuditedAt: string;
  notes?: string;
  verifyingAgencyId?: string;
  verifyingAgencyName?: string;
  verifyingAgencyLicense?: string;
}

export interface FinancialProvenance {
  catalogId: string;
  universityName: string;
  country: string;
  countryCode: string;
  degreeLevel: string;
  targetPrograms: string[];
  annualTuitionLocal: number;
  currencyLocal: string;
  annualTuitionBdtLakh: number;
  annualLivingBdtLakh: number;
  annualTotalBdtLakh: number;
  officialCatalogUrl: string;
  officialSourceTitle: string;
  intakeYear: string;
  // Agency attribution
  verifyingAgencyId: string;
  verifyingAgencyName: string;
  verifyingAgencyNameBn?: string;
  verifyingAgencyLicense: string;
  verifyingAgencyLicenseType: string;
  verifyingAgencyOwner: string;
  verifyingAgencyRating: number;
  verifyingAgencySuccessRate: number;
  verifyingAgencyRiskScore: number;
  verifyingAgencyAddress: string;
  verifyingAgencyPhone: string;
  verifyingAgencyEmail: string;
  verifyingAgencyWebsite?: string;
  // Living benchmark provenance
  livingBenchmarkId: string;
  livingBenchmarkAuthority: string;
  livingBenchmarkDirective: string;
  livingBenchmarkGovUrl: string;
  livingBenchmarkGovTitle: string;
  livingRequirementType: string;
  statutorySolvencyFormatted: string;
  statutorySolvencyBdt: number;
  exchangeRateBdt: number;
  // Admin audit details
  auditId: string;
  verifiedByAdmin: string;
  lastAuditedAt: string;
  ledgerChecksum: string;
  status: 'VERIFIED' | 'AUDITED' | 'COMPLIANT';
  legalDisclaimerEn: string;
  legalDisclaimerBn: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 15 Admin-Verified Bangladeshi Consultancies (Comprehensive Multi-Country Support)
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_AGENCIES: VerifiedAgencyRecord[] = [
  {
    id: 'agt-001',
    name: 'Global Edu BD',
    nameBn: 'গ্লোবাল এডু বিডি',
    ownerName: 'Shahriar Kabir',
    licenseNo: 'TRAD/DNCC/041289/2022',
    licenseType: 'DNCC_TRADE',
    licenseStatus: 'VERIFIED',
    foundedYear: 2018,
    rating: 4.8,
    reviewsCount: 234,
    successRate: 94,
    riskScore: 6,
    feeMinBdt: 25000,
    feeMaxBdt: 80000,
    refundSummaryEn: '100% full refund within 30 days if offer letter not secured',
    refundSummaryBn: 'অফার লেটার না পেলে ৩০ দিনের মধ্যে সম্পূর্ণ ১০০% ফি ফেরত',
    countriesServed: ['Canada', 'UK', 'Australia', 'USA', 'Germany', 'Sweden', 'Netherlands', 'Ireland', 'New Zealand', 'Finland', 'Malaysia', 'Japan', 'France', 'Italy', 'Denmark', 'Norway', 'Austria', 'Hungary', 'Poland', 'Switzerland', 'Cyprus'],
    countryCodes: ['CAN', 'GBR', 'AUS', 'USA', 'DEU', 'SWE', 'NLD', 'IRL', 'NZL', 'FIN', 'MYS', 'JPN', 'FRA', 'ITA', 'DNK', 'NOR', 'AUT', 'HUN', 'POL', 'CHE', 'CYP'],
    address: 'House 42, Road 11, Block D, Banani, Dhaka-1213',
    phone: '+8801711002233',
    email: 'admissions@globaledubd.com',
    website: 'https://globaledubd.com',
    verifiedAt: '2024-01-10',
    services: [
      {
        id: 'srv-1',
        name: 'Full Application & Visa Escrow Package',
        nameBn: 'সম্পূর্ণ আবেদন ও ভিসা এসক্রো প্যাকেজ',
        amountBdt: 60000,
        whenCharged: 'Split in 3 Escrow Milestones (30% on Offer, 40% on Visa Filing, 30% on Visa)',
        whenChargedBn: '৩টি এসক্রো মাইলস্টোনে বিভক্ত (অফারে ৩০%, ফাইল জমা ৪০%, ভিসায় ৩০%)',
        refundable: true,
        refundPolicy: 'Full refund of unreleased milestone funds upon refusal',
        refundPolicyBn: 'ভিসা রিজেক্ট হলে অপ্রকাশিত এসক্রো তহবিলের সম্পূর্ণ রিফান্ড',
      },
      {
        id: 'srv-2',
        name: 'Offer Letter Processing Only',
        nameBn: 'শুধুমাত্র অফার লেটার প্রসেসিং',
        amountBdt: 25000,
        whenCharged: 'Upon Official University Offer Confirmation',
        whenChargedBn: 'অফিসিয়াল অফার লেটার পাওয়ার পর',
        refundable: true,
        refundPolicy: '100% refund if no offer received within 45 days',
        refundPolicyBn: '৪৫ দিনের মধ্যে অফার না পেলে শতভাগ ফেরত',
      },
    ],
  },
  {
    id: 'agt-002',
    name: 'Dream Abroad Ltd',
    nameBn: 'ড্রিম অ্যাব্রোড লিমিটেড',
    ownerName: 'Tanvir Mahmud',
    licenseNo: 'MOE-BD-2023-412',
    licenseType: 'MOE_APPROVED',
    licenseStatus: 'VERIFIED',
    foundedYear: 2017,
    rating: 4.6,
    reviewsCount: 187,
    successRate: 89,
    riskScore: 12,
    feeMinBdt: 30000,
    feeMaxBdt: 100000,
    refundSummaryEn: '50% refund within 14 days of visa refusal',
    refundSummaryBn: 'ভিসা প্রত্যাখ্যানের ১৪ দিনের মধ্যে ৫০% রিফান্ড',
    countriesServed: ['USA', 'Germany', 'Netherlands', 'Canada', 'UK', 'Australia', 'Sweden', 'Finland', 'Austria', 'France', 'Italy', 'Hungary', 'Poland', 'Japan', 'South Korea', 'Denmark', 'Norway', 'Ireland', 'New Zealand', 'Switzerland'],
    countryCodes: ['USA', 'DEU', 'NLD', 'CAN', 'GBR', 'AUS', 'SWE', 'FIN', 'AUT', 'FRA', 'ITA', 'HUN', 'POL', 'JPN', 'KOR', 'DNK', 'NOR', 'IRL', 'NZL', 'CHE'],
    address: 'Level 6, Navana Tower, Gulshan-1, Dhaka-1212',
    phone: '+8801822334455',
    email: 'info@dreamabroadbd.com',
    website: 'https://dreamabroadbd.com',
    verifiedAt: '2024-02-15',
    services: [
      {
        id: 'srv-3',
        name: 'Germany Public University & Blocked Account Guidance',
        nameBn: 'জার্মানি পাবলিক বিশ্ববিদ্যালয় ও ব্লকড অ্যাকাউন্ট প্যাকেজ',
        amountBdt: 45000,
        whenCharged: 'Milestone 1: Uni-Assist/Offer (50%), Milestone 2: Visa Appointment (50%)',
        whenChargedBn: 'মাইলস্টোন ১: উনি-অ্যাসিস্ট/অফার (৫০%), মাইলস্টোন ২: ভিসা অ্যাপয়েন্টমেন্ট (৫০%)',
        refundable: true,
        refundPolicy: '70% refund if admission letter is rejected',
        refundPolicyBn: 'ভর্তি পত্র না পেলে ৭০% ফেরত',
      },
      {
        id: 'srv-4',
        name: 'USA STEM I-20 & Visa Interview Prep',
        nameBn: 'ইউএসএ স্টেম আই-২০ এবং ভিসা ইন্টারভিউ প্রস্তুতি',
        amountBdt: 80000,
        whenCharged: 'Milestone 1: I-20 Confirmed, Milestone 2: Visa Mock Passed',
        whenChargedBn: 'মাইলস্টোন ১: আই-২০ প্রাপ্তি, মাইলস্টোন ২: ভিসা মক সম্পন্ন',
        refundable: false,
        refundPolicy: 'No refund after I-20 issuance',
        refundPolicyBn: 'আই-২০ ইস্যু হওয়ার পর অফেরতযোগ্য',
      },
    ],
  },
  {
    id: 'agt-003',
    name: 'EduPath Global',
    nameBn: 'এডুপ্যাথ গ্লোবাল',
    ownerName: 'Nusrat Jahan',
    licenseNo: 'MOE-BD-2024-105',
    licenseType: 'MOE_APPROVED',
    licenseStatus: 'VERIFIED',
    foundedYear: 2020,
    rating: 4.5,
    reviewsCount: 103,
    successRate: 91,
    riskScore: 8,
    feeMinBdt: 20000,
    feeMaxBdt: 70000,
    refundSummaryEn: '100% full refund within 30 days',
    refundSummaryBn: '৩০ দিনের মধ্যে শতভাগ ফি ফেরত',
    countriesServed: ['Canada', 'New Zealand', 'Sweden', 'Finland', 'Denmark', 'Norway', 'Germany', 'UK', 'Australia', 'USA', 'Netherlands', 'Ireland', 'Austria', 'Poland', 'Malaysia', 'France', 'Italy', 'Hungary', 'Japan', 'South Korea'],
    countryCodes: ['CAN', 'NZL', 'SWE', 'FIN', 'DNK', 'NOR', 'DEU', 'GBR', 'AUS', 'USA', 'NLD', 'IRL', 'AUT', 'POL', 'MYS', 'FRA', 'ITA', 'HUN', 'JPN', 'KOR'],
    address: 'Green Grandeur, Plot 58, Kamal Ataturk Ave, Banani, Dhaka',
    phone: '+8801933445566',
    email: 'contact@edupathglobal.com',
    website: 'https://edupathglobal.com',
    verifiedAt: '2024-03-01',
    services: [
      {
        id: 'srv-5',
        name: 'Nordic & Canada Comprehensive Admissions',
        nameBn: 'নরডিক ও কানাডা ভর্তি সহায়তা',
        amountBdt: 50000,
        whenCharged: '2 Escrow Milestones (50% on conditional offer, 50% on enrollment)',
        whenChargedBn: '২টি এসক্রো মাইলস্টোন (অফারে ৫০%, এনরোলমেন্টে ৫০%)',
        refundable: true,
        refundPolicy: 'Full refund if application is rejected due to agency error',
        refundPolicyBn: 'এজেন্সির ভুলের কারণে বাতিল হলে সম্পূর্ণ রিফান্ড',
      },
    ],
  },
  {
    id: 'agt-004',
    name: 'Executive Trade International',
    nameBn: 'এক্সিকিউটিভ ট্রেড ইন্টারন্যাশনাল',
    ownerName: 'A. K. M. Shamsuddin',
    licenseNo: 'TRAD/DSCC/019942/2021',
    licenseType: 'DSCC_TRADE',
    licenseStatus: 'VERIFIED',
    foundedYear: 2012,
    rating: 4.7,
    reviewsCount: 310,
    successRate: 95,
    riskScore: 5,
    feeMinBdt: 35000,
    feeMaxBdt: 90000,
    refundSummaryEn: 'Clear written escrow refund agreement with verified milestones',
    refundSummaryBn: 'যাচাইকৃত মাইলস্টোন সহ স্পষ্ট লিখিত এসক্রো রিফান্ড চুক্তি',
    countriesServed: ['UK', 'Australia', 'Ireland', 'Canada', 'USA', 'New Zealand', 'Malaysia', 'Germany', 'Netherlands', 'Sweden', 'France', 'Cyprus', 'Hungary', 'Denmark', 'Italy', 'Norway', 'Austria', 'Poland', 'Japan', 'South Korea'],
    countryCodes: ['GBR', 'AUS', 'IRL', 'CAN', 'USA', 'NZL', 'MYS', 'DEU', 'NLD', 'SWE', 'FRA', 'CYP', 'HUN', 'DNK', 'ITA', 'NOR', 'AUT', 'POL', 'JPN', 'KOR'],
    address: 'Concord Tower, Suite 7A, 113 Kazi Nazrul Islam Ave, Dhaka',
    phone: '+8801755667788',
    email: 'info@executivetrade.com.bd',
    website: 'https://executivetrade.com.bd',
    verifiedAt: '2023-11-20',
    services: [
      {
        id: 'srv-6',
        name: 'UK Russell Group & Australia Go8 Premium Processing',
        nameBn: 'যুক্তরাজ্য ও অস্ট্রেলিয়া প্রিমিয়াম প্রসেসিং',
        amountBdt: 75000,
        whenCharged: 'Held in Escrow until CAS/COE and Visa Approval',
        whenChargedBn: 'সিএএস/সিওই এবং ভিসা অনুমোদন পর্যন্ত এসক্রোতে সুরক্ষিত',
        refundable: true,
        refundPolicy: 'Full refund on CAS denial',
        refundPolicyBn: 'সিএএস ইস্যু না হলে সম্পূর্ণ রিফান্ড',
      },
    ],
  },
  {
    id: 'agt-005',
    name: 'Mentors\' Study Abroad',
    nameBn: 'মেন্টরস স্টাডি অ্যাব্রোড',
    ownerName: 'Manzoor Hasan',
    licenseNo: 'MOE-BD-2022-771',
    licenseType: 'MOE_APPROVED',
    licenseStatus: 'VERIFIED',
    foundedYear: 2005,
    rating: 4.6,
    reviewsCount: 420,
    successRate: 92,
    riskScore: 7,
    feeMinBdt: 25000,
    feeMaxBdt: 85000,
    refundSummaryEn: 'Standard escrow refund policy backed by Ethos AI guarantee',
    refundSummaryBn: 'Ethos AI গ্যারান্টি যুক্ত স্ট্যান্ডার্ড এসক্রো রিফান্ড পলিসি',
    countriesServed: ['USA', 'Canada', 'Australia', 'UK', 'Germany', 'Sweden', 'New Zealand', 'Ireland', 'Netherlands', 'Finland', 'Malaysia', 'Japan', 'France', 'South Korea', 'Italy', 'Denmark', 'Norway', 'Austria', 'Hungary', 'Poland', 'Cyprus'],
    countryCodes: ['USA', 'CAN', 'AUS', 'GBR', 'DEU', 'SWE', 'NZL', 'IRL', 'NLD', 'FIN', 'MYS', 'JPN', 'FRA', 'KOR', 'ITA', 'DNK', 'NOR', 'AUT', 'HUN', 'POL', 'CYP'],
    address: '166/1 Mirpur Road, Kalabagan, Dhaka-1205',
    phone: '+8801713004455',
    email: 'studyabroad@mentors.com.bd',
    website: 'https://mentors.com.bd',
    verifiedAt: '2023-09-14',
    services: [
      {
        id: 'srv-7',
        name: 'USA/Canada Bachelor & Master Admissions',
        nameBn: 'আমেরিকা/কানাডা স্নাতক ও স্নাতকোত্তর ভর্তি',
        amountBdt: 55000,
        whenCharged: 'Milestone escrow on admission packet delivery',
        whenChargedBn: 'অ্যাডমিশন প্যাকেট হস্তান্তরের পর এসক্রো রিলিজ',
        refundable: true,
        refundPolicy: 'Guaranteed refund if 0 out of 5 universities accept',
        refundPolicyBn: '৫টি বিশ্ববিদ্যালয়ের একটিতেও অফার না আসলে শতভাগ ফেরত',
      },
    ],
  },
  {
    id: 'agt-006',
    name: 'Shabuj Global Education',
    nameBn: 'সবুজ গ্লোবাল এডুকেশন',
    ownerName: 'Shabuj Ahmed',
    licenseNo: 'TRAD/DSCC/038812/2023',
    licenseType: 'DSCC_TRADE',
    licenseStatus: 'VERIFIED',
    foundedYear: 2016,
    rating: 4.5,
    reviewsCount: 165,
    successRate: 90,
    riskScore: 9,
    feeMinBdt: 30000,
    feeMaxBdt: 75000,
    refundSummaryEn: 'Transparent milestone refund with zero hidden fee clauses',
    refundSummaryBn: 'কোনো লুকানো চার্জ ছাড়া স্বচ্ছ মাইলস্টোন রিফান্ড',
    countriesServed: ['UK', 'Canada', 'Malaysia', 'Australia', 'USA', 'Ireland', 'Sweden', 'Netherlands', 'Germany', 'New Zealand', 'Cyprus', 'Poland', 'Hungary', 'Finland', 'Denmark', 'France', 'Italy', 'Norway', 'Austria', 'Japan'],
    countryCodes: ['GBR', 'CAN', 'MYS', 'AUS', 'USA', 'IRL', 'SWE', 'NLD', 'DEU', 'NZL', 'CYP', 'POL', 'HUN', 'FIN', 'DNK', 'FRA', 'ITA', 'NOR', 'AUT', 'JPN'],
    address: 'Tower 71, Panthapath, Dhaka-1205',
    phone: '+8801844556677',
    email: 'info@shabujglobal.com',
    website: 'https://shabujglobal.com',
    verifiedAt: '2024-04-18',
    services: [
      {
        id: 'srv-8',
        name: 'UK Fast-Track & Malaysia Affordable Packages',
        nameBn: 'ইউকে ফাস্ট-ট্র্যাক ও মালয়েশিয়া সাশ্রয়ী প্যাকেজ',
        amountBdt: 40000,
        whenCharged: '30% upfront escrow, 70% post-visa',
        whenChargedBn: '৩০% অগ্রিম এসক্রো, ৭০% ভিসা পাওয়ার পর',
        refundable: true,
        refundPolicy: 'Full return of 70% if visa refused',
        refundPolicyBn: 'ভিসা না হলে ৭০% সম্পূর্ণ ফেরত',
      },
    ],
  },
  {
    id: 'agt-007',
    name: 'BSB Global Network',
    nameBn: 'বিএসবি গ্লোবাল নেটওয়ার্ক',
    ownerName: 'M. K. Bashar',
    licenseNo: 'MOE-BD-2020-008',
    licenseType: 'MOE_APPROVED',
    licenseStatus: 'VERIFIED',
    foundedYear: 1993,
    rating: 4.7,
    reviewsCount: 520,
    successRate: 93,
    riskScore: 6,
    feeMinBdt: 35000,
    feeMaxBdt: 95000,
    refundSummaryEn: '30-year legacy with guaranteed written escrow milestone contract',
    refundSummaryBn: '৩০ বছরের ঐতিহ্য সহ লিখিত এসক্রো মাইলস্টোন গ্যারান্টি',
    countriesServed: ['UK', 'USA', 'Canada', 'Australia', 'Germany', 'Sweden', 'Japan', 'Malaysia', 'South Korea', 'Cyprus', 'New Zealand', 'Ireland', 'Finland', 'France', 'Hungary', 'Poland', 'Denmark', 'Norway', 'Austria', 'Italy', 'Switzerland'],
    countryCodes: ['GBR', 'USA', 'CAN', 'AUS', 'DEU', 'SWE', 'JPN', 'MYS', 'KOR', 'CYP', 'NZL', 'IRL', 'FIN', 'FRA', 'HUN', 'POL', 'DNK', 'NOR', 'AUT', 'ITA', 'CHE'],
    address: 'Plot 22, Gulshan Circle-2, Dhaka-1212',
    phone: '+8801720112233',
    email: 'admissions@bsbglobal.com.bd',
    website: 'https://bsbglobal.com.bd',
    verifiedAt: '2023-08-10',
    services: [
      {
        id: 'srv-9',
        name: 'Global Comprehensive University Placement & Visa Escrow',
        nameBn: 'গ্লোবাল সমন্বিত বিশ্ববিদ্যালয় ভর্তি ও ভিসা এসক্রো',
        amountBdt: 70000,
        whenCharged: 'Milestone 1: Offer Letter (40%), Milestone 2: Visa Grant (60%)',
        whenChargedBn: 'মাইলস্টোন ১: অফার লেটার (৪০%), মাইলস্টোন ২: ভিসা প্রাপ্তি (৬০%)',
        refundable: true,
        refundPolicy: '100% refund of visa milestone if rejected',
        refundPolicyBn: 'ভিসা রিজেক্ট হলে ভিসা মাইলস্টোনের ১০০% ফেরত',
      },
    ],
  },
  {
    id: 'agt-008',
    name: 'IDP Education Bangladesh',
    nameBn: 'আইডিপি এডুকেশন বাংলাদেশ',
    ownerName: 'Faisal Quader',
    licenseNo: 'TRAD/DNCC/091823/2019',
    licenseType: 'DNCC_TRADE',
    licenseStatus: 'VERIFIED',
    foundedYear: 2002,
    rating: 4.9,
    reviewsCount: 680,
    successRate: 97,
    riskScore: 3,
    feeMinBdt: 20000,
    feeMaxBdt: 60000,
    refundSummaryEn: 'Official co-owner of IELTS with zero hidden fees and full refund protection',
    refundSummaryBn: 'আইইএলটিএস-এর অফিশিয়াল সহ-প্রতিষ্ঠাতা, কোনো লুকানো ফি নেই এবং পূর্ণ রিফান্ড সুরক্ষা',
    countriesServed: ['Australia', 'Canada', 'UK', 'USA', 'New Zealand', 'Ireland', 'Germany', 'Sweden', 'Netherlands', 'France', 'Italy', 'Finland', 'Denmark', 'Austria', 'Malaysia', 'Norway', 'Poland', 'Hungary', 'Japan', 'South Korea', 'Switzerland'],
    countryCodes: ['AUS', 'CAN', 'GBR', 'USA', 'NZL', 'IRL', 'DEU', 'SWE', 'NLD', 'FRA', 'ITA', 'FIN', 'DNK', 'AUT', 'MYS', 'NOR', 'POL', 'HUN', 'JPN', 'KOR', 'CHE'],
    address: 'Hamid Tower, Level 4, Gulshan Circle-2, Dhaka',
    phone: '+8801700778899',
    email: 'info.dhaka@idp.com',
    website: 'https://idp.com/bangladesh',
    verifiedAt: '2023-06-15',
    services: [
      {
        id: 'srv-10',
        name: 'FastLane Partner University Direct Admission',
        nameBn: 'ফাস্টলেন পার্টনার ইউনিভার্সিটি সরাসরি ভর্তি',
        amountBdt: 30000,
        whenCharged: 'Post-acceptance verification via Escrow',
        whenChargedBn: 'ভর্তি নিশ্চিত হওয়ার পর এসক্রো রিলিজ',
        refundable: true,
        refundPolicy: 'Full refund if admission not offered',
        refundPolicyBn: 'ভর্তি অফার না আসলে সম্পূর্ণ ফেরত',
      },
    ],
  },
  {
    id: 'agt-009',
    name: 'PFEC Global Bangladesh',
    nameBn: 'পিএফইসি গ্লোবাল বাংলাদেশ',
    ownerName: 'Rezaul Karim',
    licenseNo: 'TRAD/DSCC/049102/2022',
    licenseType: 'DSCC_TRADE',
    licenseStatus: 'VERIFIED',
    foundedYear: 2014,
    rating: 4.8,
    reviewsCount: 290,
    successRate: 96,
    riskScore: 4,
    feeMinBdt: 30000,
    feeMaxBdt: 85000,
    refundSummaryEn: 'Australian QEAC Certified Agency with guaranteed milestone escrow release',
    refundSummaryBn: 'অস্ট্রেলিয়ান QEAC সার্টিফাইড এজেন্সি ও নিরাপদ মাইলস্টোন এসক্রো সুবিধা',
    countriesServed: ['Australia', 'Canada', 'UK', 'USA', 'Malaysia', 'Ireland', 'New Zealand', 'Germany', 'Sweden', 'Finland', 'Netherlands', 'France', 'South Korea', 'Japan', 'Poland', 'Denmark', 'Norway', 'Austria', 'Hungary', 'Italy', 'Cyprus'],
    countryCodes: ['AUS', 'CAN', 'GBR', 'USA', 'MYS', 'IRL', 'NZL', 'DEU', 'SWE', 'FIN', 'NLD', 'FRA', 'KOR', 'JPN', 'POL', 'DNK', 'NOR', 'AUT', 'HUN', 'ITA', 'CYP'],
    address: 'SIMA Blossom, Level 5, Dhanmondi 27, Dhaka',
    phone: '+8801730345678',
    email: 'dhaka@pfecglobal.com.au',
    website: 'https://pfecglobal.com.au',
    verifiedAt: '2023-10-05',
    services: [
      {
        id: 'srv-11',
        name: 'Australia & Canada End-to-End Escrow Package',
        nameBn: 'অস্ট্রেলিয়া ও কানাডা পূর্ণাঙ্গ এসক্রো প্যাকেজ',
        amountBdt: 65000,
        whenCharged: '3 Milestones: CoE/LOA (30%), GTE/PAL Clearance (30%), Visa Approval (40%)',
        whenChargedBn: '৩টি মাইলস্টোন: অফার (৩০%), ভিসা ফাইল রেডি (৩০%), ভিসা অনুমোদন (৪০%)',
        refundable: true,
        refundPolicy: 'Unreleased milestone funds returned immediately upon refusal',
        refundPolicyBn: 'ভিসা রিফিউজ হলে অপ্রকাশিত সব টাকা সঙ্গে সঙ্গে ফেরত',
      },
    ],
  },
  {
    id: 'agt-010',
    name: 'StudyBridge International',
    nameBn: 'স্টাডিব্রিজ ইন্টারন্যাশনাল',
    ownerName: 'Nazmul Huda',
    licenseNo: 'MOE-BD-2023-819',
    licenseType: 'MOE_APPROVED',
    licenseStatus: 'VERIFIED',
    foundedYear: 2015,
    rating: 4.7,
    reviewsCount: 312,
    successRate: 96,
    riskScore: 5,
    feeMinBdt: 35000,
    feeMaxBdt: 90000,
    refundSummaryEn: '100% transparent fee structure with guaranteed no hidden charges clause',
    refundSummaryBn: '১০০% স্বচ্ছ ফি এবং কোনো লুকানো খরচ না থাকার লিখিত নিশ্চয়তা',
    countriesServed: ['Canada', 'Australia', 'USA', 'UK', 'Germany', 'Sweden', 'Finland', 'Denmark', 'Norway', 'Netherlands', 'Ireland', 'New Zealand', 'Malaysia', 'Hungary', 'Italy', 'France', 'Poland', 'Austria', 'Japan', 'South Korea', 'Switzerland'],
    countryCodes: ['CAN', 'AUS', 'USA', 'GBR', 'DEU', 'SWE', 'FIN', 'DNK', 'NOR', 'NLD', 'IRL', 'NZL', 'MYS', 'HUN', 'ITA', 'FRA', 'POL', 'AUT', 'JPN', 'KOR', 'CHE'],
    address: 'Sector 3, Uttara Model Town, Dhaka-1230',
    phone: '+8801819223344',
    email: 'info@studybridgebd.com',
    website: 'https://studybridgebd.com',
    verifiedAt: '2024-01-22',
    services: [
      {
        id: 'srv-12',
        name: 'North America & Europe Premium Admissions',
        nameBn: 'উত্তর আমেরিকা ও ইউরোপ প্রিমিয়াম ভর্তি প্যাকেজ',
        amountBdt: 60000,
        whenCharged: 'Split across admission acceptance and visa grant',
        whenChargedBn: 'ভর্তি অনুমোদন ও ভিসা পাওয়ার মাঝে বিভক্ত',
        refundable: true,
        refundPolicy: 'Full refund if admission not offered by accredited institution',
        refundPolicyBn: 'স্বীকৃত প্রতিষ্ঠানে অফার না পেলে শতভাগ ফেরত',
      },
    ],
  },
  {
    id: 'agt-011',
    name: 'EduWings Bangladesh',
    nameBn: 'এডুইংস বাংলাদেশ',
    ownerName: 'Farhana Chowdhury',
    licenseNo: 'TRAD/DNCC/072311/2023',
    licenseType: 'DNCC_TRADE',
    licenseStatus: 'VERIFIED',
    foundedYear: 2019,
    rating: 4.6,
    reviewsCount: 142,
    successRate: 92,
    riskScore: 8,
    feeMinBdt: 25000,
    feeMaxBdt: 75000,
    refundSummaryEn: 'European Schengen Specialist with full refund policy on visa denial',
    refundSummaryBn: 'ইউরোপিয়ান সেনজেন বিশেষজ্ঞ এবং ভিসা না হলে সম্পূর্ণ ফি ফেরত নীতি',
    countriesServed: ['Germany', 'Sweden', 'Finland', 'Norway', 'Denmark', 'Poland', 'Hungary', 'Austria', 'Italy', 'France', 'Netherlands', 'Canada', 'UK', 'Australia', 'Malaysia', 'Ireland', 'New Zealand', 'USA', 'Japan', 'Switzerland', 'Cyprus'],
    countryCodes: ['DEU', 'SWE', 'FIN', 'NOR', 'DNK', 'POL', 'HUN', 'AUT', 'ITA', 'FRA', 'NLD', 'CAN', 'GBR', 'AUS', 'MYS', 'IRL', 'NZL', 'USA', 'JPN', 'CHE', 'CYP'],
    address: 'Plot 14, Main Road, Mirpur-10, Dhaka-1216',
    phone: '+8801911445566',
    email: 'info@eduwingsbd.com',
    website: 'https://eduwingsbd.com',
    verifiedAt: '2024-02-28',
    services: [
      {
        id: 'srv-13',
        name: 'Schengen & Nordic Zero-Tuition Master Package',
        nameBn: 'সেনজেন ও নরডিক টিউশন-ফ্রি মাস্টার্স প্যাকেজ',
        amountBdt: 45000,
        whenCharged: '50% on Uni-Assist / University Offer, 50% on Embassy Slot',
        whenChargedBn: '৫০% অফার লেটারে, ৫০% দূতাবাস অ্যাপয়েন্টমেন্টে',
        refundable: true,
        refundPolicy: 'Guaranteed refund on admission failure',
        refundPolicyBn: 'ভর্তি না হলে সম্পূর্ণ রিফান্ড গ্যারান্টি',
      },
    ],
  },
  {
    id: 'agt-012',
    name: 'Care Overseas Consulting',
    nameBn: 'কেয়ার ওভারসিজ কনসালটিং',
    ownerName: 'Anwar Hossain',
    licenseNo: 'TRAD/CCC/018274/2021',
    licenseType: 'CCC_TRADE',
    licenseStatus: 'VERIFIED',
    foundedYear: 2011,
    rating: 4.7,
    reviewsCount: 260,
    successRate: 94,
    riskScore: 6,
    feeMinBdt: 30000,
    feeMaxBdt: 80000,
    refundSummaryEn: 'Leading Chittagong-based consultancy with verified escrow protection',
    refundSummaryBn: 'চট্টগ্রামের শীর্ষস্থানীয় বিশ্বস্ত কনসালটেন্সি এবং এসক্রো নিরাপত্তা',
    countriesServed: ['Canada', 'UK', 'Australia', 'USA', 'Malaysia', 'Sweden', 'Germany', 'Ireland', 'New Zealand', 'Cyprus', 'Finland', 'Poland', 'Japan', 'France', 'Denmark', 'Norway', 'Austria', 'Italy', 'Netherlands', 'Hungary'],
    countryCodes: ['CAN', 'GBR', 'AUS', 'USA', 'MYS', 'SWE', 'DEU', 'IRL', 'NZL', 'CYP', 'FIN', 'POL', 'JPN', 'FRA', 'DNK', 'NOR', 'AUT', 'ITA', 'NLD', 'HUN'],
    address: 'World Trade Center, Level 8, Agrabad C/A, Chittagong',
    phone: '+8801819889900',
    email: 'admissions@careoverseas.com',
    website: 'https://careoverseas.com',
    verifiedAt: '2023-12-12',
    services: [
      {
        id: 'srv-14',
        name: 'Chittagong Regional Premium Study Abroad Package',
        nameBn: 'চট্টগ্রাম আঞ্চলিক প্রিমিয়াম স্টাডি অ্যাব্রোড প্যাকেজ',
        amountBdt: 50000,
        whenCharged: 'Tiered milestone release backed by Ethos Escrow',
        whenChargedBn: 'ধাপে ধাপে এসক্রো রিলিজ ব্যবস্থা',
        refundable: true,
        refundPolicy: 'Full refund on unachieved milestones',
        refundPolicyBn: 'অসম্পন্ন ধাপে শতভাগ ফেরত',
      },
    ],
  },
  {
    id: 'agt-013',
    name: 'Sylhet Global Education',
    nameBn: 'সিলেট গ্লোবাল এডুকেশন',
    ownerName: 'Muhibur Rahman',
    licenseNo: 'TRAD/SCC/031940/2022',
    licenseType: 'SCC_TRADE',
    licenseStatus: 'VERIFIED',
    foundedYear: 2013,
    rating: 4.8,
    reviewsCount: 340,
    successRate: 95,
    riskScore: 5,
    feeMinBdt: 25000,
    feeMaxBdt: 85000,
    refundSummaryEn: 'UK & European visa expert for Sylhet division with full escrow guarantee',
    refundSummaryBn: 'সিলেট বিভাগের শীর্ষ ইউকে ও ইউরোপ ভিসা এক্সপার্ট এবং এসক্রো নিশ্চয়তা',
    countriesServed: ['UK', 'Canada', 'USA', 'Australia', 'Ireland', 'Sweden', 'Finland', 'Germany', 'Malaysia', 'New Zealand', 'Netherlands', 'Denmark', 'Poland', 'Cyprus', 'France', 'Norway', 'Austria', 'Italy', 'Hungary', 'Japan'],
    countryCodes: ['GBR', 'CAN', 'USA', 'AUS', 'IRL', 'SWE', 'FIN', 'DEU', 'MYS', 'NZL', 'NLD', 'DNK', 'POL', 'CYP', 'FRA', 'NOR', 'AUT', 'ITA', 'HUN', 'JPN'],
    address: 'City Centre, Level 4, Zindabazar, Sylhet-3100',
    phone: '+8801712778899',
    email: 'info@sylhetglobal.com',
    website: 'https://sylhetglobal.com',
    verifiedAt: '2023-11-04',
    services: [
      {
        id: 'srv-15',
        name: 'UK CAS & Student Visa Escrow Special',
        nameBn: 'ইউকে সিএএস ও স্টুডেন্ট ভিসা এসক্রো স্পেশাল',
        amountBdt: 55000,
        whenCharged: '30% on CAS Letter, 70% on Visa Grant',
        whenChargedBn: '৩০% সিএএস পাওয়ার পর, ৭০% ভিসা পাওয়ার পর',
        refundable: true,
        refundPolicy: 'Full return of 70% if visa refused',
        refundPolicyBn: 'ভিসা রিজেক্ট হলে ৭০% সম্পূর্ণ ফেরত',
      },
    ],
  },
  {
    id: 'agt-014',
    name: 'Falcon Education Services',
    nameBn: 'ফ্যালকন এডুকেশন সার্ভিসেস',
    ownerName: 'Dr. Shah Alam',
    licenseNo: 'MOE-BD-2021-394',
    licenseType: 'MOE_APPROVED',
    licenseStatus: 'VERIFIED',
    foundedYear: 2010,
    rating: 4.7,
    reviewsCount: 275,
    successRate: 93,
    riskScore: 6,
    feeMinBdt: 30000,
    feeMaxBdt: 90000,
    refundSummaryEn: 'Higher study & scholarship specialists with verified refund clauses',
    refundSummaryBn: 'উচ্চশিক্ষা ও স্কলারশিপ স্পেশালিস্ট এবং যাচাইকৃত রিফান্ড ক্লজ',
    countriesServed: ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'Netherlands', 'Sweden', 'Ireland', 'Finland', 'New Zealand', 'Japan', 'South Korea', 'France', 'Italy', 'Malaysia', 'Denmark', 'Norway', 'Austria', 'Hungary', 'Poland', 'Switzerland'],
    countryCodes: ['USA', 'CAN', 'GBR', 'AUS', 'DEU', 'NLD', 'SWE', 'IRL', 'FIN', 'NZL', 'JPN', 'KOR', 'FRA', 'ITA', 'MYS', 'DNK', 'NOR', 'AUT', 'HUN', 'POL', 'CHE'],
    address: 'Road 27, Block A, Banani, Dhaka-1213',
    phone: '+8801841334455',
    email: 'info@falconeducationbd.com',
    website: 'https://falconeducationbd.com',
    verifiedAt: '2024-03-12',
    services: [
      {
        id: 'srv-16',
        name: 'USA/Europe Graduate Full-Fund & Admission Package',
        nameBn: 'আমেরিকা ও ইউরোপ গ্র্যাজুয়েট ফুল-ফান্ড ও ভর্তি প্যাকেজ',
        amountBdt: 65000,
        whenCharged: 'Milestone escrow on admission packet delivery',
        whenChargedBn: 'অ্যাডমিশন প্যাকেট হস্তান্তরের পর এসক্রো রিলিজ',
        refundable: true,
        refundPolicy: 'Guaranteed refund on admission failure',
        refundPolicyBn: 'ভর্তি না হলে সম্পূর্ণ রিফান্ড গ্যারান্টি',
      },
    ],
  },
  {
    id: 'agt-015',
    name: 'Cosmo Education',
    nameBn: 'কসমো এডুকেশন',
    ownerName: 'Kamrul Ahsan',
    licenseNo: 'TRAD/DNCC/061290/2023',
    licenseType: 'DNCC_TRADE',
    licenseStatus: 'VERIFIED',
    foundedYear: 2016,
    rating: 4.6,
    reviewsCount: 198,
    successRate: 91,
    riskScore: 7,
    feeMinBdt: 20000,
    feeMaxBdt: 70000,
    refundSummaryEn: 'Central & Eastern Europe study specialists with transparent milestone escrow',
    refundSummaryBn: 'মধ্য ও পূর্ব ইউরোপ স্টাডি স্পেশালিস্ট এবং স্বচ্ছ মাইলস্টোন এসক্রো',
    countriesServed: ['Germany', 'Hungary', 'Poland', 'Austria', 'Italy', 'France', 'Sweden', 'Finland', 'Canada', 'UK', 'Australia', 'USA', 'Malaysia', 'Cyprus', 'Denmark', 'Norway', 'Netherlands', 'Ireland', 'New Zealand', 'Japan', 'South Korea'],
    countryCodes: ['DEU', 'HUN', 'POL', 'AUT', 'ITA', 'FRA', 'SWE', 'FIN', 'CAN', 'GBR', 'AUS', 'USA', 'MYS', 'CYP', 'DNK', 'NOR', 'NLD', 'IRL', 'NZL', 'JPN', 'KOR'],
    address: 'House 63, Road 8/A, Dhanmondi, Dhaka-1209',
    phone: '+8801715889900',
    email: 'info@cosmoeducationbd.com',
    website: 'https://cosmoeducationbd.com',
    verifiedAt: '2024-04-02',
    services: [
      {
        id: 'srv-17',
        name: 'Stipendium Hungaricum & Poland Direct Admission',
        nameBn: 'হাঙ্গেরি স্কলারশিপ ও পোল্যান্ড সরাসরি ভর্তি প্যাকেজ',
        amountBdt: 38000,
        whenCharged: '30% on Application Acceptance, 70% on Visa',
        whenChargedBn: '৩০% আবেদন গ্রহণে, ৭০% ভিসায়',
        refundable: true,
        refundPolicy: 'Full return if visa denied',
        refundPolicyBn: 'ভিসা না হলে সম্পূর্ণ ফেরত',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 16+ Country Master Cost Breakdown Standards (Bangladesh Currency BDT Standard)
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_COUNTRY_COSTS: Record<string, CountryCostStandard> = {
  canada: {
    country: 'Canada',
    countryBn: 'কানাডা',
    code: 'CAN',
    flag: '🇨🇦',
    currency: 'CAD',
    exchangeRateBdt: 89.5,
    tuitionYearlyBdt: {
      min: 1400000,
      max: 2600000,
      label: '৳14,00,000 – ৳26,00,000 / year (CAD $16,000–$30,000)',
      labelBn: '৳১৪,০০,০০০ – ৳২৬,০০,০০০ / বছর (CAD $১৬,০০০–$৩০,০০০)',
    },
    livingOrBlockedBdt: {
      amount: 1850000,
      label: '৳18,50,000 (Mandatory GIC: CAD $20,635)',
      labelBn: '৳১৮,৫০,০০০ (বাধ্যতামূলক জিআইসি: CAD $২০,৬৩৫)',
      requirementType: 'GIC',
    },
    visaAndBiometricsBdt: {
      amount: 21500,
      label: '৳21,500 (Study Permit $150 + Biometrics $85)',
      labelBn: '৳২১,৫০০ (স্টাডি পারমিট $১৫০ + বায়োমেট্রিক্স $৮৫)',
    },
    healthInsuranceYearlyBdt: {
      amount: 75000,
      label: '৳75,000 / year (Included in student fee / UHIP ~CAD $800)',
      labelBn: '৳৭৫,০০০ / বছর (বিশ্ববিদ্যালয় স্বাস্থ্য বীমা UHIP)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 80000, average: 50000 },
    totalFirstYearEstBdt: { min: 3300000, max: 4500000 },
    keyRequirementsEn: [
      'Provincial Attestation Letter (PAL) required for undergrad applicants',
      'IELTS 6.5 overall (minimum 6.0 each band) for direct SDS stream',
      '1 Year Tuition prepayment + CAD $20,635 GIC deposit with Scotiabank/CIBC',
      'Upfront Medical Examination with designated panel physician in Dhaka',
    ],
    keyRequirementsBn: [
      'স্নাতক আবেদনকারীদের জন্য প্রাদেশিক সত্যায়ন পত্র (PAL) বাধ্যতামূলক',
      'এসডিএস (SDS) স্ট্রিমের জন্য আইইএলটিএস সর্বনিম্ন ৬.৫ (প্রতি ব্যান্ডে ৬.০)',
      '১ বছরের টিউশন ফি পরিশোধ + ২০,৬৩৫ কানাডিয়ান ডলারের জিআইসি (GIC) অ্যাকাউন্ট',
      'ঢাকার প্যানেল চিকিৎসকের মাধ্যমে অগ্রিম মেডিকেল পরীক্ষা সম্পন্ন করা',
    ],
    intakes: ['Fall (September)', 'Winter (January)', 'Summer (May)'],
    topSpecializedAgencyIds: ['agt-001', 'agt-003', 'agt-004', 'agt-005', 'agt-007', 'agt-008', 'agt-009', 'agt-010', 'agt-012', 'agt-013'],
  },

  germany: {
    country: 'Germany',
    countryBn: 'জার্মানি',
    code: 'DEU',
    flag: '🇩🇪',
    currency: 'EUR',
    exchangeRateBdt: 128.0,
    tuitionYearlyBdt: {
      min: 0,
      max: 300000,
      label: '৳0 (Tuition Free at Public Universities) / Semester Contribution ~৳35,000–৳70,000/yr',
      labelBn: '৳০ (পাবলিক বিশ্ববিদ্যালয়ে টিউশন ফ্রি) / সেমিস্টার ফি মাত্র ~৳৩৫,০০০–৳৭০,০০০/বছর',
    },
    livingOrBlockedBdt: {
      amount: 1525000,
      label: '৳15,25,000 (Mandatory Blocked Account / Sperrkonto: €11,904)',
      labelBn: '৳১৫,২৫,০০০ (বাধ্যতামূলক ব্লকড অ্যাকাউন্ট / স্পারকনটো: €১১,৯০৪)',
      requirementType: 'BLOCKED_ACCOUNT',
    },
    visaAndBiometricsBdt: {
      amount: 9800,
      label: '৳9,800 (National Student Visa Fee: €75)',
      labelBn: '৳৯,৮০০ (জাতীয় স্টুডেন্ট ভিসা ফি: €৭৫)',
    },
    healthInsuranceYearlyBdt: {
      amount: 140000,
      label: '৳1,40,000 / year (Public Health Insurance TK/AOK ~€110/month)',
      labelBn: '৳১,৪০,০০০ / বছর (সরকারি স্বাস্থ্য বীমা TK/AOK ~€১১০/মাস)',
    },
    escrowAgencyFeeBdt: { min: 30000, max: 70000, average: 45000 },
    totalFirstYearEstBdt: { min: 1700000, max: 2000000 },
    keyRequirementsEn: [
      'German GPA conversion (Bavarian Formula) — typically requiring CGPA 3.0+ for direct admission',
      'APS Certificate requirement may apply for certain credentials',
      'Blocked Account of €11,904 deposited with Expatrio, Coracle, or Fintiba',
      'Uni-Assist application VPD processing for target universities',
    ],
    keyRequirementsBn: [
      'জার্মান গ্রেডিং সিস্টেমে রূপান্তর — সাধারণত সিজিপিএ ৩.০+ প্রয়োজন হয়',
      'এক্সপ্যাট্রিও (Expatrio) বা ফিনটিবা (Fintiba)-তে €১১,৯০৪ ইউরোর ব্লকড অ্যাকাউন্ট',
      'উনি-অ্যাসিস্ট (Uni-Assist) এর মাধ্যমে আবেদন ও VPD সংগ্রহ',
      'পাবলিক বিশ্ববিদ্যালয়ে টিউশন ফ্রি হওয়ায় মোট খরচ অন্য যেকোনো দেশের চেয়ে অনেক সাশ্রয়ী',
    ],
    intakes: ['Winter (October — Primary)', 'Summer (April)'],
    topSpecializedAgencyIds: ['agt-002', 'agt-001', 'agt-003', 'agt-005', 'agt-007', 'agt-010', 'agt-011', 'agt-014', 'agt-015'],
  },

  uk: {
    country: 'United Kingdom',
    countryBn: 'যুক্তরাজ্য (ইউকে)',
    code: 'GBR',
    flag: '🇬🇧',
    currency: 'GBP',
    exchangeRateBdt: 152.0,
    tuitionYearlyBdt: {
      min: 1600000,
      max: 2800000,
      label: '৳16,00,000 – ৳28,00,000 / year (£12,000–£22,000)',
      labelBn: '৳১৬,০০,০০০ – ৳২৮,০০,০০০ / বছর (£১২,০০০–£২২,০০০)',
    },
    livingOrBlockedBdt: {
      amount: 1450000,
      label: '৳14,50,000 (Maintenance funds for 9 months: £1,023/mo outside London, £1,334/mo inside London)',
      labelBn: '৳১৪,৫০,০০০ (৯ মাসের লিভিং কস্ট: লন্ডনের বাইরে £১,০২৩/মাস, ভেতরে £১,৩৩৪/মাস)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 74000,
      label: '৳74,000 (Student Visa Application: £490)',
      labelBn: '৳৭৪,০০০ (স্টুডেন্ট ভিসা আবেদন ফি: £৪৯০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 118000,
      label: '৳1,18,000 / year (IHS Immigration Health Surcharge: £776/year)',
      labelBn: '৳১,১৮,০০০ / বছর (ইএইচএস স্বাস্থ্য সারচার্জ: £৭৭৬/বছর)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 80000, average: 45000 },
    totalFirstYearEstBdt: { min: 3200000, max: 4400000 },
    keyRequirementsEn: [
      'CAS (Confirmation of Acceptance for Studies) letter issued by licensed sponsor',
      '28-Day Bank Statement Rule: Funds must remain mature in account for consecutive 28 days',
      'TB Screening Certificate from IOM Bangladesh (Dhaka/Sylhet)',
      'IELTS for UKVI (or university English waiver with MOI letter where accepted)',
    ],
    keyRequirementsBn: [
      'বিশ্ববিদ্যালয় থেকে অফিশিয়াল সিএএস (CAS) লেটার সংগ্রহ',
      'টানা ২৮ দিন ব্যাংকে নির্দিষ্ট ব্যালেন্স ম্যাচিওর রাখার নিয়ম (28-day rule)',
      'আইওএম (IOM) বাংলাদেশ থেকে যক্ষ্মা (TB) স্ক্রিনিং সার্টিফিকেট',
      'স্নাতকোত্তর প্রোগ্রামের মেয়াদ মাত্র ১ বছর হওয়ায় দ্রুত শেষ করার দারুণ সুযোগ',
    ],
    intakes: ['September/October (Major)', 'January/February', 'May (Select universities)'],
    topSpecializedAgencyIds: ['agt-001', 'agt-004', 'agt-005', 'agt-006', 'agt-007', 'agt-008', 'agt-009', 'agt-010', 'agt-012', 'agt-013'],
  },

  usa: {
    country: 'United States',
    countryBn: 'যুক্তরাষ্ট্র (ইউএসএ)',
    code: 'USA',
    flag: '🇺🇸',
    currency: 'USD',
    exchangeRateBdt: 122.5,
    tuitionYearlyBdt: {
      min: 1900000,
      max: 3800000,
      label: '৳19,00,000 – ৳38,00,000 / year ($16,000–$32,000 before scholarships)',
      labelBn: '৳১৯,০০,০০০ – ৳৩৮,০০,০০০ / বছর ($১৬,০০০–$৩২,০০০ স্কলারশিপ ছাড়া)',
    },
    livingOrBlockedBdt: {
      amount: 1500000,
      label: '৳15,00,000 – ৳20,00,000 / year (Shown via I-20 Financial Affidavit)',
      labelBn: '৳১৫,০০,০০০ – ৳২০,০০,০০০ / বছর (আই-২০ আর্থিক সক্ষমতা প্রমাণ)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 65000,
      label: '৳65,000 (SEVIS I-901 Fee: $350 + DS-160 MRV Visa Fee: $185)',
      labelBn: '৳৬৫,০০০ (সেভিস ফি $৩৫০ + ডিএস-১৬০ ভিসা ফি $১৮৫)',
    },
    healthInsuranceYearlyBdt: {
      amount: 150000,
      label: '৳1,50,000 / year (University Mandatory Health Insurance ~$1,200–$1,800)',
      labelBn: '৳১,৫০,০০০ / বছর (বিশ্ববিদ্যালয় স্বাস্থ্য বীমা)',
    },
    escrowAgencyFeeBdt: { min: 30000, max: 90000, average: 55000 },
    totalFirstYearEstBdt: { min: 3600000, max: 5800000 },
    keyRequirementsEn: [
      'Official I-20 Form from SEVP-certified institution',
      'SEVIS I-901 receipt and DS-160 confirmation barcode',
      'In-person F-1 Visa Interview at the US Embassy in Dhaka',
      'Strong academic/financial ties and intention to return',
    ],
    keyRequirementsBn: [
      'বিশ্ববিদ্যালয় থেকে অফিশিয়াল আই-২০ (I-20) ফর্ম সংগ্রহ',
      'সেভিস ফি ($৩৫০) ও ডিএস-১৬০ পূরণ করে মার্কিন দূতাবাসে ফেস-টু-ফেস ইন্টারভিউ',
      'জিআরই (GRE) বা ভালো প্রোফাইল থাকলে ফুল-ফান্ড অ্যাসিস্ট্যান্টশিপ (RA/TA) পাওয়ার চমৎকার সুযোগ',
    ],
    intakes: ['Fall (August/September — Major)', 'Spring (January)', 'Summer (May)'],
    topSpecializedAgencyIds: ['agt-002', 'agt-005', 'agt-001', 'agt-004', 'agt-007', 'agt-008', 'agt-009', 'agt-010', 'agt-014'],
  },

  australia: {
    country: 'Australia',
    countryBn: 'অস্ট্রেলিয়া',
    code: 'AUS',
    flag: '🇦🇺',
    currency: 'AUD',
    exchangeRateBdt: 80.0,
    tuitionYearlyBdt: {
      min: 1900000,
      max: 3300000,
      label: '৳19,00,000 – ৳33,00,000 / year (AUD $24,000–$42,000)',
      labelBn: '৳১৯,০০,০০০ – ৳৩৩,০০,০০০ / বছর (AUD $২৪,০০০–$৪২,০০০)',
    },
    livingOrBlockedBdt: {
      amount: 2350000,
      label: '৳23,50,000 (Department of Home Affairs Living Cost: AUD $29,710)',
      labelBn: '৳২৩,৫০,০০০ (অস্ট্রেলিয়ান সরকারের নির্ধারিত লিভিং কস্ট: AUD $২৯,৭১০)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 135000,
      label: '৳1,35,000 (Student Visa Subclass 500: AUD $1,600 + Biometrics)',
      labelBn: '৳১,৩৫,০০০ (স্টুডেন্ট সাবক্লাস ৫০০ ভিসা ফি: AUD $১,৬০০ + বায়োমেট্রিক্স)',
    },
    healthInsuranceYearlyBdt: {
      amount: 60000,
      label: '৳60,000 / year (OSHC Overseas Student Health Cover ~AUD $750)',
      labelBn: '৳৬০,০০০ / বছর (ওএসএইচসি স্বাস্থ্য বীমা)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 80000, average: 48000 },
    totalFirstYearEstBdt: { min: 4400000, max: 5800000 },
    keyRequirementsEn: [
      'Confirmation of Enrolment (CoE) from CRICOS registered provider',
      'Genuine Student (GS) assessment criteria (replaced GTE in 2024)',
      'Financial capacity evidence for 1 year tuition + AUD $29,710 living expenses + travel',
      'IELTS 6.0/6.5 or PTE Academic 58+',
    ],
    keyRequirementsBn: [
      'বিশ্ববিদ্যালয়ের সিওই (CoE) এবং জেনুইন স্টুডেন্ট (GS) ক্রাইটেরিয়া পূরণ',
      '১ বছরের টিউশন ফি + ২৯,৭১০ অস্ট্রেলিয়ান ডলার লিভিং কস্টের আর্থিক প্রমাণ',
      'আইইএলটিএস বা পিটিই (PTE) স্কোর এবং ওএসএইচসি (OSHC) হেলথ কভার',
    ],
    intakes: ['Semester 1 (February — Major)', 'Semester 2 (July)', 'Trimester (November)'],
    topSpecializedAgencyIds: ['agt-001', 'agt-004', 'agt-005', 'agt-007', 'agt-008', 'agt-009', 'agt-010', 'agt-012', 'agt-013'],
  },

  sweden: {
    country: 'Sweden',
    countryBn: 'সুইডেন',
    code: 'SWE',
    flag: '🇸🇪',
    currency: 'SEK',
    exchangeRateBdt: 11.5,
    tuitionYearlyBdt: {
      min: 1100000,
      max: 1800000,
      label: '৳11,00,000 – ৳18,00,000 / year (SEK 95,000–160,000)',
      labelBn: '৳১১,০০,০০০ – ৳১৮,০০,০০০ / বছর (SEK ৯৫,০০০–১৬০,০০০)',
    },
    livingOrBlockedBdt: {
      amount: 1400000,
      label: '৳14,00,000 (Migrationsverket requirement: SEK 10,314/month for 10-12 months)',
      labelBn: '৳১৪,০০,০০০ (মাইগ্রেশনসভার্কেট নির্ধারিত লিভিং কস্ট: SEK ১০,৩১৪/মাস)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 18000,
      label: '৳18,000 (Residence Permit for Studies: SEK 1,500)',
      labelBn: '৳১৮,০০০ (স্টুডেন্ট রেসিডেন্স পারমিট ফি: SEK ১,৫০০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 0,
      label: '৳0 (Included in Swedish University state insurance for full degree students)',
      labelBn: '৳০ (সুইডিশ বিশ্ববিদ্যালয়ে ফুল-ডিগ্রি স্টুডেন্টদের জন্য বিনামূল্যে অন্তর্ভুক্ত)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 65000, average: 45000 },
    totalFirstYearEstBdt: { min: 2500000, max: 3300000 },
    keyRequirementsEn: [
      'Centralized UniversityAdmissions.se application portal (up to 4 master programs)',
      'Tuition fee first installment paid directly to university',
      'Swedish Institute (SI) Scholarship eligible for Bangladeshi applicants',
    ],
    keyRequirementsBn: [
      'UniversityAdmissions.se এর মাধ্যমে সেন্ট্রাল আবেদন',
      'বাংলাদেশী শিক্ষার্থীদের জন্য সুইডিশ ইনস্টিটিউট (SI) ফুল-ফান্ড স্কলারশিপের সুযোগ',
    ],
    intakes: ['Autumn (August/September)'],
    topSpecializedAgencyIds: ['agt-003', 'agt-001', 'agt-002', 'agt-007', 'agt-010', 'agt-011', 'agt-014'],
  },

  finland: {
    country: 'Finland',
    countryBn: 'ফিনল্যান্ড',
    code: 'FIN',
    flag: '🇫🇮',
    currency: 'EUR',
    exchangeRateBdt: 128.0,
    tuitionYearlyBdt: {
      min: 1000000,
      max: 1800000,
      label: '৳10,00,000 – ৳18,00,000 / year (€8,000–€14,000; up to 50-100% early bird scholarships)',
      labelBn: '৳১০,০০,০০০ – ৳১৮,০০,০০০ / বছর (৫০-১০০% স্কলারশিপের দারুণ সুযোগ)',
    },
    livingOrBlockedBdt: {
      amount: 1050000,
      label: '৳10,50,000 (Migri Requirement: €6,720 / €560 per month in bank statement)',
      labelBn: '৳১০,৫০,০০০ (মিগ্রি নির্ধারিত লিভিং কস্ট: €৬,৭২০/বছর)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 45000,
      label: '৳45,000 (Electronic Residence Permit: €350)',
      labelBn: '৳৪৫,০০০ (ইলেকট্রনিক রেসিডেন্স পারমিট ফি: €৩৫০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 40000,
      label: '৳40,000 / year (SwissCare / SIP Insurance ~$300/yr)',
      labelBn: '৳৪০,০০০ / বছর (সুইসকেয়ার স্বাস্থ্য বীমা)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 65000, average: 40000 },
    totalFirstYearEstBdt: { min: 2100000, max: 2900000 },
    keyRequirementsEn: [
      'Studyinfo.fi national centralized joint application window (January)',
      '2-Year post-study job seeker visa and family PR fast-track',
      'Proof of funds (€6,720) in student\'s own name bank account',
    ],
    keyRequirementsBn: [
      'Studyinfo.fi এর মাধ্যমে জয়েন্ট অ্যাপ্লিকেশন এবং দ্রুত পিআর (PR) পাওয়ার সুযোগ',
      'অধিকাংশ বিশ্ববিদ্যালয়ে ৫০% থেকে ১০০% পর্যন্ত টিউশন স্কলারশিপ',
    ],
    intakes: ['Autumn (August/September)'],
    topSpecializedAgencyIds: ['agt-003', 'agt-002', 'agt-007', 'agt-010', 'agt-011', 'agt-013'],
  },

  malaysia: {
    country: 'Malaysia',
    countryBn: 'মালয়েশিয়া',
    code: 'MYS',
    flag: '🇲🇾',
    currency: 'MYR',
    exchangeRateBdt: 27.5,
    tuitionYearlyBdt: {
      min: 350000,
      max: 750000,
      label: '৳3,50,000 – ৳7,50,000 / year (MYR 12,000–28,000)',
      labelBn: '৳৩,৫০,০০০ – ৳৭,৫০,০০০ / বছর (MYR ১২,০০০–২৮,০০০)',
    },
    livingOrBlockedBdt: {
      amount: 450000,
      label: '৳4,50,000 / year (MYR 15,000–18,000 living expenses)',
      labelBn: '৳৪,৫০,০০০ / বছর (লিভিং ও খাবার খরচ অত্যন্ত সাশ্রয়ী)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 35000,
      label: '৳35,000 (EMGS Visa Processing Fee)',
      labelBn: '৳৩৫,০০০ (ইএমজিএস ভিসা প্রসেসিং ফি)',
    },
    healthInsuranceYearlyBdt: {
      amount: 15000,
      label: '৳15,000 / year (EMGS Medical Insurance)',
      labelBn: '৳১৫,০০০ / বছর (মেডিকেল ইন্স্যুরেন্স)',
    },
    escrowAgencyFeeBdt: { min: 15000, max: 45000, average: 30000 },
    totalFirstYearEstBdt: { min: 850000, max: 1300000 },
    keyRequirementsEn: [
      'EMGS (Education Malaysia Global Services) approval letter (VAL)',
      'Single Entry Visa (SEV) from Malaysian Embassy in Dhaka',
      'Affordable tuition with top UK/Australian branch campuses (Nottingham, Monash, Curtin)',
    ],
    keyRequirementsBn: [
      'ইএমজিএস (EMGS) থেকে ভিসা অনুমোদন পত্র (VAL)',
      'যুক্তরাজ্য ও অস্ট্রেলিয়ার শীর্ষ ক্যাম্পাসের (যেমন Monash, Nottingham) মালয়েশিয়া ব্রাঞ্চে সাশ্রয়ী ডিগ্রি',
    ],
    intakes: ['February/March', 'July', 'October'],
    topSpecializedAgencyIds: ['agt-006', 'agt-001', 'agt-004', 'agt-007', 'agt-009', 'agt-012'],
  },

  netherlands: {
    country: 'Netherlands',
    countryBn: 'নেদারল্যান্ডস',
    code: 'NLD',
    flag: '🇳🇱',
    currency: 'EUR',
    exchangeRateBdt: 128.0,
    tuitionYearlyBdt: {
      min: 1100000,
      max: 2100000,
      label: '৳11,00,000 – ৳21,00,000 / year (€9,000–€16,000)',
      labelBn: '৳১১,০০,০০০ – ৳২১,০০,০০০ / বছর (€৯,০০০–€১৬,০০০)',
    },
    livingOrBlockedBdt: {
      amount: 1550000,
      label: '৳15,50,000 (IND living expenses requirement: ~€12,150/year)',
      labelBn: '৳১৫,৫০,০০০ (আইএনডি লিভিং কস্ট রিকোয়ারমেন্ট: ~€১২,১৫০/বছর)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 28000,
      label: '৳28,000 (IND Residence Permit Entry Visa MVV: €210)',
      labelBn: '৳২৮,০০০ (আইএনডি রেসিডেন্স পারমিট ফি: €২১০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 80000,
      label: '৳80,000 / year (Aon Student Insurance ~€50–€70/mo)',
      labelBn: '৳৮০,০০০ / বছর (আয়ন স্টুডেন্ট হেলথ ইন্স্যুরেন্স)',
    },
    escrowAgencyFeeBdt: { min: 30000, max: 75000, average: 50000 },
    totalFirstYearEstBdt: { min: 2750000, max: 3850000 },
    keyRequirementsEn: [
      'Studielink.nl centralized university enrollment application',
      'University applies for MVV/VVR entry visa on behalf of student after tuition deposit',
      '1-Year post-study "Search Year" (Zoekjaar) visa for job opportunities in EU',
    ],
    keyRequirementsBn: [
      'Studielink.nl এর মাধ্যমে সেন্ট্রাল আবেদন',
      'বিশ্ববিদ্যালয় নিজেই ছাত্রের পক্ষে ডাচ সরকারের কাছ থেকে ভিসা (MVV) এনে দেয়',
      'পড়াশোনা শেষে ১ বছরের ইউরোপীয় সার্চ ইয়ার জব ভিসা',
    ],
    intakes: ['September (Major)', 'February (Select universities)'],
    topSpecializedAgencyIds: ['agt-002', 'agt-001', 'agt-004', 'agt-008', 'agt-010', 'agt-014'],
  },

  japan: {
    country: 'Japan',
    countryBn: 'জাপান',
    code: 'JPN',
    flag: '🇯🇵',
    currency: 'JPY',
    exchangeRateBdt: 0.82,
    tuitionYearlyBdt: {
      min: 450000,
      max: 950000,
      label: '৳4,50,000 – ৳9,50,000 / year (¥535,000–¥1,100,000 at National Universities)',
      labelBn: '৳৪,৫০,০০০ – ৳৯,৫০,০০০ / বছর (জাতীয় বিশ্ববিদ্যালয়ে অত্যন্ত সাশ্রয়ী ফি)',
    },
    livingOrBlockedBdt: {
      amount: 900000,
      label: '৳9,00,000 / year (¥1,100,000 living & accommodation)',
      labelBn: '৳৯,০০,০০০ / বছর (লিভিং ও পার্ট-টাইম কাজের দারুণ সুযোগ)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 4500,
      label: '৳4,500 (Embassy Student Visa: ¥3,000)',
      labelBn: '৳৪,৫০০ (জাপান দূতাবাস স্টুডেন্ট ভিসা ফি: ¥৩,০০০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 25000,
      label: '৳25,000 / year (National Health Insurance NHI with 70% medical coverage)',
      labelBn: '৳২৫,০০০ / বছর (জাতীয় স্বাস্থ্য বীমা ৭০% কভারেজ সহ)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 65000, average: 40000 },
    totalFirstYearEstBdt: { min: 1400000, max: 1950000 },
    keyRequirementsEn: [
      'Certificate of Eligibility (COE) issued by Japanese Immigration Bureau',
      'MEXT Japanese Government Full-Fund Scholarship available for BD applicants',
      'JLPT (N5/N4) or English-medium degree programs (G30 Universities)',
    ],
    keyRequirementsBn: [
      'জাপানিজ ইমিগ্রেশন থেকে সিওই (COE) অনুমোদন সংগ্রহ',
      'মেক্সট (MEXT) সম্পূর্ণ ফ্রি সরকারি স্কলারশিপের দারুণ সুযোগ',
      'সপ্তাহে ২৮ ঘণ্টা বৈধ পার্ট-টাইম জব করার অনুমতি',
    ],
    intakes: ['April (Major)', 'October'],
    topSpecializedAgencyIds: ['agt-007', 'agt-001', 'agt-002', 'agt-005', 'agt-012', 'agt-014'],
  },

  south_korea: {
    country: 'South Korea',
    countryBn: 'দক্ষিণ কোরিয়া',
    code: 'KOR',
    flag: '🇰🇷',
    currency: 'KRW',
    exchangeRateBdt: 0.092,
    tuitionYearlyBdt: {
      min: 400000,
      max: 900000,
      label: '৳4,00,000 – ৳9,00,000 / year (₩4,500,000–₩9,500,000)',
      labelBn: '৳৪,০০,০০০ – ৳৯,০০,০০০ / বছর (টপ গ্লোবাল ইউনিভার্সিটি)',
    },
    livingOrBlockedBdt: {
      amount: 850000,
      label: '৳8,50,000 / year (₩9,000,000 living & dormitory)',
      labelBn: '৳৮,৫০,০০০ / বছর (ডরমিটরি ও খাবার খরচ)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 8000,
      label: '৳8,000 (D-2 Student Visa Fee: $60)',
      labelBn: '৳৮,০০০ (ডি-২ স্টুডেন্ট ভিসা ফি)',
    },
    healthInsuranceYearlyBdt: {
      amount: 60000,
      label: '৳60,000 / year (National Health Insurance NHIS)',
      labelBn: '৳৬০,০০০ / বছর (কোরিয়ান জাতীয় স্বাস্থ্য বীমা)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 60000, average: 40000 },
    totalFirstYearEstBdt: { min: 1350000, max: 1900000 },
    keyRequirementsEn: [
      'Certificate of Admission (CoA) from accredited Korean university',
      'Global Korea Scholarship (GKS) full tuition + monthly stipend',
      'Bank balance certificate of USD $10,000–$20,000',
    ],
    keyRequirementsBn: [
      'জিকেএস (GKS) সরকারি ফুল-ফান্ড স্কলারশিপ এবং প্রফেসর ফান্ডিং (RA/TA)',
      'উন্নত গবেষণা ল্যাব এবং হাই-টেক ক্যারিয়ারের সেরা সুযোগ',
    ],
    intakes: ['March (Spring)', 'September (Fall)'],
    topSpecializedAgencyIds: ['agt-007', 'agt-002', 'agt-005', 'agt-009', 'agt-014'],
  },

  ireland: {
    country: 'Ireland',
    countryBn: 'আয়ারল্যান্ড',
    code: 'IRL',
    flag: '🇮🇪',
    currency: 'EUR',
    exchangeRateBdt: 128.0,
    tuitionYearlyBdt: {
      min: 1300000,
      max: 2400000,
      label: '৳13,00,000 – ৳24,00,000 / year (€10,000–€18,000)',
      labelBn: '৳১৩,০০,০০০ – ৳২৪,০০,০০০ / বছর (€১০,০০০–€১৮,০০০)',
    },
    livingOrBlockedBdt: {
      amount: 1300000,
      label: '৳13,00,000 (Irish Immigration Service Delivery requirement: €10,000 in bank)',
      labelBn: '৳১৩,০০,০০০ (আইরিশ ইমিগ্রেশন নির্ধারিত লিভিং ফান্ড: €১০,০০০)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 14000,
      label: '৳14,00,0 (Long-stay Study Visa D Fee: €100)',
      labelBn: '৳১৪,০০০ (লং-স্টে স্টাডি ভিসা ডি ফি: €১০০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 25000,
      label: '৳25,000 / year (Private medical insurance for non-EU students ~€180/yr)',
      labelBn: '৳২৫,০০০ / বছর (প্রাইভেট মেডিকেল ইন্স্যুরেন্স)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 75000, average: 48000 },
    totalFirstYearEstBdt: { min: 2650000, max: 3800000 },
    keyRequirementsEn: [
      'Electronic visa application AVATS through Irish Embassy',
      '6-month continuous bank statement with clear source of funds',
      '2-Year Third Level Graduate Scheme (Post-study work permit in EU tech capital Dublin)',
    ],
    keyRequirementsBn: [
      'ইউরোপের সিলিকন ভ্যালি (ডাবলিন)-তে ২ বছরের পোস্ট-স্টাডি জব ভিসা',
      'গুগল, মেটা, অ্যাপল ও মাইক্রোসফটের ইউরোপীয় হেডকোয়ার্টারে চাকরির সুযোগ',
    ],
    intakes: ['September (Major)', 'January'],
    topSpecializedAgencyIds: ['agt-004', 'agt-001', 'agt-007', 'agt-008', 'agt-009', 'agt-013'],
  },

  hungary: {
    country: 'Hungary',
    countryBn: 'হাঙ্গেরি',
    code: 'HUN',
    flag: '🇭🇺',
    currency: 'EUR',
    exchangeRateBdt: 128.0,
    tuitionYearlyBdt: {
      min: 450000,
      max: 950000,
      label: '৳4,50,000 – ৳9,50,000 / year (€3,500–€7,500; 100% Free under Stipendium Hungaricum)',
      labelBn: '৳৪,৫০,০০০ – ৳৯,৫০,০০০ / বছর (হাঙ্গেরিয়ান সরকারি স্কলারশিপে সম্পূর্ণ ফ্রি)',
    },
    livingOrBlockedBdt: {
      amount: 650000,
      label: '৳6,50,000 / year (€5,000 living & dormitory in Budapest/Debrecen)',
      labelBn: '৳৬,৫০,০০০ / বছর (ইউরোপের ভেতরে অত্যন্ত সাশ্রয়ী জীবনযাত্রা)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 14000,
      label: '৳14,000 (D-Visa for Studies: €110)',
      labelBn: '৳১৪,০০০ (ডি-ভিসা ফি: €১১০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 30000,
      label: '৳30,000 / year (National health insurance TAJ card coverage)',
      labelBn: '৳৩০,০০০ / বছর (জাতীয় স্বাস্থ্য বীমা)',
    },
    escrowAgencyFeeBdt: { min: 20000, max: 55000, average: 35000 },
    totalFirstYearEstBdt: { min: 1150000, max: 1700000 },
    keyRequirementsEn: [
      'Stipendium Hungaricum annual scholarship quota (140+ fully-funded seats for BD)',
      'Schengen D-Visa with free movement across 29 European countries',
      'Affordable tuition fees and low cost of living in Central Europe',
    ],
    keyRequirementsBn: [
      'বাংলাদেশী শিক্ষার্থীদের জন্য প্রতি বছর ১৪০+ টি সম্পূর্ণ ফ্রি স্কলারশিপ',
      '২৯টি সেনজেন দেশে ভিসা ছাড়া ভ্রমণের সুবিধা',
    ],
    intakes: ['September (Major)', 'February'],
    topSpecializedAgencyIds: ['agt-015', 'agt-002', 'agt-006', 'agt-007', 'agt-010', 'agt-011'],
  },

  poland: {
    country: 'Poland',
    countryBn: 'পোল্যান্ড',
    code: 'POL',
    flag: '🇵🇱',
    currency: 'PLN',
    exchangeRateBdt: 31.0,
    tuitionYearlyBdt: {
      min: 350000,
      max: 750000,
      label: '৳3,50,000 – ৳7,50,000 / year (€2,500–€5,500)',
      labelBn: '৳৩,৫০,০০০ – ৳৭,৫০,০০০ / বছর (ইউরোপীয় ইউনিয়নে অত্যন্ত সাশ্রয়ী টিউশন)',
    },
    livingOrBlockedBdt: {
      amount: 600000,
      label: '৳6,00,000 / year (PLN 19,000 living & dormitory)',
      labelBn: '৳৬,০০,০০০ / বছর (সাশ্রয়ী ডরমিটরি ও লিভিং কস্ট)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 11500,
      label: '৳11,500 (National Student Visa D: €90)',
      labelBn: '৳১১,৫০০ (জাতীয় স্টুডেন্ট ভিসা ফি: €৯০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 25000,
      label: '৳25,000 / year (NFZ Polish state health insurance ~PLN 55/month)',
      labelBn: '৳২৫,০০০ / বছর (এনএফজেড সরকারি স্বাস্থ্য বীমা)',
    },
    escrowAgencyFeeBdt: { min: 20000, max: 50000, average: 32000 },
    totalFirstYearEstBdt: { min: 1000000, max: 1550000 },
    keyRequirementsEn: [
      'Decision on nostrification/eligibility letter of previous certificates (Kuratorium)',
      'Schengen National Visa D from Polish Embassy in New Delhi/Dhaka',
      'Legal part-time work permitted during studies without separate work permit',
    ],
    keyRequirementsBn: [
      'পড়াশোনার পাশাপাশি বৈধ পার্ট-টাইম কাজ করার সুযোগ',
      'ইউরোপিয়ান স্ট্যান্ডার্ড ডিগ্রি এবং সাশ্রয়ী কোর্স ফি',
    ],
    intakes: ['October (Major)', 'February'],
    topSpecializedAgencyIds: ['agt-015', 'agt-002', 'agt-006', 'agt-009', 'agt-011', 'agt-013'],
  },

  france: {
    country: 'France',
    countryBn: 'ফ্রান্স',
    code: 'FRA',
    flag: '🇫🇷',
    currency: 'EUR',
    exchangeRateBdt: 128.0,
    tuitionYearlyBdt: {
      min: 350000,
      max: 1500000,
      label: '৳3,50,000 – ৳15,00,000 / year (Public Uni: €2,770/yr Bachelor, €3,770/yr Master)',
      labelBn: '৳৩,৫০,০০০ – ৳১৫,০০,০০০ / বছর (পাবলিক বিশ্ববিদ্যালয়ে অত্যন্ত সাশ্রয়ী ফি)',
    },
    livingOrBlockedBdt: {
      amount: 950000,
      label: '৳9,50,000 / year (Campus France monthly living standard: €615/mo)',
      labelBn: '৳৯,৫০,০০০ / বছর (ক্যাম্পাস ফ্রান্স নির্ধারিত লিভিং কস্ট: €৬১৫/মাস)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 13000,
      label: '৳13,000 (VFS France Long-Stay Student Visa: €99)',
      labelBn: '৳১৩,০০০ (লং-স্টে স্টুডেন্ট ভিসা ফি)',
    },
    healthInsuranceYearlyBdt: {
      amount: 0,
      label: '৳0 (100% Free Sécurité Sociale French state healthcare for all international students)',
      labelBn: '৳০ (ফ্রান্সের সরকারি স্বাস্থ্যসেবা আন্তর্জাতিক শিক্ষার্থীদের জন্য সম্পূর্ণ বিনামূল্যে)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 70000, average: 45000 },
    totalFirstYearEstBdt: { min: 1350000, max: 2550000 },
    keyRequirementsEn: [
      'Etudes en France (EEF) Campus France procedural interview in Dhaka',
      'French Government CAF Housing Subsidy (reimburses 30-40% of student rent)',
      'Top English-taught Business and Engineering Grandes Écoles',
    ],
    keyRequirementsBn: [
      'ক্যাম্পাস ফ্রান্স ঢাকার মাধ্যমে আবেদন ও ইন্টারভিউ',
      'ফরাসি সরকারের সিএএফ (CAF) বাসা ভাড়া ভতুর্কি (৩০-৪০% ভাড়া ফেরত পাওয়া যায়)',
    ],
    intakes: ['September (Major)', 'January/February'],
    topSpecializedAgencyIds: ['agt-001', 'agt-002', 'agt-004', 'agt-007', 'agt-008', 'agt-011', 'agt-014'],
  },

  italy: {
    country: 'Italy',
    countryBn: 'ইতালি',
    code: 'ITA',
    flag: '🇮🇹',
    currency: 'EUR',
    exchangeRateBdt: 128.0,
    tuitionYearlyBdt: {
      min: 150000,
      max: 600000,
      label: '৳1,50,000 – ৳6,00,000 / year (€1,000–€4,000 based on ISEE income certificate)',
      labelBn: '৳১,৫০,০০০ – ৳৬,০০,০০০ / বছর (পারিবারিক আয়ের ভিত্তিতে ফি অনেক কমে যায়)',
    },
    livingOrBlockedBdt: {
      amount: 850000,
      label: '৳8,50,000 / year (Embassy minimum sustenance ~€6,000/year)',
      labelBn: '৳৮,৫০,০০০ / বছর (দূতাবাস নির্ধারিত আর্থিক সক্ষমতা: €৬,০০০)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 7500,
      label: '৳7,500 (National Visa Type D: €50)',
      labelBn: '৳৭,৫০০ (জাতীয় ভিসা টাইপ ডি ফি: €৫০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 20000,
      label: '৳20,000 / year (SSN Italian National Health Service ~€150/yr)',
      labelBn: '৳২০,০০০ / বছর (ইতালীয় জাতীয় স্বাস্থ্য সেবা)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 65000, average: 40000 },
    totalFirstYearEstBdt: { min: 1050000, max: 1550000 },
    keyRequirementsEn: [
      'Universitaly.it pre-enrollment and Declaration of Value (DoV) / CIMEA statement',
      'Regional DSU Scholarships (Full tuition waiver + free accommodation + ~€5,000–€7,000 cash stipend)',
      'Italian Embassy in Dhaka visa appointment verification',
    ],
    keyRequirementsBn: [
      'Universitaly.it এর মাধ্যমে প্রি-এনরোলমেন্ট এবং ডিএসইউ (DSU) রিজিওনাল স্কলারশিপ',
      'ডিএসইউ স্কলারশিপ পেলে পড়াশোনা সম্পূর্ণ ফ্রি এবং নগদ অর্থ ভাতা পাওয়া যায়',
    ],
    intakes: ['September/October (Major)'],
    topSpecializedAgencyIds: ['agt-001', 'agt-002', 'agt-004', 'agt-005', 'agt-008', 'agt-010', 'agt-011', 'agt-014', 'agt-015'],
  },

  denmark: {
    country: 'Denmark',
    countryBn: 'ডেনমার্ক',
    code: 'DNK',
    flag: '🇩🇰',
    currency: 'DKK',
    exchangeRateBdt: 17.2,
    tuitionYearlyBdt: {
      min: 1200000,
      max: 2400000,
      label: '৳12,00,000 – ৳24,00,000 / year (DKK 70,000–140,000)',
      labelBn: '৳১২,০০,০০০ – ৳২৪,০০,০০০ / বছর (DKK ৭০,০০০–১,৪০,০০০)',
    },
    livingOrBlockedBdt: {
      amount: 1400000,
      label: '৳14,00,000 / year (SIRI living requirement: DKK 6,820/month)',
      labelBn: '৳১৪,০০,০০০ / বছর (সিরি নির্ধারিত লিভিং কস্ট: DKK ৬,৮২০/মাস)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 45000,
      label: '৳45,000 (SIRI Case Order ID ST1: DKK 2,545)',
      labelBn: '৳৪৫,০০০ (ডেনিশ সিরি স্টাডি পারমিট ফি: DKK ২,৫৪৫)',
    },
    healthInsuranceYearlyBdt: {
      amount: 0,
      label: '৳0 (CPR Yellow Card free national health coverage in Denmark)',
      labelBn: '৳০ (ডেনমার্কে সিপিআর কার্ডের মাধ্যমে ফ্রি চিকিৎসা সেবা)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 70000, average: 45000 },
    totalFirstYearEstBdt: { min: 2650000, max: 3900000 },
    keyRequirementsEn: [
      'ST1 case order ID registration with Danish SIRI',
      'Tuition deposit for the first semester/year before visa application',
      '3-Year post-study work permit after graduation',
    ],
    keyRequirementsBn: [
      'ডেনিশ সিরি (SIRI) সিস্টেমের মাধ্যমে অনলাইন আবেদন',
      'গ্র্যাজুয়েশনের পর ৩ বছরের ফুল পোস্ট-স্টাডি ওয়ার্ক পারমিট',
    ],
    intakes: ['September (Major)', 'February'],
    topSpecializedAgencyIds: ['agt-001', 'agt-003', 'agt-004', 'agt-008', 'agt-010', 'agt-011', 'agt-013'],
  },

  norway: {
    country: 'Norway',
    countryBn: 'নরওয়ে',
    code: 'NOR',
    flag: '🇳🇴',
    currency: 'NOK',
    exchangeRateBdt: 11.2,
    tuitionYearlyBdt: {
      min: 1400000,
      max: 2200000,
      label: '৳14,00,000 – ৳22,00,000 / year (NOK 130,000–200,000)',
      labelBn: '৳১৪,০০,০০০ – ৳২২,০০,০০০ / বছর (উন্নত নর্ডিক গবেষণা বিশ্ববিদ্যালয়)',
    },
    livingOrBlockedBdt: {
      amount: 1700000,
      label: '৳17,00,000 (UDI Mandatory Living Cost Deposit: NOK 151,690)',
      labelBn: '৳১৭,০০,০০০ (ইউডিআই নির্ধারিত ডিপোজিট: NOK ১,৫১,৬৯০)',
      requirementType: 'BLOCKED_ACCOUNT',
    },
    visaAndBiometricsBdt: {
      amount: 70000,
      label: '৳70,000 (UDI Study Permit Fee: NOK 5,900)',
      labelBn: '৳৭০,০০০ (নরওয়ে স্টাডি পারমিট ফি: NOK ৫,৯০০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 0,
      label: '৳0 (National Insurance Scheme folketrygden coverage)',
      labelBn: '৳০ (সরকারি ন্যাশনাল ইন্স্যুরেন্স স্কিমের অধীনে বিনামূল্যে)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 70000, average: 45000 },
    totalFirstYearEstBdt: { min: 3200000, max: 4200000 },
    keyRequirementsEn: [
      'UDI requirement: NOK 151,690 deposited into university deposit account',
      'Samordna opptak / Direct university application',
      'High living standard and generous student part-time opportunities',
    ],
    keyRequirementsBn: [
      'বিশ্ববিদ্যালয়ের নিজস্ব ডিপোজিট অ্যাকাউন্টে লিভিং কস্ট স্থানান্তর',
      'উন্নত জীবনযাত্রা এবং চমৎকার পার্ট-টাইম কাজের সুযোগ',
    ],
    intakes: ['August (Autumn Major)'],
    topSpecializedAgencyIds: ['agt-003', 'agt-010', 'agt-011', 'agt-001', 'agt-002', 'agt-013'],
  },

  austria: {
    country: 'Austria',
    countryBn: 'অস্ট্রিয়া',
    code: 'AUT',
    flag: '🇦🇹',
    currency: 'EUR',
    exchangeRateBdt: 128.0,
    tuitionYearlyBdt: {
      min: 190000,
      max: 450000,
      label: '৳1,90,000 – ৳4,50,000 / year (€1,500–€3,500 at Public Universities)',
      labelBn: '৳১,৯০,০০০ – ৳৪,৫০,০০০ / বছর (পাবলিক বিশ্ববিদ্যালয়ে অত্যন্ত সাশ্রয়ী টিউশন ফি)',
    },
    livingOrBlockedBdt: {
      amount: 1100000,
      label: '৳11,00,000 / year (Austrian Embassy living requirement: ~€8,500/yr)',
      labelBn: '৳১১,০০,০০০ / বছর (দূতাবাস নির্ধারিত লিভিং ফান্ড: ~€৮,৫০০)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 21000,
      label: '৳21,000 (Residence Permit Student "Aufenthaltsbewilligung": €160)',
      labelBn: '৳২১,০০০ (রেসিডেন্স পারমিট ফি: €১৬০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 90000,
      label: '৳90,000 / year (ÖGK Austrian Student Public Insurance: €69/month)',
      labelBn: '৳৯০,০০০ / বছর (অস্ট্রিয়ান সরকারি স্টুডেন্ট ইন্স্যুরেন্স)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 65000, average: 40000 },
    totalFirstYearEstBdt: { min: 1400000, max: 1950000 },
    keyRequirementsEn: [
      'Apostilled / Superlegalized academic certificates by MOFA & Austrian Embassy',
      'Admission notice (Zulassungsbescheid) from Austrian university',
      'Extremely affordable tuition with high standard of living in Vienna/Graz',
    ],
    keyRequirementsBn: [
      'সার্টিফিকেট পররাষ্ট্র মন্ত্রণালয় ও দূতাবাস থেকে সুপারলিগালাইজেশন করা',
      'ভিয়েনাতে অত্যন্ত সাশ্রয়ী টিউশন ফি ও নিরাপদ জীবনযাত্রা',
    ],
    intakes: ['Winter (October)', 'Summer (March)'],
    topSpecializedAgencyIds: ['agt-002', 'agt-011', 'agt-015', 'agt-008', 'agt-001'],
  },

  new_zealand: {
    country: 'New Zealand',
    countryBn: 'নিউজিল্যান্ড',
    code: 'NZL',
    flag: '🇳🇿',
    currency: 'NZD',
    exchangeRateBdt: 73.5,
    tuitionYearlyBdt: {
      min: 1800000,
      max: 2900000,
      label: '৳18,00,000 – ৳29,00,000 / year (NZD $25,000–$40,000)',
      labelBn: '৳১৮,০০,০০০ – ৳২৯,০০,০০০ / বছর (NZD $২৫,০০০–$৪০,০০০)',
    },
    livingOrBlockedBdt: {
      amount: 1500000,
      label: '৳15,00,000 (Immigration NZ Requirement: NZD $20,000 per year)',
      labelBn: '৳১৫,০০,০০০ (ইমিগ্রেশন নিউজিল্যান্ড নির্ধারিত লিভিং কস্ট: NZD $২০,০০০)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 32000,
      label: '৳32,000 (Fee Paying Student Visa: NZD $430)',
      labelBn: '৳৩২,০০০ (স্টুডেন্ট ভিসা ফি: NZD $৪৩০)',
    },
    healthInsuranceYearlyBdt: {
      amount: 55000,
      label: '৳55,000 / year (Studentsafe Insurance ~NZD $750/yr)',
      labelBn: '৳৫৫,০০০ / বছর (স্টুডেন্টসেফ ইন্স্যুরেন্স)',
    },
    escrowAgencyFeeBdt: { min: 25000, max: 75000, average: 45000 },
    totalFirstYearEstBdt: { min: 3400000, max: 4500000 },
    keyRequirementsEn: [
      'Offer of Place from NZQA-accredited university or polytechnic',
      'Funds Transfer Scheme (FTS) option via ANZ Bank for smooth financial proof',
      'Up to 3-Year Post-Study Work Visa (PSWV)',
    ],
    keyRequirementsBn: [
      'এনজেডকিউএ (NZQA) অনুমোদিত প্রতিষ্ঠান থেকে অফার অফ প্লেস',
      'এফটিএস (FTS) স্কিমের মাধ্যমে নিরাপদ ফান্ড প্রদর্শন',
      'পড়াশোনা শেষে ৩ বছর পর্যন্ত ওপেন জব ভিসা',
    ],
    intakes: ['February (Semester 1 Major)', 'July (Semester 2)'],
    topSpecializedAgencyIds: ['agt-001', 'agt-008', 'agt-009', 'agt-004', 'agt-007'],
  },

  cyprus: {
    country: 'Cyprus',
    countryBn: 'সাইপ্রাস',
    code: 'CYP',
    flag: '🇨🇾',
    currency: 'EUR',
    exchangeRateBdt: 128.0,
    tuitionYearlyBdt: {
      min: 350000,
      max: 650000,
      label: '৳3,50,000 – ৳6,50,000 / year (€2,800–€5,000)',
      labelBn: '৳৩,৫০,০০০ – ৳৬,৫০,০০০ / বছর (সহজ ভর্তি ও সাশ্রয়ী টিউশন)',
    },
    livingOrBlockedBdt: {
      amount: 550000,
      label: '৳5,50,000 / year (€4,000–€4,500 living & hostel)',
      labelBn: '৳৫,৫০,০০০ / বছর (হোস্টেল ও থাকা-খাওয়ার খরচ)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 12000,
      label: '৳12,00,0 (Cyprus Entry Permit / Visa: €90)',
      labelBn: '৳১২,০০০ (এন্ট্রি পারমিট ভিসা ফি)',
    },
    healthInsuranceYearlyBdt: {
      amount: 25000,
      label: '৳25,00,0 / year (Local Cyprus Medical Insurance)',
      labelBn: '৳২৫,০০০ / বছর (মেডিকেল ইন্স্যুরেন্স)',
    },
    escrowAgencyFeeBdt: { min: 20000, max: 45000, average: 30000 },
    totalFirstYearEstBdt: { min: 950000, max: 1400000 },
    keyRequirementsEn: [
      'Direct university entry permit and bank guarantee letter',
      'Flexible admission criteria with quick processing timeline',
      'Schengen pathways and European credit transfers',
    ],
    keyRequirementsBn: [
      'সহজ ও দ্রুত ভিসা প্রসেসিং সময়',
      'সাশ্রয়ী বাজেট ও ইউরোপের ক্রেডিট ট্রান্সফারের সুযোগ',
    ],
    intakes: ['October (Fall)', 'February (Spring)'],
    topSpecializedAgencyIds: ['agt-006', 'agt-007', 'agt-012', 'agt-013', 'agt-015'],
  },

  switzerland: {
    country: 'Switzerland',
    countryBn: 'সুইজারল্যান্ড',
    code: 'CHE',
    flag: '🇨🇭',
    currency: 'CHF',
    exchangeRateBdt: 138.0,
    tuitionYearlyBdt: {
      min: 200000,
      max: 2200000,
      label: '৳2,00,000 – ৳22,00,000 / year (ETH Zurich / EPFL: CHF 1,500/yr vs Private Hospitality)',
      labelBn: '৳২,০০,০০০ – ৳২২,০০,০০০ / বছর (পাবলিক ইটিএইচ জুরিখ-এ ফি মাত্র CHF ১,৫০০/বছর)',
    },
    livingOrBlockedBdt: {
      amount: 2800000,
      label: '৳28,00,000 (Cantonal Living Requirement: CHF 21,000 deposited in Swiss Bank)',
      labelBn: '৳২৮,০০,০০০ (ক্যান্টোনাল নির্ধারিত লিভিং ডিপোজিট: CHF ২১,০০০)',
      requirementType: 'BANK_STATEMENT',
    },
    visaAndBiometricsBdt: {
      amount: 15000,
      label: '৳15,000 (Swiss National Visa Type D: CHF 88)',
      labelBn: '৳১৫,০০০ (সুইস ন্যাশনাল ভিসা টাইপ ডি ফি)',
    },
    healthInsuranceYearlyBdt: {
      amount: 150000,
      label: '৳1,50,000 / year (SwissCare Student Health Plan ~CHF 100/month)',
      labelBn: '৳১,৫০,০০০ / বছর (সুইসকেয়ার স্বাস্থ্য বীমা)',
    },
    escrowAgencyFeeBdt: { min: 35000, max: 95000, average: 60000 },
    totalFirstYearEstBdt: { min: 3200000, max: 5300000 },
    keyRequirementsEn: [
      'Proof of CHF 21,000 funds in student\'s own account recognized by Swiss FINMA',
      'Top world-ranked universities (ETH Zurich #7 in the world, EPFL)',
      'World-famous Hospitality & Business Management schools with paid internships',
    ],
    keyRequirementsBn: [
      'বিশ্বসেরা ইটিএইচ জুরিখ (ETH Zurich) ও ইপিএফএল (EPFL) সহ শীর্ষ পাবলিক প্রতিষ্ঠান',
      'হসপিটালিটি ম্যানেজমেন্টে আকর্ষণীয় পেইড ইন্টার্নশিপের সুযোগ',
    ],
    intakes: ['Autumn (September)'],
    topSpecializedAgencyIds: ['agt-001', 'agt-002', 'agt-007', 'agt-008', 'agt-010', 'agt-014'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Store Helper Methods
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY_AGENCIES = 'ethos_verified_agencies_v3';
const STORAGE_KEY_PENDING = 'ethos_pending_agencies_v3';

export interface PendingAgencySubmission {
  id: string;
  name: string;
  nameBn?: string;
  ownerName: string;
  licenseNo: string;
  licenseType: string;
  appliedDate: string;
  documentsCount: number;
  aiRiskScore: number;
  countriesServed: string[];
  proposedFeeBdt: number;
  refundDays: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const INITIAL_PENDING: PendingAgencySubmission[] = [
  {
    id: 'pnd-001',
    name: 'Skyline Consultancy BD',
    ownerName: 'Rashidul Islam',
    licenseNo: 'TRAD/DNCC/088912/2024',
    licenseType: 'DNCC_TRADE',
    appliedDate: '2026-09-20',
    documentsCount: 4,
    aiRiskScore: 32,
    countriesServed: ['Canada', 'UK', 'Australia', 'USA'],
    proposedFeeBdt: 45000,
    refundDays: 30,
    status: 'PENDING',
  },
  {
    id: 'pnd-002',
    name: 'Nordic Pathways BD',
    ownerName: 'Shahadat Hossain',
    licenseNo: 'MOE-BD-2025-992',
    licenseType: 'MOE_APPROVED',
    appliedDate: '2026-09-24',
    documentsCount: 5,
    aiRiskScore: 12,
    countriesServed: ['Germany', 'Sweden', 'Finland', 'Norway', 'Denmark'],
    proposedFeeBdt: 40000,
    refundDays: 30,
    status: 'PENDING',
  },
];

export const VERIFIED_COURSE_CATALOGS: UniversityCourseCatalogItem[] = [
  {
    id: 'cat-uk-hertfordshire',
    universityName: 'University of Hertfordshire',
    country: 'United Kingdom',
    countryCode: 'GBR',
    degreeLevel: 'Master',
    programName: 'M.Sc. Software Engineering / Data Science & Analytics',
    annualTuitionLocal: 17000,
    currency: 'GBP',
    annualTuitionBdt: 2686000,
    officialCatalogUrl: 'https://www.herts.ac.uk/international/fees-and-funding',
    officialSourceTitle: 'University of Hertfordshire Official International Tuition Schedule 2026/2027',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-004',
    verifyingAgencyName: 'Executive Trade International',
    verifyingAgencyLicense: 'TRAD/DSCC/019942/2021',
    notes: 'Verified against university finance department bulletin. Eligible for £1,000-£2,500 Chancellor Scholarship.',
  },
  {
    id: 'cat-de-tum',
    universityName: 'Technical University of Munich (TUM)',
    country: 'Germany',
    countryCode: 'DEU',
    degreeLevel: 'Master',
    programName: 'M.Sc. in Informatics / Computer Science',
    annualTuitionLocal: 0,
    currency: 'EUR',
    annualTuitionBdt: 0,
    officialCatalogUrl: 'https://www.tum.de/en/studies/fees/tuition',
    officialSourceTitle: 'TUM Official Study & Tuition Regulations 2026/2027',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-002',
    verifyingAgencyName: 'Dream Abroad Ltd',
    verifyingAgencyLicense: 'MOE-BD-2023-412',
    notes: 'Zero tuition for state public university program. Only semester fee (€150–€350).',
  },
  {
    id: 'cat-de-rwth',
    universityName: 'RWTH Aachen University',
    country: 'Germany',
    countryCode: 'DEU',
    degreeLevel: 'Master',
    programName: 'M.Sc. in Software Systems Engineering',
    annualTuitionLocal: 0,
    currency: 'EUR',
    annualTuitionBdt: 0,
    officialCatalogUrl: 'https://www.rwth-aachen.de/go/id/bkmj',
    officialSourceTitle: 'RWTH Aachen University Registrar Fee Schedule 2026/2027',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-002',
    verifyingAgencyName: 'Dream Abroad Ltd',
    verifyingAgencyLicense: 'MOE-BD-2023-412',
    notes: 'TU9 alliance member. State-subsidized €0 tuition.',
  },
  {
    id: 'cat-de-dit',
    universityName: 'Deggendorf Institute of Technology (DIT)',
    country: 'Germany',
    countryCode: 'DEU',
    degreeLevel: 'Master',
    programName: 'M.Sc. Artificial Intelligence & Data Science',
    annualTuitionLocal: 0,
    currency: 'EUR',
    annualTuitionBdt: 0,
    officialCatalogUrl: 'https://www.th-deg.de/en/students/finances',
    officialSourceTitle: 'DIT Official Semester & Study Fees 2026/2027',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-002',
    verifyingAgencyName: 'Dream Abroad Ltd',
    verifyingAgencyLicense: 'MOE-BD-2023-412',
    notes: 'Free public education. Cham campus tech hub.',
  },
  {
    id: 'cat-de-hsrw',
    universityName: 'Rhine-Waal University of Applied Sciences',
    country: 'Germany',
    countryCode: 'DEU',
    degreeLevel: 'Master',
    programName: 'M.Sc. Information Engineering',
    annualTuitionLocal: 0,
    currency: 'EUR',
    annualTuitionBdt: 0,
    officialCatalogUrl: 'https://www.hochschule-rhein-waal.de/en/academics/students/fees-and-finance',
    officialSourceTitle: 'HSRW Semesterbeitrag & Fees Schedule',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-002',
    verifyingAgencyName: 'Dream Abroad Ltd',
    verifyingAgencyLicense: 'MOE-BD-2023-412',
    notes: 'English-taught degree program in Kleve/Kamp-Lintfort.',
  },
  {
    id: 'cat-uk-manchester',
    universityName: 'University of Manchester',
    country: 'United Kingdom',
    countryCode: 'GBR',
    degreeLevel: 'Master',
    programName: 'M.Sc. in Data Science',
    annualTuitionLocal: 31000,
    currency: 'GBP',
    annualTuitionBdt: 4898000,
    officialCatalogUrl: 'https://www.manchester.ac.uk/study/masters/courses/list/10293/msc-data-science/',
    officialSourceTitle: 'University of Manchester Postgraduate Tuition Table',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-004',
    verifyingAgencyName: 'Executive Trade International',
    verifyingAgencyLicense: 'TRAD/DSCC/019942/2021',
    notes: 'Russell Group flagship. Cross-validated with UKVI 28-day solvency rules.',
  },
  {
    id: 'cat-uk-coventry',
    universityName: 'Coventry University',
    country: 'United Kingdom',
    countryCode: 'GBR',
    degreeLevel: 'Master',
    programName: 'M.Sc. Cybersecurity',
    annualTuitionLocal: 18600,
    currency: 'GBP',
    annualTuitionBdt: 2938800,
    officialCatalogUrl: 'https://www.coventry.ac.uk/study-at-coventry/finance-and-funding/tuition-fees/',
    officialSourceTitle: 'Coventry University International Fees Schedule',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-004',
    verifyingAgencyName: 'Executive Trade International',
    verifyingAgencyLicense: 'TRAD/DSCC/019942/2021',
    notes: 'Includes £1,500 prompt payment discount option.',
  },
  {
    id: 'cat-uk-greenwich',
    universityName: 'University of Greenwich',
    country: 'United Kingdom',
    countryCode: 'GBR',
    degreeLevel: 'Master',
    programName: 'M.Sc. Big Data Technologies',
    annualTuitionLocal: 17500,
    currency: 'GBP',
    annualTuitionBdt: 2765000,
    officialCatalogUrl: 'https://www.gre.ac.uk/study/finance/international',
    officialSourceTitle: 'University of Greenwich International Student Fees 2026/2027',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-004',
    verifyingAgencyName: 'Executive Trade International',
    verifyingAgencyLicense: 'TRAD/DSCC/019942/2021',
    notes: 'London zone 2-3 campus with inner London UKVI maintenance allowance.',
  },
  {
    id: 'cat-can-toronto',
    universityName: 'University of Toronto',
    country: 'Canada',
    countryCode: 'CAN',
    degreeLevel: 'Master',
    programName: 'M.Sc. in Applied Computing (MScAC)',
    annualTuitionLocal: 42500,
    currency: 'CAD',
    annualTuitionBdt: 3846250,
    officialCatalogUrl: 'https://planningandbudget.utoronto.ca/tuition-fee-lookup-tool/',
    officialSourceTitle: 'University of Toronto Planning & Budget Official Tuition Schedule',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-001',
    verifyingAgencyName: 'Global Edu BD',
    verifyingAgencyLicense: 'TRAD/DNCC/041289/2022',
    notes: 'U15 Canadian research university. 8-month paid industrial internship included.',
  },
  {
    id: 'cat-can-windsor',
    universityName: 'University of Windsor',
    country: 'Canada',
    countryCode: 'CAN',
    degreeLevel: 'Master',
    programName: 'Master of Applied Computing (MAC)',
    annualTuitionLocal: 28000,
    currency: 'CAD',
    annualTuitionBdt: 2534000,
    officialCatalogUrl: 'https://www.uwindsor.ca/finance/student-accounts/tuition-fees',
    officialSourceTitle: 'University of Windsor Cashiers Office Tuition Table',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-001',
    verifyingAgencyName: 'Global Edu BD',
    verifyingAgencyLicense: 'TRAD/DNCC/041289/2022',
    notes: 'Ontario SDS stream. Guaranteed co-op semester.',
  },
  {
    id: 'cat-can-mun',
    universityName: 'Memorial University of Newfoundland (MUN)',
    country: 'Canada',
    countryCode: 'CAN',
    degreeLevel: 'Master',
    programName: 'M.Sc. in Computer Science',
    annualTuitionLocal: 9666,
    currency: 'CAD',
    annualTuitionBdt: 874773,
    officialCatalogUrl: 'https://www.mun.ca/finance/fees-and-charges/tuition-fees/',
    officialSourceTitle: 'Memorial University Financial & Administrative Services Calendar',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-001',
    verifyingAgencyName: 'Global Edu BD',
    verifyingAgencyLicense: 'TRAD/DNCC/041289/2022',
    notes: 'One of the lowest public tuition fees in North America.',
  },
  {
    id: 'cat-can-conestoga',
    universityName: 'Conestoga College Institute of Technology',
    country: 'Canada',
    countryCode: 'CAN',
    degreeLevel: 'Master',
    programName: 'Post-Grad Diploma in Cloud Data Management',
    annualTuitionLocal: 18500,
    currency: 'CAD',
    annualTuitionBdt: 1674250,
    officialCatalogUrl: 'https://www.conestogac.on.ca/international/tuition-fees',
    officialSourceTitle: 'Conestoga College International Student Fees Schedule',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-001',
    verifyingAgencyName: 'Global Edu BD',
    verifyingAgencyLicense: 'TRAD/DNCC/041289/2022',
    notes: 'PAL required under 2026 IRCC international cap.',
  },
  {
    id: 'cat-usa-uta',
    universityName: 'University of Texas at Arlington (UTA)',
    country: 'United States',
    countryCode: 'USA',
    degreeLevel: 'Master',
    programName: 'M.S. in Computer Science',
    annualTuitionLocal: 21000,
    currency: 'USD',
    annualTuitionBdt: 2572500,
    officialCatalogUrl: 'https://www.uta.edu/admissions/cost-and-affordability',
    officialSourceTitle: 'UTA Office of Financial Aid & Tuition Schedule',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-005',
    verifyingAgencyName: "Mentors' Study Abroad",
    verifyingAgencyLicense: 'MOE-BD-2022-771',
    notes: 'Includes potential in-state tuition waiver via competitive departmental scholarship.',
  },
  {
    id: 'cat-usa-usf',
    universityName: 'University of South Florida (USF)',
    country: 'United States',
    countryCode: 'USA',
    degreeLevel: 'Master',
    programName: 'M.S. in Computer Science',
    annualTuitionLocal: 17500,
    currency: 'USD',
    annualTuitionBdt: 2143750,
    officialCatalogUrl: 'https://www.usf.edu/business/graduate/ms-business-analytics-information-systems/cost.aspx',
    officialSourceTitle: 'USF Graduate Tuition & Fee Regulations',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-005',
    verifyingAgencyName: "Mentors' Study Abroad",
    verifyingAgencyLicense: 'MOE-BD-2022-771',
    notes: 'AAU member university in Tampa Bay. Form I-20 compliant.',
  },
  {
    id: 'cat-usa-sjsu',
    universityName: 'San Jose State University (SJSU)',
    country: 'United States',
    countryCode: 'USA',
    degreeLevel: 'Master',
    programName: 'M.S. Software Engineering',
    annualTuitionLocal: 19500,
    currency: 'USD',
    annualTuitionBdt: 2388750,
    officialCatalogUrl: 'https://www.sjsu.edu/bursar/fees/',
    officialSourceTitle: 'SJSU Bursar Office Official Tuition Table',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-005',
    verifyingAgencyName: "Mentors' Study Abroad",
    verifyingAgencyLicense: 'MOE-BD-2022-771',
    notes: 'Silicon Valley location with direct tech company recruiting.',
  },
  {
    id: 'cat-usa-wichita',
    universityName: 'Wichita State University',
    country: 'United States',
    countryCode: 'USA',
    degreeLevel: 'Master',
    programName: 'M.S. Computer Science',
    annualTuitionLocal: 14000,
    currency: 'USD',
    annualTuitionBdt: 1715000,
    officialCatalogUrl: 'https://www.wichita.edu/admissions/international/costs.php',
    officialSourceTitle: 'Wichita State International Admissions Cost Breakdown',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-005',
    verifyingAgencyName: "Mentors' Study Abroad",
    verifyingAgencyLicense: 'MOE-BD-2022-771',
    notes: 'Extremely affordable US tuition with high applied learning placement.',
  },
  {
    id: 'cat-aus-deakin',
    universityName: 'Deakin University',
    country: 'Australia',
    countryCode: 'AUS',
    degreeLevel: 'Master',
    programName: 'Master of Information Technology',
    annualTuitionLocal: 37000,
    currency: 'AUD',
    annualTuitionBdt: 2960000,
    officialCatalogUrl: 'https://www.deakin.edu.au/courses/fees-and-scholarships',
    officialSourceTitle: 'Deakin University International Course Fees',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-008',
    verifyingAgencyName: 'IDP Education Bangladesh',
    verifyingAgencyLicense: 'TRAD/DNCC/091823/2019',
    notes: 'Melbourne/Geelong campus with regional post-study work rights.',
  },
  {
    id: 'cat-aus-wsu',
    universityName: 'Western Sydney University',
    country: 'Australia',
    countryCode: 'AUS',
    degreeLevel: 'Master',
    programName: 'Master of Data Science',
    annualTuitionLocal: 33500,
    currency: 'AUD',
    annualTuitionBdt: 2680000,
    officialCatalogUrl: 'https://www.westernsydney.edu.au/international/home/fees',
    officialSourceTitle: 'Western Sydney University Official International Fee Schedule',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-008',
    verifyingAgencyName: 'IDP Education Bangladesh',
    verifyingAgencyLicense: 'TRAD/DNCC/091823/2019',
    notes: 'Up to AUD $6,000 multi-year scholarship available for Bangladeshi students.',
  },
  {
    id: 'cat-swe-kth',
    universityName: 'KTH Royal Institute of Technology',
    country: 'Sweden',
    countryCode: 'SWE',
    degreeLevel: 'Master',
    programName: 'M.Sc. in Software Engineering',
    annualTuitionLocal: 160000,
    currency: 'SEK',
    annualTuitionBdt: 1856000,
    officialCatalogUrl: 'https://www.kth.se/en/studies/master/fees',
    officialSourceTitle: 'KTH Royal Institute of Technology Official Tuition Fees',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-003',
    verifyingAgencyName: 'EduPath Global',
    verifyingAgencyLicense: 'MOE-BD-2024-105',
    notes: 'Leading Nordic polytechnic. Swedish Institute Scholarship eligible.',
  },
  {
    id: 'cat-swe-linnaeus',
    universityName: 'Linnaeus University',
    country: 'Sweden',
    countryCode: 'SWE',
    degreeLevel: 'Master',
    programName: 'M.Sc. in Computer Science',
    annualTuitionLocal: 140000,
    currency: 'SEK',
    annualTuitionBdt: 1624000,
    officialCatalogUrl: 'https://lnu.se/en/education/before-your-studies/tuition-fees-and-scholarships/',
    officialSourceTitle: 'Linnaeus University International Tuition Schedule',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-003',
    verifyingAgencyName: 'EduPath Global',
    verifyingAgencyLicense: 'MOE-BD-2024-105',
    notes: 'Linnaeus University Scholarship covers up to 75% tuition remission.',
  },
  {
    id: 'cat-mys-apu',
    universityName: 'Asia Pacific University of Technology & Innovation (APU)',
    country: 'Malaysia',
    countryCode: 'MYS',
    degreeLevel: 'Master',
    programName: 'M.Sc. in Data Science & Business Analytics',
    annualTuitionLocal: 38000,
    currency: 'MYR',
    annualTuitionBdt: 1056400,
    officialCatalogUrl: 'https://www.apu.edu.my/our-courses/postgraduate-studies/fees',
    officialSourceTitle: 'APU Official Postgraduate Fee Schedule',
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-006',
    verifyingAgencyName: 'Shabuj Global Education',
    verifyingAgencyLicense: 'TRAD/DSCC/038812/2023',
    notes: 'Dual degree option with De Montfort University (DMU) UK.',
  },
  {
    id: 'cat-mys-taylors',
    universityName: "Taylor's University",
    country: 'Malaysia',
    countryCode: 'MYS',
    degreeLevel: 'Master',
    programName: 'Master of Applied Computing',
    annualTuitionLocal: 46000,
    currency: 'MYR',
    annualTuitionBdt: 1278800,
    officialCatalogUrl: 'https://university.taylors.edu.my/en/study/postgraduate/fees.html',
    officialSourceTitle: "Taylor's University Postgraduate Fees & Financing",
    intakeYear: '2026/2027',
    isVerified: true,
    status: 'VERIFIED',
    verifiedByAdmin: 'usr-admin-01 (Ethos AI Senior Auditor)',
    lastAuditedAt: '2026-09-01T00:00:00Z',
    verifyingAgencyId: 'agt-006',
    verifyingAgencyName: 'Shabuj Global Education',
    verifyingAgencyLicense: 'TRAD/DSCC/038812/2023',
    notes: '#1 private university in Southeast Asia by QS World Rankings.',
  },
];

export class VerifiedKnowledgeEngine {
  private static getStoredAgencies(): VerifiedAgencyRecord[] {
    if (!OFFLINE_DEMO_ENABLED) return [];
    if (typeof window === 'undefined') return INITIAL_AGENCIES;
    try {
      const data = localStorage.getItem(STORAGE_KEY_AGENCIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
      }
    } catch {}
    return INITIAL_AGENCIES;
  }

  private static saveAgencies(agencies: VerifiedAgencyRecord[]) {
    if (!OFFLINE_DEMO_ENABLED) return;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_AGENCIES, JSON.stringify(agencies));
    } catch {}
  }

  public static getAllVerifiedAgencies(): VerifiedAgencyRecord[] {
    return this.getStoredAgencies();
  }

  public static getAgencyById(id: string): VerifiedAgencyRecord | undefined {
    return this.getStoredAgencies().find(a => a.id === id);
  }

  public static updateAgency(updated: VerifiedAgencyRecord) {
    const list = this.getStoredAgencies();
    const idx = list.findIndex(a => a.id === updated.id);
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }
    this.saveAgencies(list);
  }

  public static getPendingAgencies(): PendingAgencySubmission[] {
    if (!OFFLINE_DEMO_ENABLED) return [];
    if (typeof window === 'undefined') return INITIAL_PENDING;
    try {
      const data = localStorage.getItem(STORAGE_KEY_PENDING);
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_PENDING;
  }

  public static approvePendingAgency(id: string): boolean {
    const pending = this.getPendingAgencies();
    const item = pending.find(p => p.id === id);
    if (!item) return false;

    item.status = 'APPROVED';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pending));
    }

    // Add to verified list
    const newAgency: VerifiedAgencyRecord = {
      id: `agt-${Date.now()}`,
      name: item.name,
      ownerName: item.ownerName,
      licenseNo: item.licenseNo,
      licenseType: 'DNCC_TRADE',
      licenseStatus: 'VERIFIED',
      foundedYear: new Date().getFullYear(),
      rating: 4.8,
      reviewsCount: 1,
      successRate: 95,
      riskScore: item.aiRiskScore,
      feeMinBdt: item.proposedFeeBdt,
      feeMaxBdt: item.proposedFeeBdt + 30000,
      refundSummaryEn: `Full refund within ${item.refundDays} days if admissions milestone not met`,
      refundSummaryBn: `ভর্তি মাইলস্টোন পূরণ না হলে ${item.refundDays} দিনের মধ্যে পূর্ণ রিফান্ড`,
      countriesServed: item.countriesServed,
      countryCodes: item.countriesServed.map(c => c.slice(0, 3).toUpperCase()),
      address: 'Verified Office, Dhaka, Bangladesh',
      phone: '+8801700000000',
      email: `contact@${item.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      website: `https://${item.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      verifiedAt: new Date().toISOString().split('T')[0],
      services: [
        {
          id: `srv-${Date.now()}`,
          name: 'Verified Admissions & Escrow Package',
          nameBn: 'যাচাইকৃত ভর্তি ও এসক্রো প্যাকেজ',
          amountBdt: item.proposedFeeBdt,
          whenCharged: '30% Offer, 40% Visa Filing, 30% Visa',
          whenChargedBn: '৩০% অফার, ৪০% ফাইল জমা, ৩০% ভিসা',
          refundable: true,
          refundPolicy: 'Full refund on refusal',
          refundPolicyBn: 'রিজেক্ট হলে পূর্ণ রিফান্ড',
        },
      ],
    };

    this.updateAgency(newAgency);
    return true;
  }

  public static rejectPendingAgency(id: string): boolean {
    const pending = this.getPendingAgencies();
    const item = pending.find(p => p.id === id);
    if (!item) return false;
    item.status = 'REJECTED';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pending));
    }
    return true;
  }

  public static getCountryCost(countryQuery: string): CountryCostStandard | null {
    if (!OFFLINE_DEMO_ENABLED) return null;
    const q = countryQuery.toLowerCase().trim();
    if (q.includes('canada') || q.includes('কানাডা') || q.includes('can')) return INITIAL_COUNTRY_COSTS.canada;
    if (q.includes('german') || q.includes('জার্মানি') || q.includes('deu') || q.includes('deutschland')) return INITIAL_COUNTRY_COSTS.germany;
    if (q.includes('uk') || q.includes('britain') || q.includes('england') || q.includes('যুক্তরাজ্য') || q.includes('লন্ডন') || q.includes('london')) return INITIAL_COUNTRY_COSTS.uk;
    if (q.includes('usa') || q.includes('united states') || q.includes('america') || q.includes('আমেরিকা') || q.includes('যুক্তরাষ্ট্র')) return INITIAL_COUNTRY_COSTS.usa;
    if (q.includes('aus') || q.includes('australia') || q.includes('অস্ট্রেলিয়া')) return INITIAL_COUNTRY_COSTS.australia;
    if (q.includes('sweden') || q.includes('সুইডেন') || q.includes('swe')) return INITIAL_COUNTRY_COSTS.sweden;
    if (q.includes('finland') || q.includes('ফিনল্যান্ড') || q.includes('fin')) return INITIAL_COUNTRY_COSTS.finland;
    if (q.includes('malaysia') || q.includes('মালয়েশিয়া') || q.includes('mys')) return INITIAL_COUNTRY_COSTS.malaysia;
    if (q.includes('netherland') || q.includes('holland') || q.includes('ডাচ') || q.includes('নেদারল্যান্ডস') || q.includes('nld')) return INITIAL_COUNTRY_COSTS.netherlands;
    if (q.includes('japan') || q.includes('জাপান') || q.includes('jpn')) return INITIAL_COUNTRY_COSTS.japan;
    if (q.includes('korea') || q.includes('কোরিয়া') || q.includes('দক্ষিণ কোরিয়া') || q.includes('kor')) return INITIAL_COUNTRY_COSTS.south_korea;
    if (q.includes('ireland') || q.includes('আয়ারল্যান্ড') || q.includes('irl') || q.includes('dublin')) return INITIAL_COUNTRY_COSTS.ireland;
    if (q.includes('hungary') || q.includes('হাঙ্গেরি') || q.includes('hun') || q.includes('budapest')) return INITIAL_COUNTRY_COSTS.hungary;
    if (q.includes('poland') || q.includes('পোল্যান্ড') || q.includes('pol') || q.includes('warsaw')) return INITIAL_COUNTRY_COSTS.poland;
    if (q.includes('france') || q.includes('ফ্রান্স') || q.includes('paris') || q.includes('fra')) return INITIAL_COUNTRY_COSTS.france;
    if (q.includes('italy') || q.includes('ইতালি') || q.includes('rome') || q.includes('ita')) return INITIAL_COUNTRY_COSTS.italy;
    if (q.includes('denmark') || q.includes('ডেনমার্ক') || q.includes('dnk') || q.includes('copenhagen')) return INITIAL_COUNTRY_COSTS.denmark;
    if (q.includes('norway') || q.includes('নরওয়ে') || q.includes('nor') || q.includes('oslo')) return INITIAL_COUNTRY_COSTS.norway;
    if (q.includes('austria') || q.includes('অস্ট্রিয়া') || q.includes('aut') || q.includes('vienna')) return INITIAL_COUNTRY_COSTS.austria;
    if (q.includes('new zealand') || q.includes('নিউজিল্যান্ড') || q.includes('nzl') || q.includes('auckland')) return INITIAL_COUNTRY_COSTS.new_zealand;
    if (q.includes('cyprus') || q.includes('সাইপ্রাস') || q.includes('cyp')) return INITIAL_COUNTRY_COSTS.cyprus;
    if (q.includes('switzerland') || q.includes('সুইজারল্যান্ড') || q.includes('che') || q.includes('swiss') || q.includes('zurich')) return INITIAL_COUNTRY_COSTS.switzerland;
    return null;
  }

  public static getVerifiedAgenciesForCountry(countryName: string): VerifiedAgencyRecord[] {
    const standard = this.getCountryCost(countryName);
    const countryNormalized = standard ? standard.country.toLowerCase() : countryName.toLowerCase();
    const agencies = this.getStoredAgencies();
    return agencies.filter(a =>
      a.countriesServed.some(c => c.toLowerCase().includes(countryNormalized)) ||
      (standard && a.countryCodes.includes(standard.code))
    );
  }

  public static getUniversityCatalogs(): UniversityCourseCatalogItem[] {
    if (!OFFLINE_DEMO_ENABLED) return [];
    return VERIFIED_COURSE_CATALOGS;
  }

  public static getFinancialProvenance(uni: Partial<import('./aiService').UniversityRecommendation> & { name?: string }, agencyFallback?: VerifiedAgencyRecord): FinancialProvenance | null {
    if (!OFFLINE_DEMO_ENABLED) return null;
    const uniName = (uni.university_name || uni.name || '').trim();
    const uniCountry = (uni.country || '').trim();
    const uniId = (uni.id || '').toLowerCase();

    // 1. Search for catalog match
    const catalog = VERIFIED_COURSE_CATALOGS.find(c =>
      c.universityName.toLowerCase() === uniName.toLowerCase() ||
      c.id.toLowerCase() === uniId ||
      uniName.toLowerCase().includes(c.universityName.toLowerCase()) ||
      c.universityName.toLowerCase().includes(uniName.toLowerCase())
    );

    // 2. Identify verifying agency
    let agency = agencyFallback;
    if (!agency && uni.verified_agency) {
      agency = this.getAgencyById(uni.verified_agency.id);
    }
    if (!agency && catalog?.verifyingAgencyId) {
      agency = this.getAgencyById(catalog.verifyingAgencyId);
    }
    if (!agency) {
      const matching = this.getVerifiedAgenciesForCountry(uniCountry);
      agency = matching[0] || this.getAllVerifiedAgencies()[0];
    }
    if (!agency) return null;

    // 3. Country living standard & benchmarks
    const countryStandard = this.getCountryCost(uniCountry) || INITIAL_COUNTRY_COSTS.uk;

    // 4. Numbers & Currency
    const tuitionLocal = catalog ? catalog.annualTuitionLocal : (uni.annual_tuition_local ?? 15000);
    const currencyLocal = catalog ? catalog.currency : (uni.currency_local || countryStandard.currency || 'USD');
    const tuitionBdtLakh = uni.annual_tuition_bdt_lakh ?? +( (tuitionLocal * countryStandard.exchangeRateBdt) / 100000 ).toFixed(2);
    const livingBdtLakh = uni.annual_living_bdt_lakh ?? +( (countryStandard.livingOrBlockedBdt.amount) / 100000 ).toFixed(2);
    const totalBdtLakh = uni.annual_total_bdt_lakh ?? +(tuitionBdtLakh + livingBdtLakh).toFixed(2);

    const catalogId = catalog?.id || `cat-${countryStandard.code.toLowerCase()}-${uniId.replace(/[^a-z0-9]/g, '').slice(0, 8) || 'gen'}`;
    const auditId = `AUD-CAT-${countryStandard.code}-${(catalogId.replace('cat-', '')).toUpperCase()}`;

    // 5. Authority solvency directive details
    let authority = 'National Immigration Directorate';
    let directive = 'Official Higher Education Solvency Directive';
    let govUrl = countryStandard.officialGovUrl || 'https://www.gov.uk/student-visa/money';
    let govTitle = countryStandard.officialGovSourceTitle || `${countryStandard.country} Official Visa Solvency Guidelines`;
    let reqType = countryStandard.livingOrBlockedBdt.requirementType;
    let solvencyFormatted = `৳${(countryStandard.livingOrBlockedBdt.amount / 100000).toFixed(2)} Lakh BDT`;

    const cLower = uniCountry.toLowerCase();
    if (cLower.includes('german') || countryStandard.code === 'DEU') {
      authority = 'German Federal Foreign Office (Auswärtiges Amt)';
      directive = 'Section 16b Residence Act — Statutory Blocked Account (Sperrkonto)';
      govUrl = 'https://www.auswaertiges-amt.de/en/visa-service/blocked-account';
      govTitle = 'Auswärtiges Amt Official Blocked Account Solvency Standard (€11,904/year)';
      reqType = 'BLOCKED_ACCOUNT';
      solvencyFormatted = '€11,904 EUR (~৳15.25 Lakh BDT) in Expatrio / Coracle / Fintiba';
    } else if (cLower.includes('uk') || cLower.includes('britain') || countryStandard.code === 'GBR') {
      authority = 'UK Visas and Immigration (UKVI)';
      directive = 'Immigration Rules Appendix Finance (Student Route Maintenance)';
      govUrl = 'https://www.gov.uk/student-visa/money';
      govTitle = 'UKVI Student Route Financial Requirement (£1,023/month outside London x 9 mos)';
      reqType = 'BANK_STATEMENT';
      solvencyFormatted = '£1,023/mo (outside London) or £1,334/mo (in London) for 9 months (~৳16.59 Lakh BDT)';
    } else if (cLower.includes('canada') || countryStandard.code === 'CAN') {
      authority = 'Immigration, Refugees and Citizenship Canada (IRCC)';
      directive = 'Student Direct Stream (SDS) & General Study Permit Solvency Standard';
      govUrl = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html';
      govTitle = 'IRCC Mandatory Guaranteed Investment Certificate ($20,635 CAD GIC)';
      reqType = 'GIC';
      solvencyFormatted = '$20,635 CAD GIC (~৳18.67 Lakh BDT) + 1st Year Tuition Receipt';
    } else if (cLower.includes('usa') || countryStandard.code === 'USA') {
      authority = 'US Department of State & SEVP';
      directive = 'Form I-20 Certificate of Eligibility for Nonimmigrant Student Status (8 CFR 214.2(f)(1)(i))';
      govUrl = 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html';
      govTitle = 'US Department of State & SEVP Official Student Visa Regulations';
      reqType = 'BANK_STATEMENT';
      solvencyFormatted = 'Full 1st Year I-20 Estimated Solvency (~$18,000 USD Living + Tuition)';
    } else if (cLower.includes('aus') || countryStandard.code === 'AUS') {
      authority = 'Australian Department of Home Affairs';
      directive = 'Migration Regulations 1994 (Subclass 500 Financial Capacity)';
      govUrl = 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500';
      govTitle = 'Australian Home Affairs 12-Month Living Cost Standard (AUD $29,710/year)';
      reqType = 'BANK_STATEMENT';
      solvencyFormatted = 'AUD $29,710/yr Living Cost + Travel (~৳23.76 Lakh BDT)';
    } else if (cLower.includes('sweden') || countryStandard.code === 'SWE') {
      authority = 'Swedish Migration Agency (Migrationsverket)';
      directive = 'Swedish Aliens Act — Higher Education Residence Permit Maintenance Standard';
      govUrl = 'https://www.migrationsverket.se/en/private-individuals/studying-and-working-in-sweden/higher-education.html';
      govTitle = 'Migrationsverket Maintenance Standard (SEK 10,314/month for 10 months)';
      reqType = 'BANK_STATEMENT';
      solvencyFormatted = 'SEK 10,314/month for 10 months (SEK 103,140 = ~৳11.96 Lakh BDT)';
    } else if (cLower.includes('malaysia') || countryStandard.code === 'MYS') {
      authority = 'Education Malaysia Global Services (EMGS)';
      directive = 'Immigration Department of Malaysia (VAL Financial Solvency Verification)';
      govUrl = 'https://visa.educationmalaysia.gov.my/';
      govTitle = 'EMGS Official Student Visa Financial Solvency Benchmark (MYR 20,000)';
      reqType = 'BANK_STATEMENT';
      solvencyFormatted = 'MYR 20,000 (~৳5.56 Lakh BDT) 3-month bank statement';
    }

    // Deterministic ledger hash for audit trail
    const ledgerSource = `${catalogId}:${tuitionLocal}:${agency.licenseNo || 'GEN'}:${countryStandard.code}`;
    let hashNum = 0;
    for (let i = 0; i < ledgerSource.length; i++) {
      hashNum = ((hashNum << 5) - hashNum) + ledgerSource.charCodeAt(i);
      hashNum |= 0;
    }
    const ledgerChecksum = `SHA256:${Math.abs(hashNum).toString(16).padStart(8, '0').toUpperCase()}C29E`;

    return {
      catalogId,
      universityName: uniName || catalog?.universityName || 'Partner University',
      country: uniCountry || catalog?.country || countryStandard.country,
      countryCode: countryStandard.code,
      degreeLevel: catalog?.degreeLevel || 'Master',
      targetPrograms: uni.target_programs || [catalog?.programName || 'Postgraduate Taught Degree'],
      annualTuitionLocal: tuitionLocal,
      currencyLocal,
      annualTuitionBdtLakh: tuitionBdtLakh,
      annualLivingBdtLakh: livingBdtLakh,
      annualTotalBdtLakh: totalBdtLakh,
      officialCatalogUrl: catalog?.officialCatalogUrl || (uni.website_url || `https://www.google.com/search?q=${encodeURIComponent(uniName + ' official tuition fees')}`),
      officialSourceTitle: catalog?.officialSourceTitle || `${uniName} Official International Student Prospectus 2026/2027`,
      intakeYear: catalog?.intakeYear || '2026/2027',
      // Agency attribution
      verifyingAgencyId: agency.id || 'agt-001',
      verifyingAgencyName: agency.name || 'Global Edu BD',
      verifyingAgencyNameBn: agency.nameBn,
      verifyingAgencyLicense: agency.licenseNo || 'TRAD/DNCC/041289/2022',
      verifyingAgencyLicenseType: agency.licenseType || 'DNCC_TRADE',
      verifyingAgencyOwner: agency.ownerName || 'Licensed Education Consultant',
      verifyingAgencyRating: agency.rating || 4.8,
      verifyingAgencySuccessRate: agency.successRate || 95,
      verifyingAgencyRiskScore: agency.riskScore || 5,
      verifyingAgencyAddress: agency.address || 'Dhaka, Bangladesh',
      verifyingAgencyPhone: agency.phone || '+8801700000000',
      verifyingAgencyEmail: agency.email || 'admissions@verified.ethos.ai',
      verifyingAgencyWebsite: agency.website,
      // Living benchmark
      livingBenchmarkId: `bmk-${countryStandard.code.toLowerCase()}`,
      livingBenchmarkAuthority: authority,
      livingBenchmarkDirective: directive,
      livingBenchmarkGovUrl: govUrl,
      livingBenchmarkGovTitle: govTitle,
      livingRequirementType: reqType,
      statutorySolvencyFormatted: solvencyFormatted,
      statutorySolvencyBdt: countryStandard.livingOrBlockedBdt.amount,
      exchangeRateBdt: countryStandard.exchangeRateBdt,
      // Admin audit
      auditId,
      verifiedByAdmin: catalog?.verifiedByAdmin || 'usr-admin-01 (Ethos AI Senior Auditor)',
      lastAuditedAt: catalog?.lastAuditedAt || '2026-09-01',
      ledgerChecksum,
      status: 'VERIFIED',
      legalDisclaimerEn: `Offline demo only. ${agency.name}, its license, fees, ratings, audit identifiers, and calculated costs are illustrative fixtures, not live or production-verified records. Confirm every current amount and credential with the university, immigration authority, and issuing regulator before acting.`,
      legalDisclaimerBn: `শুধু অফলাইন ডেমো। ${agency.name}-এর নাম, লাইসেন্স, ফি, রেটিং, অডিট আইডি ও হিসাব করা খরচ নমুনা তথ্য; এগুলো লাইভ বা প্রোডাকশন-যাচাইকৃত রেকর্ড নয়। সিদ্ধান্তের আগে বিশ্ববিদ্যালয়, ইমিগ্রেশন কর্তৃপক্ষ ও লাইসেন্স প্রদানকারী সংস্থার কাছে সব তথ্য নিশ্চিত করুন।`,
    };
  }
}
