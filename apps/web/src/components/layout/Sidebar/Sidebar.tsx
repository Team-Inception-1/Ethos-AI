'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useBrowserSearch } from '@/lib/browser-preferences';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EthosLogoIcon } from '@/components/ui/EthosLogo/EthosLogo';
import styles from './Sidebar.module.css';

interface NavItem {
  href: string;
  label: string;
  labelBn: string;
  icon: React.ReactNode;
  badge?: string;
  section?: string; // optional group label before this item
  sectionBn?: string;
}

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ApplicationsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const DocumentsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const PaymentsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);


const CounselorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const ScholarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const LivingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const VerificationQueueIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const DisputesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const FraudCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M12 8v4"/>
    <path d="M12 16h.01"/>
  </svg>
);

const AgreementIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="M7 21h10"/>
    <path d="M12 3v18"/>
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
  </svg>
);

const CommunityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const BenchmarkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const DirectoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
    <path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M12 10h.01" />
    <path d="M8 14h.01" /><path d="M16 14h.01" /><path d="M12 14h.01" />
  </svg>
);

const getNavItems = (role?: string): NavItem[] => {
  const normRole = (role || '').toLowerCase();
  switch (normRole) {
    case 'agency':
      return [
        {
          href: '/agency/dashboard',
          label: 'Dashboard',
          labelBn: 'ড্যাশবোর্ড',
          icon: <DashboardIcon />,
        },
        {
          href: '/agency/dashboard?tab=applications',
          label: 'Student Queue',
          labelBn: 'আবেদন সারি',
          icon: <ApplicationsIcon />,
        },
        {
          href: '/agency/dashboard?tab=services',
          label: 'Service Packages',
          labelBn: 'প্যাকেজ ও ফি',
          icon: <PaymentsIcon />,
        },
        {
          href: '/agency/dashboard?tab=benchmarks',
          label: 'Cost Benchmarks',
          labelBn: 'কস্ট বেঞ্চমার্ক',
          icon: <BenchmarkIcon />,
          badge: 'Data',
        },
        {
          href: '/agency/dashboard?tab=license',
          label: 'License & Compliance',
          labelBn: 'লাইসেন্স ও প্রমাণ',
          icon: <VerificationQueueIcon />,
        },
        {
          href: '/agency/chat',
          label: 'Applicant Inbox',
          labelBn: 'আবেদনকারী চ্যাট',
          icon: <ChatIcon />,
        },
        {
          href: '/agency/profile',
          label: 'Agency Profile',
          labelBn: 'প্রোফাইল',
          icon: <ProfileIcon />,
        },
      ];

    case 'admin':
      return [
        {
          href: '/admin?tab=agencies',
          label: 'Agency Audits',
          labelBn: 'এজেন্সি অডিট',
          icon: <VerificationQueueIcon />,
        },
        {
          href: '/admin?tab=releases',
          label: 'Escrow Releases',
          labelBn: 'এসক্রো রিলিজ',
          icon: <PaymentsIcon />,
          badge: 'Verify',
        },
        {
          href: '/directory',
          label: 'Agency Directory',
          labelBn: 'এজেন্সি ডিরেক্টরি',
          icon: <DirectoryIcon />,
        },
        {
          href: '/admin?tab=provenance',
          label: 'Data Provenance',
          labelBn: 'ডাটা যাচাই',
          icon: <BenchmarkIcon />,
          badge: 'Data',
        },
        {
          href: '/admin?tab=disputes',
          label: 'Escrow Disputes',
          labelBn: 'এসক্রো বিরোধ',
          icon: <DisputesIcon />,
        },
        {
          href: '/admin?tab=scams',
          label: 'AI Fraud Flags',
          labelBn: 'জালিয়াতি সতর্কতা',
          icon: <FraudCheckIcon />,
        },
        {
          href: '/admin?tab=users',
          label: 'User Directory',
          labelBn: 'ব্যবহারকারী তালিকা',
          icon: <CommunityIcon />,
        },
        {
          href: '/admin?tab=ledger',
          label: 'Audit Ledger',
          labelBn: 'অডিট লেজার',
          icon: <AgreementIcon />,
        },
        {
          href: '/admin/chat',
          label: 'Dispute Transcripts',
          labelBn: 'চ্যাট অডিট',
          icon: <ChatIcon />,
        },
        {
          href: '/admin/profile',
          label: 'Admin Profile',
          labelBn: 'অ্যাডমিন প্রোফাইল',
          icon: <ProfileIcon />,
        },
      ];

    case 'parent':
      return [
        {
          href: '/dashboard',
          label: 'Dashboard',
          labelBn: 'ড্যাশবোর্ড',
          icon: <DashboardIcon />,
        },
        {
          href: '/dashboard/agency-directory',
          label: 'Agency Directory',
          labelBn: 'এজেন্সি ডিরেক্টরি',
          icon: <DirectoryIcon />,
        },
        {
          href: '/dashboard/applications',
          label: 'Applications',
          labelBn: 'আবেদন',
          icon: <ApplicationsIcon />,
        },
        {
          href: '/dashboard/documents',
          label: 'Documents',
          labelBn: 'ডকুমেন্ট',
          icon: <DocumentsIcon />,
        },
        {
          href: '/dashboard/payments',
          label: 'Payments',
          labelBn: 'পেমেন্ট',
          icon: <PaymentsIcon />,
        },
        {
          href: '/dashboard/counselor',
          label: 'AI Counselor',
          labelBn: 'এআই কাউন্সেলর',
          icon: <CounselorIcon />,
          badge: 'AI',
          section: 'AI Tools',
          sectionBn: 'এআই টুলস',
        },
        {
          href: '/dashboard/fraud-checker',
          label: 'AI Fraud Checker',
          labelBn: 'এআই ফ্রড চেকার',
          icon: <FraudCheckIcon />,
          badge: 'AI',
        },
        {
          href: '/dashboard/agreement-analyzer',
          label: 'Agreement Analyzer',
          labelBn: 'চুক্তি বিশ্লেষক',
          icon: <AgreementIcon />,
          badge: 'AI',
        },
        {
          href: '/dashboard/community',
          label: 'Student Network',
          labelBn: 'ছাত্র নেটওয়ার্ক',
          icon: <CommunityIcon />,
          badge: 'Hubs',
        },
        {
          href: '/dashboard/chat',
          label: 'Chat',
          labelBn: 'চ্যাট',
          icon: <ChatIcon />,
        },
        {
          href: '/dashboard/profile',
          label: 'Guardian Profile',
          labelBn: 'প্রোফাইল',
          icon: <ProfileIcon />,
        },
      ];

    case 'student':
    default:
      return [
        {
          href: '/dashboard',
          label: 'Dashboard',
          labelBn: 'ড্যাশবোর্ড',
          icon: <DashboardIcon />,
        },
        {
          href: '/dashboard/agency-directory',
          label: 'Agency Directory',
          labelBn: 'এজেন্সি ডিরেক্টরি',
          icon: <DirectoryIcon />,
        },
        {
          href: '/dashboard/applications',
          label: 'My Applications',
          labelBn: 'আমার আবেদন',
          icon: <ApplicationsIcon />,
        },
        {
          href: '/dashboard/documents',
          label: 'Documents',
          labelBn: 'ডকুমেন্ট',
          icon: <DocumentsIcon />,
        },
        {
          href: '/dashboard/payments',
          label: 'Payments',
          labelBn: 'পেমেন্ট',
          icon: <PaymentsIcon />,
        },
        {
          href: '/dashboard/counselor',
          label: 'AI Counselor',
          labelBn: 'এআই কাউন্সেলর',
          icon: <CounselorIcon />,
          badge: 'AI',
          section: 'AI Tools',
          sectionBn: 'এআই টুলস',
        },
        {
          href: '/dashboard/scholar-finder',
          label: 'Scholar Finder',
          labelBn: 'স্কলার ফাইন্ডার',
          icon: <ScholarIcon />,
          badge: 'AI',
        },
        {
          href: '/dashboard/fraud-checker',
          label: 'AI Fraud Checker',
          labelBn: 'এআই ফ্রড চেকার',
          icon: <FraudCheckIcon />,
          badge: 'AI',
        },
        {
          href: '/dashboard/agreement-analyzer',
          label: 'Agreement Analyzer',
          labelBn: 'চুক্তি বিশ্লেষক',
          icon: <AgreementIcon />,
          badge: 'AI',
        },
        {
          href: '/dashboard/campus-living',
          label: 'Living Costs',
          labelBn: 'আবাসন ও খরচ',
          icon: <LivingIcon />,
        },
        {
          href: '/dashboard/community',
          label: 'Student Network',
          labelBn: 'ছাত্র নেটওয়ার্ক',
          icon: <CommunityIcon />,
          badge: 'Hubs',
        },
        {
          href: '/dashboard/chat',
          label: 'Chat',
          labelBn: 'চ্যাট',
          icon: <ChatIcon />,
        },
        {
          href: '/dashboard/profile',
          label: 'Student Profile',
          labelBn: 'প্রোফাইল',
          icon: <ProfileIcon />,
        },
      ];
  }
};

