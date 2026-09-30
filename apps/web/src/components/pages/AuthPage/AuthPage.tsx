'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useAuth, UserRole } from '@/context/AuthContext';
import { EthosLogoIcon } from '@/components/ui/EthosLogo/EthosLogo';
import styles from './AuthPage.module.css';

type Mode = 'login' | 'register';

interface AuthPageProps {
  mode: Mode;
}

// Icons replaced with SVGs
const StudentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const ParentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const AgencyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
    <path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M12 10h.01" />
    <path d="M8 14h.01" /><path d="M16 14h.01" /><path d="M12 14h.01" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const QuoteIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.1" style={{ position: 'absolute', top: 16, left: 16, zIndex: 0 }}>
    <path d="M14.017 21L16.411 14.603H10.893V3H21v11.397L18.606 21h-4.589zm-10.893 0L5.518 14.603H0V3h10.107v11.397L7.714 21H3.124z" />
  </svg>
);

const roles: { id: UserRole; label: string; labelBn: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'student', icon: <StudentIcon />, label: 'Student', labelBn: 'শিক্ষার্থী', desc: 'Applying to study abroad' },
  { id: 'parent', icon: <ParentIcon />, label: 'Parent', labelBn: 'অভিভাবক', desc: 'Managing child application' },
  { id: 'agency', icon: <AgencyIcon />, label: 'Agency', labelBn: 'এজেন্সি', desc: 'Consultancy service provider' },
];

