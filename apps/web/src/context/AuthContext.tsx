'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'student' | 'parent' | 'agency' | 'admin';

export interface StudentDetails {
  targetCountries: string[];
  targetField: string;
  budgetRange: string;
  ieltsScore: string;
  linkCode: string;
}

export interface AgencyDetails {
  agencyName: string;
  licenseNo: string;
  licenseStatus: 'verified' | 'pending' | 'rejected';
  countriesServed: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  linkedParentIds: string[];
  linkedStudentIds: string[];
  studentDetails?: StudentDetails;
  agencyDetails?: AgencyDetails;
  createdAt: string;
}

export interface NeonAuthStatus {
  connected: boolean;
  provider: string;
  baseUrl: string;
  error?: string;
  loading: boolean;
}

export const DEMO_USERS: Record<UserRole, User> = {
  student: {
    id: 'usr-student-01',
    name: 'Riya Ahmed',
    email: 'riya@example.com',
    phone: '+8801712345678',
    role: 'student',
    isVerified: true,
    linkedParentIds: ['usr-parent-01'],
    linkedStudentIds: [],
    studentDetails: {
      targetCountries: ['Canada 🇨🇦', 'Australia 🇦🇺', 'United Kingdom 🇬🇧'],
      targetField: 'Computer Science & Software Engineering',
      budgetRange: '৳15L - ৳25L / year',
      ieltsScore: '7.5 (L:8.0, R:7.5, W:7.0, S:7.5)',
      linkCode: 'ETHOS-STU-8821',
    },
    agencyDetails: {
      agencyName: 'Global Edu BD Consultancy (Primary Advisor)',
      licenseNo: 'MOE-BD-2024-889',
      licenseStatus: 'verified',
      countriesServed: ['Canada', 'UK', 'Australia', 'USA'],
    },
    createdAt: '2025-01-15',
  },
  parent: {
    id: 'usr-parent-01',
    name: 'Farhana Ahmed',
    email: 'farhana@example.com',
    phone: '+8801812345679',
    role: 'parent',
    isVerified: true,
    linkedParentIds: [],
    linkedStudentIds: ['usr-student-01'],
    studentDetails: {
      targetCountries: ['Canada 🇨🇦', 'Australia 🇦🇺', 'United Kingdom 🇬🇧'],
      targetField: 'Computer Science & Software Engineering',
      budgetRange: '৳15L - ৳25L / year',
      ieltsScore: '7.5',
      linkCode: 'ETHOS-STU-8821',
    },
    agencyDetails: {
      agencyName: 'Global Edu BD Consultancy',
      licenseNo: 'MOE-BD-2024-889',
      licenseStatus: 'verified',
      countriesServed: ['Canada', 'UK', 'Australia', 'USA'],
    },
    createdAt: '2025-01-16',
  },
  agency: {
    id: 'usr-agency-01',
    name: 'Global Edu BD',
    email: 'contact@globaledu.bd',
    phone: '+8801912345680',
    role: 'agency',
    isVerified: true,
    linkedParentIds: [],
    linkedStudentIds: [],
    agencyDetails: {
      agencyName: 'Global Edu BD Consultancy',
      licenseNo: 'MOE-BD-2024-889',
      licenseStatus: 'verified',
      countriesServed: ['Canada', 'UK', 'Australia', 'USA'],
    },
    studentDetails: {
      targetCountries: ['Canada', 'UK', 'Australia', 'USA'],
      targetField: 'International Student Placement',
      budgetRange: '৳10L - ৳50L / year',
      ieltsScore: 'N/A (Agency Account)',
      linkCode: 'ETHOS-AGENCY-REP',
    },
    createdAt: '2024-11-01',
  },
  admin: {
    id: 'usr-admin-01',
    name: 'Platform Administrator',
    email: 'admin@ethosai.bd',
    phone: '+8801512345681',
    role: 'admin',
    isVerified: true,
    linkedParentIds: [],
    linkedStudentIds: [],
    agencyDetails: {
      agencyName: 'Ethos AI Governance Division',
      licenseNo: 'GOV-BD-ETHOS-001',
      licenseStatus: 'verified',
      countriesServed: ['Canada', 'UK', 'Australia', 'USA', 'Germany', 'Malaysia'],
    },
    studentDetails: {
      targetCountries: ['Global Platform Operations'],
      targetField: 'Platform Governance & Auditing',
      budgetRange: 'Unlimited',
      ieltsScore: 'Admin Clearance',
      linkCode: 'ETHOS-ADMIN-MASTER',
    },
    createdAt: '2024-10-01',
  },
};

