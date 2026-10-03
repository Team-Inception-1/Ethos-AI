'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import MarkdownContent, { stripMarkdown } from '@/components/ui/MarkdownContent';
import { useAuth } from '@/context/AuthContext';
import {
  searchProfessors,
  generateColdEmail,
  prepareInterview,
  getTARAGuide,
  parseCVFile,
  matchProfile,
  deconstructPaper,
  liveSearchAcademic,
  evaluateTARAStrategy,
  askTARAAdvisor,
  type ProfessorProfile,
  type ColdEmailGenerateResponse,
  type InterviewPrepResponse,
  type TARAGuideResponse,
  type CVParsedData,
  type ProfessorMatchScore,
  type PaperDeconstructResponse,
  type TARAStrategyResponse,
} from '@/lib/aiService';
import { OFFLINE_DEMO_ENABLED } from '@/lib/ai/demo';
import styles from './ScholarFinderPage.module.css';

interface PipelineItem {
  id: string;
  profId: string;
  profName: string;
  university: string;
  labName: string;
  stage: 'shortlisted' | 'drafted' | 'contacted' | 'interviewing';
  sentAt?: string;
  draftedEmail?: string;
  notes?: string;
}

const pipelineSchema = z.array(z.object({ id: z.string(), profId: z.string(), profName: z.string(),
  university: z.string(), labName: z.string(), stage: z.enum(['shortlisted', 'drafted', 'contacted', 'interviewing']),
  sentAt: z.string().optional(), draftedEmail: z.string().optional(), notes: z.string().optional(),
}));

const DOMAIN_OPTIONS = [
  'All',
  'Computer Science & AI',
  'Electrical & Computer Engineering',
  'Mechanical & Robotics',
  'Biomedical & Bioinformatics',
  'Data Science & Operations Research',
];

const COUNTRY_OPTIONS = ['All', 'USA', 'Canada', 'Germany', 'Australia', 'UK'];

const ENTITY_TYPE_OPTIONS: {
  id: 'all' | 'works' | 'institutions' | 'authors';
  labelEn: string;
  labelBn: string;
  icon: string;
  placeholderEn: string;
  placeholderBn: string;
  hintEn: string;
  hintBn: string;
}[] = [
  {
    id: 'all',
    labelEn: 'All Topics',
    labelBn: 'সব বিষয়',
    icon: '🌐',
    placeholderEn: 'Search research disciplines & keywords (e.g. Robotics, LLMs, Photonics, Quantum)...',
    placeholderBn: 'গবেষণার ক্ষেত্র বা টপিক দিয়ে খুঁজুন (যেমন: রোবোটিক্স, এলএলএম, কোয়ান্টাম)...',
    hintEn: 'Combined works & faculty by discipline',
    hintBn: 'যৌথ পেপার ও শিক্ষক অনুসন্ধান',
  },
  {
    id: 'works',
    labelEn: 'Works (Papers)',
    labelBn: 'গবেষণাপত্র (Works)',
    icon: '📄',
    placeholderEn: 'Search research papers, publication titles, or topics (e.g. Attention Is All You Need, NeRF)...',
    placeholderBn: 'রিসার্চ পেপার, শিরোনাম বা প্রকাশনা দিয়ে খুঁজুন...',
    hintEn: 'Finds lead PIs who published top papers',
    hintBn: 'শীর্ষ পেপারের প্রধান গবেষক',
  },
  {
    id: 'institutions',
    labelEn: 'Institutions',
    labelBn: 'বিশ্ববিদ্যালয় / ল্যাব',
    icon: '🏛️',
    placeholderEn: 'Search universities or institutes (e.g. University of Toronto, MIT, Oxford, Stanford)...',
    placeholderBn: 'বিশ্ববিদ্যালয় বা প্রতিষ্ঠানের নাম দিয়ে অনুষদ খুঁজুন (যেমন: টরন্টো, অক্সফোর্ড)...',
    hintEn: 'Lists leading faculty at this university',
    hintBn: 'এই বিশ্ববিদ্যালয়ের শীর্ষ শিক্ষক ও ল্যাব',
  },
  {
    id: 'authors',
    labelEn: 'Authors (Faculty)',
    labelBn: 'গবেষক / শিক্ষক',
    icon: '👤',
    placeholderEn: 'Search professors or scholars by name (e.g. Andrew Ng, Yoshua Bengio, Fei-Fei Li)...',
    placeholderBn: 'প্রফেসর বা গবেষকের নাম দিয়ে সরাসরি খুঁজুন...',
    hintEn: 'Matches specific scholar profiles',
    hintBn: 'নির্দিষ্ট গবেষকের প্রোফাইল',
  },
];

interface AdvisorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  keyTakeaway?: string;
  suggestedFollowups?: string[];
  modelUsed?: string;
  timestamp: string;
}

const INITIAL_ADVISOR_MESSAGES: AdvisorChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: `### Welcome to the Ethos AI Funding Advisor 🎓

I provide data-backed, institutional intelligence on **Research Assistantships (RA)**, **Teaching Assistantships (TA)**, **international student work authorizations**, and **financial negotiation**.

#### Strategic Focus Areas:
- **Assistantship Mechanics**: Differences in funding sources (Departmental GTR vs. PI NSF/NIH grant).
- **Oral English Hurdles**: State laws and university policies for TA eligibility (e.g. Texas, Ohio, California speaking cutoffs).
- **Visa & Work Hours**: F-1 20-hour/week restrictions, CPT summer internships, and tax withholding.
- **Offer Evaluation**: Comparing 9-month vs 12-month stipends, mandatory student fees, and tuition remissions.`,
    keyTakeaway:
      'PhD applicants almost universally receive guaranteed multi-year tuition waivers + stipends; MS applicants should target specialized lab technical gaps (PyTorch, ROS, hardware) to convert into an RA after Semester 1.',
    suggestedFollowups: [
      'Can I get full funding for an MS, or is it only for PhDs?',
      "What happens if my professor's grant runs out?",
      'Can I work more than 20 hours/week as an RA or TA?',
      'How do I negotiate my stipend and tuition remission offer?',
      'My TOEFL Speaking is 22 / IELTS 6.5. Can I still get funded?',
    ],
    modelUsed: 'Ethos AI Funding Model v2.4',
    timestamp: 'Just now',
  },
];

