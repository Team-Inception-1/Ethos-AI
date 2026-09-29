'use client';
import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import styles from './TopBar.module.css';

import { usePathname } from 'next/navigation';

const STUDENT_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Offer Letter Verified',
    desc: 'AI Scanner verified University of Toronto letter with 0 fraud flags.',
    time: '12m ago',
    link: '/dashboard/documents',
    read: false,
  },
  {
    id: 'n2',
    title: 'Escrow Milestone Held',
    desc: '৳25,000 held safely in escrow for Offer Processing.',
    time: '1h ago',
    link: '/dashboard/payments',
    read: false,
  },
  {
    id: 'n3',
    title: 'German Blocked Amount Updated',
    desc: 'Official benchmark €11,904 verified by licensed agencies & Auswärtiges Amt.',
    time: '2h ago',
    link: '/dashboard/campus-living',
    read: false,
  },
];

const AGENCY_NOTIFICATIONS = [
  {
    id: 'ag-1',
    title: 'New Student Inquiry',
    desc: 'Sara Islam inquired regarding German blocked account & TU Berlin admissions.',
    time: '8m ago',
    link: '/agency/chat',
    read: false,
  },
  {
    id: 'ag-2',
    title: 'Cost Benchmark Verified',
    desc: 'Admin approved your Germany Blocked Account benchmark (€11,904/yr).',
    time: '45m ago',
    link: '/agency/dashboard',
    read: false,
  },
  {
    id: 'ag-3',
    title: 'Escrow Milestone Released',
    desc: '৳18,000 released for Riya Ahmed (Milestone 1: Offer Letter Received).',
    time: '2h ago',
    link: '/agency/dashboard',
    read: false,
  },
];

const ADMIN_NOTIFICATIONS = [
  {
    id: 'adm-1',
    title: 'Dispute Docket Review',
    desc: 'Escrow dispute #DSP-8821 filed for Global Edu BD milestone release.',
    time: '14m ago',
    link: '/admin#disputes',
    read: false,
  },
  {
    id: 'adm-2',
    title: 'New Agency Audit Dossier',
    desc: 'Crescent Pathway Consultancy submitted license documentation.',
    time: '50m ago',
    link: '/admin#agencies',
    read: false,
  },
  {
    id: 'adm-3',
    title: 'Cost Benchmark Verification',
    desc: 'Germany Auswärtiges Amt €11,904 benchmark approved for student view.',
    time: '2h ago',
    link: '/admin#provenance',
    read: false,
  },
];

export default function TopBar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const effectiveRole =
    pathname?.startsWith('/agency') ? 'agency' :
    pathname?.startsWith('/admin') ? 'admin' :
    (user?.role || 'student');

  let userName = user?.name;
  if (!userName) {
    userName = effectiveRole === 'agency'
      ? 'Global Edu BD'
      : effectiveRole === 'admin'
      ? 'Platform Administrator'
      : effectiveRole === 'parent'
      ? 'Parent User'
      : 'Student User';
  } else if (userName.includes('@')) {
    const local = userName.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim();
    userName = local ? local.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : userName;
  }
  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

  const initialNotifs =
    effectiveRole === 'agency' ? AGENCY_NOTIFICATIONS :
    effectiveRole === 'admin' ? ADMIN_NOTIFICATIONS :
    STUDENT_NOTIFICATIONS;

  const [notifs, setNotifs] = React.useState(initialNotifs);
  const [openNotifs, setOpenNotifs] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setImgError(false);
  }, [user?.avatarUrl]);

  React.useEffect(() => {
    setNotifs(
      effectiveRole === 'agency' ? AGENCY_NOTIFICATIONS :
      effectiveRole === 'admin' ? ADMIN_NOTIFICATIONS :
      STUDENT_NOTIFICATIONS
    );
  }, [effectiveRole]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setOpenNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleItemClick = (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setOpenNotifs(false);
  };

  const pageTitle =
    pathname?.startsWith('/admin') ? 'Platform Governance' :
    pathname?.startsWith('/agency') ? 'Agency Operations' :
    pathname?.includes('/counselor') ? 'AI Counselor' :
    pathname?.includes('/scholar-finder') ? 'Scholar Finder' :
    pathname?.includes('/campus-living') ? 'Living Cost Estimator' :
    pathname?.includes('/applications') ? 'My Applications' :
    pathname?.includes('/documents') ? 'Document Storage Vault' :
    pathname?.includes('/payments') ? 'Payments & Escrow' :
    pathname?.includes('/chat') ? (effectiveRole === 'agency' ? 'Applicant Messages' : effectiveRole === 'admin' ? 'Supervisory Dispute Audit' : 'Agency Consultation') :
    pathname?.includes('/profile') ? 'Account Settings' :
    'Student Dashboard';

  return (
    <header className={styles.topbar} role="banner">
      <div className={styles.left}>
        <h1 className={styles.pageTitle} id="page-heading">{pageTitle}</h1>
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
        <div className={styles.notifWrap} ref={notifRef}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Notifications (${unreadCount} unread)`}
            id="notifications-btn"
            onClick={() => setOpenNotifs((prev) => !prev)}
            aria-expanded={openNotifs}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className={styles.notifBadge} aria-label={`${unreadCount} unread notifications`}>
                {unreadCount}
              </span>
            )}
          </button>

          {openNotifs && (
            <div className={styles.notifDropdown} role="region" aria-label="Notifications Panel">
              <div className={styles.notifHeader}>
                <span className={styles.notifHeaderTitle}>
                  🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
                </span>
                {unreadCount > 0 && (
                  <button type="button" className={styles.markAllBtn} onClick={handleMarkAllRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              <ul className={styles.notifList} role="list">
                {notifs.length === 0 ? (
                  <li className={styles.notifEmpty}>No notifications at this time</li>
                ) : (
                  notifs.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.link}
                        className={`${styles.notifItem} ${!n.read ? styles.notifItemUnread : ''}`}
                        onClick={() => handleItemClick(n.id)}
                      >
                        <div className={styles.notifItemHeader}>
                          <span className={styles.notifItemTitle}>{n.title}</span>
                          {!n.read && <span className={styles.unreadDot} aria-hidden="true" />}
                        </div>
                        <p className={styles.notifItemDesc}>{n.desc}</p>
                        <span className={styles.notifItemTime}>{n.time}</span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <ThemeToggle />

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <Link
            href={
              effectiveRole === 'agency'
                ? '/agency/profile'
                : effectiveRole === 'admin'
                ? '/admin/profile'
                : '/dashboard/profile'
            }
            className={styles.avatar}
            aria-label={`User menu for ${userName}`}
            title={userName}
            id="user-menu-btn"
          >
            {user?.avatarUrl && !imgError ? (
              <img
                src={user.avatarUrl}
                alt={userName}
                onError={() => setImgError(true)}
                className={styles.avatarImg}
              />
            ) : (
              initial
            )}
          </Link>
          <div className={styles.avatarDot} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
