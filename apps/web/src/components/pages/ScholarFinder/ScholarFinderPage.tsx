'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  searchProfessors,
  generateColdEmail,
  prepareInterview,
  getTARAGuide,
  parseCVFile,
  parseCVText,
  matchProfile,
  deconstructPaper,
  liveSearchAcademic,
  type ProfessorProfile,
  type ColdEmailGenerateResponse,
  type InterviewPrepResponse,
  type TARAGuideResponse,
  type CVParsedData,
  type ProfessorMatchScore,
  type PaperDeconstructResponse,
} from '@/lib/aiService';
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

const DOMAIN_OPTIONS = [
  'All',
  'Computer Science & AI',
  'Electrical & Computer Engineering',
  'Mechanical & Robotics',
  'Biomedical & Bioinformatics',
  'Data Science & Operations Research',
];

const COUNTRY_OPTIONS = ['All', 'USA', 'Canada', 'Germany', 'Australia', 'UK'];

export default function ScholarFinderPage() {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [activeTab, setActiveTab] = useState<'search' | 'email_studio' | 'pipeline' | 'guide'>('search');

  // Search Mode: 'curated' (top R1/U15 labs) or 'live' (OpenAlex Global Deep Search)
  const [searchMode, setSearchMode] = useState<'curated' | 'live'>('curated');

  // Search Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [activeFundingOnly, setActiveFundingOnly] = useState(false);
  const [acceptingOnly, setAcceptingOnly] = useState(false);

  // Search Results
  const [professors, setProfessors] = useState<ProfessorProfile[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Cold Email Studio State
  const [studentName, setStudentName] = useState('Tanvir Ahmed');
  const [studentDegree, setStudentDegree] = useState('B.Sc. in Computer Science & Engineering');
  const [studentInstitution, setStudentInstitution] = useState('BUET');
  const [studentGpa, setStudentGpa] = useState('3.82');
  const [studentSkills, setStudentSkills] = useState('PyTorch, Computer Vision, CUDA, Diffusion Models');
  const [studentThesis, setStudentThesis] = useState('Robust Visual Perception in Autonomous Mobile Robots');
  const [targetDegree, setTargetDegree] = useState<'PhD' | 'MS with Thesis'>('PhD');
  const [targetSemester, setTargetSemester] = useState('Fall 2026');
  const [selectedPaperTitle, setSelectedPaperTitle] = useState('');

  // Email Output
  const [emailGenerating, setEmailGenerating] = useState(false);
  const [generatedEmailRes, setGeneratedEmailRes] = useState<ColdEmailGenerateResponse | null>(null);
  const [emailSubTab, setEmailSubTab] = useState<'initial' | 'followup1' | 'followup2'>('initial');
  const [selectedSubjectLine, setSelectedSubjectLine] = useState('');

  // Pipeline CRM State (LocalStorage backed)
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interview Prep Modal
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewPrepData, setInterviewPrepData] = useState<InterviewPrepResponse | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Guide Data
  const [guideData, setGuideData] = useState<TARAGuideResponse | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load initial pipeline and guide
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ethos_scholar_pipeline');
      if (saved) {
        setPipeline(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load pipeline from localStorage', e);
    }

    getTARAGuide()
      .then((data) => setGuideData(data))
      .catch((err) => console.warn('Failed to fetch guide data', err));
  }, []);

  // Save pipeline
  const savePipeline = (items: PipelineItem[]) => {
    setPipeline(items);
    try {
      localStorage.setItem('ethos_scholar_pipeline', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save pipeline', e);
    }
  };

  // Load professors
  const runSearch = async () => {
    setLoading(true);
    try {
      if (searchMode === 'live') {
        const res = await liveSearchAcademic({
          query: searchQuery.trim() || (selectedDomain !== 'All' ? selectedDomain : 'Computer Science and Artificial Intelligence'),
          country: selectedCountry === 'All' ? null : selectedCountry,
          limit: 12,
        });
        setProfessors(res.results);
        if (res.results.length > 0) {
          setSelectedProf(res.results[0]);
          if (res.results[0].recent_publications.length > 0) {
            setSelectedPaperTitle(res.results[0].recent_publications[0].title);
          }
        }
      } else {
        const res = await searchProfessors({
          domain: selectedDomain === 'All' ? null : selectedDomain,
          countries: selectedCountry === 'All' ? [] : [selectedCountry],
          has_active_funding: activeFundingOnly,
          accepting_only: acceptingOnly,
          query: searchQuery.trim() || null,
        });
        setProfessors(res.professors);
        if (res.professors.length > 0 && !selectedProf) {
          setSelectedProf(res.professors[0]);
          if (res.professors[0].recent_publications.length > 0) {
            setSelectedPaperTitle(res.professors[0].recent_publications[0].title);
          }
        }
      }
    } catch (err) {
      console.error('Failed to search professors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
  }, [selectedDomain, selectedCountry, activeFundingOnly, acceptingOnly, searchMode]);

  // Feature 1: Handle CV upload and auto-fill
  const handleCVFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvLoading(true);
    try {
      const res = await parseCVFile(file);
      setCvParsedData(res.parsed_data);
      if (res.parsed_data.student_name) setStudentName(res.parsed_data.student_name);
      if (res.parsed_data.degree) setStudentDegree(res.parsed_data.degree);
      if (res.parsed_data.institution) setStudentInstitution(res.parsed_data.institution);
      if (res.parsed_data.gpa) setStudentGpa(res.parsed_data.gpa);
      if (res.parsed_data.skills && res.parsed_data.skills.length > 0) {
        setStudentSkills(res.parsed_data.skills.join(', '));
      }
      if (res.parsed_data.thesis_topic) setStudentThesis(res.parsed_data.thesis_topic);
      showToast('📄 CV Parsed Successfully! Profile fields auto-populated.');

      if (selectedProf) {
        triggerProfileMatch(res.parsed_data, selectedProf);
      }
    } catch (err) {
      console.error('CV Parsing failed:', err);
      showToast('Could not parse CV file. Please verify format.');
    } finally {
      setCvLoading(false);
    }
  };

  const triggerProfileMatch = async (cv: CVParsedData, prof: ProfessorProfile) => {
    setMatchLoading(true);
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
  };

  // Re-run match if selected professor changes and CV is present
  useEffect(() => {
    if (selectedProf && cvParsedData) {
      triggerProfileMatch(cvParsedData, selectedProf);
    }
  }, [selectedProf]);

  // Feature 2: Deconstruct paper
  const handleDeconstructPaper = async () => {
    if (!selectedProf || !selectedPaperTitle) return;
    setPaperDeconstructLoading(true);
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
    savePipeline(updated);
    showToast(`Added ${p.name} to your ${stage.toUpperCase()} pipeline.`);
  };

  const handleMovePipelineStage = (itemId: string, newStage: PipelineItem['stage']) => {
    const updated = pipeline.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          stage: newStage,
          sentAt: newStage === 'contacted' && !item.sentAt ? new Date().toISOString() : item.sentAt,
        };
      }
      return item;
    });
    savePipeline(updated);
    showToast(`Stage updated to ${newStage.toUpperCase()}`);
  };

  const handleRemoveFromPipeline = (itemId: string) => {
    const updated = pipeline.filter((i) => i.id !== itemId);
    savePipeline(updated);
    showToast('Removed from pipeline');
  };

  const handleGenerateEmail = async () => {
    if (!selectedProf) return;
    setEmailGenerating(true);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard! 📋');
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

      {/* Header Section */}
      <header className={styles.hero}>
        <div className={styles.heroTagline}>
          <span>🎓</span>
          <span>{lang === 'en' ? 'Full-Fund Scholarship & RA/TA Navigator' : 'ফুল-ফান্ড স্কলারশিপ ও আরএ/টিএ নেভিগেটর'}</span>
        </div>
        <h1 className={styles.heroTitle}>
          {lang === 'en' ? 'Ethos ScholarFinder' : 'ইথোস স্কলার-ফাইন্ডার'}
        </h1>
        <p className={styles.heroDesc}>
          {lang === 'en'
            ? 'Discover professors with active research grants (NSF, NIH, NSERC, Horizon), synthesize hyper-personalized 3-paragraph cold emails, and secure fully funded RA/TA positions.'
            : 'সক্রিয় গ্র্যান্টধারী প্রফেসরদের খুঁজুন, নির্দিষ্ট পেপারের আলোকে হাইপার-পার্সোনালাইজড কোল্ড ইমেইল ড্রাফট করুন এবং ফুল-ফান্ডেড আরএ/টিএ পজিশন নিশ্চিত করুন।'}
        </p>

        <div className={styles.heroStats}>
          <div className={styles.heroStatItem}>
            <span>🏛️</span>
            <strong>{lang === 'en' ? 'Top R1 / U15 / TU9 Universities' : 'শীর্ষ আর১ / ইউ১৫ / টিইউ৯ বিশ্ববিদ্যালয়'}</strong>
          </div>
          <div className={styles.heroStatItem}>
            <span>💰</span>
            <strong>{lang === 'en' ? '100% Tuition Remission + Stipend' : '১০০% টিউশন ওয়েভার + মাসিক স্টাইপেন্ড'}</strong>
          </div>
          <div className={styles.heroStatItem}>
            <span>🛡️</span>
            <strong>{lang === 'en' ? 'Zero Consultancy Exploitation' : 'দালাল ও এজেন্সিমুক্ত গবেষণা পথ'}</strong>
          </div>
        </div>
      </header>

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
          <span>{lang === 'en' ? 'RA vs TA Strategy & Stipend' : 'আরএ বনাম টিএ গাইড'}</span>
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
              <span>{lang === 'en' ? 'Curated R1 / U15 / TU9 Labs' : 'নির্বাচিত আর১ / ইউ১৫ ল্যাব'}</span>
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
            <input
              type="text"
              className={styles.searchInput}
              placeholder={
                lang === 'en'
                  ? 'Search by professor name, university, research interest (e.g. Robotics, LLMs, Photonics)...'
                  : 'প্রফেসরের নাম, বিশ্ববিদ্যালয় বা রিসার্চ টপিক লিখে সার্চ করুন (যেমন: রোবোটিক্স, এলএলএম)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <Button variant="primary" onClick={runSearch} disabled={loading}>
              {loading ? 'Searching...' : lang === 'en' ? 'Search Faculty' : 'অনুসন্ধান'}
            </Button>
          </div>

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
                      "{p.recent_publications[0].title}"
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
                    "{paperDeconstructData.tailored_cold_hook}"
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
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Current Institution</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={studentInstitution}
                  onChange={(e) => setStudentInstitution(e.target.value)}
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
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>GPA</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={studentGpa}
                  onChange={(e) => setStudentGpa(e.target.value)}
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
                  onChange={(e) => setTargetDegree(e.target.value as any)}
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
                  Click "Generate Personalized Cold Email" to produce a tailored, 3-paragraph research pitch adhering to top university admissions standards.
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
                    generatedEmailRes.initial_email.body
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
      {/* TAB 4: RA vs TA STRATEGY & STIPEND GUIDE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'guide' && guideData && (
        <section>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', marginBottom: 'var(--space-1)' }}>
              {lang === 'en' ? 'RA vs TA Graduate Funding Masterclass' : 'রিসার্চ অ্যাসিস্ট্যান্টশিপ (RA) বনাম টিচিং অ্যাসিস্ট্যান্টশিপ (TA)'}
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto' }}>
              Understand how graduate stipends and 100% tuition waivers work across destination countries.
            </p>
          </div>

          <div className={styles.guideGrid}>
            {guideData.countries.map((item, idx) => (
              <GlassCard key={idx} variant="bordered" className={styles.guideCard}>
                <div className={styles.guideCountryHeader}>
                  <div className={styles.guideCountryName}>
                    <span>{item.flag}</span>
                    <span>{item.country}</span>
                  </div>
                  <Badge variant="verified" size="sm">
                    {item.tuition_remission.includes('100%') ? '100% Tuition Free' : 'Partial/Full Offset'}
                  </Badge>
                </div>

                <div className={styles.stipendHighlight}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Monthly Living Stipend:</div>
                  <div className={styles.stipendBdt}>
                    {item.monthly_stipend_range} (~৳{item.monthly_stipend_bdt_lakh} Lakh BDT/mo)
                  </div>
                </div>

                <div>
                  <div className={styles.guideSectionTitle}>🔬 Research Assistantship (RA):</div>
                  <div className={styles.guideText}>{item.ra_overview}</div>
                </div>

                <div>
                  <div className={styles.guideSectionTitle}>👨‍🏫 Teaching Assistantship (TA):</div>
                  <div className={styles.guideText}>{item.ta_overview}</div>
                </div>

                <div className={styles.speakingCutoffBox}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase' }}>
                    🗣️ Spoken English Cutoff for TA:
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {item.ta_speaking_score_requirement}
                  </div>
                </div>

                <div>
                  <div className={styles.guideSectionTitle}>💡 Pro Tips:</div>
                  <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {item.pro_tips.map((tip, tIdx) => (
                      <li key={tIdx} style={{ marginBottom: '4px' }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Grant Cycles Timeline */}
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
                Predicting professor's technical screening questions...
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
