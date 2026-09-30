'use client';
import React, { useState } from 'react';
import { useLanguage } from '@/lib/browser-preferences';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { EthosLogoIcon } from '@/components/ui/EthosLogo/EthosLogo';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/directory', label: 'Directory', labelBn: 'ডিরেক্টরি' },
  { href: '/compare', label: 'Compare', labelBn: 'তুলনা' },
  { href: '/community', label: 'Student Network', labelBn: 'ছাত্র নেটওয়ার্ক' },
  { href: '/agency', label: 'For Agencies', labelBn: 'এজেন্সি' },
];

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [lang, setLang] = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const dashboardHref =
    user?.role === 'agency' ? '/agency/dashboard' :
    user?.role === 'admin' ? '/admin' :
    '/dashboard';
  const isDashboardActive =
    pathname === dashboardHref ||
    (pathname?.startsWith('/agency') && user?.role === 'agency') ||
    (pathname?.startsWith('/admin') && user?.role === 'admin') ||
    pathname === '/dashboard';

  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);



  const toggleLanguage = () => {
    const next = lang === 'en' ? 'bn' : 'en';
    setLang(next);
  };


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
            onClick={toggleLanguage}
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
              {/* User Profile Link */}
              <Link href="/dashboard/profile" className={styles.userPill} title="View Profile & Settings">
                <span className={styles.userAvatarPill}>
                  {user.avatarUrl && user.avatarUrl !== failedAvatar ? (
                    <Image unoptimized width={40} height={40}
                      src={user.avatarUrl}
                      alt={user.name}
                      onError={() => setFailedAvatar(user.avatarUrl ?? null)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                    />
                  ) : (
                    (user.name?.charAt(0) || 'U').toUpperCase()
                  )}
                </span>
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