/**
 * Normalizes any user object to ensure full mandatory fields:
 * id, name, email, phone, role, isVerified, agencyDetails, studentDetails
 */
export function normalizeUser(u: Partial<User> & { role?: UserRole }): User {
  const role: UserRole = u.role || 'student';
  const demo = DEMO_USERS[role] || DEMO_USERS.student;

  return {
    id: u.id || demo.id || `usr-${role}-${Date.now()}`,
    name: u.name || demo.name,
    email: u.email || demo.email,
    phone: u.phone || demo.phone,
    role: role,
    isVerified: u.isVerified !== undefined ? u.isVerified : true,
    linkedParentIds: u.linkedParentIds || demo.linkedParentIds || [],
    linkedStudentIds: u.linkedStudentIds || demo.linkedStudentIds || [],
    studentDetails: u.studentDetails || demo.studentDetails,
    agencyDetails: u.agencyDetails || demo.agencyDetails,
    createdAt: u.createdAt || demo.createdAt || new Date().toISOString().split('T')[0],
  };
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  pendingRegistration: Partial<User> | null;
  otpSent: boolean;
  otpCountdown: number;
  otpEmail: string;
  lastGeneratedOtp: string;
  linkedStudents: User[];
  linkedParents: User[];
  neonAuthStatus: NeonAuthStatus;
  login: (emailOrPhone: string, pass?: string) => Promise<boolean>;
  register: (data: { name: string; email: string; phone: string; role: UserRole; password?: string }) => void;
  verifyOtp: (code: string) => Promise<boolean>;
  resendOtp: () => void;
  quickLoginDemo: (role: UserRole) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  linkStudent: (identifier: string) => { success: boolean; message: string };
  unlinkStudent: (studentId: string) => void;
  switchActiveRole: (role: UserRole) => void;
  checkNeonAuth: () => Promise<NeonAuthStatus>;
}

const DEFAULT_AUTH_STATUS: NeonAuthStatus = {
  connected: false,
  provider: 'neon_better_auth',
  baseUrl: process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL || 'https://ep-young-term-axk9zwb2.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth',
  loading: true,
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  pendingRegistration: null,
  otpSent: false,
  otpCountdown: 0,
  otpEmail: '',
  lastGeneratedOtp: '123456',
  linkedStudents: [],
  linkedParents: [],
  neonAuthStatus: DEFAULT_AUTH_STATUS,
  login: async () => false,
  register: () => {},
  verifyOtp: async () => false,
  resendOtp: () => {},
  quickLoginDemo: () => {},
  logout: () => {},
  updateProfile: () => {},
  linkStudent: () => ({ success: false, message: '' }),
  unlinkStudent: () => {},
  switchActiveRole: () => {},
  checkNeonAuth: async () => DEFAULT_AUTH_STATUS,
});

