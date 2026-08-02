'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import styles from './LandingPage.module.css';

const stats = [
  { value: 2400, suffix: '+', label: 'Students Protected', labelBn: 'শিক্ষার্থী সুরক্ষিত' },
  { value: 98,   suffix: '%', label: 'Escrow Success Rate', labelBn: 'এস্ক্রো সাফল্যের হার' },
  { value: 340,  suffix: '+', label: 'Verified Agencies', labelBn: 'যাচাইকৃত এজেন্সি' },
  { value: 18,   suffix: 'Cr+', label: 'Funds Protected (Tk)', labelBn: 'সুরক্ষিত তহবিল (Tk)' },
];

const features = [
  {
    icon: '🛡️',
    title: 'Verified Agencies',
    titleBn: 'যাচাইকৃত এজেন্সি',
    desc: 'Every agency is verified against government registration, complaints history, and AI risk scoring before they appear in our directory.',
    descBn: 'প্রতিটি এজেন্সি সরকারি নিবন্ধন, অভিযোগের ইতিহাস এবং AI রিস্ক স্কোরিং এর বিরুদ্ধে যাচাই করা হয়।',
    color: 'emerald',
  },
  {
    icon: '🔒',
    title: 'Escrow Payments',
    titleBn: 'এস্ক্রো পেমেন্ট',
    desc: 'Never pay upfront. Your money is held in escrow and released milestone by milestone — only when conditions are met.',
    descBn: 'আগেভাগে পরিশোধ করবেন না। আপনার অর্থ এস্ক্রোতে রাখা হয় এবং মাইলস্টোন অনুযায়ী মুক্তি দেওয়া হয়।',
    color: 'blue',
  },
  {
    icon: '🤖',
    title: 'AI Fraud Shield',
    titleBn: 'AI জালিয়াতি ঢাল',
    desc: 'Upload any offer letter or agreement. Our AI detects fake documents, hidden fees, and predatory clauses instantly.',
    descBn: 'যেকোনো অফার লেটার বা চুক্তি আপলোড করুন। আমাদের AI তাৎক্ষণিকভাবে জাল নথি, লুকানো ফি সনাক্ত করে।',
    color: 'purple',
  },
  {
    icon: '💬',
    title: 'Bangla AI Assistant',
    titleBn: 'বাংলা AI সহকারী',
    desc: 'Get plain-language explanations of your application status, agreements, and next steps — in Bangla or English.',
    descBn: 'আপনার আবেদনের অবস্থা, চুক্তি এবং পরবর্তী পদক্ষেপের সহজ ব্যাখ্যা পান — বাংলায় বা ইংরেজিতে।',
    color: 'amber',
  },
];

const steps = [
  { n: '01', title: 'Register & Find', desc: 'Create your profile and browse our directory of 340+ AI-verified agencies.' },
  { n: '02', title: 'Compare & Choose', desc: 'Side-by-side compare fees, refund policies, success rates, and reviews.' },
  { n: '03', title: 'Pay Safely', desc: 'Lock payments in escrow. Funds release only as your application progresses.' },
  { n: '04', title: 'Track Everything', desc: 'Real-time application tracking, AI document checks, and direct agency chat.' },
];

function useCountUp(target: number, trigger: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, trigger, duration]);
  return count;
}

