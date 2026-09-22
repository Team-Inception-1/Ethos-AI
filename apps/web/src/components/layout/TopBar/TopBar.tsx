'use client';
import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import styles from './TopBar.module.css';

const INITIAL_NOTIFICATIONS = [
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
    title: 'New Message from Dream Abroad',
    desc: 'German blocked account documentation has been reviewed.',
    time: '2h ago',
    link: '/dashboard/applications/app-002',
    read: false,
  },
];

export default function TopBar() {
  const { user } = useAuth();
  const userName = user?.name || 'Student User';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

  const [notifs, setNotifs] = React.useState(INITIAL_NOTIFICATIONS);
  const [openNotifs, setOpenNotifs] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

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
            href="/profile"
            className={styles.avatar}
            aria-label={`User menu for ${userName}`}
            title={userName}
            id="user-menu-btn"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={userName}
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
