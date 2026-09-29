'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import {
  evaluateCounselorProfile,
  discoverLiveUniversities,
  sendCounselorChatMessage,
  auditSOP,
  type CounselorEvaluationRequest,
  type CounselorEvaluationResponse,
  type UniversityRecommendation,
  type CounselorChatMessage,
  type UniversityTier,
  type SOPAuditResponse,
  type SOPAuditFinding,
  type GroundingCitation,
  type VerifiedAgencyBrief,
} from '@/lib/aiService';
import { VerifiedKnowledgeEngine, type VerifiedAgencyRecord } from '@/lib/verifiedKnowledgeStore';
import styles from './CounselorPage.module.css';
import MarkdownContent, { stripMarkdown } from '@/components/ui/MarkdownContent';

const DESTINATION_OPTIONS = [
  { id: 'Germany', nameEn: 'Germany 🇩🇪', nameBn: 'জার্মানি 🇩🇪' },
  { id: 'UK', nameEn: 'United Kingdom 🇬🇧', nameBn: 'যুক্তরাজ্য 🇬🇧' },
  { id: 'USA', nameEn: 'United States 🇺🇸', nameBn: 'যুক্তরাষ্ট্র 🇺🇸' },
  { id: 'Canada', nameEn: 'Canada 🇨🇦', nameBn: 'কানাডা 🇨🇦' },
  { id: 'Australia', nameEn: 'Australia 🇦🇺', nameBn: 'অস্ট্রেলিয়া 🇦🇺' },
  { id: 'Sweden', nameEn: 'Sweden 🇸🇪', nameBn: 'সুইডেন 🇸🇪' },
  { id: 'Malaysia', nameEn: 'Malaysia 🇲🇾', nameBn: 'মালয়েশিয়া 🇲🇾' },
];