function StatCard({ value, suffix, label, labelBn, lang, trigger }: typeof stats[0] & { lang: 'en'|'bn'; trigger: boolean }) {
  const count = useCountUp(value, trigger);
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue}>{count.toLocaleString()}<span className={styles.statSuffix}>{suffix}</span></div>
      <div className={styles.statLabel}>{lang === 'en' ? label : labelBn}</div>
    </div>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<'en'|'bn'>('en');
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsTrigger, setStatsTrigger] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsTrigger(true); },
      { threshold: 0.4 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <main className={styles.main}>
      {/* ── Hero ── */}
      <section className={styles.hero} aria-label="Hero">
        <div className={styles.heroBg} aria-hidden="true">
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orbPurple} />
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className={styles.star} style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.6 + 0.2,
            }} />
          ))}
        </div>

        <div className={`${styles.heroContent} container`}>
          <div className={styles.heroPill}>
            <span className={styles.pillDot} aria-hidden="true" />
            {lang === 'en' ? '🇧🇩  Built for Bangladeshi Students' : '🇧🇩  বাংলাদেশী শিক্ষার্থীদের জন্য নির্মিত'}
          </div>

          <h1 className={`${styles.heroTitle} display`}>
            {lang === 'en' ? (
              <>Study Abroad.<br /><span className="text-gradient">Without the Fear.</span></>
            ) : (
              <>বিদেশে পড়ুন।<br /><span className="text-gradient">ভয় ছাড়াই।</span></>
            )}
          </h1>

          <p className={styles.heroSubtitle}>
            {lang === 'en'
              ? 'Ethos AI protects you from fraudulent consultancies with agency verification, milestone escrow payments, and AI-powered document fraud detection.'
              : 'Ethos AI আপনাকে জালিয়াতি কনসালটেন্সি থেকে রক্ষা করে — এজেন্সি যাচাইকরণ, মাইলস্টোন এস্ক্রো পেমেন্ট এবং AI-চালিত নথি জালিয়াতি সনাক্তকরণের মাধ্যমে।'}
          </p>

          <div className={styles.heroCtas}>
            <Link href="/register">
              <Button size="lg" glow>
                {lang === 'en' ? 'Get Protected — It\'s Free' : 'সুরক্ষিত হন — বিনামূল্যে'}
              </Button>
            </Link>
            <Link href="/directory">
              <Button size="lg" variant="ghost">
                {lang === 'en' ? 'Browse Verified Agencies →' : 'যাচাইকৃত এজেন্সি দেখুন →'}
              </Button>
            </Link>
          </div>

          <div className={styles.heroTrust}>
            <div className={styles.trustAvatars} aria-label="Recent users">
              {['A','B','C','D'].map(l => <div key={l} className={styles.trustAvatar}>{l}</div>)}
            </div>
            <span className={styles.trustText}>
              {lang === 'en' ? 'Trusted by 2,400+ students this year' : 'এই বছর ২,৪০০+ শিক্ষার্থী বিশ্বাস করেছেন'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.featuresSection} aria-label="Features">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>{lang === 'en' ? 'Everything You Need to Study Safely' : 'নিরাপদে পড়াশোনার জন্য সবকিছু'}</h2>
            <p className={styles.sectionSubtitle}>
              {lang === 'en'
                ? 'A complete trust and payments platform built specifically for Bangladeshi students.'
                : 'বাংলাদেশী শিক্ষার্থীদের জন্য তৈরি একটি সম্পূর্ণ ট্রাস্ট ও পেমেন্ট প্ল্যাটফর্ম।'}
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((f) => (
              <GlassCard key={f.title} hover className={styles.featureCard}>
                <div className={`${styles.featureIcon} ${styles[`icon-${f.color}`]}`} aria-hidden="true">{f.icon}</div>
                <h3 className={styles.featureTitle}>{lang === 'en' ? f.title : f.titleBn}</h3>
                <p className={styles.featureDesc}>{lang === 'en' ? f.desc : f.descBn}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.statsSection} aria-label="Statistics" ref={statsRef}>
        <div className="container">
          <div className={styles.statsGrid}>
            {stats.map(s => (
              <StatCard key={s.label} {...s} lang={lang} trigger={statsTrigger} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={styles.stepsSection} id="how" aria-label="How it works">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>{lang === 'en' ? 'How Ethos AI Works' : 'Ethos AI কীভাবে কাজ করে'}</h2>
            <p className={styles.sectionSubtitle}>
              {lang === 'en' ? 'Four simple steps to a safer study-abroad journey.' : 'নিরাপদ বিদেশ যাত্রার চারটি সহজ ধাপ।'}
            </p>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((s, i) => (
              <div key={s.n} className={styles.step}>
                <div className={styles.stepNumber} aria-hidden="true">{s.n}</div>
                {i < steps.length - 1 && <div className={styles.stepConnector} aria-hidden="true" />}
                <GlassCard padding="md" className={styles.stepCard}>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agency CTA ── */}
      <section className={styles.agencyCtaSection} aria-label="Agency CTA">
        <div className="container">
          <GlassCard glow padding="lg" className={styles.agencyCta}>
            <div className={styles.agencyCtaContent}>
              <div>
                <h2>{lang === 'en' ? 'Are You a Consultancy Agency?' : 'আপনি কি একটি কনসালটেন্সি এজেন্সি?'}</h2>
                <p className={styles.agencyCtaDesc}>
                  {lang === 'en'
                    ? 'Join Ethos AI to get verified, build trust with students, and grow your business with our analytics dashboard.'
                    : 'যাচাই পেতে, শিক্ষার্থীদের সাথে আস্থা তৈরি করতে এবং আমাদের অ্যানালিটিক্স ড্যাশবোর্ড দিয়ে ব্যবসা বৃদ্ধি করতে Ethos AI-তে যোগ দিন।'}
                </p>
              </div>
              <Link href="/register?role=agency">
                <Button variant="emerald" size="lg">
                  {lang === 'en' ? 'Apply for Verification →' : 'যাচাইকরণের জন্য আবেদন করুন →'}
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer} aria-label="Footer">
        <div className={`${styles.footerInner} container`}>
          <div className={styles.footerLogo}>
            <span className={styles.footerLogoText}>Ethos <span className="text-gradient">AI</span></span>
            <p className={styles.footerTagline}>
              {lang === 'en' ? 'The Future of Study-Abroad Consulting' : 'স্টাডি-অ্যাব্রোড কনসালটিং এর ভবিষ্যৎ'}
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>Product</h4>
              <Link href="/directory">Directory</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/dashboard/ai-tools">AI Tools</Link>
            </div>
            <div className={styles.footerCol}>
              <h4>Company</h4>
              <Link href="#">About</Link>
              <Link href="#">Blog</Link>
              <Link href="#">Contact</Link>
            </div>
            <div className={styles.footerCol}>
              <h4>Legal</h4>
              <Link href="#">Privacy</Link>
              <Link href="#">Terms</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2026 Ethos AI. {lang === 'en' ? 'All rights reserved.' : 'সর্বস্বত্ব সংরক্ষিত।'}</p>
            <button className={styles.footerLang} onClick={() => setLang(l => l === 'en' ? 'bn' : 'en')}>
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
