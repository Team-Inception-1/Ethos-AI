'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth, UserRole } from '@/context/AuthContext';
import { EthosLogoIcon } from '@/components/ui/EthosLogo/EthosLogo';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/directory', label: 'Directory', labelBn: 'ডিরেক্টরি' },
  { href: '/compare', label: 'Compare', labelBn: 'তুলনা' },
  { href: '/ai-tools', label: 'AI Tools', labelBn: 'এআই টুলস' },
  { href: '/agency', label: 'For Agencies', labelBn: 'এজেন্সি' },
];

export default function Navbar() {
  const { user, isAuthenticated, switchActiveRole } = useAuth();
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const dashboardHref = user?.role === 'agency' ? '/agency/dashboard' : '/dashboard';
  const isDashboardActive = pathname === dashboardHref || (pathname?.startsWith('/agency') && user?.role === 'agency') || pathname === '/dashboard';

  return (
    <header className={styles.header}>
      <nav className={`${styles.nav} container`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="Ethos AI Home">
          <EthosLogoIcon size={30} />
          <span className={styles.logoText}>
            Ethos <span className={styles.logoAI}>AI</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className={styles.links} role="list">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={`${styles.link} ${pathname === l.href ? styles.active : ''}`}>
                {lang === 'en' ? l.label : l.labelBn}
              </Link>
            </li>
          ))}
          {isAuthenticated && (
            <li>
              <Link href={dashboardHref} className={`${styles.link} ${isDashboardActive ? styles.active : ''}`}>
                {user?.role === 'parent' ? 'Parent Portal' : user?.role === 'agency' ? 'Agency Portal' : 'Dashboard'}
              </Link>
            </li>
          )}
        </ul>

        {/* Right Controls */}
        <div className={styles.controls}>
          {/* Language Toggle */}
          <button
            id="lang-toggle"
            onClick={() => setLang((l) => (l === 'en' ? 'bn' : 'en'))}
            className={styles.langBtn}
            aria-label="Toggle language"
          >
            <span className={lang === 'en' ? styles.langActive : ''}>EN</span>
            <span className={styles.langDivider}>|</span>
            <span className={lang === 'bn' ? styles.langActive : ''}>বাং</span>
          </button>

          <ThemeToggle />

          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {/* Quick Role Select */}
              <select
                className={styles.roleSelectNav}
                value={user.role}
                onChange={(e) => switchActiveRole(e.target.value as UserRole)}
                title="Quick Role Switcher (Demo)"
              >
                <option value="student">🎓 Student</option>
                <option value="parent">👨‍👧 Parent</option>
                <option value="agency">🏢 Agency</option>
                <option value="admin">🛡️ Admin</option>
              </select>

              {/* User Profile Link */}
              <Link href="/profile" className={styles.userPill} title="View Profile & Guardian Settings">
                <span className={styles.userAvatarPill}>{user.name.charAt(0)}</span>
                <span className={styles.userNamePill}>{user.name.split(' ')[0]}</span>
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.loginBtn}>
                {lang === 'en' ? 'Login' : 'লগইন'}
              </Link>

              <Link href="/register" className={styles.registerBtn}>
                {lang === 'en' ? 'Get Started' : 'শুরু করুন'}
              </Link>
            </>
          )}

          {/* Mobile burger */}
          <button
            className={styles.burger}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {lang === 'en' ? l.label : l.labelBn}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <Link href={dashboardHref} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                {user?.role === 'parent' ? 'Parent Portal' : user?.role === 'agency' ? 'Agency Portal' : 'Dashboard'}
              </Link>
              <Link href="/profile" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                Profile & Guardian Settings ({user?.name})
              </Link>
            </>
          )}
          <div className={styles.mobileCtas}>
            {!isAuthenticated ? (
              <>
                <Link href="/login" className={`${styles.loginBtn} ${styles.w100}`}>
                  Login
                </Link>
                <Link href="/register" className={`${styles.registerBtn} ${styles.w100}`}>
                  Get Started
                </Link>
              </>
            ) : (
              <Link href="/profile" className={`${styles.registerBtn} ${styles.w100}`}>
                My Profile ({user?.role.toUpperCase()})
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
