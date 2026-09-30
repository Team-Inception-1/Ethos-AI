'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { currentUserSchema, type User, type UserRole } from '@/lib/auth/contracts';
export type { User, UserRole, StudentDetails, AgencyDetails } from '@/lib/auth/contracts';

export interface NeonAuthStatus {
  connected: boolean; provider: string; baseUrl: string; error?: string; loading: boolean; demoEnabled?: boolean;
}

type Registration = { name: string; email: string; phone: string; role: UserRole; password?: string };

interface AuthContextValue {
  user: User | null; isAuthenticated: boolean; loading: boolean;
  pendingRegistration: Partial<User> | null; otpSent: boolean; otpCountdown: number; otpEmail: string;
  linkedStudents: User[]; linkedParents: User[]; neonAuthStatus: NeonAuthStatus;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (data: Registration) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>; resendOtp: () => Promise<boolean>;
  requestSignInOtp: (email: string) => Promise<boolean>;
  logout: () => Promise<void>; refreshSession: () => Promise<User | null>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  linkStudent: (identifier: string) => { success: boolean; message: string };
  unlinkStudent: (studentId: string) => void;
  checkNeonAuth: () => Promise<NeonAuthStatus>;
}

const DEFAULT_AUTH_STATUS: NeonAuthStatus = {
  connected: false, provider: 'neon_better_auth', baseUrl: '', loading: true, demoEnabled: false,
};
const AuthContext = createContext<AuthContextValue | null>(null);

async function authRequest(path: string, body: unknown) {
  const response = await fetch('/api/auth/' + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin', body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Authentication request failed.');
}

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

  const login = async (email: string, password?: string) => {
    try {
      if (!password) return false;
      await authRequest('sign-in/email', { email: email.trim().toLowerCase(), password });
      return !!await refreshSession();
    } catch { return false; }
  };

  const sendOtp = async (email: string, type: 'sign-in' | 'email-verification') => {
    try {
      await authRequest('email-otp/send-verification-otp', { email, type });
      setOtpEmail(email); setOtpSent(true); setOtpCountdown(60);
      return true;
    } catch { return false; }
  };

  const register = async (data: Registration) => {
    if (data.role === 'admin' || !data.password) return false;
    try {
      const email = data.email.trim().toLowerCase();
      await authRequest('sign-up/email', { name: data.name, email, password: data.password });
      setPendingRegistration({ name: data.name, email, phone: data.phone, role: data.role });
      return await sendOtp(email, 'email-verification');
    } catch { return false; }
  };

  const verifyOtp = async (code: string) => {
    if (!/^\d{6}$/.test(code) || !otpEmail) return false;
    try {
      await authRequest(pendingRegistration ? 'email-otp/verify-email' : 'sign-in/email-otp', { email: otpEmail, otp: code });
      const current = await refreshSession();
      if (!current) return false;
      setPendingRegistration(null); setOtpSent(false);
      return true;
    } catch { return false; }
  };

  const resendOtp = async () => {
    if (otpCountdown > 0 || !otpEmail) return false;
    return sendOtp(otpEmail, pendingRegistration ? 'email-verification' : 'sign-in');
  };

  const requestSignInOtp = async (email: string) => {
    setPendingRegistration(null);
    return sendOtp(email.trim().toLowerCase(), 'sign-in');
  };

  const logout = async () => {
    // Clear local UI immediately, but report/retain no fabricated replacement identity.
    ++generation.current; setUser(null); setPendingRegistration(null); setOtpSent(false);
    try { await authRequest('sign-out', {}); } finally { await refreshSession(); }
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
    linkedStudents: [], linkedParents: [], neonAuthStatus, login, register, verifyOtp, resendOtp,
    logout, refreshSession, updateProfile, checkNeonAuth, requestSignInOtp,
    linkStudent: () => ({ success: false, message: 'Guardian linking requires a server-approved relationship.' }),
    unlinkStudent: () => {},
  }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requires AuthProvider.');
  return context;
}