export default function ScholarFinderPage() {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [activeTab, setActiveTab] = useState<'search' | 'email_studio' | 'pipeline' | 'guide'>('search');

  // Search Mode: 'curated' (top R1/U15 labs) or 'live' (OpenAlex Global Deep Search)
  const [searchMode, setSearchMode] = useState<'curated' | 'live'>('curated');

  // OpenAlex Search Entity Type: 'all' | 'works' | 'institutions' | 'authors'
  const [liveEntityType, setLiveEntityType] = useState<'all' | 'works' | 'institutions' | 'authors'>('all');

  // Search Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [activeFundingOnly, setActiveFundingOnly] = useState(false);
  const [acceptingOnly, setAcceptingOnly] = useState(false);

  // Search Results
  const [professors, setProfessors] = useState<ProfessorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchSequence = useRef(0);
  const [selectedProf, setSelectedProf] = useState<ProfessorProfile | null>(null);

  // Feature 1: CV Upload & Matchmaker State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvParsedData, setCvParsedData] = useState<CVParsedData | null>(null);
  const [matchScore, setMatchScore] = useState<ProfessorMatchScore | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Feature 2: Paper Deconstructor State
  const [paperDeconstructData, setPaperDeconstructData] = useState<PaperDeconstructResponse | null>(null);
  const [paperDeconstructLoading, setPaperDeconstructLoading] = useState(false);

  // Cold Email Studio State - Hydrated from authenticated profile
  const { user } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [studentDegree, setStudentDegree] = useState('');
  const [studentInstitution, setStudentInstitution] = useState('');
  const [studentGpa, setStudentGpa] = useState('');
  const [studentSkills, setStudentSkills] = useState('');
  const [studentThesis, setStudentThesis] = useState('');
  const [targetDegree, setTargetDegree] = useState<'PhD' | 'MS with Thesis'>('PhD');
  const [targetSemester, setTargetSemester] = useState('Fall 2026');
  const [selectedPaperTitle, setSelectedPaperTitle] = useState('');

  // Hydrate profile data from signed-in student
  useEffect(() => {
    if (user) {
      if (user.name) setStudentName(user.name);
      if (user.studentDetails?.targetField) {
        setStudentDegree(user.studentDetails.targetField);
        setTaraMajor(user.studentDetails.targetField);
      }
    }
  }, [user]);

  // Email Output
  const [emailGenerating, setEmailGenerating] = useState(false);
  const [generatedEmailRes, setGeneratedEmailRes] = useState<ColdEmailGenerateResponse | null>(null);
  const [emailSubTab, setEmailSubTab] = useState<'initial' | 'followup1' | 'followup2'>('initial');
  const [selectedSubjectLine, setSelectedSubjectLine] = useState('');

  // Pipeline CRM State (PostgreSQL backed with local backup)
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interview Prep Modal
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewPrepData, setInterviewPrepData] = useState<InterviewPrepResponse | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Guide Data
  const [guideData, setGuideData] = useState<TARAGuideResponse | null>(null);

  // Tab 4: Graduate Assistantship & Funding Suite State
  const [guideSubTab, setGuideSubTab] = useState<'evaluator' | 'simulator' | 'advisor' | 'matrix'>('evaluator');

  // Module 1: Fit Evaluator State
  const [taraDegreeGoal, setTaraDegreeGoal] = useState<'PhD' | 'MS with Thesis'>('PhD');
  const [taraGpa, setTaraGpa] = useState<string>('3.82');
  const [taraMajor, setTaraMajor] = useState<string>('Computer Science & Engineering');
  const [taraResearchExp, setTaraResearchExp] = useState<'peer_reviewed' | 'preprint_workshop' | 'thesis_only' | 'none'>('thesis_only');
  const [taraCoding, setTaraCoding] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [taraEnglishTest, setTaraEnglishTest] = useState<'toefl' | 'ielts' | 'duolingo' | 'none'>('toefl');
  const [taraSpeakingScore, setTaraSpeakingScore] = useState<number>(24);
  const [taraTargetCountry, setTaraTargetCountry] = useState<string>('USA');
  const [taraLoading, setTaraLoading] = useState<boolean>(false);
  const [taraResult, setTaraResult] = useState<TARAStrategyResponse | null>(null);

  // Module 2: Financial Simulator State
  const [simCountry, setSimCountry] = useState<'USA' | 'Canada' | 'Germany' | 'UK' | 'Australia'>('USA');
  const [simRole, setSimRole] = useState<'RA' | 'TA'>('RA');
  const [simCityCost, setSimCityCost] = useState<'low' | 'medium' | 'high'>('medium');

  // Module 3: AI Funding Advisor Chat Stream & Audio State
  const [advisorChatMessages, setAdvisorChatMessages] = useState<AdvisorChatMessage[]>(INITIAL_ADVISOR_MESSAGES);
  const [advisorInputText, setAdvisorInputText] = useState<string>('');
  const [advisorLoading, setAdvisorLoading] = useState<boolean>(false);
  const [advisorSpeakingMsgId, setAdvisorSpeakingMsgId] = useState<string | null>(null);
  const advisorChatWindowRef = useRef<HTMLDivElement>(null);
  const advisorChatEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Safe local auto-scroll advisor chat when new message arrives or loading state changes
  useEffect(() => {
    if (guideSubTab === 'advisor' && advisorChatWindowRef.current) {
      advisorChatWindowRef.current.scrollTop = advisorChatWindowRef.current.scrollHeight;
    }
  }, [advisorChatMessages, advisorLoading, guideSubTab]);

  // Load initial pipeline from PostgreSQL API (fallback to localStorage), guide, and baseline TARA
  useEffect(() => {
    let cancelled = false;
    async function fetchPipeline() {
      try {
        const res = await fetch('/api/scholar-finder/outreach');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.pipeline)) {
            setPipeline(data.pipeline);
            return;
          }
        }
      } catch {}
      try {
        const saved = localStorage.getItem('ethos_scholar_pipeline');
        if (!cancelled && saved) {
          setPipeline(pipelineSchema.parse(JSON.parse(saved)));
        }
      } catch (e) {
        console.warn('Failed to load pipeline', e);
      }
    }
    void fetchPipeline();

    getTARAGuide()
      .then((data) => setGuideData(data))
      .catch((err) => console.warn('Failed to fetch guide data', err));

    evaluateTARAStrategy({
      degree_goal: 'PhD',
      gpa: '3.82',
      undergrad_major: 'Computer Science & Engineering',
      research_experience: 'thesis_only',
      coding_depth: 'intermediate',
      english_test_type: 'toefl',
      speaking_score: 24,
      target_country: 'USA',
    })
      .then((res) => setTaraResult(res))
      .catch((e) => console.warn('Initial TARA evaluation error', e));
    return () => {
      cancelled = true;
    };
  }, []);

  // TARA Strategy Evaluation Handler
  const runTARAEvaluation = async () => {
    setTaraLoading(true);
    setTaraResult(null);
    try {
      const res = await evaluateTARAStrategy({
        degree_goal: taraDegreeGoal,
        gpa: taraGpa,
        undergrad_major: taraMajor,
        research_experience: taraResearchExp,
        coding_depth: taraCoding,
        english_test_type: taraEnglishTest,
        speaking_score: taraSpeakingScore,
        target_country: taraTargetCountry,
      });
      setTaraResult(res);
      showToast('🎯 Assistantship & funding strategy evaluated!');
    } catch (err) {
      console.error('Failed to evaluate TARA strategy:', err);
      showToast('Evaluation error. Please check parameters.');
    } finally {
      setTaraLoading(false);
    }
  };

  // Voice Speech Synthesis Toggle for Advisor Answers
  const toggleAdvisorSpeech = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('⚠️ Speech synthesis is not supported on this browser.');
      return;
    }

    if (advisorSpeakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setAdvisorSpeakingMsgId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = stripMarkdown(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const isBn = lang === 'bn' || /[\u0980-\u09FF]/.test(cleanText);

      const voices = window.speechSynthesis.getVoices() || [];
      if (isBn) {
        const bnVoice = voices.find((v) => v.lang.toLowerCase().startsWith('bn'));
        if (bnVoice) {
          utterance.voice = bnVoice;
          utterance.lang = bnVoice.lang;
        } else {
          utterance.lang = 'bn-BD';
        }
      } else {
        const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        if (enVoice) {
          utterance.voice = enVoice;
          utterance.lang = enVoice.lang;
        } else {
          utterance.lang = 'en-US';
        }
      }
      utterance.rate = 0.95;

      utterance.onstart = () => {
        setAdvisorSpeakingMsgId(msgId);
      };
      utterance.onend = () => {
        setAdvisorSpeakingMsgId(null);
      };
      utterance.onerror = () => {
        setAdvisorSpeakingMsgId(null);
      };

      setAdvisorSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    } catch {
      setAdvisorSpeakingMsgId(null);
      showToast('⚠️ Speech playback not permitted by device.');
    }
  };

  // TARA Advisor Question Handler (Conversational Stream)
  const handleAskAdvisor = async (questionToAsk?: string) => {
    const qText = (questionToAsk || advisorInputText).trim();
    if (!qText || advisorLoading) return;

    const userMsgId = `user-${crypto.randomUUID()}`;
    const userMsg: AdvisorChatMessage = {
      id: userMsgId,
      role: 'user',
      content: qText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAdvisorChatMessages((prev) => [...prev, userMsg]);
    setAdvisorInputText('');
    setAdvisorLoading(true);

    try {
      const res = await askTARAAdvisor({
        question: qText,
        student_context: {
          gpa: taraGpa,
          degree_goal: taraDegreeGoal,
          major: taraMajor,
          target_country: taraTargetCountry,
        },
      });

      const botMsgId = `bot-${crypto.randomUUID()}`;
      const botMsg: AdvisorChatMessage = {
        id: botMsgId,
        role: 'assistant',
        content: res.answer,
        keyTakeaway: res.key_takeaway,
        suggestedFollowups: res.suggested_followups,
        modelUsed: res.model_used,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setAdvisorChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Failed to ask advisor:', err);
      const errMsg: AdvisorChatMessage = {
        id: `err-${crypto.randomUUID()}`,
        role: 'assistant',
        content:
          lang === 'en'
            ? 'I apologize, but I encountered a connection timeout while analyzing this funding policy. Please try again or rephrase your inquiry.'
            : 'দুঃখিত, ফান্ডিং পলিসি পর্যালোচনা করার সময় নেটওয়ার্ক ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
        keyTakeaway:
          lang === 'en'
            ? 'Connection failover encountered. Check your internet or re-submit your prompt.'
            : 'নেটওয়ার্ক ফেইলওভার হয়েছে। পুনরায় প্রশ্নটি পাঠান।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAdvisorChatMessages((prev) => [...prev, errMsg]);
      showToast('Advisor query failed. Please try again.');
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleResetAdvisorChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAdvisorSpeakingMsgId(null);
    setAdvisorChatMessages(INITIAL_ADVISOR_MESSAGES);
    setAdvisorInputText('');
    showToast('Advisor conversation reset.');
  };

  const handleCopyPitch = async () => {
    if (!taraResult?.cold_pitch_paragraph) return;
    try {
      await navigator.clipboard.writeText(taraResult.cold_pitch_paragraph);
      showToast('📋 Tailored RA pitch copied to clipboard!');
    } catch { showToast('Could not copy the pitch. Select and copy the text manually.'); }
  };

  // Financial Simulator reactive calculation
  const simData = React.useMemo(() => {
    const isRA = simRole === 'RA';
    let currencySymbol = '$';
    let currencyCode = 'USD';
    let exchangeRateBDT = 122;
    let baseStipend = isRA ? 2800 : 2550;
    let tuitionWaiverAnnual = 44000;
    let termFees = 1250;
    let monthlyRent = 950;
    let monthlyFoodLiving = 550;
    let monthlyHealthInsurance = 180;
    const summerMonthsCovered = isRA ? 3 : 0;
    let summerTip = isRA
      ? '✅ 12-Month Coverage: RAs typically receive 12-month funding directly from faculty grant accounts, including June–August.'
      : '⚠️ 9-Month Gap: TAs are appointed for 9 academic months (Aug–May). June–August requires summer teaching, RA buyout, or CPT industry internship ($7,500–$10,500/mo).';

    if (simCountry === 'USA') {
      currencySymbol = '$';
      currencyCode = 'USD';
      exchangeRateBDT = 122;
      tuitionWaiverAnnual = 44000;
      termFees = 1250;
      if (simCityCost === 'low') {
        baseStipend = isRA ? 2300 : 2100;
        monthlyRent = 650;
        monthlyFoodLiving = 450;
        monthlyHealthInsurance = 150;
      } else if (simCityCost === 'high') {
        baseStipend = isRA ? 3400 : 3100;
        monthlyRent = 1450;
        monthlyFoodLiving = 700;
        monthlyHealthInsurance = 220;
      } else {
        baseStipend = isRA ? 2800 : 2550;
        monthlyRent = 950;
        monthlyFoodLiving = 550;
        monthlyHealthInsurance = 180;
      }
    } else if (simCountry === 'Canada') {
      currencySymbol = 'C$';
      currencyCode = 'CAD';
      exchangeRateBDT = 89;
      tuitionWaiverAnnual = 24000;
      termFees = 850;
      summerTip = '🇨🇦 U15 Guarantee: Canadian research universities provide a 12-month minimum guaranteed funding package split between TAships and RA top-ups.';
      if (simCityCost === 'low') {
        baseStipend = isRA ? 2200 : 2050;
        monthlyRent = 700;
        monthlyFoodLiving = 480;
        monthlyHealthInsurance = 90;
      } else if (simCityCost === 'high') {
        baseStipend = isRA ? 3100 : 2850;
        monthlyRent = 1350;
        monthlyFoodLiving = 650;
        monthlyHealthInsurance = 110;
      } else {
        baseStipend = isRA ? 2600 : 2400;
        monthlyRent = 950;
        monthlyFoodLiving = 550;
        monthlyHealthInsurance = 100;
      }
    } else if (simCountry === 'Germany') {
      currencySymbol = '€';
      currencyCode = 'EUR';
      exchangeRateBDT = 132;
      tuitionWaiverAnnual = 0;
      termFees = 320;
      summerTip = '🇩🇪 Full 12-Month TV-L E13 Contract: PhD candidates are salaried university/institute employees with 30 paid annual vacation days.';
      if (simCityCost === 'low') {
        baseStipend = 1750;
        monthlyRent = 450;
        monthlyFoodLiving = 420;
        monthlyHealthInsurance = 110;
      } else if (simCityCost === 'high') {
        baseStipend = 2250;
        monthlyRent = 850;
        monthlyFoodLiving = 550;
        monthlyHealthInsurance = 130;
      } else {
        baseStipend = 1950;
        monthlyRent = 600;
        monthlyFoodLiving = 480;
        monthlyHealthInsurance = 120;
      }
    } else if (simCountry === 'UK') {
      currencySymbol = '£';
      currencyCode = 'GBP';
      exchangeRateBDT = 158;
      tuitionWaiverAnnual = 26000;
      termFees = 0;
      summerTip = '🇬🇧 UKRI Doctoral Training: Tax-free stipend paid across all 12 months for 3.5 to 4 years.';
      if (simCityCost === 'low') {
        baseStipend = 1600;
        monthlyRent = 550;
        monthlyFoodLiving = 400;
        monthlyHealthInsurance = 60;
      } else if (simCityCost === 'high') {
        baseStipend = 1900;
        monthlyRent = 1050;
        monthlyFoodLiving = 550;
        monthlyHealthInsurance = 75;
      } else {
        baseStipend = 1700;
        monthlyRent = 750;
        monthlyFoodLiving = 460;
        monthlyHealthInsurance = 65;
      }
    } else if (simCountry === 'Australia') {
      currencySymbol = 'A$';
      currencyCode = 'AUD';
      exchangeRateBDT = 79;
      tuitionWaiverAnnual = 38000;
      termFees = 300;
      summerTip = '🇦🇺 RTP Scholarship: Tax-free stipend paid bi-weekly across all 12 months for 3 to 3.5 years.';
      if (simCityCost === 'low') {
        baseStipend = 2600;
        monthlyRent = 850;
        monthlyFoodLiving = 600;
        monthlyHealthInsurance = 120;
      } else if (simCityCost === 'high') {
        baseStipend = 3200;
        monthlyRent = 1500;
        monthlyFoodLiving = 800;
        monthlyHealthInsurance = 140;
      } else {
        baseStipend = 2850;
        monthlyRent = 1100;
        monthlyFoodLiving = 700;
        monthlyHealthInsurance = 130;
      }
    }

    const totalMonthlyLiving = monthlyRent + monthlyFoodLiving + monthlyHealthInsurance;
    const monthlyAmortizedFees = termFees > 0 ? Math.round(termFees / 4.5) : 0;
    const netMonthlySavings = Math.max(0, baseStipend - totalMonthlyLiving - monthlyAmortizedFees);
    const grossStipendBDT = Math.round((baseStipend * exchangeRateBDT) / 1000) * 1000;
    const netSavingsBDT = Math.round((netMonthlySavings * exchangeRateBDT) / 1000) * 1000;
    const tuitionSavingsBDTLakh = tuitionWaiverAnnual > 0 ? ((tuitionWaiverAnnual * exchangeRateBDT) / 100000).toFixed(1) : '0';

    return {
      currencySymbol,
      currencyCode,
      baseStipend,
      grossStipendBDT,
      grossStipendBDTLakh: (grossStipendBDT / 100000).toFixed(2),
      tuitionWaiverAnnual,
      tuitionSavingsBDTLakh,
      termFees,
      totalMonthlyLiving,
      monthlyRent,
      monthlyFoodLiving,
      monthlyHealthInsurance,
      monthlyAmortizedFees,
      netMonthlySavings,
      netSavingsBDT,
      netSavingsBDTLakh: (netSavingsBDT / 100000).toFixed(2),
      summerMonthsCovered,
      summerTip,
    };
  }, [simCountry, simRole, simCityCost]);

  // Save pipeline (persisting to Neon PostgreSQL and browser cache)
  const savePipeline = async (items: PipelineItem[], changedItem?: PipelineItem) => {
    setPipeline(items);
    try {
      localStorage.setItem('ethos_scholar_pipeline', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save pipeline locally', e);
    }

    if (changedItem) {
      try {
        await fetch('/api/scholar-finder/outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profId: changedItem.profId,
            profName: changedItem.profName,
            university: changedItem.university,
            labName: changedItem.labName,
            stage: changedItem.stage,
            draftedEmail: changedItem.draftedEmail,
            notes: changedItem.notes,
            sentAt: changedItem.sentAt,
          }),
        });
      } catch (err) {
        console.warn('Could not sync outreach item to database:', err);
      }
    }
    return true;
  };

  // Load professors
  const runSearch = useCallback(async () => {
    const sequence = ++searchSequence.current;
    setLoading(true);
    setSearchError(null);
    try {
      if (searchMode === 'live') {
        const defaultTopic =
          liveEntityType === 'institutions'
            ? 'University of Toronto'
            : liveEntityType === 'authors'
            ? 'Yoshua Bengio'
            : liveEntityType === 'works'
            ? 'Diffusion Models'
            : selectedDomain !== 'All'
            ? selectedDomain
            : 'Computer Science and Artificial Intelligence';

        try {
          const res = await liveSearchAcademic({
            query: searchQuery.trim() || defaultTopic,
            country: selectedCountry === 'All' ? null : selectedCountry,
            limit: 12,
            entity_type: liveEntityType,
          });
          if (sequence !== searchSequence.current) return;
          if (res.results && res.results.length > 0) {
            setProfessors(res.results);
            setSelectedProf(res.results[0] ?? null);
            setSelectedPaperTitle(res.results[0]?.recent_publications?.[0]?.title ?? '');
            return;
          }
        } catch (liveErr) {
          console.warn('Live search fallback to PostgreSQL faculty catalog:', liveErr);
        }
      }

      // Query PostgreSQL database-backed professors
      try {
        const queryParams = new URLSearchParams();
        if (selectedDomain !== 'All') queryParams.set('domain', selectedDomain);
        if (selectedCountry !== 'All') queryParams.set('country', selectedCountry);
        if (activeFundingOnly) queryParams.set('activeFunding', 'true');
        if (acceptingOnly) queryParams.set('accepting', 'true');
        if (searchQuery.trim()) queryParams.set('q', searchQuery.trim());

        const res = await fetch(`/api/scholar-finder/professors?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.professors)) {
            if (sequence !== searchSequence.current) return;
            setProfessors(data.professors);
            setSelectedProf(data.professors[0] ?? null);
            setSelectedPaperTitle(data.professors[0]?.recent_publications?.[0]?.title ?? data.professors[0]?.recentPublications?.[0]?.title ?? '');
            return;
          }
        }
      } catch (dbErr) {
        console.warn('Database query fallback to offline engine:', dbErr);
      }

      // Offline fallback if database route failed
      try {
        const resOffline = await searchProfessors({
          domain: selectedDomain === 'All' ? null : selectedDomain,
          countries: selectedCountry === 'All' ? [] : [selectedCountry],
          has_active_funding: activeFundingOnly,
          accepting_only: acceptingOnly,
          query: searchQuery.trim() || null,
        });
        if (sequence !== searchSequence.current) return;
        setProfessors(resOffline.professors);
        setSelectedProf(resOffline.professors[0] ?? null);
        setSelectedPaperTitle(resOffline.professors[0]?.recent_publications?.[0]?.title ?? '');
      } catch (offlineErr) {
        console.warn('Offline search fallback:', offlineErr);
        if (sequence === searchSequence.current) {
          setProfessors([]);
          setSelectedProf(null);
        }
      }
    } catch (err) {
      console.error('Failed to search professors:', err);
      if (sequence === searchSequence.current) {
        setSearchError(err instanceof Error ? err.message : 'Professor search is unavailable. Please retry.');
        setProfessors([]);
        setSelectedProf(null);
      }
    } finally {
      if (sequence === searchSequence.current) setLoading(false);
    }
  }, [searchMode, liveEntityType, selectedDomain, searchQuery, selectedCountry, activeFundingOnly, acceptingOnly]);

  useEffect(() => {
    const timer = setTimeout(() => { void runSearch(); }, 300);
    return () => { clearTimeout(timer); searchSequence.current += 1; };
  }, [runSearch]);

  // Feature 1: Handle CV upload and auto-fill
  const handleCVFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvLoading(true);
    try {
      const res = await parseCVFile(file);
      setCvParsedData(res.parsed_data);
      if (res.parsed_data.student_name) setStudentName(res.parsed_data.student_name);
      if (res.parsed_data.degree) {
        setStudentDegree(res.parsed_data.degree);
        setTaraMajor(res.parsed_data.degree);
      }
      if (res.parsed_data.institution) setStudentInstitution(res.parsed_data.institution);
      if (res.parsed_data.gpa) {
        setStudentGpa(res.parsed_data.gpa);
        setTaraGpa(res.parsed_data.gpa);
      }
      if (res.parsed_data.publications && res.parsed_data.publications.length > 0) {
        setTaraResearchExp('peer_reviewed');
      }
      if (res.parsed_data.skills && res.parsed_data.skills.length > 0) {
        setStudentSkills(res.parsed_data.skills.join(', '));
      }
      if (res.parsed_data.thesis_topic) setStudentThesis(res.parsed_data.thesis_topic);
      showToast('📄 CV Parsed Successfully! Profile fields auto-populated.');

    } catch (err) {
      console.error('CV Parsing failed:', err);
      showToast('Could not parse CV file. Please verify format.');
    } finally {
      setCvLoading(false);
    }
  };

  const triggerProfileMatch = useCallback(async (cv: CVParsedData, prof: ProfessorProfile) => {
    setMatchLoading(true);
    setMatchScore(null);
    try {
      const res = await matchProfile({
        parsed_cv: cv,
        professor_id: prof.id,
        professors: [prof],
      });
      if (res.matches.length > 0) {
        setMatchScore(res.matches[0]);
      }
    } catch (err) {
      console.error('Matching failed:', err);
    } finally {
      setMatchLoading(false);
    }
  }, []);

  // Re-run match if selected professor changes and CV is present
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedProf && cvParsedData) void triggerProfileMatch(cvParsedData, selectedProf);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedProf, cvParsedData, triggerProfileMatch]);

  // Feature 2: Deconstruct paper
  const handleDeconstructPaper = async () => {
    if (!selectedProf || !selectedPaperTitle) return;
    setPaperDeconstructLoading(true);
    setPaperDeconstructData(null);
    try {
      const skillsArray = studentSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await deconstructPaper({
        paper_title: selectedPaperTitle,
        professor_name: selectedProf.name,
        student_skills: skillsArray,
        student_thesis: studentThesis || null,
      });
      setPaperDeconstructData(res);
      showToast('🔬 Paper Deconstructed! Tailored hook generated.');
    } catch (err) {
      console.error('Paper deconstruction failed:', err);
      showToast('Paper deconstruction failed.');
    } finally {
      setPaperDeconstructLoading(false);
    }
  };

  const handleApplyHookToEmail = () => {
    if (!paperDeconstructData) return;
    setStudentThesis((prev) =>
      prev ? `${prev}. ${paperDeconstructData.tailored_cold_hook}` : paperDeconstructData.tailored_cold_hook
    );
    showToast('✓ Tailored hook inserted into your research value proposition!');
  };

  const handleSelectProfForEmail = (p: ProfessorProfile) => {
    setSelectedProf(p);
    if (p.recent_publications.length > 0) {
      setSelectedPaperTitle(p.recent_publications[0].title);
    }
    setActiveTab('email_studio');
  };

  const handleAddToPipeline = (p: ProfessorProfile, stage: PipelineItem['stage'] = 'shortlisted') => {
    const exists = pipeline.some((item) => item.profId === p.id);
    if (exists) {
      showToast(`${p.name} is already in your Outreach Pipeline.`);
      return;
    }
    const newItem: PipelineItem = {
      id: `pipe-${Date.now()}`,
      profId: p.id,
      profName: p.name,
      university: p.university,
      labName: p.lab_name,
      stage,
      sentAt: stage === 'contacted' ? new Date().toISOString() : undefined,
    };
    const updated = [newItem, ...pipeline];
    void savePipeline(updated, newItem);
    showToast(`Added ${p.name} to your ${stage.toUpperCase()} pipeline.`);
  };

  const handleMovePipelineStage = (itemId: string, newStage: PipelineItem['stage']) => {
    let changed: PipelineItem | undefined;
    const updated = pipeline.map((item) => {
      if (item.id === itemId) {
        changed = {
          ...item,
          stage: newStage,
          sentAt: newStage === 'contacted' && !item.sentAt ? new Date().toISOString() : item.sentAt,
        };
        return changed;
      }
      return item;
    });
    void savePipeline(updated, changed);
    showToast(`Stage updated to ${newStage.toUpperCase()}`);
  };

  const handleRemoveFromPipeline = async (itemId: string) => {
    const target = pipeline.find((i) => i.id === itemId);
    const updated = pipeline.filter((i) => i.id !== itemId);
    setPipeline(updated);
    try {
      localStorage.setItem('ethos_scholar_pipeline', JSON.stringify(updated));
    } catch {}
    if (target) {
      try {
        await fetch(`/api/scholar-finder/outreach?profId=${encodeURIComponent(target.profId)}`, {
          method: 'DELETE',
        });
      } catch {}
    }
    showToast('Removed from pipeline');
  };

  const handleGenerateEmail = async () => {
    if (!selectedProf) return;
    setEmailGenerating(true);
    setGeneratedEmailRes(null);
    try {
      const skillsArray = studentSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await generateColdEmail({
        professor: selectedProf,
        selected_paper_title: selectedPaperTitle || (selectedProf.recent_publications[0]?.title || 'Recent Research'),
        student_name: studentName,
        student_degree: studentDegree,
        student_institution: studentInstitution,
        student_gpa: studentGpa,
        student_skills: skillsArray,
        student_thesis_topic: studentThesis || null,
        target_degree: targetDegree,
        target_semester: targetSemester,
        language: lang,
      });
      setGeneratedEmailRes(res);
      setSelectedSubjectLine(res.initial_email.subject_line);
      showToast('AI Cold Email Generated!');
    } catch (err) {
      console.error('Email generation failed:', err);
      showToast('Generation failed, please try again.');
    } finally {
      setEmailGenerating(false);
    }
  };

  const handleLaunchInterviewPrep = async (p: ProfessorProfile) => {
    setSelectedProf(p);
    setInterviewModalOpen(true);
    setInterviewLoading(true);
    setInterviewPrepData(null);
    try {
      const skillsArray = studentSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await prepareInterview({
        professor_name: p.name,
        university: p.university,
        research_interests: p.research_interests,
        recent_paper_title: p.recent_publications[0]?.title || 'Lab Publications',
        student_skills: skillsArray,
      });
      setInterviewPrepData(res);
    } catch (err) {
      console.error('Failed to load interview prep:', err);
    } finally {
      setInterviewLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); showToast('Copied to clipboard! 📋'); }
    catch { showToast('Could not copy. Select and copy the text manually.'); }
  };

  const getGmailLink = (to: string, subject: string, body: string) => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
      {searchError && <p role="alert">{searchError}</p>}

      {/* Header Section */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>
              <span>🎓</span> {lang === 'en' ? 'Scholar Finder & RA/TA Suite' : 'স্কলার-ফাইন্ডার ও ফুল-ফান্ড অ্যাসিস্ট্যান্টশিপ'}
            </h1>
            <Badge variant="verified" size="sm">
              {lang === 'en' ? 'Verified R1/U15 Labs' : 'ভেরিফায়েড আর১/ইউ১৫ ল্যাব'}
            </Badge>
            <Badge variant="ai" size="sm">
              {lang === 'en' ? 'OpenAlex Global Deep Search' : 'ওপেনঅ্যালেক্স গ্লোবাল লাইভ'}
            </Badge>
          </div>
          <p className={styles.pageSubtitle}>
            {lang === 'en'
              ? 'Connect directly with principal investigators holding active NSF, NIH, and ERC grants. Auto-match CVs, deconstruct publications into high-conversion email hooks, and calculate real graduate funding.'
              : 'সক্রিয় রিসার্চ গ্রান্ট থাকা প্রফেসরদের খুঁজুন, পেপারের সামারি থেকে ইমেইল হুক তৈরি করুন, সিভি ম্যাচিং স্কোর দেখুন এবং মাস্টার্স ও পিএইচডি ফুল-ফান্ডিং ক্যালকুলেট করুন।'}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setLang((l) => (l === 'en' ? 'bn' : 'en'))}
            className={styles.langBtn}
            title={lang === 'en' ? 'Switch to Bangla' : 'Switch to English'}
          >
            🌐 {lang === 'en' ? 'বাংলা সংস্করণ' : 'English View'}
          </button>
        </div>
      </div>

      {/* Executive KPI Stat Cards Dock */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🏛️</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>240+ Labs</div>
            <div className={styles.statLabel}>
              {lang === 'en' ? 'Curated R1 & U15 Faculty' : 'নির্বাচিত আর১ ও ইউ১৫ ল্যাব'}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💰</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>NSF / NIH / ERC</div>
            <div className={styles.statLabel}>
              {lang === 'en' ? 'Verified Active Grants' : 'সক্রিয় রিসার্চ ফান্ডিং'}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>📊</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>{pipeline.length} PIs</div>
            <div className={styles.statLabel}>
              {lang === 'en' ? 'In Outreach Pipeline' : 'আউটরিচ পাইপলাইনে ট্র্যাকিং'}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🌐</div>
          <div className={styles.statInfo}>
            <div className={styles.statVal}>OpenAlex Live</div>
            <div className={styles.statLabel}>
              {lang === 'en' ? 'Global Deep Search Ready' : 'গ্লোবাল পেপার ও ফ্যাকাল্টি সার্চ'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'search' ? styles.active : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <span>🔍</span>
          <span>{lang === 'en' ? 'Professor & Lab Directory' : 'প্রফেসর ও ল্যাব ডিরেক্টরি'}</span>
          <span className={styles.tabBadge}>{professors.length}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'email_studio' ? styles.active : ''}`}
          onClick={() => setActiveTab('email_studio')}
        >
          <span>✉️</span>
          <span>{lang === 'en' ? 'AI Cold Outreach Studio' : 'এআই কোল্ড আউটরিচ স্টুডিও'}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'pipeline' ? styles.active : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <span>📊</span>
          <span>{lang === 'en' ? 'Outreach Pipeline & CRM' : 'আউটরিচ পাইপলাইন ট্র্যাকার'}</span>
          <span className={styles.tabBadge}>{pipeline.length}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'guide' ? styles.active : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          <span>💡</span>
          <span>{lang === 'en' ? 'Funding Intel' : 'ফান্ডিং ইন্টেল'}</span>
          <span className={styles.tabBadge}>AI</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFESSOR & LAB DIRECTORY                                          */}
      {/* ========================================================================= */}
      {activeTab === 'search' && (
        <section className={styles.searchSection}>
          {/* Search Mode Toggle (Curated R1/U15 vs Global Live OpenAlex) */}
          <div className={styles.searchModeToggle}>
            <button
              type="button"
              className={`${styles.searchModeBtn} ${searchMode === 'curated' ? styles.searchModeActive : ''}`}
              onClick={() => setSearchMode('curated')}
            >
              <span>🏛️</span>
              <span>{lang === 'en' ? 'Verified R1 & U15 Faculty (PostgreSQL)' : 'ভেরিফায়েড আর১/ইউ১৫ ফ্যাকাল্টি (ডাটাবেজ)'}</span>
            </button>
            <button
              type="button"
              className={`${styles.searchModeBtn} ${searchMode === 'live' ? styles.searchModeActive : ''}`}
              onClick={() => setSearchMode('live')}
            >
              <span>🌐</span>
              <span>{lang === 'en' ? 'Live Academic Deep Search (OpenAlex)' : 'গ্লোবাল লাইভ সার্চ (OpenAlex)'}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className={styles.searchBarRow}>
            {searchMode === 'live' && (
              <div className={styles.entitySelectorWrap}>
                <select
                  className={styles.entitySelect}
                  value={liveEntityType}
                  onChange={(e) => setLiveEntityType(e.target.value as 'all' | 'works' | 'institutions' | 'authors')}
                  aria-label="Search Target Entity"
                  title={lang === 'en' ? 'Select search target: All, Works, Institutions, or Authors' : 'সার্চ টার্গেট নির্বাচন করুন'}
                >
                  {ENTITY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {lang === 'en' ? opt.labelEn : opt.labelBn}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <input
              type="text"
              className={styles.searchInput}
              placeholder={
                searchMode === 'live'
                  ? (lang === 'en'
                      ? (ENTITY_TYPE_OPTIONS.find((o) => o.id === liveEntityType)?.placeholderEn || 'Search OpenAlex...')
                      : (ENTITY_TYPE_OPTIONS.find((o) => o.id === liveEntityType)?.placeholderBn || 'OpenAlex এ অনুসন্ধান করুন...'))
                  : (lang === 'en'
                      ? 'Search by professor name, university, research interest (e.g. Robotics, LLMs, Photonics)...'
                      : 'প্রফেসরের নাম, বিশ্ববিদ্যালয় বা রিসার্চ টপিক লিখে সার্চ করুন (যেমন: রোবোটিক্স, এলএলএম)...')
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <Button variant="primary" onClick={runSearch} disabled={loading}>
              {loading ? 'Searching...' : lang === 'en' ? 'Search Faculty' : 'অনুসন্ধান'}
            </Button>
          </div>

          {/* If Live mode, show entity type selector pill chips + hint */}
          {searchMode === 'live' && (
            <div className={styles.filterChipsRow} style={{ marginTop: '-4px', marginBottom: 'var(--space-3)' }}>
              <span className={styles.filterLabel}>{lang === 'en' ? 'Target Entity:' : 'টার্গেট এনটিটি:'}</span>
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`${styles.filterChip} ${liveEntityType === opt.id ? styles.chipActive : ''}`}
                  onClick={() => setLiveEntityType(opt.id)}
                >
                  <span>{opt.icon}</span>
                  <span>{lang === 'en' ? opt.labelEn : opt.labelBn}</span>
                </button>
              ))}
              <span className={styles.entityHint}>
                • {lang === 'en'
                    ? (ENTITY_TYPE_OPTIONS.find((o) => o.id === liveEntityType)?.hintEn)
                    : (ENTITY_TYPE_OPTIONS.find((o) => o.id === liveEntityType)?.hintBn)}
              </span>
            </div>
          )}

          {/* Domain Chips */}
          <div className={styles.filterChipsRow}>
            <span className={styles.filterLabel}>{lang === 'en' ? 'Domain:' : 'ক্ষেত্র:'}</span>
            {DOMAIN_OPTIONS.map((d) => (
              <button
                key={d}
                className={`${styles.filterChip} ${selectedDomain === d ? styles.chipActive : ''}`}
                onClick={() => setSelectedDomain(d)}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Country Chips & Toggles */}
          <div className={styles.filterChipsRow}>
            <span className={styles.filterLabel}>{lang === 'en' ? 'Country:' : 'দেশ:'}</span>
            {COUNTRY_OPTIONS.map((c) => (
              <button
                key={c}
                className={`${styles.filterChip} ${selectedCountry === c ? styles.chipActive : ''}`}
                onClick={() => setSelectedCountry(c)}
              >
                {c}
              </button>
            ))}

            <label className={styles.toggleCheckboxLabel} style={{ marginLeft: 'auto' }}>
              <input
                type="checkbox"
                checked={activeFundingOnly}
                onChange={(e) => setActiveFundingOnly(e.target.checked)}
              />
              <span>{lang === 'en' ? 'Active Grants Only (NSF/NIH/ERC)' : 'শুধুমাত্র সক্রিয় ফান্ডিং'}</span>
            </label>

            <label className={styles.toggleCheckboxLabel}>
              <input
                type="checkbox"
                checked={acceptingOnly}
                onChange={(e) => setAcceptingOnly(e.target.checked)}
              />
              <span>{lang === 'en' ? 'Recruiting Fall 2026' : 'ফল ২০২৬-এ ছাত্র নিচ্ছে'}</span>
            </label>
          </div>

          {/* Results Grid */}
          <div className={styles.profGrid}>
            {professors.map((p) => (
              <GlassCard key={p.id} className={styles.profCard} variant="bordered" hover>
                <div className={styles.profHeader}>
                  <div>
                    <h3 className={styles.profName}>{p.name}</h3>
                    <p className={styles.profTitle}>{p.title}</p>
                  </div>
                  <Badge variant={p.accepting_students ? 'success' : 'neutral'} size="sm">
                    {p.accepting_students ? 'Open for RA/TA' : 'Faculty'}
                  </Badge>
                </div>

                <div className={styles.uniName}>
                  {p.university} ({p.country})
                </div>

                <div className={styles.profMetaRow}>
                  <Badge variant="ai" size="sm">
                    {p.tier}
                  </Badge>
                  {p.h_index && (
                    <span className={styles.hIndexBadge}>
                      h-index: <strong>{p.h_index}</strong> ({p.citations_count?.toLocaleString()} citations)
                    </span>
                  )}
                </div>

                {/* Lab & Funding */}
                <div className={styles.labInfo}>
                  <div className={styles.labName}>
                    <span>🔬 {p.lab_name}</span>
                    {p.lab_url && (
                      <a href={p.lab_url} target="_blank" rel="noopener noreferrer" className={styles.labLink}>
                        Lab Site ↗
                      </a>
                    )}
                  </div>
                  {p.funding_sources.length > 0 && (
                    <div className={styles.fundingTags}>
                      {p.funding_sources.slice(0, 2).map((f, i) => (
                        <span key={i} className={styles.fundingTag}>
                          💰 {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Research Interests */}
                <div className={styles.researchInterests}>
                  {p.research_interests.map((topic, i) => (
                    <span key={i} className={styles.topicTag}>
                      {topic}
                    </span>
                  ))}
                </div>

                {/* Recent Publication */}
                {p.recent_publications.length > 0 && (
                  <div className={styles.recentPubsSection}>
                    <div className={styles.pubTitleHeader}>Latest Research Paper</div>
                    <div className={styles.pubItem}>
                      &quot;{p.recent_publications[0].title}&quot;
                    </div>
                    <div className={styles.pubVenue}>
                      {p.recent_publications[0].venue} ({p.recent_publications[0].year})
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className={styles.profActions}>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={() => handleSelectProfForEmail(p)}
                  >
                    ✉️ {lang === 'en' ? 'Draft Cold Email' : 'ইমেইল ড্রাফট'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddToPipeline(p, 'shortlisted')}
                    title="Add to CRM Pipeline"
                  >
                    + Shortlist
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLaunchInterviewPrep(p)}
                    title="Preview Interview Questions"
                  >
                    🎙️
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>

          {professors.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
              No professors found matching current filters. Try relaxing keywords or domain constraints.
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI COLD OUTREACH STUDIO                                            */}
      {/* ========================================================================= */}
      {activeTab === 'email_studio' && (
        <section className={styles.studioContainer}>
          {/* Left Column: Form & Student Profile */}
          <GlassCard variant="elevated" className={styles.studioForm}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold' }}>
              👤 {lang === 'en' ? 'Target Professor & Your Profile' : 'টার্গেট প্রফেসর ও আপনার প্রোফাইল'}
            </h3>

            {/* Selected Professor Banner */}
            {selectedProf ? (
              <div className={styles.targetProfBanner}>
                <div className={styles.targetProfName}>{selectedProf.name}</div>
                <div className={styles.targetProfUni}>{selectedProf.university} • {selectedProf.department}</div>
                <div className={styles.targetProfEmail}>Email: {selectedProf.email}</div>
              </div>
            ) : (
              <div className={styles.noProfAlert}>
                Please select a professor from the directory first.
              </div>
            )}

            {/* Feature 1: CV Upload Dropzone */}
            <div
              className={styles.cvDropzone}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className={styles.cvUploadInput}
                accept=".pdf,.txt,.docx"
                onChange={handleCVFileUpload}
              />
              <span style={{ fontSize: '22px' }}>📄</span>
              <div className={styles.cvDropzoneTitle}>
                {cvLoading
                  ? (lang === 'en' ? 'Parsing CV with AI...' : 'এআই দিয়ে সিভি বিশ্লেষণ করা হচ্ছে...')
                  : cvParsedData
                  ? (lang === 'en' ? `✓ ${cvParsedData.student_name || 'Resume'} Uploaded (Click to Change)` : '✓ সিভি আপলোড সম্পন্ন (পরিবর্তন করতে ক্লিক করুন)')
                  : (lang === 'en' ? 'Upload CV / Resume (PDF or TXT) for 1-Click Auto-Fill' : 'সিভি / রেজ্যুমে আপলোড করুন (১-ক্লিকে ফর্ম পূরণ)')}
              </div>
              <div className={styles.cvDropzoneSub}>
                {lang === 'en'
                  ? 'Extracts GPA, degrees, thesis topic & computes exact skill match with professor'
                  : 'জিপিএ, ডিগ্রি ও রিসার্চ স্কিল স্বয়ংক্রিয়ভাবে প্রফেসরের সাথে ম্যাচ করবে'}
              </div>
            </div>

            {/* Feature 1: Match Score & Skill Intersection Card */}
            {matchLoading && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '6px' }}>
                ⚡ Calculating lab compatibility & skill gaps...
              </div>
            )}

            {matchScore && !matchLoading && (
              <div className={styles.matchScoreCard}>
                <div className={styles.matchHeaderRow}>
                  <div className={styles.matchTitle}>
                    <span>🎯</span>
                    <span>{lang === 'en' ? 'Lab Compatibility Gauge' : 'ল্যাব ম্যাচ স্কোর'}</span>
                  </div>
                  <div
                    className={styles.matchScoreBadge}
                    style={{
                      background:
                        matchScore.compatibility_score >= 80
                          ? '#10b981'
                          : matchScore.compatibility_score >= 60
                          ? '#3b82f6'
                          : '#f59e0b',
                    }}
                  >
                    {matchScore.compatibility_score}%
                  </div>
                </div>

                <div className={styles.skillIntersectionRow}>
                  {matchScore.matching_skills && matchScore.matching_skills.length > 0 && (
                    <div className={styles.intersectionGroup}>
                      <span style={{ fontWeight: 600, color: '#059669' }}>
                        {lang === 'en' ? 'Exact Overlaps:' : 'সরাসরি মিল:'}
                      </span>
                      {matchScore.matching_skills.map((skill: string, idx: number) => (
                        <span key={idx} className={styles.overlapBadge}>
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {matchScore.adjacent_skills && matchScore.adjacent_skills.length > 0 && (
                    <div className={styles.intersectionGroup}>
                      <span style={{ fontWeight: 600, color: '#2563eb' }}>
                        {lang === 'en' ? 'Transferable:' : 'প্রাসঙ্গিক:'}
                      </span>
                      {matchScore.adjacent_skills.map((skill: string, idx: number) => (
                        <span key={idx} className={styles.adjacentBadge}>
                          ~ {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {matchScore.skill_gaps && matchScore.skill_gaps.length > 0 && (
                    <div className={styles.intersectionGroup}>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>
                        {lang === 'en' ? 'Lab Skill Gaps:' : 'ল্যাব রিকোয়ারমেন্ট:'}
                      </span>
                      {matchScore.skill_gaps.slice(0, 3).map((skill: string, idx: number) => (
                        <span key={idx} className={styles.gapBadge}>
                          + {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {matchScore.recommendation_snippet}
                </div>
              </div>
            )}

            {/* Paper Selection Hook */}
            {selectedProf && selectedProf.recent_publications.length > 0 && (
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                    {lang === 'en' ? 'Paper Hook (To Cite in Paragraph 1):' : 'যে পেপারের রেফারেন্স দেবেন:'}
                  </label>
                  <button
                    type="button"
                    onClick={handleDeconstructPaper}
                    disabled={paperDeconstructLoading || !selectedPaperTitle}
                    className={styles.deconstructBtn}
                  >
                    {paperDeconstructLoading ? 'Analyzing...' : '🔬 Deconstruct Paper with AI'}
                  </button>
                </div>
                <select
                  className={styles.formSelect}
                  value={selectedPaperTitle}
                  onChange={(e) => setSelectedPaperTitle(e.target.value)}
                >
                  {selectedProf.recent_publications.map((pub, i) => (
                    <option key={i} value={pub.title}>
                      {pub.title} ({pub.year})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Feature 2: Paper Deconstructor Results Card */}
            {paperDeconstructData && (
              <div className={styles.deconstructCard}>
                <div className={styles.deconstructHeader}>
                  <div className={styles.deconstructTitle}>
                    <span>🔬</span>
                    <span>{lang === 'en' ? 'AI Paper Deep Dive' : 'গবেষণা পেপার ডিকনস্ট্রাকশন'}</span>
                  </div>
                  <Badge variant="ai" size="sm">
                    {paperDeconstructData.paper_title.slice(0, 32)}...
                  </Badge>
                </div>

                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>💡 {lang === 'en' ? 'Core Contribution:' : 'মূল অবদান:'} </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{paperDeconstructData.core_contribution}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>⚠️ {lang === 'en' ? 'Unsolved Bottleneck:' : 'সীমাবদ্ধতা:'} </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{paperDeconstructData.unsolved_limitation}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>
                    🎯 {lang === 'en' ? 'Tailored Cold Hook (Your Research Inroad):' : 'কোল্ড ইমেইলের জন্য কাস্টম হুক:'}
                  </div>
                  <div className={styles.hookSnippet}>
                    &quot;{paperDeconstructData.tailored_cold_hook}&quot;
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.applyHookBtn}
                  onClick={handleApplyHookToEmail}
                >
                  ✓ {lang === 'en' ? 'Insert Hook into Research Proposal' : 'প্রস্তাবে এই হুক যুক্ত করুন'}
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Your Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Current Institution</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={studentInstitution}
                  onChange={(e) => setStudentInstitution(e.target.value)}
                  placeholder="e.g. BUET / Dhaka University"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Degree Completed</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={studentDegree}
                  onChange={(e) => setStudentDegree(e.target.value)}
                  placeholder="e.g. B.Sc. in Computer Science"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>GPA</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={studentGpa}
                  onChange={(e) => setStudentGpa(e.target.value)}
                  placeholder="e.g. 3.82"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Core Technical Skills (comma separated)</label>
              <input
                type="text"
                className={styles.formInput}
                value={studentSkills}
                onChange={(e) => setStudentSkills(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Undergrad Thesis / Capstone Topic</label>
              <textarea
                className={styles.formTextarea}
                rows={2}
                value={studentThesis}
                onChange={(e) => setStudentThesis(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Degree</label>
                <select
                  className={styles.formSelect}
                  value={targetDegree}
                  onChange={(e) => setTargetDegree(e.target.value === 'PhD' ? 'PhD' : 'MS with Thesis')}
                >
                  <option value="PhD">PhD</option>
                  <option value="MS with Thesis">MS with Thesis</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Intake</label>
                <select
                  className={styles.formSelect}
                  value={targetSemester}
                  onChange={(e) => setTargetSemester(e.target.value)}
                >
                  <option value="Fall 2026">Fall 2026</option>
                  <option value="Spring 2027">Spring 2027</option>
                  <option value="Fall 2027">Fall 2027</option>
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateEmail}
              disabled={emailGenerating || !selectedProf}
            >
              {emailGenerating ? 'Synthesizing with AI...' : '✨ Generate Personalized Cold Email'}
            </Button>
          </GlassCard>

          {/* Right Column: Generated Email Studio & Quality Audit */}
          <GlassCard variant="elevated" className={styles.emailOutputCard}>
            <div className={styles.emailTabsRow}>
              <button
                className={`${styles.subTabBtn} ${emailSubTab === 'initial' ? styles.subTabActive : ''}`}
                onClick={() => setEmailSubTab('initial')}
              >
                1. Initial Cold Email
              </button>
              <button
                className={`${styles.subTabBtn} ${emailSubTab === 'followup1' ? styles.subTabActive : ''}`}
                onClick={() => setEmailSubTab('followup1')}
              >
                2. 7-Day Follow-Up
              </button>
              <button
                className={`${styles.subTabBtn} ${emailSubTab === 'followup2' ? styles.subTabActive : ''}`}
                onClick={() => setEmailSubTab('followup2')}
              >
                3. 14-Day Final Follow-Up
              </button>
            </div>

            {/* Subject Line Selector */}
            {generatedEmailRes && emailSubTab === 'initial' && (
              <div className={styles.subjectLineBox}>
                <div className={styles.subjectLineLabel}>Recommended Subject Line:</div>
                <select
                  className={styles.subjectSelect}
                  value={selectedSubjectLine}
                  onChange={(e) => setSelectedSubjectLine(e.target.value)}
                >
                  {generatedEmailRes.subject_line_options.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Email Body Display */}
            <div className={styles.emailContentBox}>
              {generatedEmailRes ? (
                emailSubTab === 'initial' ? (
                  generatedEmailRes.initial_email.body
                ) : emailSubTab === 'followup1' ? (
                  generatedEmailRes.follow_up_1.body
                ) : (
                  generatedEmailRes.follow_up_2.body
                )
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  Click &quot;Generate Personalized Cold Email&quot; to produce a tailored, 3-paragraph research pitch adhering to top university admissions standards.
                </span>
              )}
            </div>

            {/* Anti-Spam & Quality Audit */}
            {generatedEmailRes && (
              <div className={styles.auditSummaryRow}>
                <div>
                  <strong>Anti-Spam Score:</strong> {generatedEmailRes.anti_spam_audit.verdict} ({generatedEmailRes.initial_email.word_count} words)
                </div>
                <div className={styles.auditScore}>
                  {generatedEmailRes.anti_spam_audit.overall_score}/100
                </div>
              </div>
            )}

            {/* Bangla Outreach Guidance */}
            {generatedEmailRes && (
              <div className={styles.banglaTipBox}>
                <strong>💡 গুরুত্বপূর্ণ টিপস (Ethos Guidance):</strong>
                <p style={{ marginTop: '4px', whiteSpace: 'pre-line' }}>{generatedEmailRes.bangla_guidance}</p>
              </div>
            )}

            {/* Action Buttons */}
            {generatedEmailRes && selectedProf && (
              <div className={styles.studioActions}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const currentText =
                      emailSubTab === 'initial'
                        ? generatedEmailRes.initial_email.body
                        : emailSubTab === 'followup1'
                        ? generatedEmailRes.follow_up_1.body
                        : generatedEmailRes.follow_up_2.body;
                    copyToClipboard(currentText);
                  }}
                >
                  📋 Copy Email Body
                </Button>

                <a
                  href={getGmailLink(
                    selectedProf.email,
                    selectedSubjectLine,
                    emailSubTab === 'initial'
                      ? generatedEmailRes.initial_email.body
                      : emailSubTab === 'followup1'
                      ? generatedEmailRes.follow_up_1.body
                      : generatedEmailRes.follow_up_2.body
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="outline" size="sm">
                    ✉️ Open in Gmail
                  </Button>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddToPipeline(selectedProf, 'drafted')}
                >
                  💾 Save to Pipeline
                </Button>
              </div>
            )}
          </GlassCard>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OUTREACH PIPELINE & CRM                                            */}
      {/* ========================================================================= */}
      {activeTab === 'pipeline' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>
                {lang === 'en' ? 'Your Graduate Outreach Pipeline' : 'আপনার আউটরিচ পাইপলাইন ট্র্যাকার'}
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Track cold emails, response statuses, follow-up countdowns, and interview schedules.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('search')}
            >
              + Find More Professors
            </Button>
          </div>

          <div className={styles.kanbanBoard}>
            {/* Column 1: Shortlisted */}
            <div className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <span>📌 Shortlisted</span>
                <span className={styles.columnCount}>
                  {pipeline.filter((i) => i.stage === 'shortlisted').length}
                </span>
              </div>
              {pipeline.filter((i) => i.stage === 'shortlisted').length === 0 && (
                <div className={styles.emptyKanbanState}>
                  {lang === 'en' ? 'No professors shortlisted yet' : 'এই ধাপে কোনো প্রফেসর শর্টলিস্ট করা নেই'}
                </div>
              )}
              {pipeline
                .filter((i) => i.stage === 'shortlisted')
                .map((item) => (
                  <div key={item.id} className={styles.pipelineCard}>
                    <div className={styles.pipelineCardProf}>{item.profName}</div>
                    <div className={styles.pipelineCardUni}>{item.university}</div>
                    <div className={styles.pipelineCardActions}>
                      <button
                        className={styles.pipelineActionBtn}
                        onClick={() => handleMovePipelineStage(item.id, 'drafted')}
                      >
                        Draft Email ➔
                      </button>
                      <button
                        className={styles.pipelineDeleteBtn}
                        onClick={() => handleRemoveFromPipeline(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Column 2: Email Drafted */}
            <div className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <span>📝 Email Drafted</span>
                <span className={styles.columnCount}>
                  {pipeline.filter((i) => i.stage === 'drafted').length}
                </span>
              </div>
              {pipeline.filter((i) => i.stage === 'drafted').length === 0 && (
                <div className={styles.emptyKanbanState}>
                  {lang === 'en' ? 'No drafts waiting to be sent' : 'কোনো ড্রাফট পাঠানো বাকি নেই'}
                </div>
              )}
              {pipeline
                .filter((i) => i.stage === 'drafted')
                .map((item) => (
                  <div key={item.id} className={styles.pipelineCard}>
                    <div className={styles.pipelineCardProf}>{item.profName}</div>
                    <div className={styles.pipelineCardUni}>{item.university}</div>
                    <div className={styles.pipelineCardActions}>
                      <button
                        className={styles.pipelineSentBtn}
                        onClick={() => handleMovePipelineStage(item.id, 'contacted')}
                      >
                        Mark as Sent ✉️
                      </button>
                      <button
                        className={styles.pipelineDeleteBtn}
                        onClick={() => handleRemoveFromPipeline(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Column 3: Contacted (Waiting / Follow-up Alert) */}
            <div className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <span>📬 Contacted</span>
                <span className={styles.columnCount}>
                  {pipeline.filter((i) => i.stage === 'contacted').length}
                </span>
              </div>
              {pipeline.filter((i) => i.stage === 'contacted').length === 0 && (
                <div className={styles.emptyKanbanState}>
                  {lang === 'en' ? 'No active inquiries awaiting reply' : 'উত্তরের অপেক্ষায় কোনো ইমেইল নেই'}
                </div>
              )}
              {pipeline
                .filter((i) => i.stage === 'contacted')
                .map((item) => (
                  <div key={item.id} className={styles.pipelineCard}>
                    <div className={styles.pipelineCardProf}>{item.profName}</div>
                    <div className={styles.pipelineCardUni}>{item.university}</div>
                    <div className={styles.pipelineDateRow}>
                      <span>Sent: {item.sentAt ? new Date(item.sentAt).toLocaleDateString() : 'Recently'}</span>
                      <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Follow-up due: Day 7</span>
                    </div>
                    <div className={styles.pipelineCardActions}>
                      <button
                        className={styles.pipelineActionBtn}
                        onClick={() => handleMovePipelineStage(item.id, 'interviewing')}
                      >
                        🎉 Interview Scheduled!
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Column 4: Interview Scheduled / Funded Offer */}
            <div className={styles.kanbanColumn}>
              <div className={styles.columnHeader}>
                <span>🏆 Interview / Funded</span>
                <span className={styles.columnCount}>
                  {pipeline.filter((i) => i.stage === 'interviewing').length}
                </span>
              </div>
              {pipeline.filter((i) => i.stage === 'interviewing').length === 0 && (
                <div className={styles.emptyKanbanState}>
                  {lang === 'en' ? 'Interviews and offers will show here' : 'ইন্টারভিউ ও অফার এখানে দেখাবে'}
                </div>
              )}
              {pipeline
                .filter((i) => i.stage === 'interviewing')
                .map((item) => (
                  <div key={item.id} className={styles.pipelineCard} style={{ borderColor: '#10b981' }}>
                    <div className={styles.pipelineCardProf}>⭐ {item.profName}</div>
                    <div className={styles.pipelineCardUni}>{item.university}</div>
                    <Badge variant="success" size="sm">
                      RA/TA Discussions Open
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RA / TA FUNDING INTEL                                              */}
      {/* ========================================================================= */}
      {activeTab === 'guide' && (
        <section>
          {/* Header */}
          <div className={styles.taraSuiteHeader}>
            <h2 className={styles.taraSuiteTitle}>
              {lang === 'en'
                ? 'RA / TA Funding Intel'
                : 'আরএ / টিএ ফান্ডিং ইন্টেল'}
            </h2>
            <p className={styles.taraSuiteSubtitle}>
              {lang === 'en'
                ? 'Strategic Assistantship Fit, Oral English Clearances, Living Stipends & Real-World Funding Advisory.'
                : 'রিসার্চ অ্যাসিস্ট্যান্টশিপ (RA), টিচিং অ্যাসিস্ট্যান্টশিপ (TA), স্পোকেন টেস্ট নিয়মাবলী এবং মাসিক সঞ্চয়ের বাস্তবসম্মত এআই সিমুলেটর।'}
            </p>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className={styles.taraSubNav}>
            <button
              type="button"
              className={`${styles.taraSubNavBtn} ${guideSubTab === 'evaluator' ? styles.taraSubNavBtnActive : ''}`}
              onClick={() => setGuideSubTab('evaluator')}
            >
              <span>🎯</span>
              <span>{lang === 'en' ? 'Fit & Viability Evaluator' : 'প্রোফাইল ফিট ও যোগ্যতা মূল্যায়ন'}</span>
            </button>
            <button
              type="button"
              className={`${styles.taraSubNavBtn} ${guideSubTab === 'simulator' ? styles.taraSubNavBtnActive : ''}`}
              onClick={() => setGuideSubTab('simulator')}
            >
              <span>💰</span>
              <span>{lang === 'en' ? 'Stipend & Savings Simulator' : 'স্টাইপেন্ড ও সেভিংস সিমুলেটর'}</span>
            </button>
            <button
              type="button"
              className={`${styles.taraSubNavBtn} ${guideSubTab === 'advisor' ? styles.taraSubNavBtnActive : ''}`}
              onClick={() => setGuideSubTab('advisor')}
            >
              <span>🤖</span>
              <span>{lang === 'en' ? 'AI Funding Advisor' : 'এআই ফান্ডিং অ্যাডভাইজর'}</span>
            </button>
            <button
              type="button"
              className={`${styles.taraSubNavBtn} ${guideSubTab === 'matrix' ? styles.taraSubNavBtnActive : ''}`}
              onClick={() => setGuideSubTab('matrix')}
            >
              <span>🌐</span>
              <span>{lang === 'en' ? 'Destination Matrix' : 'গ্লোবাল ফান্ডিং ম্যাট্রিক্স'}</span>
            </button>
          </div>

          {/* ================================================================= */}
          {/* SUB-TAB 1: AI PROFILE FIT & VIABILITY EVALUATOR                   */}
          {/* ================================================================= */}
          {guideSubTab === 'evaluator' && (
            <div className={styles.evaluatorGrid}>
              {/* Form Input Card */}
              <div className={styles.evaluatorFormCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    ⚙️ {lang === 'en' ? 'Academic & Test Credentials' : 'একাডেমিক ও টেস্ট তথ্য'}
                  </h3>
                  <Badge variant="verified" size="sm">
                    {lang === 'en' ? 'Custom Evaluator' : 'কাস্টম ইভালুয়েটর'}
                  </Badge>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{lang === 'en' ? 'Degree Goal' : 'টার্গেট ডিগ্রি'}</label>
                  <select
                    className={styles.formSelect}
                    value={taraDegreeGoal}
                    onChange={(e) => setTaraDegreeGoal(e.target.value as 'PhD' | 'MS with Thesis')}
                  >
                    <option value="PhD">Direct PhD (Higher Grant & TA Priority)</option>
                    <option value="MS with Thesis">MS with Thesis (Competitive Assistantships)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{lang === 'en' ? 'Undergrad GPA' : 'অনার্স সিজিপিএ'}</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={taraGpa}
                      onChange={(e) => setTaraGpa(e.target.value)}
                      placeholder="e.g. 3.82"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{lang === 'en' ? 'Target Country' : 'টার্গেট দেশ'}</label>
                    <select
                      className={styles.formSelect}
                      value={taraTargetCountry}
                      onChange={(e) => setTaraTargetCountry(e.target.value)}
                    >
                      <option value="USA">USA (Strict State ITA Laws)</option>
                      <option value="Canada">Canada (U15 Package)</option>
                      <option value="Germany">Germany (Salaried Contract)</option>
                      <option value="UK">UK (UKRI Research)</option>
                      <option value="Australia">Australia (RTP Scholarship)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{lang === 'en' ? 'Field / Major' : 'বিষয় বা বিভাগ'}</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={taraMajor}
                    onChange={(e) => setTaraMajor(e.target.value)}
                    placeholder="e.g. Computer Science, EEE, Robotics"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {lang === 'en' ? 'Research Track Record' : 'রিসার্চ পূর্বঅভিজ্ঞতা'}
                  </label>
                  <select
                    className={styles.formSelect}
                    value={taraResearchExp}
                    onChange={(e) =>
                      setTaraResearchExp(
                        e.target.value as 'peer_reviewed' | 'preprint_workshop' | 'thesis_only' | 'none'
                      )
                    }
                  >
                    <option value="peer_reviewed">Peer-Reviewed First/Co-Author Paper (Highest RA Priority)</option>
                    <option value="preprint_workshop">arXiv Preprint / Workshop Paper</option>
                    <option value="thesis_only">Undergraduate Senior Thesis / Capstone</option>
                    <option value="none">No Prior Publications (Early Stage)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {lang === 'en' ? 'Technical & Coding Depth' : 'কোডিং ও টেকনিক্যাল গভীরতা'}
                  </label>
                  <select
                    className={styles.formSelect}
                    value={taraCoding}
                    onChange={(e) =>
                      setTaraCoding(e.target.value as 'beginner' | 'intermediate' | 'advanced')
                    }
                  >
                    <option value="advanced">Advanced (PyTorch, CUDA, C++, Distributed Systems, Hardware)</option>
                    <option value="intermediate">Intermediate (Python, NumPy, Git, Standard ML Frameworks)</option>
                    <option value="beginner">Foundational (Coursework Programming)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{lang === 'en' ? 'English Test' : 'ইংরেজি টেস্ট'}</label>
                    <select
                      className={styles.formSelect}
                      value={taraEnglishTest}
                      onChange={(e) => setTaraEnglishTest(e.target.value as 'toefl' | 'ielts' | 'duolingo' | 'none')}
                    >
                      <option value="toefl">TOEFL iBT</option>
                      <option value="ielts">IELTS Academic</option>
                      <option value="duolingo">Duolingo / Other</option>
                      <option value="none">Native / Exempt</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      {lang === 'en' ? 'Speaking Score' : 'স্পিকিং স্কোর'}
                    </label>
                    <input
                      type="number"
                      step={taraEnglishTest === 'ielts' ? '0.5' : '1'}
                      className={styles.formInput}
                      value={taraSpeakingScore}
                      onChange={(e) => setTaraSpeakingScore(parseFloat(e.target.value) || 0)}
                      placeholder={taraEnglishTest === 'ielts' ? 'e.g. 7.5' : 'e.g. 26'}
                    />
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={runTARAEvaluation}
                  disabled={taraLoading}
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  {taraLoading ? '⚡ Evaluating Profile...' : '🎯 Run Strategic Funding Assessment'}
                </Button>
              </div>

              {/* Results Column */}
              <div className={styles.evaluatorResultCol}>
                {taraResult ? (
                  <>
                    {/* Dual Meter Row */}
                    <div className={styles.viabilityMeterRow}>
                      {/* RA Viability Card */}
                      <div className={styles.viabilityMeterCard}>
                        <div className={styles.meterHeader}>
                          <span className={styles.meterTitle}>
                            <span>🔬</span>
                            <span>{lang === 'en' ? 'RA Viability Score' : 'আরএ সম্ভাবনা'}</span>
                          </span>
                          <Badge
                            variant={
                              taraResult.ra_viability_score >= 70
                                ? 'success'
                                : taraResult.ra_viability_score >= 50
                                ? 'verified'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {taraResult.ra_viability_score >= 70
                              ? 'High Fit'
                              : taraResult.ra_viability_score >= 50
                              ? 'Moderate'
                              : 'Emerging'}
                          </Badge>
                        </div>
                        <div
                          className={styles.meterScoreNumber}
                          style={{
                            color:
                              taraResult.ra_viability_score >= 70
                                ? '#10b981'
                                : taraResult.ra_viability_score >= 50
                                ? '#818cf8'
                                : '#f59e0b',
                          }}
                        >
                          {taraResult.ra_viability_score}%
                        </div>
                        <div className={styles.meterProgressBar}>
                          <div
                            className={styles.meterProgressFill}
                            style={{
                              width: `${taraResult.ra_viability_score}%`,
                              background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                            }}
                          />
                        </div>
                        <div className={styles.meterSubtext}>
                          Grant readiness driven by publication output, {taraCoding} programming & thesis depth.
                        </div>
                      </div>

                      {/* TA Viability Card */}
                      <div className={styles.viabilityMeterCard}>
                        <div className={styles.meterHeader}>
                          <span className={styles.meterTitle}>
                            <span>👨‍🏫</span>
                            <span>{lang === 'en' ? 'TA Viability Score' : 'টিএ সম্ভাবনা'}</span>
                          </span>
                          <Badge
                            variant={
                              taraResult.ta_viability_score >= 70
                                ? 'success'
                                : taraResult.ta_viability_score >= 50
                                ? 'verified'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {taraResult.ta_viability_score >= 70
                              ? 'Instruction Clear'
                              : taraResult.ta_viability_score >= 50
                              ? 'Conditional'
                              : 'Restricted'}
                          </Badge>
                        </div>
                        <div
                          className={styles.meterScoreNumber}
                          style={{
                            color:
                              taraResult.ta_viability_score >= 70
                                ? '#10b981'
                                : taraResult.ta_viability_score >= 50
                                ? '#f59e0b'
                                : '#ef4444',
                          }}
                        >
                          {taraResult.ta_viability_score}%
                        </div>
                        <div className={styles.meterProgressBar}>
                          <div
                            className={styles.meterProgressFill}
                            style={{
                              width: `${taraResult.ta_viability_score}%`,
                              background:
                                taraResult.ta_viability_score >= 70
                                  ? 'linear-gradient(90deg, #818cf8 0%, #10b981 100%)'
                                  : 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)',
                            }}
                          />
                        </div>
                        <div className={styles.meterSubtext}>
                          Governed by department teaching capacity & state spoken English certifications.
                        </div>
                      </div>
                    </div>

                    {/* Primary Strategy Recommendation */}
                    <GlassCard variant="bordered" padding="md">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '18px' }}>💡</span>
                        <strong style={{ fontSize: '14px', color: '#818CF8' }}>
                          {lang === 'en' ? 'Primary AI Recommendation:' : 'প্রধান সুপারিশ:'}
                        </strong>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                          {taraResult.primary_recommendation}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        Based on your GPA ({taraGpa}), {taraResearchExp.replace(/_/g, ' ')} background, and{' '}
                        {taraSpeakingScore} speaking score in {taraTargetCountry}.
                      </p>
                    </GlassCard>

                    {/* Spoken English Clearance Alert */}
                    <div
                      className={`${styles.oralClearanceBox} ${
                        taraResult.oral_english_status === 'cleared'
                          ? styles.oralClearanceCleared
                          : taraResult.oral_english_status === 'borderline'
                          ? styles.oralClearanceBorderline
                          : styles.oralClearanceRestricted
                      }`}
                    >
                      <strong style={{ fontSize: '13px' }}>
                        🗣️ {lang === 'en' ? 'Spoken English & Institutional Clearance:' : 'স্পোকেন ইংলিশ মূল্যায়ন:'}
                      </strong>
                      <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                        {taraResult.oral_english_analysis}
                      </div>
                    </div>

                    {/* Tailored Cold Pitch for RA Outreach */}
                    <div className={styles.pitchBox}>
                      <div className={styles.pitchBoxHeader}>
                        <strong style={{ fontSize: '13px', color: '#818CF8' }}>
                          ✨ {lang === 'en' ? 'Tailored Cold Pitch Hook (for Faculty Outreach):' : 'প্রফেসরের জন্য কোল্ড পিচ হুক:'}
                        </strong>
                        <button
                          type="button"
                          className={styles.copyEmailBtn}
                          onClick={handleCopyPitch}
                          title="Copy pitch to clipboard"
                        >
                          📋 Copy Pitch
                        </button>
                      </div>
                      <div className={styles.pitchText}>&quot;{taraResult.cold_pitch_paragraph}&quot;</div>
                      <div className={styles.pitchActions}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveTab('email_studio');
                            showToast('✉️ Jumped to Cold Outreach Studio!');
                          }}
                        >
                          🚀 Insert into Cold Outreach Studio
                        </Button>
                      </div>
                    </div>

                    {/* Action Steps Checklist */}
                    <GlassCard variant="bordered" padding="md">
                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#E2E8F0', marginTop: 0, marginBottom: '8px' }}>
                        📋 {lang === 'en' ? 'Next Actionable Steps for Funding:' : 'ফান্ডিং নিশ্চিত করার পরবর্তী পদক্ষেপ:'}
                      </h4>
                      <ul className={styles.actionStepList}>
                        {taraResult.action_steps.map((step, sIdx) => (
                          <li key={sIdx} className={styles.actionStepItem}>
                            <span className={styles.actionStepIcon}>✓</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </GlassCard>

                    {/* Summer Strategy & Negotiation Tips */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                      <GlassCard variant="bordered" padding="md">
                        <strong style={{ fontSize: '12.5px', color: '#F59E0B', display: 'block', marginBottom: '6px' }}>
                          ☀️ {lang === 'en' ? 'Summer Funding Reality:' : 'গ্রীষ্মকালীন ফান্ডিং গ্যাপ:'}
                        </strong>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          {taraResult.summer_funding_strategy}
                        </p>
                      </GlassCard>

                      <GlassCard variant="bordered" padding="md">
                        <strong style={{ fontSize: '12.5px', color: '#10B981', display: 'block', marginBottom: '6px' }}>
                          💼 {lang === 'en' ? 'Negotiation Formula:' : 'নেগোসিয়েশন ফর্মুলা:'}
                        </strong>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          {taraResult.negotiation_tip}
                        </p>
                      </GlassCard>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                    Loading personalized funding assessment...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SUB-TAB 2: INTERACTIVE STIPEND & FINANCIAL SIMULATOR              */}
          {/* ================================================================= */}
          {guideSubTab === 'simulator' && (
            <div>
              {/* Simulator Controls Card */}
              <div className={styles.simulatorControlsCard}>
                <div className={styles.simControlsGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{lang === 'en' ? 'Destination Country' : 'টার্গেট দেশ'}</label>
                    <select
                      className={styles.formSelect}
                      value={simCountry}
                      onChange={(e) =>
                        setSimCountry(
                          e.target.value as 'USA' | 'Canada' | 'Germany' | 'UK' | 'Australia'
                        )
                      }
                    >
                      <option value="USA">🇺🇸 United States (R1 / R2 Universities)</option>
                      <option value="Canada">🇨🇦 Canada (U15 Research Consortium)</option>
                      <option value="Germany">🇩🇪 Germany (TU9 / Max Planck / Fraunhofer)</option>
                      <option value="UK">🇬🇧 United Kingdom (Russell Group)</option>
                      <option value="Australia">🇦🇺 Australia (Group of Eight)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{lang === 'en' ? 'Assistantship Role' : 'দায়িত্ব'}</label>
                    <select
                      className={styles.formSelect}
                      value={simRole}
                      onChange={(e) => setSimRole(e.target.value as 'RA' | 'TA')}
                    >
                      <option value="RA">Research Assistantship (RA - Lab Grant)</option>
                      <option value="TA">Teaching Assistantship (TA - Department)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{lang === 'en' ? 'City Cost of Living' : 'শহরের জীবনযাত্রার খরচ'}</label>
                    <select
                      className={styles.formSelect}
                      value={simCityCost}
                      onChange={(e) =>
                        setSimCityCost(e.target.value as 'low' | 'medium' | 'high')
                      }
                    >
                      <option value="low">Moderate / College Town (e.g. Purdue, Texas A&M, Aachen)</option>
                      <option value="medium">Metropolitan / Urban (e.g. Austin, Toronto, Berlin, Manchester)</option>
                      <option value="high">Tier-1 High Cost (e.g. Bay Area, NYC, London, Vancouver, Sydney)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial Provenance & Official Assistantship Directive */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛡️</span>
                  <span>{lang === 'en' ? 'Verified Funding Baseline: Figures cross-verified with graduate collective bargaining agreements (GEO/GSOC) & official university tuition catalogs.' : 'অফিশিয়াল গ্র্যাজুয়েট স্টাইপেন্ড চুক্তি ও আন্তর্জাতিক টিউশন ক্যাটালগ অনুযায়ী অডিটকৃত।'}</span>
                </span>
                <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                  ✓ {lang === 'en' ? 'Agency & Admin Audited' : 'এডমিন অডিটকৃত'}
                </span>
              </div>

              {/* Financial Metric Tiles */}
              <div className={styles.simTilesGrid}>
                {/* Gross Monthly Stipend */}
                <div className={styles.simTile}>
                  <span className={styles.simTileLabel}>
                    💵 {lang === 'en' ? 'Gross Monthly Stipend' : 'মাসিক গ্রস স্টাইপেন্ড'}
                  </span>
                  <div className={styles.simTilePrimaryVal}>
                    {simData.currencySymbol}
                    {simData.baseStipend.toLocaleString()}/mo
                  </div>
                  <div className={styles.simTileSecondaryVal}>
                    ≈ ৳{simData.grossStipendBDTLakh} Lakh BDT/mo
                  </div>
                </div>

                {/* 100% Tuition Waiver Value */}
                <div className={styles.simTile}>
                  <span className={styles.simTileLabel}>
                    🎓 {lang === 'en' ? 'Tuition Remission Value' : 'মওকুফকৃত বাৎসরিক টিউশন'}
                  </span>
                  <div className={styles.simTilePrimaryVal} style={{ color: '#10B981' }}>
                    {simData.tuitionWaiverAnnual > 0
                      ? `${simData.currencySymbol}${simData.tuitionWaiverAnnual.toLocaleString()}/yr`
                      : '100% Free Tuition'}
                  </div>
                  <div className={styles.simTileSecondaryVal}>
                    {simData.tuitionWaiverAnnual > 0
                      ? `≈ ৳${simData.tuitionSavingsBDTLakh} Lakhs saved per year`
                      : 'Guaranteed 0 Tuition by State Law'}
                  </div>
                </div>

                {/* Mandatory Semester Fees */}
                <div className={styles.simTile}>
                  <span className={styles.simTileLabel}>
                    ⚠️ {lang === 'en' ? 'Mandatory Student Fees' : 'বাধ্যতামূলক সেমিস্টার ফি (পকেট থেকে)'}
                  </span>
                  <div className={styles.simTilePrimaryVal} style={{ color: '#F59E0B' }}>
                    {simData.termFees > 0
                      ? `${simData.currencySymbol}${simData.termFees}/sem`
                      : 'Included'}
                  </div>
                  <div className={styles.simTileSecondaryVal} style={{ color: '#94A3B8' }}>
                    {simData.termFees > 0
                      ? `≈ ${simData.currencySymbol}${simData.monthlyAmortizedFees}/mo amortized`
                      : 'No out-of-pocket term fees'}
                  </div>
                </div>

                {/* Estimated Monthly Living Cost */}
                <div className={styles.simTile}>
                  <span className={styles.simTileLabel}>
                    🏠 {lang === 'en' ? 'Total Living Expenses' : 'মাসিক আবাসন ও জীবনযাত্রা খরচ'}
                  </span>
                  <div className={styles.simTilePrimaryVal} style={{ color: '#94A3B8' }}>
                    {simData.currencySymbol}
                    {simData.totalMonthlyLiving.toLocaleString()}/mo
                  </div>
                  <div className={styles.simTileSecondaryVal} style={{ color: '#94A3B8' }}>
                    Rent {simData.currencySymbol}{simData.monthlyRent} • Food {simData.currencySymbol}{simData.monthlyFoodLiving} • Health {simData.currencySymbol}{simData.monthlyHealthInsurance}
                  </div>
                </div>

                {/* Net Monthly Discretionary Savings */}
                <div
                  className={styles.simTile}
                  style={{
                    borderColor: '#10B981',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 20, 32, 0.9) 100%)',
                  }}
                >
                  <span className={styles.simTileLabel} style={{ color: '#10B981' }}>
                    💰 {lang === 'en' ? 'Net Monthly Savings' : 'মাসিক নেট সঞ্চয় (হাতখরচ বাদে)'}
                  </span>
                  <div className={styles.simTilePrimaryVal} style={{ color: '#10B981' }}>
                    {simData.currencySymbol}
                    {simData.netMonthlySavings.toLocaleString()}/mo
                  </div>
                  <div className={styles.simTileSecondaryVal} style={{ color: '#6EE7B7' }}>
                    ≈ ৳{simData.netSavingsBDTLakh} Lakh BDT/mo (~৳{simData.netSavingsBDT.toLocaleString()})
                  </div>
                </div>
              </div>

              {/* Summer Funding Gap Reality Alert */}
              <div className={styles.summerGapBanner}>
                <div className={styles.summerGapTitle}>
                  <span>☀️</span>
                  <span>{lang === 'en' ? 'The Summer Gap Alert (June – August Reality)' : 'গ্রীষ্মকালীন ফান্ডিং গ্যাপ ও সতর্কতা'}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#E2E8F0', margin: 0, lineHeight: 1.5 }}>
                  {simData.summerTip}
                </p>

                <div className={styles.summerGapList}>
                  <div className={styles.summerGapItem}>
                    <strong>1. Faculty RA Summer Buyout:</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Ask your PI for 20h–40h/week summer grant payroll. Pays full stipend ($2,500–$3,500/mo) while conducting pure research.
                    </div>
                  </div>
                  <div className={styles.summerGapItem}>
                    <strong>2. US/Canada Industry CPT Internship:</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Eligible after 2 semesters. Tech companies (Google, Meta, Nvidia, Intel, Bloomberg) pay $7,500–$10,500/month for PhD/MS interns.
                    </div>
                  </div>
                  <div className={styles.summerGapItem}>
                    <strong>3. Summer Session Teaching:</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Large state universities offer 6–8 week accelerated summer courses needing TAs. Covers living expenses during June and July.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SUB-TAB 3: ASK ETHOS AI FUNDING ADVISOR (CONVERSATIONAL CHAT)     */}
          {/* ================================================================= */}
          {guideSubTab === 'advisor' && (
            <div className={styles.advisorChatSection}>
              {/* Header */}
              <div className={styles.advisorChatHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 className={styles.advisorChatTitle}>
                    <span>🤖</span>
                    <span>{lang === 'en' ? 'Ethos AI Funding Advisor' : 'ইথোস এআই ফান্ডিং অ্যাডভাইজর'}</span>
                  </h3>
                  <Badge variant="verified" size="sm">
                    {lang === 'en' ? 'Assistantship & Visa Intelligence' : 'অ্যাসিস্ট্যান্টশিপ ও ভিসা ইন্টেলিজেন্স'}
                  </Badge>
                </div>
                <button
                  type="button"
                  className={styles.resetChatBtn}
                  onClick={handleResetAdvisorChat}
                  title="Reset conversation thread"
                >
                  🔄 {lang === 'en' ? 'Reset Chat' : 'রিসেট চ্যাট'}
                </button>
              </div>

              {/* Chat Thread Window */}
              <div className={styles.advisorChatWindow} ref={advisorChatWindowRef}>
                {advisorChatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${styles.messageRow} ${
                      msg.role === 'user' ? styles.messageRowUser : styles.messageRowBot
                    }`}
                  >
                    <div
                      className={`${styles.msgBubble} ${
                        msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleBot
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <>
                          {/* Bot Badge with live pulsing dot */}
                          <div className={styles.advisorBadge}>
                            <span className={styles.advisorBadgeDot} />
                            <span>{lang === 'bn' ? 'ইথোস এআই ফান্ডিং অ্যাডভাইজর' : 'Ethos AI Funding Advisor'}</span>
                            {msg.modelUsed && (
                              <span style={{ opacity: 0.65, fontSize: '10px', marginLeft: '6px', fontWeight: 500 }}>
                                • {msg.modelUsed}
                              </span>
                            )}
                          </div>

                          {/* Markdown formatted content */}
                          <MarkdownContent
                            content={msg.content}
                            onQuestionClick={(q) => handleAskAdvisor(q)}
                          />

                          {/* Key Institutional Takeaway Callout */}
                          {msg.keyTakeaway && (
                            <div className={styles.advisorTakeawayBox}>
                              <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>💡</span>
                              <div>
                                <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                                  {lang === 'bn' ? 'কোর টেকঅ্যাওয়ে:' : 'Core Institutional Takeaway:'}
                                </strong>
                                <span style={{ lineHeight: 1.5 }}>{msg.keyTakeaway}</span>
                              </div>
                            </div>
                          )}

                          {/* Suggested Follow-up Question Chips */}
                          {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                            <div className={styles.suggestedQueriesRow}>
                              {msg.suggestedFollowups.map((followup, fIdx) => (
                                <button
                                  key={fIdx}
                                  type="button"
                                  className={styles.suggestedQueryBtn}
                                  onClick={() => handleAskAdvisor(followup)}
                                >
                                  💭 {followup}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Speech Read Aloud Action */}
                          <div className={styles.chatActionsRow}>
                            <button
                              type="button"
                              onClick={() => toggleAdvisorSpeech(msg.id, msg.content)}
                              className={`${styles.speechBtn} ${advisorSpeakingMsgId === msg.id ? styles.speechBtnActive : ''}`}
                              title="Read response aloud"
                            >
                              {advisorSpeakingMsgId === msg.id
                                ? (lang === 'en' ? '🔊 Speaking...' : '🔊 পড়ছে...')
                                : (lang === 'en' ? '🔊 Read Aloud' : '🔊 পড়ে শোনান')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div>{msg.content}</div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading State */}
                {advisorLoading && (
                  <div className={`${styles.messageRow} ${styles.messageRowBot}`}>
                    <div
                      className={`${styles.msgBubble} ${styles.msgBubbleBot}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                      <span className={styles.advisorBadgeDot} style={{ animation: 'pulse 1s infinite' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {lang === 'en'
                          ? 'Advisor is reviewing institutional funding rules & evaluating your inquiry...'
                          : 'অ্যাডভাইজর ফান্ডিং নীতিমালা পর্যালোচনা করছে...'}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={advisorChatEndRef} />
              </div>

              {/* Fast Suggested Prompts bar */}
              <div style={{ padding: '10px 16px', background: 'rgba(16, 20, 32, 0.7)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div className={styles.advisorPromptChips}>
                  {[
                    'Can I get full funding for an MS, or is it only for PhDs?',
                    "What happens if my professor's grant runs out?",
                    'Can I work more than 20 hours/week as an RA or TA?',
                    'How do I negotiate my stipend and tuition remission offer?',
                    'My TOEFL Speaking is 22 / IELTS 6.5. Can I still get funded?',
                  ].map((chipText, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      className={styles.advisorChipBtn}
                      onClick={() => handleAskAdvisor(chipText)}
                    >
                      💬 {chipText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Input Bar */}
              <div className={styles.advisorInputBar}>
                <input
                  type="text"
                  className={styles.advisorInput}
                  placeholder={
                    lang === 'en'
                      ? 'Ask any specific question about assistantships, stipends, or visa hours...'
                      : 'অ্যাসিস্ট্যান্টশিপ বা ফান্ডিং সংক্রান্ত যেকোনো প্রশ্ন লিখুন...'
                  }
                  value={advisorInputText}
                  onChange={(e) => setAdvisorInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAdvisor()}
                  disabled={advisorLoading}
                />
                <Button
                  variant="primary"
                  onClick={() => handleAskAdvisor()}
                  disabled={advisorLoading || !advisorInputText.trim()}
                >
                  {advisorLoading ? (lang === 'en' ? 'Analyzing...' : 'বিশ্লেষণ হচ্ছে...') : (lang === 'en' ? 'Send Query' : 'পাঠান')}
                </Button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SUB-TAB 4: GLOBAL COMPARATIVE DESTINATION MATRIX                  */}
          {/* ================================================================= */}
          {guideSubTab === 'matrix' && (
            <div>
              <div className={styles.matrixWrapper}>
                <table className={styles.matrixTable}>
                  <thead>
                    <tr>
                      <th>Country & Hub</th>
                      <th>Primary Funding Model</th>
                      <th>Gross Monthly Stipend</th>
                      <th>Tuition Remission Policy</th>
                      <th>Oral English / Speaking Hurdle</th>
                      <th>Summer Months Pay</th>
                      <th>Visa Work Rights</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.matrixCountryCol}>
                        🇺🇸 USA<br />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>R1 / R2 Universities</span>
                      </td>
                      <td>
                        <strong>Faculty RA Grants (NSF/NIH)</strong><br />
                        Departmental Teaching Assistantships (TA)
                      </td>
                      <td>
                        <strong>$2,400 – $3,400/mo</strong><br />
                        <span style={{ color: '#10B981' }}>≈ ৳2.9L – ৳4.1L BDT/mo</span>
                      </td>
                      <td>
                        <Badge variant="success" size="sm">100% Full Waiver</Badge><br />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>($40k–$60k/yr saved)</span>
                      </td>
                      <td>
                        <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>Strict State Law:</span><br />
                        TOEFL Speaking ≥26 or IELTS ≥8.0 for direct TA without campus SPEAK test.
                      </td>
                      <td>
                        <span style={{ color: '#F59E0B' }}>9-month TA / 12-month RA</span><br />
                        (CPT internships pay $8k–$10k/mo)
                      </td>
                      <td>
                        <strong>F-1 Visa:</strong> Strictly max 20h/week during term; 40h/week in summer.
                      </td>
                    </tr>

                    <tr>
                      <td className={styles.matrixCountryCol}>
                        🇨🇦 Canada<br />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>U15 Consortium</span>
                      </td>
                      <td>
                        <strong>U15 Guaranteed Package:</strong><br />
                        Blended Graduate Assistantship + NSERC/SSHRC
                      </td>
                      <td>
                        <strong>C$2,300 – C$3,100/mo</strong><br />
                        <span style={{ color: '#10B981' }}>≈ ৳2.0L – ৳2.8L BDT/mo</span>
                      </td>
                      <td>
                        <Badge variant="verified" size="sm">Tuition Differential Award</Badge><br />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>Offsets international fees</span>
                      </td>
                      <td>
                        <strong>Department Union Standard:</strong><br />
                        IELTS ≥7.5 or brief departmental pedagogical interview.
                      </td>
                      <td>
                        <span style={{ color: '#10B981' }}>Guaranteed 12-month</span><br />
                        funding package spread over 3 terms.
                      </td>
                      <td>
                        <strong>Study Permit:</strong> 20h/week on/off campus during study terms.
                      </td>
                    </tr>

                    <tr>
                      <td className={styles.matrixCountryCol}>
                        🇩🇪 Germany<br />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>TU9 / Max Planck</span>
                      </td>
                      <td>
                        <strong>TV-L E13 Salaried Contract:</strong><br />
                        Scientific Employee (Wissenschaftlicher Mitarbeiter)
                      </td>
                      <td>
                        <strong>€1,750 – €2,300/mo (Net)</strong><br />
                        <span style={{ color: '#10B981' }}>≈ ৳2.3L – ৳3.0L BDT/mo</span>
                      </td>
                      <td>
                        <Badge variant="success" size="sm">100% Free Tuition</Badge><br />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>No tuition fee across public unis</span>
                      </td>
                      <td>
                        <strong>No State Oral Exam:</strong><br />
                        English is working lab language. IELTS 6.5–7.0 baseline.
                      </td>
                      <td>
                        <span style={{ color: '#10B981' }}>Full 12-month Salaried</span><br />
                        Includes 30 paid annual leave days.
                      </td>
                      <td>
                        <strong>Employee Contract:</strong> Full social security, health & pension benefits.
                      </td>
                    </tr>

                    <tr>
                      <td className={styles.matrixCountryCol}>
                        🇬🇧 United Kingdom<br />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>Russell Group</span>
                      </td>
                      <td>
                        <strong>UKRI Studentships:</strong><br />
                        Doctoral Training Partnerships (DTP / CDT)
                      </td>
                      <td>
                        <strong>£1,650 – £1,950/mo (Tax-Free)</strong><br />
                        <span style={{ color: '#10B981' }}>≈ ৳2.6L – ৳3.1L BDT/mo</span>
                      </td>
                      <td>
                        <Badge variant="verified" size="sm">Full International Fee Waiver</Badge><br />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>For UKRI-funded awardees</span>
                      </td>
                      <td>
                        <strong>Visa English Clearance:</strong><br />
                        IELTS Academic overall 6.5–7.0 (no subscore below 6.0).
                      </td>
                      <td>
                        <span style={{ color: '#10B981' }}>12-month Continuous</span><br />
                        Paid quarterly or monthly for 3.5 to 4 years.
                      </td>
                      <td>
                        <strong>Student Route:</strong> 20h/week during term; hourly tutoring permitted.
                      </td>
                    </tr>

                    <tr>
                      <td className={styles.matrixCountryCol}>
                        🇦🇺 Australia<br />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>Group of Eight (Go8)</span>
                      </td>
                      <td>
                        <strong>Research Training Program (RTP):</strong><br />
                        Commonwealth & University Fellowships
                      </td>
                      <td>
                        <strong>A$2,600 – A$3,300/mo (Tax-Free)</strong><br />
                        <span style={{ color: '#10B981' }}>≈ ৳2.1L – ৳2.6L BDT/mo</span>
                      </td>
                      <td>
                        <Badge variant="success" size="sm">100% RTP Fee Offset</Badge><br />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>Covers 3.5 years of fees</span>
                      </td>
                      <td>
                        <strong>Standard IELTS/PTE:</strong><br />
                        IELTS ≥6.5 or PTE ≥58. No separate state ITA exam.
                      </td>
                      <td>
                        <span style={{ color: '#10B981' }}>12-month Bi-weekly</span><br />
                        Standard Australian stipend paid year-round.
                      </td>
                      <td>
                        <strong>Subclass 500:</strong> 48 hours per fortnight during research sessions.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Grant Cycles Timeline */}
              {guideData && (
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <GlassCard variant="elevated" padding="lg">
                    <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
                      📅 Global Academic Grant & Hiring Timelines
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                      {guideData.grant_cycles_overview.map((cycle, i) => (
                        <div key={i} className={styles.grantCycleCard}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{cycle.mechanism}</strong>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{cycle.timeline}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* INTERVIEW PREP MODAL                                                      */}
      {/* ========================================================================= */}
      {interviewModalOpen && selectedProf && (
        <div className={styles.modalBackdrop} onClick={() => setInterviewModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>
                  🎙️ AI Interview Simulator: {selectedProf.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selectedProf.university} • {selectedProf.lab_name}
                </p>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setInterviewModalOpen(false)}>
                ✕
              </button>
            </div>

            {interviewLoading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                Predicting professor&apos;s technical screening questions...
              </div>
            ) : interviewPrepData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className={styles.interviewCultureBox}>
                  <strong>Lab Research Culture:</strong> {interviewPrepData.lab_vibe_summary}
                </div>

                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Predicted Screening Questions:</div>

                {interviewPrepData.predicted_questions.map((q, qIdx) => (
                  <div key={qIdx} className={styles.interviewQuestionCard}>
                    <div className={styles.interviewQuestionTitle}>
                      Q{qIdx + 1}: {q.question}
                    </div>
                    <div className={styles.interviewWhyText}>
                      <strong>Why they ask this:</strong> {q.why_prof_asks_this}
                    </div>
                    <div className={styles.interviewStrategyBox}>
                      <strong>Recommended Strategy:</strong> {q.strong_answer_strategy}
                    </div>
                    <div className={styles.interviewKeywordsText}>
                      Keywords to hit: {q.key_terms_to_mention.join(', ')}
                    </div>
                  </div>
                ))}

                <Button variant="primary" onClick={() => setInterviewModalOpen(false)}>
                  Done Reviewing
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