export default function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const { loading, login, register, verifyOtp, resendOtp, otpCountdown, otpEmail, refreshSession, requestSignInOtp, neonAuthStatus } = useAuth();

  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [role, setRole] = useState<UserRole>('student');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const next = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setOtp(next);
      const nextIndex = Math.min(pasted.length, 5);
      otpRefs.current[nextIndex]?.focus();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'register') {
      if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
        setErrorMsg('Please fill in all required fields.');
        return;
      }
      setIsVerifying(true);
      const sent = await register({ name: fullName, email, phone, role, password });
      setIsVerifying(false);
      if (sent) setStep('otp');
      else setErrorMsg('Registration or verification email failed. Please retry.');
    } else {
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Please enter your email and password.');
        return;
      }
      setIsVerifying(true);
      try {
        const ok = await login(email.trim(), password);
        if (!ok) {
          setErrorMsg('Invalid login credentials. Please check your email and password.');
          setIsVerifying(false);
          return;
        }

        const current = await refreshSession();
        if (!current) { setErrorMsg('Your session could not be restored. Please sign in again.'); return; }
        router.push(current.role === 'agency' ? '/agency/dashboard' : current.role === 'admin' ? '/admin' : '/dashboard');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Authentication error. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleLoginViaOtp = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email to receive an OTP.');
      return;
    }
    setIsVerifying(true);
    const sent = await requestSignInOtp(email);
    setIsVerifying(false);
    if (sent) setStep('otp');
    else setErrorMsg('The sign-in code could not be sent. Please retry.');
  };

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

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter a valid 6 digit OTP code.');
      return;
    }
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const success = await verifyOtp(code);
      if (success) {
        const current = await refreshSession();
        if (!current) { setErrorMsg('Your session could not be restored. Please sign in again.'); return; }
        router.push(current.role === 'agency' ? '/agency/dashboard' : current.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        setErrorMsg('Invalid verification code. Please check your email and try again.');
      }
    } catch {
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      {/* Left Panel — Branding */}
      <div className={styles.leftPanel} aria-hidden="true">
        <Link href="/" className={styles.brandLogo}>
          <EthosLogoIcon size={36} />
          <span className={styles.brandName}>
            Ethos <span className={styles.brandAI}>AI</span>
          </span>
        </Link>
        <div className={styles.leftContent}>
          <div className={styles.quoteCard}>
            <QuoteIcon />
            <blockquote className={styles.quote}>
              <p>
                {lang === 'en'
                  ? '"I finally trusted a consultancy. Ethos AI showed me it was verified before I paid a single taka."'
                  : '"আমি অবশেষে একটি কনসালটেন্সিকে বিশ্বাস করতে পেরেছি। একটি টাকা দেওয়ার আগেই Ethos AI আমাকে দেখিয়েছে এটি যাচাইকৃত।"'}
              </p>
              <footer>
                <div className={styles.quoteAvatar}>RA</div>
                <div>
                  <strong>Riya Ahmed</strong>
                  <div>{lang === 'en' ? 'IELTS 7.5, Canada 2025' : 'IELTS ৭.৫, কানাডা ২০২৫'}</div>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
        <div className={styles.leftStats}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>2,400+</span>
            <span className={styles.statLbl}>{lang === 'en' ? 'Protected' : 'সুরক্ষিত'}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>340+</span>
            <span className={styles.statLbl}>{lang === 'en' ? 'Agencies' : 'এজেন্সি'}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>98%</span>
            <span className={styles.statLbl}>{lang === 'en' ? 'Success' : 'সাফল্য'}</span>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrap}>
          {/* Lang Toggle */}
          <div className={styles.formHeader}>
            <div className={styles.formTitleWrap}>
              {step === 'form' ? (
                <>
                  <h1 className={styles.formTitle}>
                    {mode === 'login'
                      ? lang === 'en'
                        ? 'Welcome Back'
                        : 'স্বাগতম'
                      : lang === 'en'
                        ? 'Create Account'
                        : 'অ্যাকাউন্ট তৈরি করুন'}
                  </h1>
                  <p className={styles.formSub}>
                    {mode === 'login'
                      ? lang === 'en'
                        ? 'Sign in to your Ethos AI account'
                        : 'আপনার Ethos AI অ্যাকাউন্টে সাইন ইন করুন'
                      : lang === 'en'
                        ? 'Join 2,400+ students already protected'
                        : 'ইতিমধ্যে সুরক্ষিত ২,৪০০+ শিক্ষার্থীদের সাথে যোগ দিন'}
                  </p>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setStep('form')} className={styles.backBtn}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    {lang === 'en' ? 'Back' : 'ফিরে যান'}
                  </button>
                  <h1 className={styles.formTitle}>{lang === 'en' ? 'Verify OTP' : 'OTP যাচাই করুন'}</h1>
                  <p className={styles.formSub}>
                    {lang === 'en' ? (
                      <>
                        We sent a 6-digit verification code to{' '}
                        <strong style={{ color: 'var(--blue-light)' }}>{otpEmail || email || 'your email'}</strong> via Neon Auth.
                      </>
                    ) : (
                      <>
                        আমরা আপনার ইমেইল{' '}
                        <strong style={{ color: 'var(--blue-light)' }}>{otpEmail || email}</strong>-এ একটি ৬ সংখ্যার কোড পাঠিয়েছি।
                      </>
                    )}
                  </p>
                </>
              )}
            </div>
            <button className={styles.langBtn} onClick={() => setLang((l) => (l === 'en' ? 'bn' : 'en'))}>
              {lang === 'en' ? 'বাং' : 'EN'}
            </button>
          </div>

          {step === 'form' ? (
            <>
              {/* Role Selector (register only) */}
              {mode === 'register' && (
                <div className={styles.roleGrid} role="radiogroup" aria-label="Account type">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      role="radio"
                      aria-checked={role === r.id}
                      className={`${styles.roleCard} ${role === r.id ? styles.roleActive : ''}`}
                      onClick={() => setRole(r.id)}
                    >
                      <span className={styles.roleIcon} aria-hidden="true">
                        {r.icon}
                      </span>
                      <span className={styles.roleLabel}>{lang === 'en' ? r.label : r.labelBn}</span>
                      <span className={styles.roleDesc}>{r.desc}</span>
                    </button>
                  ))}
                </div>
              )}



              {errorMsg && <div style={{ color: 'var(--red-light)', fontSize: '13px', fontWeight: 600 }}>{errorMsg}</div>}

              <form className={styles.form} onSubmit={handleFormSubmit}>
                {mode === 'register' && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="fullname">
                      {lang === 'en' ? 'Full Name' : 'পূর্ণ নাম'}
                    </label>
                    <input
                      id="fullname"
                      type="text"
                      className={styles.input}
                      placeholder={lang === 'en' ? 'Riya Ahmed' : 'রিয়া আহমেদ'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="email">
                    {lang === 'en' ? 'Email Address' : 'ইমেইল ঠিকানা'}
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {mode === 'register' && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="phone">
                      {lang === 'en' ? 'Phone Number' : 'ফোন নম্বর'}
                    </label>
                    <div className={styles.phoneWrap}>
                      <span className={styles.phonePrefix}>🇧🇩 +880</span>
                      <input
                        id="phone"
                        type="tel"
                        className={`${styles.input} ${styles.phoneInput}`}
                        placeholder="1XXXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="password">
                    {lang === 'en'
                      ? mode === 'login'
                        ? 'Password'
                        : 'Create Password'
                      : mode === 'login'
                        ? 'পাসওয়ার্ড'
                        : 'নতুন পাসওয়ার্ড'}
                  </label>
                  <div className={styles.passwordWrap}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`${styles.input} ${styles.passwordInput}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggleBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {mode === 'login' && (
                    <Link href="#" className={styles.forgotLink}>
                      {lang === 'en' ? 'Forgot password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
                    </Link>
                  )}
                </div>
                <Button type="submit" size="lg" fullWidth glow disabled={loading || isVerifying}>
                  {mode === 'login'
                    ? (isVerifying
                        ? (lang === 'en' ? 'Verifying Credentials…' : 'যাচাই করা হচ্ছে…')
                        : (lang === 'en' ? 'Sign In →' : 'সাইন ইন →'))
                    : (lang === 'en' ? 'Create Account →' : 'অ্যাকাউন্ট তৈরি করুন →')}
                </Button>
                {mode === 'login' && (
                  <button
                    type="button"
                    className={styles.otpSwitchLink}
                    onClick={handleLoginViaOtp}
                    disabled={loading || isVerifying}
                  >
                    🔒 {lang === 'en' ? 'Or sign in with email OTP' : 'অথবা ইমেল OTP দিয়ে সাইন ইন করুন'}
                  </button>
                )}
              </form>

              {/* Subtle Collapsible Credentials Guide for Reviewers */}
              {mode === 'login' && neonAuthStatus.demoEnabled && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <details style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 700, userSelect: 'none' }}>
                      🔑 Evaluator Quick-Fill Credentials
                    </summary>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '10px' }}>
                      <button
                        type="button"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => { setEmail('riya@example.com'); setPassword('student123'); }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Student</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>riya@example.com</div>
                      </button>
                      <button
                        type="button"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => { setEmail('contact@globaledu.bd'); setPassword('agency123'); }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Agency</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>contact@globaledu.bd</div>
                      </button>
                      <button
                        type="button"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => { setEmail('admin@ethosai.bd'); setPassword('admin123'); }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Admin</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>admin@ethosai.bd</div>
                      </button>
                      <button
                        type="button"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => { setEmail('farhana@example.com'); setPassword('parent123'); }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Parent</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>farhana@example.com</div>
                      </button>
                    </div>
                  </details>
                </div>
              )}

              <p className={styles.switchMode}>
                {mode === 'login' ? (
                  <>
                    {lang === 'en' ? 'New to Ethos AI? ' : 'নতুন? '}
                    <Link href="/register" className={styles.switchLink}>
                      {lang === 'en' ? 'Create account' : 'অ্যাকাউন্ট তৈরি করুন'}
                    </Link>
                  </>
                ) : (
                  <>
                    {lang === 'en' ? 'Already have an account? ' : 'অ্যাকাউন্ট আছে? '}
                    <Link href="/login" className={styles.switchLink}>
                      {lang === 'en' ? 'Sign in' : 'সাইন ইন'}
                    </Link>
                  </>
                )}
              </p>
            </>
          ) : (
            /* OTP Step */
            <>
              {errorMsg && <div style={{ color: 'var(--red-light)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>{errorMsg}</div>}

              <div className={styles.otpGrid} role="group" aria-label="OTP input">
                {otp.map((v, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                    onPaste={handleOtpPaste}
                    className={`${styles.otpBox} ${v ? styles.otpFilled : ''}`}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', margin: '12px 0 16px', lineHeight: '1.5' }}>
                📬 Verification code sent to <strong style={{ color: 'var(--text-primary)' }}>{otpEmail || 'your email'}</strong>
              </div>

              <div className={styles.demoOtpHint}>
                Enter the six-digit code delivered by Neon Auth. Codes expire and have a limited number of attempts.
              </div>

              <Button size="lg" fullWidth glow onClick={handleVerify} disabled={isVerifying}>
                {isVerifying
                  ? (lang === 'en' ? 'Verifying…' : 'যাচাই করা হচ্ছে…')
                  : (lang === 'en' ? 'Verify & Continue →' : 'যাচাই করুন ও চালিয়ে যান →')}
              </Button>

              <p className={styles.resend}>
                {lang === 'en' ? "Didn't receive code? " : 'কোড পাননি? '}
                {otpCountdown > 0 ? (
                  <span style={{ color: 'var(--blue-light)', fontWeight: 600 }}>Resend in {otpCountdown}s</span>
                ) : (
                  <button type="button" onClick={resendOtp} className={styles.switchLink}>
                    {lang === 'en' ? 'Resend OTP' : 'OTP পুনরায় পাঠান'}
                  </button>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
