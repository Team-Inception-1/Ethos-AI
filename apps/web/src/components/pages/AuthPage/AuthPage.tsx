'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import styles from './AuthPage.module.css';

type Mode = 'login' | 'register';
type Role = 'student' | 'parent' | 'agency';

interface AuthPageProps { mode: Mode; }

const roles: { id: Role; label: string; labelBn: string; icon: string; desc: string }[] = [
  { id: 'student', icon: '🎓', label: 'Student',  labelBn: 'শিক্ষার্থী', desc: 'Applying to study abroad' },
  { id: 'parent',  icon: '👨‍👧', label: 'Parent',   labelBn: 'অভিভাবক',   desc: 'Managing my child\'s application' },
  { id: 'agency',  icon: '🏢', label: 'Agency',   labelBn: 'এজেন্সি',   desc: 'Consultancy service provider' },
];

export default function AuthPage({ mode }: AuthPageProps) {
  const [lang, setLang]       = useState<'en'|'bn'>('en');
  const [role, setRole]       = useState<Role>('student');
  const [step, setStep]       = useState<'form'|'otp'>(mode === 'login' ? 'form' : 'form');
  const [otp, setOtp]         = useState(['','','','','','']);
  const otpRefs               = useRef<(HTMLInputElement|null)[]>([]);

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.orb1}/><div className={styles.orb2}/>
      </div>

      {/* Left Panel — Branding */}
      <div className={styles.leftPanel} aria-hidden="true">
        <Link href="/" className={styles.brandLogo}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L4 8v8c0 7 5.5 13.5 12 16 6.5-2.5 12-9 12-16V8L16 2z" fill="url(#auth-shield)"/>
            <path d="M11 16l3.5 3.5L21 12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="auth-shield" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#4F8EF7"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient></defs>
          </svg>
          <span className={styles.brandName}>Ethos <span className={styles.brandAI}>AI</span></span>
        </Link>
        <div className={styles.leftContent}>
          <blockquote className={styles.quote}>
            <p>{lang === 'en'
              ? '"I finally trusted a consultancy. Ethos AI showed me it was verified before I paid a single taka."'
              : '"আমি অবশেষে একটি কনসালটেন্সিকে বিশ্বাস করতে পেরেছি। একটি টাকা দেওয়ার আগেই Ethos AI আমাকে দেখিয়েছে এটি যাচাইকৃত।"'}
            </p>
            <footer>— Riya Ahmed, {lang === 'en' ? 'IELTS 7.5, Canada 2025' : 'IELTS ৭.৫, কানাডা ২০২৫'}</footer>
          </blockquote>
        </div>
        <div className={styles.leftStats}>
          <div><span className={styles.statNum}>2,400+</span><span className={styles.statLbl}>{lang === 'en' ? 'Protected' : 'সুরক্ষিত'}</span></div>
          <div><span className={styles.statNum}>340+</span><span className={styles.statLbl}>{lang === 'en' ? 'Agencies' : 'এজেন্সি'}</span></div>
          <div><span className={styles.statNum}>98%</span><span className={styles.statLbl}>{lang === 'en' ? 'Success' : 'সাফল্য'}</span></div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrap}>
          {/* Lang Toggle */}
          <div className={styles.formHeader}>
            <button className={styles.langBtn} onClick={() => setLang(l => l === 'en' ? 'bn' : 'en')}>
              {lang === 'en' ? 'বাং' : 'EN'}
            </button>
          </div>

          {step === 'form' ? (
            <>
              <h1 className={styles.formTitle}>
                {mode === 'login'
                  ? (lang === 'en' ? 'Welcome Back' : 'স্বাগতম')
                  : (lang === 'en' ? 'Create Account' : 'অ্যাকাউন্ট তৈরি করুন')}
              </h1>
              <p className={styles.formSub}>
                {mode === 'login'
                  ? (lang === 'en' ? 'Sign in to your Ethos AI account' : 'আপনার Ethos AI অ্যাকাউন্টে সাইন ইন করুন')
                  : (lang === 'en' ? 'Join 2,400+ students already protected' : 'ইতিমধ্যে সুরক্ষিত ২,৪০০+ শিক্ষার্থীদের সাথে যোগ দিন')}
              </p>

              {/* Role Selector (register only) */}
              {mode === 'register' && (
                <div className={styles.roleGrid} role="radiogroup" aria-label="Account type">
                  {roles.map(r => (
                    <button
                      key={r.id}
                      role="radio"
                      aria-checked={role === r.id}
                      className={`${styles.roleCard} ${role === r.id ? styles.roleActive : ''}`}
                      onClick={() => setRole(r.id)}
                    >
                      <span className={styles.roleIcon} aria-hidden="true">{r.icon}</span>
                      <span className={styles.roleLabel}>{lang === 'en' ? r.label : r.labelBn}</span>
                      <span className={styles.roleDesc}>{r.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              <form className={styles.form} onSubmit={e => { e.preventDefault(); setStep('otp'); }}>
                {mode === 'register' && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="fullname">{lang === 'en' ? 'Full Name' : 'পূর্ণ নাম'}</label>
                    <input id="fullname" type="text" className={styles.input} placeholder={lang === 'en' ? 'Riya Ahmed' : 'রিয়া আহমেদ'} required />
                  </div>
                )}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="email">{lang === 'en' ? 'Email Address' : 'ইমেইল ঠিকানা'}</label>
                  <input id="email" type="email" className={styles.input} placeholder="you@example.com" required />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="phone">{lang === 'en' ? 'Phone Number' : 'ফোন নম্বর'}</label>
                  <div className={styles.phoneWrap}>
                    <span className={styles.phonePrefix}>🇧🇩 +880</span>
                    <input id="phone" type="tel" className={`${styles.input} ${styles.phoneInput}`} placeholder="1XXXXXXXXX" required />
                  </div>
                </div>
                {mode === 'login' && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="password">{lang === 'en' ? 'Password' : 'পাসওয়ার্ড'}</label>
                    <input id="password" type="password" className={styles.input} placeholder="••••••••" required />
                    <Link href="#" className={styles.forgotLink}>{lang === 'en' ? 'Forgot password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}</Link>
                  </div>
                )}
                <Button type="submit" size="lg" fullWidth glow>
                  {mode === 'login'
                    ? (lang === 'en' ? 'Send OTP & Login' : 'OTP পাঠান ও লগইন করুন')
                    : (lang === 'en' ? 'Continue →' : 'চালিয়ে যান →')}
                </Button>
              </form>

              <p className={styles.switchMode}>
                {mode === 'login'
                  ? <>{lang === 'en' ? 'New to Ethos AI? ' : 'নতুন? '}<Link href="/register" className={styles.switchLink}>{lang === 'en' ? 'Create account' : 'অ্যাকাউন্ট তৈরি করুন'}</Link></>
                  : <>{lang === 'en' ? 'Already have an account? ' : 'অ্যাকাউন্ট আছে? '}<Link href="/login" className={styles.switchLink}>{lang === 'en' ? 'Sign in' : 'সাইন ইন'}</Link></>
                }
              </p>
            </>
          ) : (
            /* OTP Step */
            <>
              <div className={styles.otpBack}>
                <button onClick={() => setStep('form')} className={styles.backBtn}>
                  ← {lang === 'en' ? 'Back' : 'ফিরে যান'}
                </button>
              </div>
              <h1 className={styles.formTitle}>{lang === 'en' ? 'Verify OTP' : 'OTP যাচাই করুন'}</h1>
              <p className={styles.formSub}>{lang === 'en' ? 'We sent a 6-digit code to your phone and email.' : 'আমরা আপনার ফোন ও ইমেইলে একটি ৬ সংখ্যার কোড পাঠিয়েছি।'}</p>

              <div className={styles.otpGrid} role="group" aria-label="OTP input">
                {otp.map((v, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    className={`${styles.otpBox} ${v ? styles.otpFilled : ''}`}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <Button size="lg" fullWidth glow onClick={() => {}}>
                {lang === 'en' ? 'Verify & Continue →' : 'যাচাই করুন ও চালিয়ে যান →'}
              </Button>

              <p className={styles.resend}>
                {lang === 'en' ? "Didn't receive it? " : 'পাননি? '}
                <button className={styles.switchLink}>{lang === 'en' ? 'Resend OTP' : 'OTP পুনরায় পাঠান'}</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