const STORAGE_KEY = 'ethos_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<Partial<User> | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpEmail, setOtpEmail] = useState<string>('');
  const [lastGeneratedOtp, setLastGeneratedOtp] = useState<string>('123456');
  const [neonAuthStatus, setNeonAuthStatus] = useState<NeonAuthStatus>(DEFAULT_AUTH_STATUS);

  const saveUser = useCallback((u: User | null) => {
    const fullUser = u ? normalizeUser(u) : null;
    setUser(fullUser);
    if (fullUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Check Neon Auth backend health & connectivity
  const checkNeonAuth = useCallback(async (): Promise<NeonAuthStatus> => {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        const status: NeonAuthStatus = {
          connected: true,
          provider: data.provider || 'neon_better_auth',
          baseUrl: data.baseUrl || DEFAULT_AUTH_STATUS.baseUrl,
          loading: false,
        };
        setNeonAuthStatus(status);
        return status;
      } else {
        const status: NeonAuthStatus = {
          connected: false,
          provider: 'neon_better_auth',
          baseUrl: DEFAULT_AUTH_STATUS.baseUrl,
          error: `HTTP ${res.status}`,
          loading: false,
        };
        setNeonAuthStatus(status);
        return status;
      }
    } catch (err) {
      const status: NeonAuthStatus = {
        connected: false,
        provider: 'neon_better_auth',
        baseUrl: DEFAULT_AUTH_STATUS.baseUrl,
        error: (err as Error).message,
        loading: false,
      };
      setNeonAuthStatus(status);
      return status;
    }
  }, []);

  // Load user session on initial render and check Neon Auth status
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(normalizeUser(parsed));
      } else {
        const initialDemoUser = normalizeUser(DEMO_USERS.student);
        setUser(initialDemoUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDemoUser));
      }
    } catch {
      setUser(normalizeUser(DEMO_USERS.student));
    }

    checkNeonAuth();
  }, [checkNeonAuth]);

  // OTP Countdown Timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  /**
   * Dispatches real email OTP via direct dispatcher and Neon Auth's Better Auth provider
   */
  const sendNeonEmailOtp = async (email: string, type: 'sign-in' | 'email-verification') => {
    // 1. Generate real 6-digit verification code
    const genCode = Math.floor(100000 + Math.random() * 900000).toString();
    setLastGeneratedOtp(genCode);

    // 2. Dispatch to server-side OTP sender (logs to terminal & dispatches via Resend if configured)
    try {
      fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: genCode }),
      }).catch((e) => console.warn('[Direct OTP Sender Error]:', e));
    } catch (e) {
      console.warn('[Direct OTP Error]:', e);
    }

    // 3. Dispatch to Neon Auth upstream
    try {
      const res = await fetch('/api/auth/email-otp/send-verification-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type }),
      });
      if (res.ok) {
        console.log(`[Neon Auth] Real email OTP successfully dispatched to ${email}`);
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[Neon Auth] Failed to dispatch email OTP (${res.status}):`, errText);
      }
    } catch (e) {
      console.warn('[Neon Auth] Could not dispatch email OTP:', e);
    }
  };

  /**
   * Hybrid login bridge:
   * 1. Checks if input matches any demo user (e.g. contact@globaledu.bd -> agency,
   *    riya@example.com -> student, admin@ethosai.bd -> admin) and loads that role.
   * 2. Dispatches real email OTP to the user's email address via Neon Auth.
   * 3. Sets countdown and transitions UI to OTP verification step.
   */
  const login = async (emailOrPhone: string, pass?: string): Promise<boolean> => {
    const clean = emailOrPhone.trim().toLowerCase();
    const targetEmail = clean.includes('@') ? clean : `${clean}@example.com`;
    setOtpEmail(targetEmail);

    // Check if input matches any demo user
    const demoMatch = Object.values(DEMO_USERS).find(
      (u) =>
        u.email.toLowerCase() === clean ||
        u.phone.replace(/[\s-]/g, '').includes(clean.replace(/[\s-]/g, '')) ||
        clean === u.role
    );

    if (demoMatch) {
      const targetUser = normalizeUser(demoMatch);
      saveUser(targetUser);

      // Dispatch real email OTP to demo user's email if valid
      if (demoMatch.email.includes('@')) {
        sendNeonEmailOtp(demoMatch.email, 'sign-in');
      }

      setOtpSent(true);
      setOtpCountdown(60);
      return true;
    }

    // Non-demo user: dispatch real email OTP via Neon Auth
    if (clean.includes('@')) {
      sendNeonEmailOtp(clean, 'sign-in');
    }

    // Fallback user state while awaiting OTP verification
    const fallbackUser = normalizeUser({
      id: `usr-${Date.now()}`,
      name: emailOrPhone.split('@')[0],
      email: targetEmail,
      phone: emailOrPhone.includes('+880') ? emailOrPhone : '+8801712345678',
      role: 'student',
      isVerified: false,
    });

    saveUser(fallbackUser);
    setOtpSent(true);
    setOtpCountdown(60);
    return true;
  };

  const register = (data: { name: string; email: string; phone: string; role: UserRole; password?: string }) => {
    const cleanEmail = data.email.trim();
    setOtpEmail(cleanEmail);

    // 1. Optionally trigger Neon Auth registration if password provided
    if (data.password) {
      try {
        fetch('/api/auth/sign-up/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            email: cleanEmail,
            password: data.password,
          }),
        }).catch((err) => console.warn('[Neon Auth sign-up error]:', err));
      } catch {
        // Fallback gracefully
      }
    }

    // 2. Dispatch real email OTP via Neon Auth Better Auth
    sendNeonEmailOtp(cleanEmail, 'email-verification');

    const newUser: Partial<User> = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: cleanEmail,
      phone: data.phone,
      role: data.role,
      isVerified: false,
      linkedParentIds: [],
      linkedStudentIds: [],
      createdAt: new Date().toISOString().split('T')[0],
      ...(data.role === 'student' && {
        studentDetails: {
          targetCountries: ['Canada 🇨🇦'],
          targetField: 'General Studies',
          budgetRange: '৳10L - ৳20L / year',
          ieltsScore: '6.5',
          linkCode: `ETHOS-STU-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      }),
      ...(data.role === 'agency' && {
        agencyDetails: {
          agencyName: data.name,
          licenseNo: `MOE-BD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          licenseStatus: 'pending',
          countriesServed: ['Canada', 'UK'],
        },
      }),
    };
    setPendingRegistration(newUser);
    setOtpSent(true);
    setOtpCountdown(60);
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    if (code.length < 4) return false;

    const targetEmail = pendingRegistration?.email || user?.email || otpEmail;

    // 1. If demo bypass code '123456' OR session generated OTP is entered, accept immediately
    if (code === '123456' || (lastGeneratedOtp && code === lastGeneratedOtp)) {
      if (pendingRegistration) {
        const fullUser = normalizeUser({ ...pendingRegistration, isVerified: true });
        saveUser(fullUser);
        setPendingRegistration(null);
        setOtpSent(false);
        return true;
      } else if (user) {
        saveUser(normalizeUser({ ...user, isVerified: true }));
        setOtpSent(false);
        return true;
      }
    }

    // 2. Attempt real OTP verification with Neon Auth Better Auth
    if (targetEmail) {
      try {
        // Try sign-in OTP endpoint first
        let verifyRes = await fetch('/api/auth/sign-in/email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, otp: code }),
        });

        // If not sign-in, try email-verification endpoint
        if (!verifyRes.ok) {
          verifyRes = await fetch('/api/auth/email-otp/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail, otp: code }),
          });
        }

        if (verifyRes.ok) {
          const authData = await verifyRes.json().catch(() => ({}));
          console.log('[Neon Auth] Email OTP verified successfully:', authData);

          if (pendingRegistration) {
            const fullUser = normalizeUser({ ...pendingRegistration, isVerified: true });
            saveUser(fullUser);
            setPendingRegistration(null);
            setOtpSent(false);
            return true;
          } else if (user) {
            saveUser(normalizeUser({ ...user, isVerified: true }));
            setOtpSent(false);
            return true;
          }
          return true;
        }
      } catch (err) {
        console.warn('[Neon Auth] OTP verification network error:', err);
      }
    }

    // 3. Fallback for demo users
    if (user && Object.values(DEMO_USERS).some((d) => d.email.toLowerCase() === user.email.toLowerCase())) {
      saveUser(normalizeUser({ ...user, isVerified: true }));
      setOtpSent(false);
      return true;
    }

    return false;
  };

  const resendOtp = () => {
    const targetEmail = pendingRegistration?.email || user?.email || otpEmail;
    if (targetEmail) {
      const type = pendingRegistration ? 'email-verification' : 'sign-in';
      sendNeonEmailOtp(targetEmail, type);
    }
    setOtpCountdown(60);
    setOtpSent(true);
  };

  const quickLoginDemo = (role: UserRole) => {
    const demo = DEMO_USERS[role] || DEMO_USERS.student;
    saveUser(normalizeUser(demo));
  };

  const logout = () => {
    try {
      fetch('/api/auth/sign-out', { method: 'POST' }).catch(() => {});
    } catch {
      // Ignore
    }
    saveUser(null);
    setPendingRegistration(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updated: User = normalizeUser({
      ...user,
      ...updates,
      studentDetails: updates.studentDetails
        ? { ...user.studentDetails, ...updates.studentDetails } as StudentDetails
        : user.studentDetails,
      agencyDetails: updates.agencyDetails
        ? { ...user.agencyDetails, ...updates.agencyDetails } as AgencyDetails
        : user.agencyDetails,
    });
    saveUser(updated);
  };

  const linkStudent = (identifier: string): { success: boolean; message: string } => {
    if (!user || user.role !== 'parent') {
      return { success: false, message: 'Only parent accounts can link a student.' };
    }

    const trimmed = identifier.trim().toUpperCase();
    const demoStudent = DEMO_USERS.student;

    if (
      trimmed === demoStudent.studentDetails?.linkCode ||
      trimmed === demoStudent.email.toUpperCase() ||
      trimmed.includes('8821') ||
      trimmed.length >= 4
    ) {
      if (user.linkedStudentIds.includes(demoStudent.id)) {
        return { success: false, message: 'Student is already linked to your guardian account.' };
      }

      const updatedParent: User = normalizeUser({
        ...user,
        linkedStudentIds: [...user.linkedStudentIds, demoStudent.id],
      });
      saveUser(updatedParent);
      return { success: true, message: `Successfully linked student ${demoStudent.name} (${demoStudent.studentDetails?.linkCode})` };
    }

    return { success: false, message: 'No student found with that Link Code or Email. Try code ETHOS-STU-8821.' };
  };

  const unlinkStudent = (studentId: string) => {
    if (!user) return;
    const updated: User = normalizeUser({
      ...user,
      linkedStudentIds: user.linkedStudentIds.filter((id) => id !== studentId),
    });
    saveUser(updated);
  };

  const switchActiveRole = (role: UserRole) => {
    quickLoginDemo(role);
  };

  // Helper arrays for linked objects
  const linkedStudents = user && user.role === 'parent'
    ? user.linkedStudentIds.map(() => normalizeUser(DEMO_USERS.student))
    : [];

  const linkedParents = user && user.role === 'student'
    ? user.linkedParentIds.map(() => normalizeUser(DEMO_USERS.parent))
    : [];

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        pendingRegistration,
        otpSent,
        otpCountdown,
        otpEmail,
        lastGeneratedOtp,
        linkedStudents,
        linkedParents,
        neonAuthStatus,
        login,
        register,
        verifyOtp,
        resendOtp,
        quickLoginDemo,
        logout,
        updateProfile,
        linkStudent,
        unlinkStudent,
        switchActiveRole,
        checkNeonAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);