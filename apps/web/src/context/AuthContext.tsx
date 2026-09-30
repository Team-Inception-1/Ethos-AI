'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { currentUserSchema, type User, type UserRole } from '@/lib/auth/contracts';
import { postAuth, authFailure, type AuthResult } from '@/lib/auth/client-request';
export type { User, UserRole, StudentDetails, AgencyDetails } from '@/lib/auth/contracts';

export interface NeonAuthStatus {
  connected: boolean; provider: string; baseUrl: string; error?: string; loading: boolean; demoEnabled?: boolean;
}

type Registration = { name: string; email: string; phone: string; role: UserRole; password?: string };

interface AuthContextValue {
  user: User | null; isAuthenticated: boolean; loading: boolean;
  pendingRegistration: Partial<User> | null; otpSent: boolean; otpCountdown: number; otpEmail: string;
  linkedStudents: User[]; linkedParents: User[]; neonAuthStatus: NeonAuthStatus;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult<User>>;
  signUp: (data: Registration) => Promise<AuthResult>;
  verifyOtp: (code: string) => Promise<AuthResult<User>>; resendOtp: () => Promise<AuthResult>;
  requestSignInOtp: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>; logout: () => Promise<AuthResult>; refreshSession: () => Promise<User | null>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  linkStudent: (identifier: string) => { success: boolean; message: string };
  unlinkStudent: (studentId: string) => void;
  checkNeonAuth: () => Promise<NeonAuthStatus>;
}

const DEFAULT_AUTH_STATUS: NeonAuthStatus = {
  connected: false, provider: 'neon_better_auth', baseUrl: '', loading: true, demoEnabled: false,
};
const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/user/me', { credentials: 'same-origin', cache: 'no-store' });
    return response.ok ? currentUserSchema.parse((await response.json()).data) : null;
  } catch { return null; }
}

