'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    labelBn: 'ড্যাশবোর্ড',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/applications',
    label: 'My Applications',
    labelBn: 'আমার আবেদন',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/documents',
    label: 'Documents',
    labelBn: 'ডকুমেন্ট',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/payments',
    label: 'Payments',
    labelBn: 'পেমেন্ট',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/ai-tools',
    label: 'AI Tools',
    labelBn: 'AI টুলস',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    badge: 'AI',
  },
  {
    href: '/dashboard/chat',
    label: 'Chat',
    labelBn: 'চ্যাট',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    badge: '3',
  },
];

import { EthosLogoIcon } from '@/components/ui/EthosLogo/EthosLogo';

interface SidebarProps {
  lang?: 'en' | 'bn';
}

export default function Sidebar({ lang = 'en' }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <EthosLogoIcon size={26} />
        {!collapsed && (
          <span className={styles.logoText}>
            Ethos <span className={styles.logoAI}>AI</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className={styles.nav} aria-label="Dashboard navigation">
        <ul role="list">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={collapsed ? (lang === 'en' ? item.label : item.labelBn) : undefined}
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

      {/* Collapse Toggle */}
      <button
        className={styles.collapseBtn}
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}
        >
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* Profile snippet */}
      {!collapsed && (
        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden="true">S</div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>Student User</div>
            <div className={styles.profileRole}>{lang === 'en' ? 'Student' : 'শিক্ষার্থী'}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
