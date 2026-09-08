'use client';
import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { user } = useAuth();
  const userName = user?.name || 'Student User';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

  return (
    <header className={styles.topbar} role="banner">
      <div className={styles.left}>
        <h1 className={styles.pageTitle} id="page-heading">Dashboard</h1>
      </div>
      <div className={styles.right}>
        {/* Search */}
        <div className={styles.searchWrap} role="search">
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search…"
            aria-label="Search dashboard"
            id="dashboard-search"
          />
        </div>

        {/* Notifications */}
        <button className={styles.iconBtn} aria-label="Notifications (3 unread)" id="notifications-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className={styles.notifBadge} aria-label="3 unread notifications">3</span>
        </button>

        <ThemeToggle />

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <Link
            href="/profile"
            className={styles.avatar}
            aria-label={`User menu for ${userName}`}
            title={userName}
            id="user-menu-btn"
          >
            {initial}
          </Link>
          <div className={styles.avatarDot} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
