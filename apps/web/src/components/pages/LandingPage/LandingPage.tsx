'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import EthosLogo from '@/components/ui/EthosLogo/EthosLogo';
import styles from './LandingPage.module.css';

const stats = [
  { value: 2400, suffix: '+', label: 'Students Protected', labelBn: 'শিক্ষার্থী সুরক্ষিত' },
  { value: 98,   suffix: '%', label: 'Escrow Success Rate', labelBn: 'এস্ক্রো সাফল্যের হার' },
  { value: 340,  suffix: '+', label: 'Verified Agencies', labelBn: 'যাচাইকৃত এজেন্সি' },
  { value: 18,   suffix: 'Cr+', label: 'Funds Protected (Tk)', labelBn: 'সুরক্ষিত তহবিল (Tk)' },
];

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Verified Agencies',
    titleBn: 'যাচাইকৃত এজেন্সি',
    desc: 'Every agency is verified against government registration, complaints history, and AI risk scoring before they appear in our directory.',
    descBn: 'প্রতিটি এজেন্সি সরকারি নিবন্ধন, অভিযোগের ইতিহাস এবং AI রিস্ক স্কোরিং এর বিরুদ্ধে যাচাই করা হয়।',
    color: 'emerald',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Escrow Payments',
    titleBn: 'এস্ক্রো পেমেন্ট',
    desc: 'Never pay upfront. Your money is held in escrow and released milestone by milestone — only when conditions are met.',
    descBn: 'আগেভাগে পরিশোধ করবেন ঘন না। আপনার অর্থ এস্ক্রোতে রাখা হয় এবং মাইলস্টোন অনুযায়ী মুক্তি দেওয়া হয়।',
    color: 'blue',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a9.96 9.96 0 0 1-5-1.34L2 22l1.34-5A9.96 9.96 0 0 1 2 12 10 10 0 0 1 12 2z"/>
        <circle cx="8.5" cy="12.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="12.5" r="1.2" fill="currentColor"/>
      </svg>
    ),
    title: 'AI Fraud Shield',
    titleBn: 'AI জালিয়াতি ঢাল',
    desc: 'Upload any offer letter or agreement. Our AI detects fake documents, hidden fees, and predatory clauses instantly.',
    descBn: 'যেকোনো অফার লেটার বা চুক্তি আপলোড করুন। আমাদের AI তাৎক্ষণিকভাবে জাল নথি, লুকানো ফি সনাক্ত করে।',
    color: 'purple',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
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

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return { ref, isVisible };
}

export default function LandingPage() {
  const [lang, setLang] = useState<'en'|'bn'>('en');
  
  const statsReveal = useScrollReveal();
  const featuresReveal = useScrollReveal();
  const stepsReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  return (
    <main className={styles.main}>
      {/* ── Hero ── */}
      <section className={styles.hero} aria-label="Hero">
        <div className={styles.heroBg} aria-hidden="true">
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orbPurple} />
          {Array.from({ length: 40 }).map((_, i) => {
            const random = (offset: number) => {
              const x = Math.sin(i * 1000 + offset) * 10000;
              return parseFloat((x - Math.floor(x)).toFixed(4));
            };
            return (
              <div key={i} className={styles.star} style={{
                left: `${(random(1) * 100).toFixed(4)}%`,
                top: `${(random(2) * 100).toFixed(4)}%`,
                animationDelay: `${(random(3) * 4).toFixed(4)}s`,
                width: `${(random(4) * 2 + 1).toFixed(4)}px`,
                height: `${(random(5) * 2 + 1).toFixed(4)}px`,
                opacity: random(6) * 0.6 + 0.1,
              }} />
            );
          })}
        </div>

        <div className={`${styles.heroContent} container`}>
          <div className={styles.heroPill}>
            <span className={styles.pillDot} aria-hidden="true" />
            {lang === 'en' ? 'Built for Bangladeshi Students' : 'বাংলাদেশী শিক্ষার্থীদের জন্য নির্মিত'}
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
              {['A','M','S','R'].map(l => <div key={l} className={styles.trustAvatar}>{l}</div>)}
            </div>
            <span className={styles.trustText}>
              {lang === 'en' ? 'Trusted by 2,400+ students this year' : 'এই বছর ২,৪০০+ শিক্ষার্থী বিশ্বাস করেছেন'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.featuresSection} aria-label="Features" ref={featuresReveal.ref}>
        <div className="container">
          <div className={`${styles.sectionHeader} ${featuresReveal.isVisible ? 'animate-fade-up' : 'opacity-0'}`}>
            <h2>{lang === 'en' ? 'Everything You Need to Study Safely' : 'নিরাপদে পড়াশোনার জন্য সবকিছু'}</h2>
            <p className={styles.sectionSubtitle}>
              {lang === 'en'
                ? 'A complete trust and payments platform built specifically for Bangladeshi students.'
                : 'বাংলাদেশী শিক্ষার্থীদের জন্য তৈরি একটি সম্পূর্ণ ট্রাস্ট ও পেমেন্ট প্ল্যাটফর্ম।'}
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <div 
                key={f.title} 
                className={`${featuresReveal.isVisible ? 'animate-fade-up' : 'opacity-0'}`} 
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <GlassCard hover className={styles.featureCard} padding="lg">
                  <div className={`${styles.featureIcon} ${styles[`icon-${f.color}`]}`} aria-hidden="true">{f.icon}</div>
                  <h3 className={styles.featureTitle}>{lang === 'en' ? f.title : f.titleBn}</h3>
                  <p className={styles.featureDesc}>{lang === 'en' ? f.desc : f.descBn}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.statsSection} aria-label="Statistics" ref={statsReveal.ref}>
        <div className="container">
          <div className={styles.statsGrid}>
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`${statsReveal.isVisible ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <StatCard {...s} lang={lang} trigger={statsReveal.isVisible} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={styles.stepsSection} id="how" aria-label="How it works" ref={stepsReveal.ref}>
        <div className="container">
          <div className={`${styles.sectionHeader} ${stepsReveal.isVisible ? 'animate-fade-up' : 'opacity-0'}`}>
            <h2>{lang === 'en' ? 'How Ethos AI Works' : 'Ethos AI কীভাবে কাজ করে'}</h2>
            <p className={styles.sectionSubtitle}>
              {lang === 'en' ? 'Four simple steps to a safer study-abroad journey.' : 'নিরাপদ বিদেশ যাত্রার চারটি সহজ ধাপ।'}
            </p>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((s, i) => (
              <div 
                key={s.n} 
                className={`${styles.step} ${stepsReveal.isVisible ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={styles.stepNumber} aria-hidden="true">{s.n}</div>
                {i < steps.length - 1 && <div className={styles.stepConnector} aria-hidden="true" />}
                <GlassCard padding="lg" className={styles.stepCard} variant="elevated">
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agency CTA ── */}
      <section className={styles.agencyCtaSection} aria-label="Agency CTA" ref={ctaReveal.ref}>
        <div className="container">
          <div className={`${ctaReveal.isVisible ? 'animate-fade-up' : 'opacity-0'}`}>
            <GlassCard glow padding="lg" className={styles.agencyCta} variant="frosted">
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
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer} aria-label="Footer">
        <div className={`${styles.footerInner} container`}>
          <div className={styles.footerLogo}>
            <EthosLogo size={32} />
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