interface SidebarProps {
  lang?: 'en' | 'bn';
}

export default function Sidebar({ lang = 'en' }: SidebarProps) {
  const collapsed = false;
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const currentSearch = useBrowserSearch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push('/login');
    }
  };


  // If URL path is /agency/* or /admin/*, enforce appropriate role navigation immediately
  const effectiveRole = pathname?.startsWith('/admin')
    ? 'admin'
    : pathname?.startsWith('/agency')
    ? 'agency'
    : user?.role?.toLowerCase() || 'student';
  const navItems = getNavItems(effectiveRole);

  let userName = user?.name;
  if (!userName) {
    userName = 'Your account';
  } else if (userName.includes('@')) {
    const local = userName.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim();
    userName = local ? local.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : userName;
  }
  const userRoleDisplay = effectiveRole.toUpperCase();
  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <Link href="/" className={styles.logo} title="Ethos AI — Return to Welcome Page">
        <EthosLogoIcon size={26} />
        {!collapsed && (
          <span className={styles.logoText}>
            Ethos <span className={styles.logoAI}>AI</span>
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className={styles.nav} aria-label="Dashboard navigation">
        <ul role="list">
          {navItems.map((item) => {
            let isActive = false;
            const hrefBase = item.href.split('?')[0];
            const hrefQuery = item.href.includes('?') ? item.href.split('?')[1] : '';
            const pathnameMatches = pathname === hrefBase || (
              hrefBase !== '/dashboard' &&
              hrefBase !== '/agency/dashboard' &&
              hrefBase !== '/admin' &&
              pathname?.startsWith(hrefBase) &&
              !item.href.includes('?')
            );

            if (hrefQuery) {
              isActive = pathname === hrefBase && (currentSearch ? currentSearch.includes(hrefQuery) : hrefQuery === 'tab=agencies');
            } else if (item.href === '/agency/dashboard' && effectiveRole === 'agency') {
              // Dashboard root: only active when no tab query present
              isActive = pathname === '/agency/dashboard' && !currentSearch.includes('tab=');
            } else {
              isActive = pathnameMatches;
            }

            return (
              <li key={`${item.href}-${item.label}`}>
                {item.section && !collapsed && (
                  <div className={styles.navSection}>
                    <span>{lang === 'en' ? item.section : (item.sectionBn || item.section)}</span>
                  </div>
                )}
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={collapsed ? (lang === 'en' ? item.label : item.labelBn) : undefined}
                  onClick={() => {
                    if (item.href.includes('?tab=')) {
                      const tab = item.href.split('?tab=')[1]?.toLowerCase();
                      if (tab) {
                        window.dispatchEvent(new CustomEvent('admin-switch-tab', { detail: tab }));
                      }
                      setTimeout(() => window.dispatchEvent(new Event('popstate')), 50);
                    }
                  }}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!collapsed && (
                    <span className={styles.navLabel}>{lang === 'en' ? item.label : item.labelBn}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className={`${styles.navBadge} ${item.badge === 'AI' ? styles.aiBadge : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>


      {/* Footer / Profile & Logout */}
      <div className={styles.footerSection}>
        {!collapsed && (
          <div className={styles.profile} suppressHydrationWarning>
            <div className={styles.avatar} aria-hidden="true" suppressHydrationWarning>
              {user?.avatarUrl && user.avatarUrl !== failedAvatar ? (
                <Image unoptimized width={40} height={40}
                  src={user.avatarUrl}
                  alt={userName}
                  onError={() => setFailedAvatar(user.avatarUrl || null)}
                  className={styles.avatarImg}
                />
              ) : (
                initial
              )}
            </div>
            <div className={styles.profileInfo} suppressHydrationWarning>
              <div className={styles.profileName} suppressHydrationWarning>{userName}</div>
              <div className={styles.profileRole} suppressHydrationWarning>{userRoleDisplay}</div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={collapsed ? styles.logoutBtnCollapsed : styles.logoutBtn}
          title={lang === 'en' ? 'Log Out' : 'লগআউট'}
          aria-label={lang === 'en' ? 'Log Out' : 'লগআউট'}
        >
          <span className={styles.logoutIcon}>
            <LogoutIcon />
          </span>
          {!collapsed && (
            <span className={styles.logoutLabel}>
              {loggingOut
                ? (lang === 'en' ? 'Logging out…' : 'লগআউট হচ্ছে…')
                : (lang === 'en' ? 'Log Out' : 'লগআউট')}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