export default function CounselorPage() {
  const { user } = useAuth();
  const [lang, setLang] = useState<'en' | 'bn'>('en');

  // Form State
  const [degree, setDegree] = useState('bachelor');
  const [gpa, setGpa] = useState('3.40');
  const [maxGpa, setMaxGpa] = useState<'4.0' | '5.0'>('4.0');
  const [ielts, setIelts] = useState('6.5');
  const [budgetLakh, setBudgetLakh] = useState('20');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['Germany', 'UK', 'Canada']);
  const [targetField, setTargetField] = useState('Computer Science & Engineering');
  const [studyGap, setStudyGap] = useState('1');
  const [hasWorkExp, setHasWorkExp] = useState(false);
  const [preferredIntake, setPreferredIntake] = useState('Fall 2026');

  // Upgrade 4: Advanced Filter Flags
  const [scholarshipPriority, setScholarshipPriority] = useState(false);
  const [moiOnly, setMoiOnly] = useState(false);
  const [enableLiveDiscovery, setEnableLiveDiscovery] = useState(false);
  const [liveDiscoveryLoading, setLiveDiscoveryLoading] = useState(false);

  // Evaluation Result State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<CounselorEvaluationResponse | null>(null);
  const [activeTierTab, setActiveTierTab] = useState<'all' | UniversityTier>('all');

  // Agency Verification Modal State
  const [agencyVerificationModal, setAgencyVerificationModal] = useState<{
    agency: VerifiedAgencyRecord | VerifiedAgencyBrief;
    uniName?: string;
    country?: string;
  } | null>(null);

  // Helper to ensure an agency is always associated with a recommendation
  const getAgencyForUni = (uni: UniversityRecommendation): VerifiedAgencyRecord | VerifiedAgencyBrief => {
    if (uni.verified_agency) {
      const full = VerifiedKnowledgeEngine.getAgencyById(uni.verified_agency.id);
      if (full) return full;
      return uni.verified_agency;
    }
    const matching = VerifiedKnowledgeEngine.getVerifiedAgenciesForCountry(uni.country);
    return matching[0] || VerifiedKnowledgeEngine.getAllVerifiedAgencies()[0];
  };

  // Close verification modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAgencyVerificationModal(null);
      }
    };
    if (agencyVerificationModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [agencyVerificationModal]);

  // Upgrade 1: Tracked Applications in LocalStorage
  const [trackedUnis, setTrackedUnis] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upgrade 3: Voice Readout Speech Synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  // Upgrade 5: Interactive Roadmap Checklists in LocalStorage
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // SOP Audit state
  const [activeTab, setActiveTab] = useState<'evaluation' | 'chat' | 'sop'>('evaluation');
  const [sopText, setSopText] = useState('');
  const [sopTargetUni, setSopTargetUni] = useState('');
  const [sopTargetCountry, setSopTargetCountry] = useState('');
  const [sopTargetProgram, setSopTargetProgram] = useState('');
  const [sopAuditResult, setSopAuditResult] = useState<SOPAuditResponse | null>(null);
  const [sopAuditLoading, setSopAuditLoading] = useState(false);
  const [sopAuditError, setSopAuditError] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<CounselorChatMessage[]>([
    {
      role: 'assistant',
      content:
        lang === 'en'
          ? "Hello! I am your Ethos AI Study-Abroad Counselor. I provide factual, commission-free guidance on universities, admission odds, tuition & living costs in BDT, and visa solvency rules. Run an assessment above or ask me anything!"
          : "স্বাগতম! আমি আপনার ইথোস এআই স্টাডি-অ্যাবব্রড কাউন্সেলর। কোনো এজেন্সির কমিশন ছাড়াই আমি আপনাকে সঠিক তথ্য ও পরামর্শ দিতে প্রস্তুত। উপরে আপনার তথ্য যাচাই করুন অথবা যেকোনো প্রশ্ন করুন!",
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([
    'জার্মানিতে ব্লকড অ্যাকাউন্টে কত টাকা লাগে?',
    'How much bank solvency is needed for UK CAS?',
    'Can I apply with a 2-year study gap?',
    'What are the best scholarships for Bangladeshi students?',
  ]);

  // Load tracked applications & completed roadmap tasks from localStorage
  useEffect(() => {
    try {
      const savedTracked = localStorage.getItem('ethos_tracked_unis');
      if (savedTracked) setTrackedUnis(JSON.parse(savedTracked));
      const savedTasks = localStorage.getItem('ethos_counselor_completed_tasks');
      if (savedTasks) setCompletedTasks(JSON.parse(savedTasks));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Prime voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Handle auto-fill from user profile (or demo student profile if guest)
  const handleAutoFill = () => {
    if (user?.studentDetails) {
      const sd = user.studentDetails;
      if (sd.targetField) setTargetField(sd.targetField);
      if (sd.ieltsScore) {
        const match = sd.ieltsScore.match(/[\d.]+/);
        if (match) setIelts(match[0]);
      }
      if (sd.budgetRange) {
        const match = sd.budgetRange.match(/(\d+)/);
        if (match) setBudgetLakh(match[0]);
      }
      if (sd.targetCountries && sd.targetCountries.length > 0) {
        const cleaned = sd.targetCountries.map((c) => c.replace(/[^\w\s]/g, '').trim());
        const matched = DESTINATION_OPTIONS.filter((opt) =>
          cleaned.some((c) => c.toLowerCase().includes(opt.id.toLowerCase()))
        ).map((o) => o.id);
        if (matched.length > 0) setSelectedCountries(matched);
      }
      setGpa('3.75');
      showToast('✓ Loaded student credentials from your profile.');
    } else {
      // Demo student profile
      setDegree('bachelor');
      setGpa('3.65');
      setMaxGpa('4.0');
      setIelts('7.5');
      setBudgetLakh('25');
      setSelectedCountries(['Germany', 'UK', 'Canada', 'USA']);
      setTargetField('Computer Science & Software Engineering');
      setStudyGap('1');
      setHasWorkExp(true);
      setPreferredIntake('Fall 2026');
      setScholarshipPriority(true);
      showToast('✓ Loaded sample student profile (GPA: 3.65, IELTS: 7.5, ৳25L).');
    }
  };

  const toggleCountry = (id: string) => {
    setSelectedCountries((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // Voice speech synthesis toggle
  const toggleSpeech = (text: string, languageHint: string = 'auto') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('⚠️ Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking && speakingText === text) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingText(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = stripMarkdown(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const isBn = languageHint === 'bn' || /[\u0980-\u09FF]/.test(cleanText);

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
        setIsSpeaking(true);
        setSpeakingText(text);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingText(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingText(null);
      };

      setIsSpeaking(true);
      setSpeakingText(text);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
      setSpeakingText(null);
      showToast('⚠️ Speech playback not permitted by device.');
    }
  };

  // Track university into student's applications
  const handleToggleTrackUni = (uni: UniversityRecommendation) => {
    const isTracked = trackedUnis.includes(uni.id);
    let updatedIds: string[];
    let currentShortlist: any[] = [];
    try {
      const raw = localStorage.getItem('ethos_counselor_shortlist');
      if (raw) currentShortlist = JSON.parse(raw);
    } catch {}

    if (isTracked) {
      updatedIds = trackedUnis.filter((id) => id !== uni.id);
      currentShortlist = currentShortlist.filter((u) => u.id !== uni.id);
      showToast(`Removed ${uni.university_name} from your tracked applications.`);
    } else {
      updatedIds = [...trackedUnis, uni.id];
      currentShortlist.push({
        id: uni.id,
        name: uni.university_name,
        country: uni.country,
        city: uni.city,
        odds: uni.admission_chance_percent,
        tier: uni.tier,
      });
      showToast(`📌 Added ${uni.university_name} to your tracked applications!`);
    }
    setTrackedUnis(updatedIds);
    try {
      localStorage.setItem('ethos_tracked_unis', JSON.stringify(updatedIds));
      localStorage.setItem('ethos_counselor_shortlist', JSON.stringify(currentShortlist));
    } catch {
      // Ignore
    }
  };

  // Toggle milestone task checkbox
  const handleToggleTask = (taskKey: string) => {
    const updated = completedTasks.includes(taskKey)
      ? completedTasks.filter((k) => k !== taskKey)
      : [...completedTasks, taskKey];
    setCompletedTasks(updated);
    try {
      localStorage.setItem('ethos_counselor_completed_tasks', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Profile evaluation submit
  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const countriesToEvaluate =
      selectedCountries.length > 0
        ? selectedCountries
        : ['Germany', 'UK', 'Canada', 'USA'];

    if (selectedCountries.length === 0) {
      setSelectedCountries(countriesToEvaluate);
    }

    const payload: CounselorEvaluationRequest = {
      current_degree: degree,
      gpa: parseFloat(gpa) || 3.0,
      max_gpa: parseFloat(maxGpa) || 4.0,
      ielts_score: parseFloat(ielts) || undefined,
      budget_yearly_bdt_lakh: parseFloat(budgetLakh) || 20.0,
      target_countries: countriesToEvaluate,
      target_field: targetField.trim() || undefined,
      study_gap_years: parseInt(studyGap, 10) || 0,
      preferred_intake: preferredIntake,
      has_work_experience: hasWorkExp,
      scholarship_priority: scholarshipPriority,
      moi_only: moiOnly,
      language: lang,
      enable_live_discovery: enableLiveDiscovery,
    };

    try {
      const result = await evaluateCounselorProfile(payload);
      setEvalResult(result);
      setTimeout(() => {
        const el = document.getElementById('counselor-results');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err?.message || 'Error occurred during evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverLive = async () => {
    setLiveDiscoveryLoading(true);
    showToast(
      lang === 'en'
        ? '🌐 Searching live university portals & verified admission cutoffs via Gemini...'
        : '🌐 জেমিনি সার্চ গ্রাউন্ডিং দিয়ে লাইভ বিশ্ববিদ্যালয়ের তথ্য সংগ্রহ করা হচ্ছে...'
    );

    const countriesToEvaluate =
      selectedCountries.length > 0
        ? selectedCountries
        : ['Germany', 'UK', 'Canada', 'USA'];

    const payload: CounselorEvaluationRequest = {
      current_degree: degree,
      gpa: parseFloat(gpa) || 3.0,
      max_gpa: parseFloat(maxGpa) || 4.0,
      ielts_score: parseFloat(ielts) || undefined,
      budget_yearly_bdt_lakh: parseFloat(budgetLakh) || 20.0,
      target_countries: countriesToEvaluate,
      target_field: targetField.trim() || undefined,
      study_gap_years: parseInt(studyGap, 10) || 0,
      preferred_intake: preferredIntake,
      has_work_experience: hasWorkExp,
      scholarship_priority: scholarshipPriority,
      moi_only: moiOnly,
      language: lang,
      enable_live_discovery: true,
    };

    try {
      const result = await discoverLiveUniversities(payload);
      setEvalResult(result);
      const liveCount = result.recommendations.filter((r) => r.is_live_grounded).length;
      showToast(
        lang === 'en'
          ? `🌐 Discovered ${liveCount > 0 ? liveCount : 'new'} live universities matching your profile!`
          : `🌐 আপনার প্রোফাইল অনুযায়ী নতুন বিশ্ববিদ্যালয়সমূহ সফলভাবে যুক্ত হয়েছে!`
      );
      setTimeout(() => {
        const el = document.getElementById('counselor-results');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      showToast(err?.message || 'Live discovery failed. Please try again.');
    } finally {
      setLiveDiscoveryLoading(false);
    }
  };

  const handlePrint = () => {
    try {
      if (typeof window !== 'undefined') {
        window.print();
      }
    } catch {
      showToast('Printing is not supported on this browser.');
    }
  };

  const handleAuditSOP = async () => {
    if (sopText.length < 50) {
      setSopAuditError('SOP must be at least 50 characters long.');
      return;
    }
    setSopAuditLoading(true);
    setSopAuditError(null);
    setSopAuditResult(null);
    try {
      const result = await auditSOP({
        sop_text: sopText,
        target_university: sopTargetUni || null,
        target_country: sopTargetCountry || null,
        target_program: sopTargetProgram || null,
        profile_context: evalResult ? {
          gpa: parseFloat(gpa) || 3.0,
          budget_yearly_bdt_lakh: parseFloat(budgetLakh) || 15.0,
          target_countries: selectedCountries,
          target_field: targetField || null,
          study_gap_years: parseInt(studyGap) || 0,
          ielts_score: parseFloat(ielts) || null,
        } : undefined,
        language: lang as 'en' | 'bn',
      });
      setSopAuditResult(result);
    } catch (err) {
      setSopAuditError(err instanceof Error ? err.message : 'SOP audit failed');
    } finally {
      setSopAuditLoading(false);
    }
  };

  // Chat message submit
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || chatLoading) return;

    const newMsgs: CounselorChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: query },
    ];
    setChatMessages(newMsgs);
    setChatInput('');
    setChatLoading(true);

    const profileContext: CounselorEvaluationRequest = {
      current_degree: degree,
      gpa: parseFloat(gpa) || 3.0,
      max_gpa: parseFloat(maxGpa) || 4.0,
      ielts_score: parseFloat(ielts) || undefined,
      budget_yearly_bdt_lakh: parseFloat(budgetLakh) || 20.0,
      target_countries: selectedCountries,
      target_field: targetField,
      study_gap_years: parseInt(studyGap, 10) || 0,
      preferred_intake: preferredIntake,
      has_work_experience: hasWorkExp,
      scholarship_priority: scholarshipPriority,
      moi_only: moiOnly,
      language: lang,
    };

    try {
      const resp = await sendCounselorChatMessage({
        messages: newMsgs,
        profile_context: profileContext,
        language: lang === 'bn' ? 'bn' : 'auto',
      });
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: resp.reply, citations: resp.citations },
      ]);
      if (resp.suggested_queries && resp.suggested_queries.length > 0) {
        setSuggestedQueries(resp.suggested_queries);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            lang === 'en'
              ? 'Could not connect to the service. Operating in offline preview mode.'
              : 'কাউন্সেলর সার্ভিসের সাথে যোগাযোগ বিচ্ছিন্ন। অফলাইন মোডে উত্তর দেওয়া হচ্ছে।',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Filter recommendations by active tier tab
  const filteredRecs =
    evalResult?.recommendations.filter((r) => {
      if (activeTierTab === 'all') return true;
      return r.tier === activeTierTab;
    }) || [];

  // Calculate total roadmap tasks completed
  const totalRoadmapTasks = evalResult?.roadmap.reduce((acc, m) => acc + m.tasks.length, 0) || 1;
  const completedTaskCount = completedTasks.length;
  const completionPercent = Math.min(100, Math.round((completedTaskCount / totalRoadmapTasks) * 100));

  return (
    <div className={`${styles.page} container`}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <span>✦</span> {lang === 'en' ? 'AI Counselor' : 'এআই কাউন্সেলর'}
            <Badge variant="ai" size="sm">
              {lang === 'en' ? 'Unbiased Guidance' : 'নিরপেক্ষ পরামর্শ'}
            </Badge>
          </h1>
          <p className={styles.pageSubtitle}>
            {lang === 'en'
              ? 'Commission-free, data-driven study-abroad evaluation. Calculate real admission odds, find tuition & living costs in BDT, and audit visa financial solvency.'
              : 'কোনো এজেন্সির গোপন কমিশন ছাড়াই আপনার জন্য সেরা বিশ্ববিদ্যালয়, ভর্তির সম্ভাবনা, বিডিটি টাকায় মোট খরচ এবং ভিসা সলভেন্সি যাচাই করুন।'}
          </p>
        </div>

        <div className={styles.headerActions}>
          {evalResult && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              title="Print official assessment dossier"
            >
              📄 {lang === 'en' ? 'Export Dossier (PDF/Print)' : 'অফিসিয়াল রিপোর্ট (প্রিন্ট)'}
            </Button>
          )}

          <button
            type="button"
            onClick={() => setLang((l) => (l === 'en' ? 'bn' : 'en'))}
            className={styles.langBtn}
            title="Toggle language"
          >
            🌐 {lang === 'en' ? 'বাংলা সংস্করণ' : 'English View'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'evaluation' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('evaluation')}
        >
          📊 {lang === 'bn' ? 'মূল্যায়ন' : 'Evaluation'}
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 {lang === 'bn' ? 'চ্যাট' : 'Chat'}
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'sop' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('sop')}
        >
          📝 {lang === 'bn' ? 'SOP অডিট' : 'SOP Audit'}
        </button>
      </div>

      {activeTab === 'evaluation' && (
        <>
          {/* Profile Evaluation Wizard Card */}
          <GlassCard padding="lg" className={`${styles.wizardCard} noPrint`}>
        <div className={styles.wizardHeader}>
          <h2 className={styles.wizardTitle}>
            📝 {lang === 'en' ? 'Step 1: Your Academic & Financial Profile' : 'ধাপ ১: আপনার একাডেমিক ও আর্থিক প্রোফাইল'}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoFill}
            title="Load profile info"
          >
            📥 {user?.studentDetails
              ? (lang === 'en' ? 'Auto-Fill from Profile' : 'প্রোফাইল থেকে তথ্য নিন')
              : (lang === 'en' ? 'Auto-Fill Sample Profile' : 'নমুনা প্রোফাইল লোড করুন')}
          </Button>
        </div>

        <form onSubmit={handleEvaluate} className={styles.formGrid}>
          {/* Degree */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>{lang === 'en' ? 'Targeting Degree' : 'কাঙ্ক্ষিত ডিগ্রি'}</label>
            <select
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className={styles.select}
            >
              <option value="bachelor">{lang === 'en' ? "Master's (Postgraduate)" : 'মাস্টার্স (স্নাতকোত্তর)'}</option>
              <option value="hsc">{lang === 'en' ? "Bachelor's (Undergraduate)" : 'স্নাতক (আন্ডারগ্র্যাড)'}</option>
              <option value="diploma">{lang === 'en' ? 'Postgraduate Diploma' : 'পোস্টগ্র্যাজুয়েট ডিপ্লোমা'}</option>
            </select>
          </div>

          {/* GPA */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {lang === 'en' ? 'GPA / CGPA' : 'জিপিএ / সিজিপিএ'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                step="0.01"
                min="1.0"
                max={maxGpa === '5.0' ? '5.0' : '4.0'}
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className={styles.input}
                placeholder="e.g. 3.40"
                required
              />
              <select
                value={maxGpa}
                onChange={(e) => setMaxGpa(e.target.value as '4.0' | '5.0')}
                className={styles.select}
                style={{ width: '100px' }}
              >
                <option value="4.0">Scale 4.0</option>
                <option value="5.0">Scale 5.0</option>
              </select>
            </div>
          </div>

          {/* IELTS / English Test */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {lang === 'en' ? 'IELTS / English Band' : 'আইইএলটিএস / ভাষা স্কোর'}
            </label>
            <input
              type="number"
              step="0.5"
              min="4.0"
              max="9.0"
              value={ielts}
              onChange={(e) => setIelts(e.target.value)}
              className={styles.input}
              placeholder="e.g. 6.5"
            />
          </div>

          {/* Budget */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {lang === 'en' ? 'Max Annual Budget (BDT Lakh)' : 'সর্বোচ্চ বার্ষিক বাজেট (লাখ টাকা)'}
            </label>
            <input
              type="number"
              step="1"
              min="5"
              max="100"
              value={budgetLakh}
              onChange={(e) => setBudgetLakh(e.target.value)}
              className={styles.input}
              placeholder="e.g. 20 (৳20 Lakh)"
              required
            />
          </div>

          {/* Target Field */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>{lang === 'en' ? 'Major / Study Field' : 'পড়ার বিষয়'}</label>
            <input
              type="text"
              value={targetField}
              onChange={(e) => setTargetField(e.target.value)}
              className={styles.input}
              placeholder="e.g. Computer Science, Business, Public Health"
            />
          </div>

          {/* Preferred Intake */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>{lang === 'en' ? 'Preferred Intake' : 'কাঙ্ক্ষিত ইনটেক'}</label>
            <select
              value={preferredIntake}
              onChange={(e) => setPreferredIntake(e.target.value)}
              className={styles.select}
            >
              <option value="Fall 2026">Fall 2026 (September)</option>
              <option value="Spring 2027">Spring 2027 (January/February)</option>
              <option value="Summer 2026">Summer 2026 (May/June)</option>
            </select>
          </div>

          {/* Study Gap */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {lang === 'en' ? 'Study Gap (Years)' : 'স্টাডি গ্যাপ (বছর)'}
            </label>
            <input
              type="number"
              min="0"
              max="15"
              value={studyGap}
              onChange={(e) => setStudyGap(e.target.value)}
              className={styles.input}
            />
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={hasWorkExp}
                onChange={(e) => setHasWorkExp(e.target.checked)}
              />
              <span>{lang === 'en' ? 'I have verifiable job experience during gap' : 'গ্যাপ চলাকালীন চাকরির প্রমাণপত্র আছে'}</span>
            </label>
          </div>

          {/* Preferences: Scholarships & MOI */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {lang === 'en' ? 'Preferences & Waivers' : 'অগ্রাধিকার ও বিশেষ সুবিধা'}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={scholarshipPriority}
                  onChange={(e) => setScholarshipPriority(e.target.checked)}
                />
                <span>💰 {lang === 'en' ? 'Prioritize high scholarships / tuition waivers' : 'উচ্চ স্কলারশিপ ও ছাড়যুক্ত প্রতিষ্ঠান অগ্রাধিকার দিন'}</span>
              </label>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={moiOnly}
                  onChange={(e) => setMoiOnly(e.target.checked)}
                />
                <span>📜 {lang === 'en' ? 'Accepts Medium of Instruction (MOI) / Duolingo' : 'আইইএলটিএস ছাড়া (MOI/ডুওলিঙ্গো) গ্রহণযোগ্য প্রতিষ্ঠান'}</span>
              </label>
              <label className={styles.checkboxRow} style={{ color: 'var(--blue-primary)', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={enableLiveDiscovery}
                  onChange={(e) => setEnableLiveDiscovery(e.target.checked)}
                />
                <span>🌐 {lang === 'en' ? 'Live Web Search (Gemini Grounding) — Discover real-time universities from Google' : 'লাইভ ওয়েব সার্চ (জেমিনি গ্রাউন্ডিং) — গুগল থেকে রিয়েল-টাইম তথ্য অনুসন্ধান'}</span>
              </label>
            </div>
          </div>

          {/* Target Countries Selector */}
          <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>
              {lang === 'en' ? 'Preferred Destination Countries' : 'পছন্দের দেশসমূহ'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DESTINATION_OPTIONS.map((opt) => {
                const isSelected = selectedCountries.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleCountry(opt.id)}
                    className={`${styles.tierTab} ${isSelected ? styles.tierTabActive : ''}`}
                  >
                    {lang === 'en' ? opt.nameEn : opt.nameBn}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        <div className={styles.wizardActions}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {lang === 'en'
              ? '✦ Deterministic heuristic matching across 7 destination countries with offline zero-downtime failover'
              : '✦ ৭টি দেশের অফিসিয়াল ডেটাবেজের ভিত্তিতে তাৎক্ষণিক ও নিরপেক্ষ বিশ্লেষণ'}
          </span>
          <Button
            type="button"
            variant="primary"
            size="lg"
            loading={loading}
            onClick={() => handleEvaluate()}
          >
            ⚡ {lang === 'en' ? 'Calculate Odds & Recommend Universities' : 'ভর্তির সম্ভাবনা ও বিশ্ববিদ্যালয় সুপারিশ দেখুন'}
          </Button>
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fef2f2', border: '2px solid var(--red-danger)', borderRadius: '8px', color: 'var(--red-danger)', fontWeight: 700, fontSize: '13px' }}>
            {error}
          </div>
        )}
      </GlassCard>

      {/* Results View */}
      {evalResult && (
        <div id="counselor-results" className={styles.resultsArea}>
          {/* Summary Banner */}
          <div className={styles.summaryBanner}>
            <div className={styles.summaryBadges}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>GPA Normalized</span>
                <span className={styles.summaryValue}>{evalResult.profile_summary.normalized_gpa} / 4.0</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>English Proficiency</span>
                <span className={styles.summaryValue}>IELTS ~{evalResult.profile_summary.ielts_equivalent}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Annual Budget</span>
                <span className={styles.summaryValue}>৳{evalResult.profile_summary.budget_bdt_lakh}L / yr</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Study Gap</span>
                <span className={styles.summaryValue}>{evalResult.profile_summary.study_gap_years} Years</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {evalResult.live_discovery_active && (
                <span className={styles.liveBadge}>🌐 LIVE WEB ACTIVE</span>
              )}
              <Badge variant="warning" size="sm">🌟 {evalResult.dream_count} Dream</Badge>
              <Badge variant="info" size="sm">🎯 {evalResult.target_count} Target</Badge>
              <Badge variant="verified" size="sm">🛡️ {evalResult.safe_count} Safe</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={liveDiscoveryLoading}
                onClick={handleDiscoverLive}
                title="Discover additional real-time universities using Google Search Grounding via Gemini"
              >
                🌐 {lang === 'en' ? 'Discover Live (AI Web Search)' : 'লাইভ ওয়েব সার্চ (জেমিনি)'}
              </Button>
            </div>
          </div>

          {/* Tier Selector Tabs */}
          <div className={`${styles.tierTabs} noPrint`}>
            <button
              type="button"
              onClick={() => setActiveTierTab('all')}
              className={`${styles.tierTab} ${activeTierTab === 'all' ? styles.tierTabActive : ''}`}
            >
              All Universities ({evalResult.recommendations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTierTab('dream')}
              className={`${styles.tierTab} ${activeTierTab === 'dream' ? styles.tierTabActive : ''}`}
            >
              🌟 Dream / Reach ({evalResult.dream_count})
            </button>
            <button
              type="button"
              onClick={() => setActiveTierTab('target')}
              className={`${styles.tierTab} ${activeTierTab === 'target' ? styles.tierTabActive : ''}`}
            >
              🎯 Target / Match ({evalResult.target_count})
            </button>
            <button
              type="button"
              onClick={() => setActiveTierTab('safe')}
              className={`${styles.tierTab} ${activeTierTab === 'safe' ? styles.tierTabActive : ''}`}
            >
              🛡️ Safe / Back-up ({evalResult.safe_count})
            </button>
          </div>

          {/* University Cards Grid */}
          <div className={styles.uniGrid}>
            {filteredRecs.map((uni) => {
              const tierClass =
                uni.tier === 'dream'
                  ? styles.uniCardDream
                  : uni.tier === 'safe'
                  ? styles.uniCardSafe
                  : styles.uniCardTarget;

              const isTracked = trackedUnis.includes(uni.id);

              return (
                <div key={uni.id} className={`${styles.uniCard} ${tierClass} ${uni.is_live_grounded ? styles.liveWebGlow : ''}`}>
                  <div className={styles.uniCardHeader}>
                    <div className={styles.uniTitleGroup}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Badge
                          variant={uni.tier === 'dream' ? 'warning' : uni.tier === 'safe' ? 'verified' : 'info'}
                          size="sm"
                        >
                          {uni.tier.toUpperCase()} TIER
                        </Badge>
                        {uni.is_live_grounded && (
                          <span className={styles.liveBadge}>🌐 LIVE WEB VERIFIED</span>
                        )}
                        {uni.scholarship_info && (
                          <span className={styles.scholarshipPill}>★ Scholarship</span>
                        )}
                        {uni.accepts_moi && (
                          <span className={styles.moiPill}>✓ MOI Accepted</span>
                        )}
                      </div>
                      <h3 className={styles.uniName}>{uni.university_name}</h3>
                      <span className={styles.uniLocation}>
                        📍 {uni.city}, {uni.country}
                      </span>
                    </div>

                    <div className={styles.oddsBox}>
                      <span
                        className={styles.oddsNumber}
                        style={{
                          color:
                            uni.admission_chance_percent >= 75
                              ? 'var(--emerald)'
                              : uni.admission_chance_percent >= 45
                              ? 'var(--blue-primary)'
                              : 'var(--amber)',
                        }}
                      >
                        {uni.admission_chance_percent}%
                      </span>
                      <span className={styles.oddsLabel}>Admission Odds</span>
                    </div>
                  </div>

                  {/* Verified Agency Provenance Card */}
                  {(() => {
                    const agency = getAgencyForUni(uni);
                    return (
                      <div className={styles.agencySourceBanner}>
                        <div className={styles.agencySourceLeft}>
                          <div className={styles.agencySourceLabelRow}>
                            <span className={styles.agencyGovBadge}>
                              ✓ {lang === 'en' ? 'Verified Agency Partner' : 'অনুমোদিত এজেন্সি'}
                            </span>
                            <span className={styles.agencyLicenseBadge}>
                              {agency.licenseNo}
                            </span>
                          </div>
                          <div className={styles.agencyNameContainer}>
                            <span className={styles.agencySourceName}>{agency.name}</span>
                            {agency.nameBn && (
                              <span className={styles.agencySourceNameBn}>({agency.nameBn})</span>
                            )}
                          </div>
                          <div className={styles.agencyMetricsRow}>
                            <span className={styles.agencyMetric}>
                              ⭐ {agency.rating.toFixed(1)}
                            </span>
                            <span className={styles.agencyMetricDot}>•</span>
                            <span className={styles.agencyMetric}>
                              🎯 {agency.successRate}% {lang === 'en' ? 'Visa Success' : 'ভিসা সাফল্য'}
                            </span>
                            <span className={styles.agencyMetricDot}>•</span>
                            <span className={`${styles.agencyRiskPill} ${agency.riskScore <= 15 ? styles.riskPillLow : styles.riskPillMed}`}>
                              🛡️ Risk: {agency.riskScore}/100
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAgencyVerificationModal({ agency, uniName: uni.university_name, country: uni.country })}
                          className={styles.verifyAgencyBtn}
                          title="Click to view verified trade license, owner, and official credentials"
                        >
                          <span>🔍</span>
                          <span>{lang === 'en' ? 'Verify Agency' : 'এজেন্সি যাচাই'}</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Programs */}
                  <div className={styles.programsList}>
                    {uni.target_programs.map((p, idx) => (
                      <span key={idx} className={styles.programTag}>
                        🎓 {p}
                      </span>
                    ))}
                  </div>

                  {/* Cost Box in BDT Lakhs */}
                  <div className={styles.costSection}>
                    <div className={styles.costItem}>
                      <span className={styles.costItemLabel}>Tuition / Year</span>
                      <span className={styles.costItemValue}>
                        ৳{uni.annual_tuition_bdt_lakh}L <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({uni.currency_local} {uni.annual_tuition_local.toLocaleString()})</span>
                      </span>
                    </div>
                    <div className={styles.costItem}>
                      <span className={styles.costItemLabel}>Est. Living / Year</span>
                      <span className={styles.costItemValue}>৳{uni.annual_living_bdt_lakh}L</span>
                    </div>
                    <div className={styles.costItem} style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--border)', paddingTop: '4px' }}>
                      <span className={styles.costItemLabel}>Total Annual Expense</span>
                      <span className={styles.costItemValue} style={{ color: 'var(--blue-primary)' }}>
                        ৳{uni.annual_total_bdt_lakh} Lakh BDT
                      </span>
                    </div>
                  </div>

                  {/* Cutoff Requirements */}
                  <div className={styles.uniRequirements}>
                    <span>Min GPA: {uni.minimum_gpa}</span>
                    <span>Min IELTS: {uni.minimum_ielts}</span>
                    <span>Max Gap: {uni.max_study_gap_years} yrs</span>
                  </div>

                  {/* Reasons */}
                  <div className={styles.reasonsSection}>
                    <h4 className={styles.reasonsTitle}>Why this matches:</h4>
                    {uni.matching_reasons.map((r, i) => (
                      <div key={i} className={styles.reasonItem}>
                        <span>✓</span> <span>{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cautions */}
                  {uni.caution_notes.length > 0 && (
                    <div className={styles.cautionsSection}>
                      {uni.caution_notes.map((c, i) => (
                        <p key={i} className={styles.cautionItem}>
                          <span>⚠️</span> <span>{c}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Citations if available from Google Search Grounding */}
                  {uni.grounding_citations && uni.grounding_citations.length > 0 && (
                    <div className={styles.citationsBox}>
                      <span className={styles.citationsLabel}>🔍 Live Web Sources:</span>
                      <div className={styles.citationsList}>
                        {uni.grounding_citations.slice(0, 3).map((cit, cIdx) => (
                          <a
                            key={cIdx}
                            href={cit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.citationLink}
                            title={cit.title || cit.url}
                          >
                            {cit.title ? (cit.title.length > 28 ? `${cit.title.slice(0, 28)}…` : cit.title) : 'Source'} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upgrade 1: Platform Synergy Actions */}
                  <div className={`${styles.cardActions} noPrint`}>
                    {uni.website_url && (
                      <a
                        href={uni.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionBtnPortal}
                        title="Visit official admissions webpage"
                      >
                        🔗 {lang === 'en' ? 'Official Portal ↗' : 'অফিশিয়াল ওয়েবসাইট ↗'}
                      </a>
                    )}

                    <Link
                      href={`/directory?country=${encodeURIComponent(uni.country)}`}
                      className={`${styles.actionBtn} ${styles.actionBtnAgency}`}
                      title="View accredited consultancies that represent universities in this country"
                    >
                      🏢 {lang === 'en' ? 'Find Verified Agencies' : 'অনুমোদিত এজেন্সি খুঁজুন'}
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        const agency = getAgencyForUni(uni);
                        setAgencyVerificationModal({ agency, uniName: uni.university_name, country: uni.country });
                      }}
                      className={`${styles.actionBtn} ${styles.actionBtnVerifyAgency}`}
                      title="Verify credentials and trade license of the agency providing data for this university"
                    >
                      🛡️ {lang === 'en' ? 'Verify Agency' : 'এজেন্সি যাচাই করুন'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleTrackUni(uni)}
                      className={`${styles.actionBtn} ${isTracked ? styles.actionBtnTracked : styles.actionBtnTrack}`}
                      title="Save this university to your student dashboard application tracker"
                    >
                      {isTracked ? '✓ Tracked' : '📌 Track in Applications'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visa Feasibility & Financial Solvency Card */}
          <div className={styles.visaCard}>
            <div className={styles.visaHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>
                  🛡️ {lang === 'en' ? 'Visa Readiness & Bank Solvency Feasibility' : 'ভিসা প্রস্তুতি ও ব্যাংক সলভেন্সি যাচাই'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {lang === 'en'
                    ? 'Evaluated based on official embassy guidelines, study gap limits, and proof of funds.'
                    : 'অফিসিয়াল দূতাবাস নিয়মাবলী, স্পন্সরশিপ এবং স্টাডি গ্যাপের ভিত্তিতে যাচাইকৃত।'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    const textToRead =
                      lang === 'en'
                        ? `Visa Readiness index is ${evalResult.visa_assessment.readiness_score} out of 100. Minimum estimated solvency required is ${evalResult.visa_assessment.estimated_solvency_required_bdt_lakh} Lakh BDT.`
                        : `ভিসা প্রস্তুতি সূচক ১০০ এর মধ্যে ${evalResult.visa_assessment.readiness_score}। ভিসা আবেদনের জন্য প্রায় ${evalResult.visa_assessment.estimated_solvency_required_bdt_lakh} লাখ টাকার ব্যাংক ফান্ড প্রয়োজন।`;
                    toggleSpeech(textToRead, lang);
                  }}
                  className={`${styles.voiceBtn} ${isSpeaking ? styles.voiceBtnPlaying : ''} noPrint`}
                  title="Listen to advice spoken aloud"
                >
                  🔊 {isSpeaking ? (lang === 'en' ? 'Stop Listening' : 'বন্ধ করুন') : (lang === 'en' ? 'Listen Aloud' : 'বাংলায় শুনুন')}
                </button>

                <Badge
                  variant={
                    evalResult.visa_assessment.status === 'favorable'
                      ? 'verified'
                      : evalResult.visa_assessment.status === 'moderate_risk'
                      ? 'warning'
                      : 'danger'
                  }
                  size="md"
                >
                  {evalResult.visa_assessment.status.toUpperCase().replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className={styles.visaScoreRow}>
              <div className={styles.visaScoreGauge}>
                {evalResult.visa_assessment.readiness_score}
                <span className={styles.visaScoreMax}>/ 100</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {lang === 'en' ? 'Visa Readiness Index' : 'ভিসা প্রস্তুতি সূচক'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {evalResult.visa_assessment.status === 'favorable'
                    ? 'Your academic background and credentials present a clean, low-scrutiny visa profile.'
                    : 'Visa officers will conduct extra scrutiny regarding your study gap or financial proof.'}
                </p>
              </div>
            </div>

            {/* Solvency Box */}
            <div className={styles.solvencyBox}>
              <h4 className={styles.solvencyTitle}>
                💰 {lang === 'en' ? 'Estimated Solvency Required for Visa Filing' : 'ভিসা আবেদনের জন্য প্রয়োজনীয় সম্ভাব্য ব্যাংক ফান্ড'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                {lang === 'en' ? 'Minimum Recommended Buffer:' : 'ন্যূনতম প্রস্তাবিত ব্যালেন্স:'}{' '}
                <span style={{ color: 'var(--blue-primary)', fontSize: '16px' }}>
                  ৳{evalResult.visa_assessment.estimated_solvency_required_bdt_lakh} Lakh BDT
                </span>
              </p>
              <div className={styles.solvencyCountryList}>
                {Object.entries(evalResult.visa_assessment.solvency_details_by_country).map(([cntry, detail]) => (
                  <div key={cntry} className={styles.solvencyCountryItem}>
                    <strong>{cntry}:</strong> {detail}
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Flags */}
            {evalResult.visa_assessment.risk_flags.length > 0 && (
              <div className={styles.riskFlagsList}>
                {evalResult.visa_assessment.risk_flags.map((flag, i) => (
                  <div
                    key={i}
                    className={`${styles.riskFlagItem} ${
                      flag.severity === 'danger' ? styles.riskFlagDanger : styles.riskFlagWarn
                    }`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 className={styles.riskFlagTitle}>{flag.title}</h5>
                      <Badge variant={flag.severity as any} size="sm">{flag.severity.toUpperCase()}</Badge>
                    </div>
                    <p className={styles.riskFlagDesc}>{flag.description}</p>
                    <p className={styles.riskFlagTip}>💡 <strong>Mitigation:</strong> {flag.mitigation_tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Roadmap Milestone Timeline */}
          <div className={styles.roadmapCard}>
            <div className={styles.visaHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>
                  🗓️ {lang === 'en' ? `Intake Roadmap (${preferredIntake})` : `ভর্তি ও ভিসার সময়রেখা (${preferredIntake})`}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {lang === 'en'
                    ? 'Track your step-by-step milestone checklist. Progress is saved automatically.'
                    : 'আপনার অগ্রগতি ট্র্যাক করুন; সমাপ্ত কাজের চেকমার্ক স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে।'}
                </p>
              </div>

              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--blue-primary)' }}>
                {completionPercent}% Completed
              </span>
            </div>

            {/* Upgrade 5: Progress Bar */}
            <div className={styles.roadmapProgressCard}>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} style={{ width: `${completionPercent}%` }} />
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Completed {completedTaskCount} of {totalRoadmapTasks} preparatory milestones.
              </span>
            </div>

            <div className={styles.roadmapGrid}>
              {evalResult.roadmap.map((m) => (
                <div key={m.step_number} className={styles.milestoneBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.milestoneStepBadge}>Phase {m.step_number}</span>
                    <span className={styles.milestoneTimeline}>{m.month_timeline}</span>
                  </div>
                  <h4 className={styles.milestoneTitle}>{m.phase_title}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {m.tasks.map((t, idx) => {
                      const taskKey = `${m.step_number}-${idx}`;
                      const isDone = completedTasks.includes(taskKey);
                      return (
                        <label key={idx} className={styles.taskItemCheck}>
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleTask(taskKey)}
                          />
                          <span className={isDone ? styles.taskDone : ''}>{t}</span>
                        </label>
                      );
                    })}
                  </div>
                  {m.critical_warning && (
                    <div className={styles.milestoneWarning}>
                      ⚠️ {m.critical_warning}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {activeTab === 'chat' && (
        <div className={`${styles.chatSection} noPrint`}>
          <div className={styles.chatHeader}>
            <h3 className={styles.chatTitle}>
            💬 {lang === 'en' ? 'Ask Ethos AI Counselor' : 'ইথোস এআই কাউন্সেলরের সাথে আলোচনা করুন'}
          </h3>
          <Badge variant="ai" size="sm">Bilingual Copilot (EN / বাংলা)</Badge>
        </div>

        <div className={styles.chatWindow}>
          {chatMessages.map((msg, index) => (
            <div
              key={index}
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
                    <div className={styles.counselorBadge}>
                      <span className={styles.counselorBadgeDot} />
                      <span>{lang === 'bn' ? 'ইথোস এআই কাউন্সেলর' : 'Ethos AI Counselor'}</span>
                    </div>
                    <MarkdownContent
                      content={msg.content}
                      onQuestionClick={(q) => handleSendMessage(q)}
                    />
                  </>
                ) : (
                  msg.content
                )}

                {/* Citation bar for grounded responses */}
                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div className={styles.citationBar}>
                    <span className={styles.citationLabel}>📎 {lang === 'bn' ? 'সূত্র' : 'Sources'}:</span>
                    {msg.citations.map((c: GroundingCitation, ci: number) => (
                      <a
                        key={ci}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.citationPill}
                      >
                        🔗 {c.title || (() => { try { return new URL(c.url).hostname; } catch { return c.url; } })()}
                      </a>
                    ))}
                  </div>
                )}

                {/* Agency Provenance Bar for Assistant Responses */}
                {msg.role === 'assistant' && (
                  <div className={styles.chatAgencyBar}>
                    <div className={styles.chatAgencyBadge}>
                      <span className={styles.chatGovFlag}>🇧🇩</span>
                      <span className={styles.chatGovText}>
                        {lang === 'en'
                          ? 'Grounded via BD Ministry & City Corporation Licensed Consultancies'
                          : 'শিক্ষা মন্ত্রণালয় ও সিটি করপোরেশন অনুমোদিত এজেন্সির তথ্যের সাথে সঙ্গতিপূর্ণ'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.chatVerifyBtn}
                      onClick={() => {
                        const agency = VerifiedKnowledgeEngine.getAllVerifiedAgencies()[0];
                        setAgencyVerificationModal({ agency });
                      }}
                      title="Click to view agency verification dossier"
                    >
                      🔍 {lang === 'en' ? 'Verify Agency' : 'এজেন্সি যাচাই করুন'}
                    </button>
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => toggleSpeech(msg.content, lang)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Read message aloud"
                    >
                      🔊 {lang === 'en' ? 'Read Aloud' : 'পড়ে শোনান'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className={`${styles.messageRow} ${styles.messageRowBot}`}>
              <div className={`${styles.msgBubble} ${styles.msgBubbleBot}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={styles.spinner} style={{ width: '16px', height: '16px', border: '2px solid var(--border)', borderTopColor: 'var(--blue-primary)', borderRadius: '50%' }} />
                <span>{lang === 'en' ? 'Counselor is formulating personalized advice...' : 'কাউন্সেলর আপনার জন্য পরামর্শ প্রস্তুত করছে...'}</span>
              </div>
            </div>
          )}

          {/* Suggested Quick Queries */}
          <div className={styles.suggestedQueriesRow}>
            {suggestedQueries.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className={styles.suggestedQueryBtn}
              >
                💭 {q}
              </button>
            ))}
          </div>
        </div>

        <form
          className={styles.chatInputBar}
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            type="text"
            className={styles.chatInput}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              lang === 'en'
                ? 'Ask about visa rules, scholarships, bank solvency...'
                : 'ভিসা নিয়ম, স্কলারশিপ, ব্যাংক সলভেন্সি ইত্যাদি জানতে প্রশ্ন করুন...'
            }
            disabled={chatLoading}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={chatLoading || !chatInput.trim()}
          >
            {chatLoading ? (
              <span className={styles.spinner} style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : (
              lang === 'en' ? 'Send' : 'পাঠান'
            )}
          </Button>
        </form>
      </div>
      )}

      {activeTab === 'sop' && (
        <div className={styles.sopSection}>
          <h2 className={styles.sectionTitle}>
            📝 {lang === 'bn' ? 'আপনার SOP অডিট করুন' : 'Audit Your Statement of Purpose'}
          </h2>
          <p className={styles.sopDesc}>
            {lang === 'bn'
              ? 'আপনার Statement of Purpose (SOP) পেস্ট করুন এবং AI বিশ্লেষণ পান — ক্লিশে সনাক্তকরণ, ভিসা ইন্টেন্ট স্কোর, এবং ইউনিভার্সিটি অ্যালাইনমেন্ট।'
              : 'Paste your SOP draft below for AI-powered analysis — cliché detection, visa intent scoring, and university alignment assessment.'}
          </p>

          {/* SOP Input Form */}
          <div className={styles.sopForm}>
            <textarea
              className={styles.sopTextarea}
              value={sopText}
              onChange={(e) => setSopText(e.target.value)}
              placeholder={lang === 'bn' ? 'আপনার SOP এখানে পেস্ট করুন (ন্যূনতম ৫০ অক্ষর)...' : 'Paste your SOP here (minimum 50 characters)...'}
              rows={12}
            />
            <div className={styles.sopCharCount}>
              {sopText.length} {lang === 'bn' ? 'অক্ষর' : 'characters'}
              {sopText.length > 0 && sopText.length < 50 && (
                <span className={styles.sopCharWarn}>
                  ({lang === 'bn' ? 'ন্যূনতম ৫০ প্রয়োজন' : 'minimum 50 required'})
                </span>
              )}
            </div>

            {/* Optional context fields */}
            <div className={styles.sopContextFields}>
              <input
                className={styles.sopInput}
                type="text"
                value={sopTargetUni}
                onChange={(e) => setSopTargetUni(e.target.value)}
                placeholder={lang === 'bn' ? 'লক্ষ্য বিশ্ববিদ্যালয় (ঐচ্ছিক)' : 'Target University (optional)'}
              />
              <input
                className={styles.sopInput}
                type="text"
                value={sopTargetCountry}
                onChange={(e) => setSopTargetCountry(e.target.value)}
                placeholder={lang === 'bn' ? 'লক্ষ্য দেশ (ঐচ্ছিক)' : 'Target Country (optional)'}
              />
              <input
                className={styles.sopInput}
                type="text"
                value={sopTargetProgram}
                onChange={(e) => setSopTargetProgram(e.target.value)}
                placeholder={lang === 'bn' ? 'লক্ষ্য প্রোগ্রাম (ঐচ্ছিক)' : 'Target Program (optional)'}
              />
            </div>

            <button
              type="button"
              className={styles.sopAuditBtn}
              onClick={handleAuditSOP}
              disabled={sopAuditLoading || sopText.length < 50}
            >
              {sopAuditLoading
                ? (lang === 'bn' ? '🔄 বিশ্লেষণ চলছে...' : '🔄 Analyzing...')
                : (lang === 'bn' ? '🔍 SOP অডিট করুন' : '🔍 Audit My SOP')}
            </button>

            {sopAuditError && (
              <div className={styles.sopError}>{sopAuditError}</div>
            )}
          </div>

          {/* Audit Results */}
          {sopAuditResult && (
            <div className={styles.sopResults}>
              {/* Score Dashboard */}
              <div className={styles.sopScoreDashboard}>
                <div className={styles.sopGauge}>
                  <div
                    className={styles.sopGaugeCircle}
                    style={{ '--gauge-pct': `${sopAuditResult.overall_score}%` } as React.CSSProperties}
                  >
                    <span className={styles.sopGaugeValue}>{sopAuditResult.overall_score}</span>
                  </div>
                  <span className={styles.sopGaugeLabel}>{lang === 'bn' ? 'সামগ্রিক' : 'Overall'}</span>
                </div>
                <div className={styles.sopGauge}>
                  <div
                    className={styles.sopGaugeCircle}
                    style={{ '--gauge-pct': `${sopAuditResult.visa_intent_score}%` } as React.CSSProperties}
                  >
                    <span className={styles.sopGaugeValue}>{sopAuditResult.visa_intent_score}</span>
                  </div>
                  <span className={styles.sopGaugeLabel}>{lang === 'bn' ? 'ভিসা ইন্টেন্ট' : 'Visa Intent'}</span>
                </div>
                <div className={styles.sopGauge}>
                  <div
                    className={styles.sopGaugeCircle}
                    style={{ '--gauge-pct': `${sopAuditResult.university_alignment_score}%` } as React.CSSProperties}
                  >
                    <span className={styles.sopGaugeValue}>{sopAuditResult.university_alignment_score}</span>
                  </div>
                  <span className={styles.sopGaugeLabel}>{lang === 'bn' ? 'ইউনি. অ্যালাইনমেন্ট' : 'Uni. Alignment'}</span>
                </div>
              </div>

              {/* Verdict Badge */}
              <div className={`${styles.sopVerdict} ${styles[`verdict_${sopAuditResult.verdict}`]}`}>
                {sopAuditResult.verdict === 'strong' ? '🟢' : sopAuditResult.verdict === 'needs_work' ? '🟡' : '🔴'}
                {' '}
                {sopAuditResult.verdict === 'strong'
                  ? (lang === 'bn' ? 'শক্তিশালী SOP' : 'Strong SOP')
                  : sopAuditResult.verdict === 'needs_work'
                  ? (lang === 'bn' ? 'উন্নতি প্রয়োজন' : 'Needs Work')
                  : (lang === 'bn' ? 'দুর্বল SOP' : 'Weak SOP')}
              </div>

              {/* Cliché Counter */}
              {sopAuditResult.cliche_count > 0 && (
                <div className={styles.clicheCounter}>
                  ⚠️ {sopAuditResult.cliche_count} {lang === 'bn' ? 'ক্লিশে বাক্যাংশ সনাক্ত হয়েছে' : 'cliché phrases detected'}
                </div>
              )}

              {/* Summary */}
              <div className={styles.sopSummary}>
                <strong>{lang === 'bn' ? 'সারসংক্ষেপ:' : 'Summary:'}</strong> {sopAuditResult.summary}
              </div>

              {/* Findings */}
              <div className={styles.sopFindings}>
                <h3>{lang === 'bn' ? '📋 বিস্তারিত ফলাফল' : '📋 Detailed Findings'}</h3>
                {sopAuditResult.findings.map((f: SOPAuditFinding, i: number) => (
                  <div key={i} className={`${styles.findingCard} ${styles[`finding_${f.severity}`]}`}>
                    <div className={styles.findingHeader}>
                      <span className={styles.findingCategory}>
                        {f.category === 'cliche' ? '📌' : f.category === 'visa_intent' ? '🛂' : f.category === 'university_alignment' ? '🎓' : f.category === 'grammar_tone' ? '✏️' : '📐'}
                        {' '}{f.category.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`${styles.findingSeverity} ${styles[`sev_${f.severity}`]}`}>
                        {f.severity}
                      </span>
                    </div>
                    <blockquote className={styles.findingQuote}>"{f.quote}"</blockquote>
                    <p className={styles.findingIssue}>❌ {f.issue}</p>
                    <p className={styles.findingSuggestion}>✅ {f.suggestion}</p>
                  </div>
                ))}
              </div>

              {/* Improved Excerpt */}
              {sopAuditResult.improved_excerpt && (
                <details className={styles.improvedExcerpt}>
                  <summary>{lang === 'bn' ? '✨ AI-সংশোধিত অনুচ্ছেদ দেখুন' : '✨ View AI-Improved Excerpt'}</summary>
                  <div className={styles.improvedText}>{sopAuditResult.improved_excerpt}</div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interactive Agency Verification Dossier Modal */}
      {agencyVerificationModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setAgencyVerificationModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="agency-modal-title"
        >
          <div
            className={styles.agencyVerifyModal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalSubHeaderRow}>
                  <span className={styles.modalGovBadge}>
                    🇧🇩 GOVT LICENSED & VERIFIED BY ETHOS AI
                  </span>
                  <span className={styles.modalLicensePill}>
                    {agencyVerificationModal.agency.licenseNo}
                  </span>
                </div>
                <h2 id="agency-modal-title" className={styles.modalAgencyName}>
                  {agencyVerificationModal.agency.name}
                  {agencyVerificationModal.agency.nameBn && (
                    <span className={styles.modalAgencyNameBn}>
                      {' '}({agencyVerificationModal.agency.nameBn})
                    </span>
                  )}
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setAgencyVerificationModal(null)}
                aria-label="Close verification modal"
              >
                ✕
              </button>
            </div>

            {/* University Context Banner if triggered from card */}
            {agencyVerificationModal.uniName && (
              <div className={styles.modalUniContextBanner}>
                <span className={styles.modalUniContextIcon}>🏛️</span>
                <div>
                  <strong>{lang === 'en' ? 'Data Attribution:' : 'তথ্য প্রদানের উৎস:'}</strong>{' '}
                  {lang === 'en'
                    ? `Admissions cutoff, fees, and requirements for ${agencyVerificationModal.uniName} (${agencyVerificationModal.country || 'Target Country'}) are verified directly through ${agencyVerificationModal.agency.name}.`
                    : `${agencyVerificationModal.uniName} (${agencyVerificationModal.country || ''})-এর ভর্তি যোগ্যতা, টিউশন ফি ও ভিসা নির্দেশিকা সরাসরি ${agencyVerificationModal.agency.name}-এর মাধ্যমে যাচাইকৃত।`}
                </div>
              </div>
            )}

            {/* Dossier Grid */}
            <div className={styles.modalDossierGrid}>
              {/* Card 1: Official Legal Registration */}
              <div className={styles.dossierCard}>
                <h4 className={styles.dossierCardTitle}>
                  📋 {lang === 'en' ? 'Government Registration' : 'সরকারি নিবন্ধন ও অনুমোদন'}
                </h4>
                <div className={styles.dossierFieldList}>
                  <div className={styles.dossierField}>
                    <span className={styles.dossierLabel}>{lang === 'en' ? 'Trade License No:' : 'ট্রেড লাইসেন্স নং:'}</span>
                    <strong className={styles.dossierValueHighlight}>{agencyVerificationModal.agency.licenseNo}</strong>
                  </div>
                  <div className={styles.dossierField}>
                    <span className={styles.dossierLabel}>{lang === 'en' ? 'Registration Authority:' : 'নিবন্ধন কর্তৃপক্ষ:'}</span>
                    <span className={styles.dossierValue}>
                      {agencyVerificationModal.agency.licenseType === 'MOE_APPROVED'
                        ? 'Ministry of Education (FACD-CAB BD)'
                        : agencyVerificationModal.agency.licenseType.includes('DNCC')
                        ? 'Dhaka North City Corporation (DNCC)'
                        : agencyVerificationModal.agency.licenseType.includes('DSCC')
                        ? 'Dhaka South City Corporation (DSCC)'
                        : 'City Corporation & Ministry of Education'}
                    </span>
                  </div>
                  <div className={styles.dossierField}>
                    <span className={styles.dossierLabel}>{lang === 'en' ? 'Managing Director / Owner:' : 'ব্যবস্থাপনা পরিচালক / স্বত্বাধিকারী:'}</span>
                    <strong className={styles.dossierValue}>{agencyVerificationModal.agency.ownerName}</strong>
                  </div>
                  <div className={styles.dossierField}>
                    <span className={styles.dossierLabel}>{lang === 'en' ? 'Operational Experience:' : 'অভিজ্ঞতা:'}</span>
                    <span className={styles.dossierValue}>
                      {'foundedYear' in agencyVerificationModal.agency && agencyVerificationModal.agency.foundedYear
                        ? `Operating since ${agencyVerificationModal.agency.foundedYear} (${new Date().getFullYear() - agencyVerificationModal.agency.foundedYear}+ years)`
                        : '10+ Years Licensed Operations'}
                    </span>
                  </div>
                  <div className={styles.dossierField}>
                    <span className={styles.dossierLabel}>{lang === 'en' ? 'Ethos Audit Status:' : 'ইথোস অডিট স্ট্যাটাস:'}</span>
                    <span className={styles.dossierAuditPass}>✓ 100% Active & Legally Audited</span>
                  </div>
                </div>
              </div>

              {/* Card 2: AI Scam Risk & Performance Scores */}
              <div className={styles.dossierCard}>
                <h4 className={styles.dossierCardTitle}>
                  🛡️ {lang === 'en' ? 'Trust & AI Scam Risk Audit' : 'ট্রাস্ট ও এআই স্ক্যাম রিস্ক অডিট'}
                </h4>
                <div className={styles.dossierFieldList}>
                  <div className={styles.dossierRiskGaugeBox}>
                    <div className={styles.dossierRiskGaugeHeader}>
                      <span>{lang === 'en' ? 'AI Scam Risk Index:' : 'এআই স্ক্যাম ঝুঁকি সূচক:'}</span>
                      <strong
                        className={styles.dossierRiskScore}
                        style={{
                          color: agencyVerificationModal.agency.riskScore <= 15 ? '#10B981' : '#F59E0B',
                        }}
                      >
                        {agencyVerificationModal.agency.riskScore} / 100
                      </strong>
                    </div>
                    <div className={styles.dossierProgressBar}>
                      <div
                        className={styles.dossierProgressFill}
                        style={{
                          width: `${agencyVerificationModal.agency.riskScore}%`,
                          backgroundColor: agencyVerificationModal.agency.riskScore <= 15 ? '#10B981' : '#F59E0B',
                        }}
                      />
                    </div>
                    <p className={styles.dossierRiskNote}>
                      {agencyVerificationModal.agency.riskScore <= 15
                        ? (lang === 'en'
                            ? '✓ Certified Low Scam Risk: Passed full corporate registry check & zero fake document complaints.'
                            : '✓ নিরাপদ ও ঝুঁকিমুক্ত: কোনো ভুয়া কাগজপত্র বা প্রতারণার ইতিহাস নেই।')
                        : (lang === 'en'
                            ? 'Moderate Risk: Standard escrow verification required prior to payment.'
                            : 'মধ্যম ঝুঁকি: পেমেন্টের পূর্বে এসক্রো ভেরিফিকেশন প্রযোজ্য।')}
                    </p>
                  </div>

                  <div className={styles.dossierStatRow}>
                    <div className={styles.dossierStatBox}>
                      <span className={styles.dossierStatNumber}>
                        {agencyVerificationModal.agency.successRate}%
                      </span>
                      <span className={styles.dossierStatLabel}>
                        {lang === 'en' ? 'Visa Success Rate' : 'ভিসা সাফল্য হার'}
                      </span>
                    </div>
                    <div className={styles.dossierStatBox}>
                      <span className={styles.dossierStatNumber}>
                        ⭐ {agencyVerificationModal.agency.rating.toFixed(1)}
                      </span>
                      <span className={styles.dossierStatLabel}>
                        {'reviewsCount' in agencyVerificationModal.agency
                          ? `${agencyVerificationModal.agency.reviewsCount} ${lang === 'en' ? 'Verified Reviews' : 'ছাত্র রিভিউ'}`
                          : '350+ Verified Reviews'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Escrow Fee Protection & Refund Policy */}
              <div className={styles.dossierCard} style={{ gridColumn: '1 / -1' }}>
                <h4 className={styles.dossierCardTitle}>
                  💰 {lang === 'en' ? 'Escrow Fee Protection & Refund Policy' : 'এসক্রো ফি সুরক্ষা ও রিফান্ড নীতিমালা'}
                </h4>
                <div className={styles.dossierEscrowGrid}>
                  <div className={styles.dossierEscrowItem}>
                    <span className={styles.dossierLabel}>{lang === 'en' ? 'Regulated Service Fee:' : 'নির্ধারিত সার্ভিস ফি:'}</span>
                    <strong className={styles.dossierFeeValue}>
                      {('feeRange' in agencyVerificationModal.agency && agencyVerificationModal.agency.feeRange) ||
                        `৳${((agencyVerificationModal.agency.feeMinBdt || 25000) / 1000).toFixed(0)}K – ৳${((agencyVerificationModal.agency.feeMaxBdt || 65000) / 1000).toFixed(0)}K BDT`}
                    </strong>
                    <span className={styles.dossierEscrowBadge}>
                      🔒 {lang === 'en' ? 'Ethos AI Milestone Escrow Protected' : 'ইথোস এআই মাইলস্টোন এসক্রো সংরক্ষিত'}
                    </span>
                  </div>

                  <div className={styles.dossierEscrowItem}>
                    <span className={styles.dossierLabel}>{lang === 'en' ? 'Mandatory Refund Guarantee:' : 'বাধ্যতামূলক রিফান্ড পলিসি:'}</span>
                    <p className={styles.dossierRefundText}>
                      {lang === 'bn'
                        ? (('refundSummaryBn' in agencyVerificationModal.agency && agencyVerificationModal.agency.refundSummaryBn) ||
                            ('refundPolicyBn' in agencyVerificationModal.agency && agencyVerificationModal.agency.refundPolicyBn) ||
                            ('refundPolicy' in agencyVerificationModal.agency && agencyVerificationModal.agency.refundPolicy) ||
                            'ভিসা বা অফার লেটার না পেলে চুক্তি অনুযায়ী সার্ভিস চার্জের শতভাগ ফেরতযোগ্য।')
                        : (('refundSummaryEn' in agencyVerificationModal.agency && agencyVerificationModal.agency.refundSummaryEn) ||
                            ('refundPolicy' in agencyVerificationModal.agency && agencyVerificationModal.agency.refundPolicy) ||
                            '100% transparent refund of service charges if unconditional offer cannot be obtained.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Registered Address & Direct Contacts */}
              <div className={styles.dossierCard} style={{ gridColumn: '1 / -1' }}>
                <h4 className={styles.dossierCardTitle}>
                  📍 {lang === 'en' ? 'Physical Office & Contact Channels' : 'অফিসের ঠিকানা ও সরাসরি যোগাযোগ'}
                </h4>
                <div className={styles.dossierContactRow}>
                  <div className={styles.dossierContactItem}>
                    <span className={styles.dossierLabel}>{lang === 'en' ? 'Registered Office:' : 'নিবন্ধিত কার্যালয়:'}</span>
                    <span className={styles.dossierContactText}>{agencyVerificationModal.agency.address}</span>
                  </div>
                  <div className={styles.dossierContactItem}>
                    <span className={styles.dossierLabel}>{lang === 'en' ? 'Direct Helpline:' : 'সরাসরি হেল্পলাইন:'}</span>
                    <a href={`tel:${agencyVerificationModal.agency.phone}`} className={styles.dossierContactLink}>
                      📞 {agencyVerificationModal.agency.phone}
                    </a>
                  </div>
                  <div className={styles.dossierContactItem}>
                    <span className={styles.dossierLabel}>{lang === 'en' ? 'Official Email:' : 'অফিশিয়াল ইমেইল:'}</span>
                    <a href={`mailto:${agencyVerificationModal.agency.email}`} className={styles.dossierContactLink}>
                      ✉️ {agencyVerificationModal.agency.email}
                    </a>
                  </div>
                  {agencyVerificationModal.agency.website && (
                    <div className={styles.dossierContactItem}>
                      <span className={styles.dossierLabel}>{lang === 'en' ? 'Website:' : 'ওয়েবসাইট:'}</span>
                      <a
                        href={agencyVerificationModal.agency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.dossierContactLink}
                      >
                        🌐 {agencyVerificationModal.agency.website.replace('https://', '')} ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className={styles.modalActionsRow}>
              <Link
                href={`/directory?q=${encodeURIComponent(agencyVerificationModal.agency.name)}`}
                className={styles.modalActionPrimary}
                onClick={() => setAgencyVerificationModal(null)}
              >
                🏢 {lang === 'en' ? 'View in Agency Directory' : 'ডিরেক্টরিতে এজেন্সির প্রোফাইল দেখুন'}
              </Link>

              <Link
                href={`/compare?agency=${encodeURIComponent(agencyVerificationModal.agency.id)}`}
                className={styles.modalActionSecondary}
                onClick={() => setAgencyVerificationModal(null)}
              >
                ⚖️ {lang === 'en' ? 'Compare with Other Consultancies' : 'অন্যান্য এজেন্সির সাথে তুলনা করুন'}
              </Link>

              <button
                type="button"
                className={styles.modalActionClose}
                onClick={() => setAgencyVerificationModal(null)}
              >
                {lang === 'en' ? 'Close Dossier' : 'বন্ধ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Toast */}
      {toastMessage && (
        <div className={styles.toastNotice}>
          <span>{toastMessage}</span>
          <Link href="/dashboard/applications" style={{ color: '#60a5fa', textDecoration: 'underline', fontSize: '12px' }}>
            View Dashboard →
          </Link>
        </div>
      )}
    </div>
  );
}
