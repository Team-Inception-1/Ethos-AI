'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

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
    createdAt: '2024-10-01',
  },
};

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  pendingRegistration: Partial<User> | null;
  otpSent: boolean;
  otpCountdown: number;
  linkedStudents: User[];
  linkedParents: User[];
  login: (emailOrPhone: string, pass?: string) => Promise<boolean>;
  register: (data: { name: string; email: string; phone: string; role: UserRole }) => void;
  verifyOtp: (code: string) => boolean;
  resendOtp: () => void;
  quickLoginDemo: (role: UserRole) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  linkStudent: (identifier: string) => { success: boolean; message: string };
  unlinkStudent: (studentId: string) => void;
  switchActiveRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  pendingRegistration: null,
  otpSent: false,
  otpCountdown: 0,
  linkedStudents: [],
  linkedParents: [],
  login: async () => false,
  register: () => {},
  verifyOtp: () => false,
  resendOtp: () => {},
  quickLoginDemo: () => {},
  logout: () => {},
  updateProfile: () => {},
  linkStudent: () => ({ success: false, message: '' }),
  unlinkStudent: () => {},
  switchActiveRole: () => {},
});

const STORAGE_KEY = 'ethos_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<Partial<User> | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Load user session on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default to demo student profile on first load so user is immediately logged in
        setUser(DEMO_USERS.student);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USERS.student));
      }
    } catch {
      setUser(DEMO_USERS.student);
    }
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const saveUser = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (emailOrPhone: string): Promise<boolean> => {
    // Check if input matches any demo user email/phone
    const found = Object.values(DEMO_USERS).find(
      (u) => u.email.toLowerCase() === emailOrPhone.toLowerCase() || u.phone.includes(emailOrPhone)
    );
    const target = found || DEMO_USERS.student;
    saveUser(target);
    return true;
  };

  const register = (data: { name: string; email: string; phone: string; role: UserRole }) => {
    const newUser: Partial<User> = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email,
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

  const verifyOtp = (code: string): boolean => {
    if (code.length < 4) return false;
    if (pendingRegistration) {
      const fullUser: User = {
        ...(pendingRegistration as User),
        isVerified: true,
      };
      saveUser(fullUser);
      setPendingRegistration(null);
      setOtpSent(false);
      return true;
    } else if (user) {
      saveUser({ ...user, isVerified: true });
      return true;
    }
    return false;
  };

  const resendOtp = () => {
    setOtpCountdown(60);
    setOtpSent(true);
  };

  const quickLoginDemo = (role: UserRole) => {
    saveUser(DEMO_USERS[role]);
  };

  const logout = () => {
    saveUser(null);
    setPendingRegistration(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updated: User = {
      ...user,
      ...updates,
      studentDetails: updates.studentDetails
        ? { ...user.studentDetails, ...updates.studentDetails } as StudentDetails
        : user.studentDetails,
      agencyDetails: updates.agencyDetails
        ? { ...user.agencyDetails, ...updates.agencyDetails } as AgencyDetails
        : user.agencyDetails,
    };
    saveUser(updated);
  };

  const linkStudent = (identifier: string): { success: boolean; message: string } => {
    if (!user || user.role !== 'parent') {
      return { success: false, message: 'Only parent accounts can link a student.' };
    }

    const trimmed = identifier.trim().toUpperCase();
    const demoStudent = DEMO_USERS.student;
    
    // Check match against link code, email, or phone
    if (
      trimmed === demoStudent.studentDetails?.linkCode ||
      trimmed === demoStudent.email.toUpperCase() ||
      trimmed.includes('8821') ||
      trimmed.length >= 4
    ) {
      if (user.linkedStudentIds.includes(demoStudent.id)) {
        return { success: false, message: 'Student is already linked to your guardian account.' };
      }

      const updatedParent: User = {
        ...user,
        linkedStudentIds: [...user.linkedStudentIds, demoStudent.id],
      };
      saveUser(updatedParent);
      return { success: true, message: `Successfully linked student ${demoStudent.name} (${demoStudent.studentDetails?.linkCode})` };
    }

    return { success: false, message: 'No student found with that Link Code or Email. Try code ETHOS-STU-8821.' };
  };

  const unlinkStudent = (studentId: string) => {
    if (!user) return;
    const updated: User = {
      ...user,
      linkedStudentIds: user.linkedStudentIds.filter((id) => id !== studentId),
    };
    saveUser(updated);
  };

  const switchActiveRole = (role: UserRole) => {
    quickLoginDemo(role);
  };

  // Helper arrays for linked objects
  const linkedStudents = user && user.role === 'parent'
    ? user.linkedStudentIds.map(() => DEMO_USERS.student)
    : [];

  const linkedParents = user && user.role === 'student'
    ? user.linkedParentIds.map(() => DEMO_USERS.parent)
    : [];

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        pendingRegistration,
        otpSent,
        otpCountdown,
        linkedStudents,
        linkedParents,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