async function fetchAuthStatus(): Promise<NeonAuthStatus> {
  try {
    const response = await fetch('/api/auth/status', { cache: 'no-store' });
    const data = await response.json();
    return {
      connected: response.ok && data.status === 'configured', provider: 'neon_better_auth',
      baseUrl: typeof data.baseUrl === 'string' ? data.baseUrl : '', loading: false,
      demoEnabled: data.demoEnabled === true,
    };
  } catch { return { ...DEFAULT_AUTH_STATUS, loading: false, error: 'Auth configuration could not be checked.' }; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRegistration, setPendingRegistration] = useState<Partial<User> | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpEmail, setOtpEmail] = useState('');
  const [neonAuthStatus, setNeonAuthStatus] = useState(DEFAULT_AUTH_STATUS);
  const generation = useRef(0);
  const registrationPassword = useRef<string | null>(null);
  const registrationVerified = useRef(false);

  const refreshSession = useCallback(async () => {
    const requestGeneration = ++generation.current;
    const current = await fetchCurrentUser();
    if (requestGeneration === generation.current) { setUser(current); setLoading(false); }
    return current;
  }, []);

  const checkNeonAuth = useCallback(async () => {
    const status = await fetchAuthStatus();
    setNeonAuthStatus(status);
    return status;
  }, []);

  useEffect(() => {
    // Old localStorage identities are never read or used as credentials.
    let active = true;
    const requestGeneration = ++generation.current;
    fetchCurrentUser().then(current => {
      if (active && requestGeneration === generation.current) { setUser(current); setLoading(false); }
    });
    fetchAuthStatus().then(status => { if (active) setNeonAuthStatus(status); });
    const onFocus = () => { void refreshSession(); };
    window.addEventListener('focus', onFocus);
    return () => { active = false; window.removeEventListener('focus', onFocus); };
  }, [refreshSession]);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => setOtpCountdown(count => Math.max(0, count - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const signInWithPassword = async (email: string, password: string): Promise<AuthResult<User>> => {
    if (!password) return authFailure('PASSWORD_REQUIRED', 'Enter your password.');
    const result = await postAuth('/api/auth/sign-in/email', { email: email.trim().toLowerCase(), password });
    if (!result.success) return result;
    const current = await refreshSession();
    return current ? { success: true, data: current } : authFailure('PROFILE_UNAVAILABLE', 'Your email must be verified and your platform profile completed before signing in.');
  };

  const sendOtp = async (email: string, type: 'sign-in' | 'email-verification'): Promise<AuthResult> => {
    const result = await postAuth('/api/auth/email-otp/send-verification-otp', { email, type });
    if (result.success) { setOtpEmail(email); setOtpSent(true); setOtpCountdown(60); }
    return result;
  };

  const signUp = async (data: Registration): Promise<AuthResult> => {
    if (data.role === 'admin' || !data.password) return authFailure('INVALID_REGISTRATION', 'Choose a public account type and enter a password.');
    const email = data.email.trim().toLowerCase();
    if (pendingRegistration?.email === email && otpCountdown > 0) return authFailure('RESEND_COOLDOWN', 'Wait before requesting another verification code.');
    const result = await postAuth('/api/registration/start', { ...data, email });
    if (!result.success) return result;
    registrationPassword.current = data.password;
    registrationVerified.current = false;
    setPendingRegistration({ name: data.name, email, phone: data.phone, role: data.role });
    setOtpEmail(email);
    return sendOtp(email, 'email-verification');
  };

  const verifyOtp = async (code: string): Promise<AuthResult<User>> => {
    if (!/^\d{6}$/.test(code) || !otpEmail) return authFailure('INVALID_OTP', 'Enter a six-digit code.');
    if (!pendingRegistration || !registrationVerified.current) {
      const result = await postAuth(pendingRegistration ? '/api/auth/email-otp/verify-email' : '/api/auth/sign-in/email-otp', { email: otpEmail, otp: code });
      if (!result.success) return result;
      if (pendingRegistration) registrationVerified.current = true;
    }
    if (pendingRegistration) {
      // Some Neon configurations do not create a session on verification. Authenticate
      // with the original password, never with a sign-in OTP of a different purpose.
      if (registrationPassword.current) {
        const signedIn = await postAuth('/api/auth/sign-in/email', { email: otpEmail, password: registrationPassword.current });
        if (!signedIn.success) return signedIn;
      }
      const provisioned = await postAuth('/api/registration/complete', {});
      if (!provisioned.success) return provisioned;
    }
    const current = await refreshSession();
    if (!current) return authFailure('PROFILE_UNAVAILABLE', 'Your session or platform profile could not be restored. Please sign in again.');
    registrationPassword.current = null;
    setPendingRegistration(null); setOtpSent(false);
    return { success: true, data: current };
  };

  const resendOtp = async (): Promise<AuthResult> => {
    if (otpCountdown > 0) return authFailure('RESEND_COOLDOWN', 'Wait before requesting another code.');
    if (!otpEmail) return authFailure('EMAIL_REQUIRED', 'Enter your email first.');
    return sendOtp(otpEmail, pendingRegistration ? 'email-verification' : 'sign-in');
  };

  const requestSignInOtp = async (email: string): Promise<AuthResult> => {
    setPendingRegistration(null);
    registrationPassword.current = null;
    return sendOtp(email.trim().toLowerCase(), 'sign-in');
  };

  const signOut = async (): Promise<AuthResult> => {
    const result = await postAuth('/api/auth/sign-out', {});
    if (result.success) {
      ++generation.current; setUser(null); setPendingRegistration(null); setOtpSent(false);
      registrationPassword.current = null;
    }
    await refreshSession();
    return result;
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const response = await fetch('/api/user/me', { method: 'PUT', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (!response.ok) return false;
      await refreshSession();
      return true;
    } catch { return false; }
  };

  return <AuthContext.Provider value={{
    user, loading, isAuthenticated: !!user, pendingRegistration, otpSent, otpCountdown, otpEmail,
    linkedStudents: [], linkedParents: [], neonAuthStatus, signInWithPassword, signUp, verifyOtp, resendOtp,
    signOut, logout: signOut, refreshSession, updateProfile, checkNeonAuth, requestSignInOtp,
    linkStudent: () => ({ success: false, message: 'Guardian linking requires a server-approved relationship.' }),
    unlinkStudent: () => {},
  }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requires AuthProvider.');
  return context;
}
