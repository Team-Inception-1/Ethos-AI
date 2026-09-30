'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  CommunityService,
  CountryHub,
  SeniorMentor,
  CommunityPostItem,
  CommunityCommentItem,
  DirectMessageThread,
} from '@/lib/communityClient';
import styles from './CommunityPage.module.css';

const CATEGORIES = [
  'All',
  'Help',
  'Visa',
  'University',
  'Accommodation',
  'Travel',
  'Jobs',
  'Scholarship',
];

function HubFlagIcon({ code, size = 'sm' }: { code?: string; size?: 'sm' | 'lg' }) {
  const isLg = size === 'lg';
  const width = isLg ? 36 : 22;
  const height = isLg ? 24 : 15;
  const radius = isLg ? '5px' : '3px';
  const style: React.CSSProperties = {
    borderRadius: radius,
    flexShrink: 0,
    boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
    display: 'inline-block',
    verticalAlign: 'middle',
    overflow: 'hidden',
  };

  switch (code?.toUpperCase()) {
    case 'DE':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" style={style}>
          <path fill="#000" d="M0 0h640v160H0z"/>
          <path fill="#D00" d="M0 160h640v160H0z"/>
          <path fill="#FFCE00" d="M0 320h640v160H0z"/>
        </svg>
      );
    case 'CA':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" style={style}>
          <path fill="#D80027" d="M0 0h640v480H0z"/>
          <path fill="#fff" d="M160 0h320v480H160z"/>
          <path fill="#D80027" d="M320 100l20 50 50-15-20 50 45 25-50 15 15 50-45-25-10 50-10-50-45 25 15-50-50-15 45-25-20-50 50 15z"/>
        </svg>
      );
    case 'GB':
    case 'UK':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" style={style}>
          <clipPath id={`uk-flag-${size}`}><path d="M0 0v480h640V0z"/></clipPath>
          <g clipPath={`url(#uk-flag-${size})`}>
            <path fill="#012169" d="M0 0v480h640V0z"/>
            <path stroke="#fff" strokeWidth="60" d="M0 0l640 480M640 0L0 480"/>
            <path stroke="#c8102e" strokeWidth="40" d="M0 0l640 480M640 0L0 480"/>
            <path stroke="#fff" strokeWidth="100" d="M320 0v480M0 240h640"/>
            <path stroke="#c8102e" strokeWidth="60" d="M320 0v480M0 240h640"/>
          </g>
        </svg>
      );
    case 'US':
    case 'USA':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" style={style}>
          <path fill="#bd3d44" d="M0 0h640v480H0z"/>
          <path stroke="#fff" strokeWidth="37" d="M0 55.5h640m-640 74h640m-640 74h640m-640 74h640m-640 74h640m-640 74h640"/>
          <path fill="#192f5d" d="M0 0h260v260H0z"/>
          <circle cx="45" cy="45" r="10" fill="#fff"/>
          <circle cx="105" cy="45" r="10" fill="#fff"/>
          <circle cx="165" cy="45" r="10" fill="#fff"/>
          <circle cx="215" cy="45" r="10" fill="#fff"/>
          <circle cx="75" cy="95" r="10" fill="#fff"/>
          <circle cx="135" cy="95" r="10" fill="#fff"/>
          <circle cx="195" cy="95" r="10" fill="#fff"/>
          <circle cx="45" cy="145" r="10" fill="#fff"/>
          <circle cx="105" cy="145" r="10" fill="#fff"/>
          <circle cx="165" cy="145" r="10" fill="#fff"/>
          <circle cx="215" cy="145" r="10" fill="#fff"/>
          <circle cx="75" cy="195" r="10" fill="#fff"/>
          <circle cx="135" cy="195" r="10" fill="#fff"/>
          <circle cx="195" cy="195" r="10" fill="#fff"/>
        </svg>
      );
    case 'AU':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" style={style}>
          <path fill="#00008b" d="M0 0h640v480H0z"/>
          <path fill="#fff" d="M0 0h320v240H0z"/>
          <path fill="#012169" d="M0 0h320v240H0z"/>
          <path stroke="#fff" strokeWidth="30" d="M0 0l320 240M320 0L0 240"/>
          <path stroke="#c8102e" strokeWidth="20" d="M0 0l320 240M320 0L0 240"/>
          <path stroke="#fff" strokeWidth="50" d="M160 0v240M0 120h320"/>
          <path stroke="#c8102e" strokeWidth="30" d="M160 0v240M0 120h320"/>
          <polygon fill="#fff" points="160,300 170,330 200,330 175,350 185,380 160,360 135,380 145,350 120,330 150,330"/>
          <circle cx="480" cy="120" r="16" fill="#fff"/>
          <circle cx="530" cy="200" r="16" fill="#fff"/>
          <circle cx="480" cy="340" r="16" fill="#fff"/>
          <circle cx="430" cy="220" r="16" fill="#fff"/>
          <circle cx="500" cy="260" r="10" fill="#fff"/>
        </svg>
      );
    case 'SE':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" style={style}>
          <path fill="#006aa7" d="M0 0h640v480H0z"/>
          <path fill="#fecc00" d="M190 0h70v480h-70zM0 205h640v70H0z"/>
        </svg>
      );
    default:
      return <span style={{ fontSize: isLg ? '28px' : '16px' }}>🌍</span>;
  }
}

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const currentUserId = user?.id || '';
  const currentUserName = user?.name || 'Not signed in';
  const currentUserAvatar = user?.avatarUrl || '';

  // ── State ──
  const [hubs, setHubs] = useState<CountryHub[]>([]);
  const [activeHubId, setActiveHubId] = useState<string>('hub-germany');
  const [joinedHubIds, setJoinedHubIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [seniorOnlyFilter, setSeniorOnlyFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [nextPostCursor, setNextPostCursor] = useState<string | null>(null);
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [seniors, setSeniors] = useState<SeniorMentor[]>([]);

  // Modals & Panels
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, CommunityCommentItem[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentAnonymous, setCommentAnonymous] = useState<Record<string, boolean>>({});

  // 1-to-1 Messaging Drawer
  const [dmTarget, setDmTarget] = useState<{
    id: string;
    name: string;
    avatar?: string;
    university?: string;
    status?: string;
    isVerified?: boolean;
  } | null>(null);
  const [activeDmThread, setActiveDmThread] = useState<DirectMessageThread | null>(null);
  const [dmInput, setDmInput] = useState<string>('');

  // Report & Block
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment';
    id: string;
    title?: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState<string>('Spam or Advertising');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  // Toast
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // New Post Form
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Help');
  const [newPostIsAnonymous, setNewPostIsAnonymous] = useState(false);
  const [newPostIsSeniorAsk, setNewPostIsSeniorAsk] = useState(false);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // No bundled identities or localStorage memberships are trusted.
  useEffect(() => {
    if (!currentUserId) return;
    let active = true;
    Promise.all([CommunityService.getHubs(), CommunityService.getJoinedHubIds(currentUserId)]).then(([loadedHubs, joined]) => {
      if (active) { setHubs(loadedHubs); setJoinedHubIds(joined); }
    }).catch(() => { if (active) setLoadError('Community could not be loaded. Please retry.'); });
    return () => { active = false; };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    let active = true;
    CommunityService.getPostsPage({ hubId: activeHubId, category: selectedCategory, seniorOnly: seniorOnlyFilter, query: searchQuery }).then(page => {
      if (active) { setPosts(page.items); setNextPostCursor(page.nextCursor); setLoadError(''); }
    }).catch(error => {
      if (active) { setPosts([]); setNextPostCursor(null); setLoadError(error instanceof Error ? error.message : 'Feed could not be loaded.'); }
    });
    CommunityService.getSeniorsByCountry(activeHubId).then(items => { if (active) setSeniors(items); })
      .catch(() => { if (active) setLoadError('Mentors could not be loaded. Please retry.'); });
    return () => { active = false; };
  }, [activeHubId, selectedCategory, seniorOnlyFilter, searchQuery, currentUserId, blockedUsers, joinedHubIds]);

  // Active Hub Object
  const currentHub = useMemo(() => {
    return hubs.find((h) => h.id === activeHubId) || hubs[0];
  }, [hubs, activeHubId]);

  const isCurrentHubJoined = useMemo(() => {
    return joinedHubIds.includes(activeHubId);
  }, [joinedHubIds, activeHubId]);

  // ── Join / Leave Hub ──
  const handleToggleJoin = async () => {
    try {
    const result = await CommunityService.toggleJoinHub(currentUserId, activeHubId, isCurrentHubJoined);
    setHubs(previous => previous.map(hub => hub.id === activeHubId ? { ...hub, memberCount: result.memberCount } : hub));
    setJoinedHubIds(result.joinedHubs);
    showToast(
      result.joined
        ? `Joined ${currentHub?.country} Hub! You are now connected with peers in this country.`
        : `Left ${currentHub?.country} Hub.`
    );
    } catch (error) { showToast(error instanceof Error ? error.message : 'Membership update failed.'); }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const existing = posts.find(post => post.id === postId);
      const res = await CommunityService.toggleLikePost(postId, currentUserId, !!existing?.likedBy.includes(currentUserId));
      setPosts(previous => previous.map(post => post.id === postId ? { ...post, likesCount: res.likesCount, likedBy: res.isLiked ? [currentUserId] : [] } : post));
    } catch (error) { showToast(error instanceof Error ? error.message : 'Like could not be saved.'); }
  };
  const handleLoadMorePosts = async () => {
    if (!nextPostCursor) return;
    try {
      const page = await CommunityService.getPostsPage({ hubId: activeHubId, category: selectedCategory, seniorOnly: seniorOnlyFilter, query: searchQuery, cursor: nextPostCursor });
      setPosts(previous => [...previous, ...page.items.filter(item => !previous.some(post => post.id === item.id))]);
      setNextPostCursor(page.nextCursor);
    } catch (error) { showToast(error instanceof Error ? error.message : 'More posts could not be loaded.'); }
  };

  // ── Comments Toggle & Load ──
  const handleToggleComments = async (postId: string) => {
    try {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
    } else {
      setExpandedCommentsPostId(postId);
      const comments = await CommunityService.getComments(postId, currentUserId);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
    }
    } catch (error) { showToast(error instanceof Error ? error.message : 'Comments could not be loaded.'); }
  };

  // ── Add Comment ──
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim(); if (!text) return;
    try {
      const saved = await CommunityService.addComment({ postId, content: text, isAnonymous: !!commentAnonymous[postId] });
      setPostComments(previous => ({ ...previous, [postId]: [...(previous[postId] || []), saved] }));
      setPosts(previous => previous.map(post => post.id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post));
      setCommentInputs(previous => ({ ...previous, [postId]: '' }));
      showToast('Comment saved successfully.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Comment could not be saved.'); }
  };

  // ── Create Post ──
  const handleCreatePost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) { showToast('Provide a title and content.'); return; }
    try {
      const saved = await CommunityService.createPost({ countryId: activeHubId, category: newPostCategory, title: newPostTitle,
        content: newPostContent, isAnonymous: newPostIsAnonymous, isSeniorAsk: newPostIsSeniorAsk });
      setPosts(previous => [saved, ...previous]); setIsCreateModalOpen(false);
      setHubs(previous => previous.map(hub => hub.id === activeHubId ? { ...hub, postCount: hub.postCount + 1 } : hub));
      setNewPostTitle(''); setNewPostContent(''); setNewPostIsAnonymous(false); setNewPostIsSeniorAsk(false);
      showToast('Post saved in ' + currentHub?.country + ' Hub.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Post could not be saved.'); }
  };

  // ── 1-to-1 Direct Messaging ──
  const handleOpenDm = async (target: {
    id: string;
    name: string;
    avatar?: string;
    university?: string;
    status?: string;
    isVerified?: boolean;
  }) => {
    try {
    if (target.id === currentUserId) {
      alert('You cannot message yourself.');
      return;
    }
    setDmTarget(target);
    const thread = await CommunityService.getDirectThread(currentUserId, target.id);
    setActiveDmThread(thread);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Message thread could not be opened.'); }
  };

  const handleSendDm = async (e: React.FormEvent) => {
    try {
    e.preventDefault();
    if (!dmTarget || !dmInput.trim()) return;

    const newMsg = await CommunityService.sendDirectMessage(
      currentUserId,
      dmTarget.id,
      currentUserId,
      currentUserName,
      dmInput.trim()
    );

    setActiveDmThread((prev) => (prev ? { ...prev, messages: [...prev.messages, newMsg] } : null));
    setDmInput('');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Message could not be saved.'); }
  };

  // ── Report ──
  const handleOpenReport = (type: 'post' | 'comment', id: string, title?: string) => {
    setReportTarget({ type, id, title });
    setReportReason('Spam or Advertising');
    setReportDetails('');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    try {
    e.preventDefault();
    if (!reportTarget) return;

    await CommunityService.reportItem({
      reporterId: currentUserId,
      targetType: reportTarget.type,
      targetId: reportTarget.id,
      reason: reportReason,
      details: reportDetails,
    });

    setReportTarget(null);
    showToast('Report submitted. Our moderation team can review it.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Report could not be saved.'); }
  };

  // ── Block User ──
  const handleBlockUser = async (userId: string, userName: string) => {
    try {
    if (userId === currentUserId) return;
    const confirmBlock = window.confirm(
      `Block ${userName}? All posts, comments, and messages from this user will be hidden from your feed.`
    );
    if (!confirmBlock) return;

    const updated = await CommunityService.blockUser(currentUserId, userId);
    setBlockedUsers(updated);
    showToast(`${userName} has been blocked.`);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Block could not be saved.'); }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
    const updated = await CommunityService.unblockUser(currentUserId, userId);
    setBlockedUsers(updated);
    showToast('User unblocked.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Unblock could not be saved.'); }
  };

  const visiblePosts = posts.filter(post => post.countryId === activeHubId);
  if (authLoading) return <div className={styles.page}>Loading your session…</div>;
  if (!user) return <div className={styles.page}>Sign in to access the Student Network Hub.</div>;

  return (
    <div className={styles.page}>
      {loadError && <p role="alert">{loadError}</p>}
      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Student Peer Network & Country Hubs</h1>
          <p className={styles.headerSubtitle}>
            Connect with current students, incoming peers, and verified alumni in your destination country.
            Exchange real-time advice on visas, housing, blocked accounts, and university prep.
          </p>
        </div>

        {/* Current Student Identity Card */}
        <div className={styles.userBadgeCard} title="Your current community profile">
          <Image unoptimized width={48} height={48} src={currentUserAvatar || '/icon.svg'} alt={currentUserName} className={styles.userAvatar} />
          <div className={styles.userInfo}>
            <span className={styles.userName}>{currentUserName}</span>
            <span className={styles.userStatusText}>
              ✈️ Incoming Student {user?.isVerified && '• Verified'}
            </span>
          </div>
        </div>
      </div>

      {nextPostCursor && <Button onClick={handleLoadMorePosts}>Load more discussions</Button>}
      {/* ── Country Hub Tabs ── */}
      <div className={styles.hubTabsContainer} role="tablist" aria-label="Country communities">
        {hubs.map((hub) => {
          const isActive = hub.id === activeHubId;
          const isJoined = joinedHubIds.includes(hub.id);
          const tabLabel = hub.countryCode === 'GB' ? 'UK' : hub.countryCode === 'US' ? 'USA' : hub.country;

          return (
            <button
              key={hub.id}
              role="tab"
              aria-selected={isActive}
              title={`${hub.country} Student Community (${hub.memberCount} members)`}
              onClick={() => {
                setActiveHubId(hub.id);
                setSelectedCategory('All');
                setSeniorOnlyFilter(false);
              }}
              className={`${styles.hubTab} ${isActive ? styles.hubTabActive : ''}`}
            >
              <span className={styles.hubTabFlag}>
                <HubFlagIcon code={hub.countryCode} size="sm" />
              </span>
              <span className={styles.hubTabName}>{tabLabel}</span>
              <span className={styles.hubTabMeta}>
                {isJoined && <span className={styles.hubJoinedDot} title="Joined Community" />}
                <span className={styles.hubTabBadge}>{hub.memberCount}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Active Country Banner ── */}
      {currentHub && (
        <div className={styles.activeHubBanner}>
          <div className={styles.bannerTop}>
            <div className={styles.bannerMain}>
              <span className={styles.bannerFlag}>
                <HubFlagIcon code={currentHub.countryCode} size="lg" />
              </span>
              <div>
                <h2 className={styles.bannerTitle}>
                  {currentHub.country} Student Community
                </h2>
                <div className={styles.bannerTagline}>{currentHub.tagline}</div>
              </div>
            </div>

            <div className={styles.bannerStats}>
              <Button
                variant={isCurrentHubJoined ? 'emerald' : 'primary'}
                size="sm"
                onClick={handleToggleJoin}
                icon={isCurrentHubJoined ? '✓' : '+'}
              >
                {isCurrentHubJoined ? 'Joined Community' : `Join ${currentHub.country} Hub`}
              </Button>
            </div>
          </div>

          <p className={styles.bannerDesc}>{currentHub.description}</p>

          {/* Quick Links & Cities */}
          {currentHub.quickLinks && currentHub.quickLinks.length > 0 && (
            <div className={styles.bannerLinks}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Official Resources:</span>
              {currentHub.quickLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.bannerLinkItem}
                >
                  🔗 {link.title} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Strict Country Isolation Notice ── */}
      <div className={styles.isolationAlert}>
        <div>
          🔒 <strong>Strict Country Group Isolation:</strong> You are viewing discussions created exclusively
          within <strong>{currentHub?.country} Hub</strong>. Posts published here do not leak into other country groups.
        </div>
        <span style={{ fontSize: '11px', opacity: 0.8 }}>
          {visiblePosts.length} discussions in this hub
        </span>
      </div>

      {/* ── Controls Section (Search, Categories, Actions) ── */}
      <div className={styles.controlsSection}>
        <div className={styles.searchAndActionRow}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder={`Search ${currentHub?.country} discussions, seniors, or topics...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <Button
            variant="primary"
            size="md"
            icon="✏️"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Post in {currentHub?.country}
          </Button>
        </div>

        {/* Category Pills & Senior Filter */}
        <div className={styles.categoryPills}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.categoryBtnActive : ''}`}
            >
              {cat === 'All' ? '🌐 All Topics' : cat}
            </button>
          ))}

          {/* Ask a Senior Filter Pill */}
          <button
            onClick={() => setSeniorOnlyFilter((prev) => !prev)}
            className={`${styles.seniorFilterBtn} ${seniorOnlyFilter ? styles.seniorFilterBtnActive : ''}`}
            title="Filter to questions directed to seniors & alumni"
          >
            ⚡ Ask a Senior {seniorOnlyFilter ? '(Active)' : ''}
          </button>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className={styles.mainGrid}>
        {/* Left Column: Feed */}
        <div className={styles.feedList}>
          {visiblePosts.length === 0 ? (
            <div className={styles.emptyFeed}>
              <h3>No discussions found in {currentHub?.country} Hub</h3>
              <p style={{ marginTop: '8px', fontSize: '13px' }}>
                Be the first to ask a question or share advice for students traveling to {currentHub?.country}!
              </p>
              <div style={{ marginTop: '16px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  + Start First Discussion
                </Button>
              </div>
            </div>
          ) : (
            visiblePosts.map((post) => {
              const isLiked = post.likedBy?.includes(currentUserId);
              const isCommentsOpen = expandedCommentsPostId === post.id;
              const comments = postComments[post.id] || [];

              return (
                <article key={post.id} className={styles.postCard}>
                  {/* Pinned Tag */}
                  {post.pinned && (
                    <div className={styles.postPinnedHeader}>
                      📌 Pinned Guide / Megathread
                    </div>
                  )}

                  {/* Post Header */}
                  <div className={styles.postHeader}>
                    <div className={styles.authorRow}>
                      {post.isAnonymous ? (
                        <div className={styles.anonymousAvatar} title="Anonymous Post">
                          🕵️‍♂️
                        </div>
                      ) : (
                        <Image unoptimized width={48} height={48}
                          src={post.authorAvatar || currentUserAvatar}
                          alt={post.authorName}
                          className={styles.authorAvatar}
                        />
                      )}

                      <div className={styles.authorMeta}>
                        <div className={styles.authorNameLine}>
                          <span className={styles.authorName}>
                            {post.isAnonymous ? 'Anonymous Student' : post.authorName}
                          </span>

                          {/* Academic Status Badge */}
                          <Badge
                            variant={
                              post.authorStatus === 'alumni'
                                ? 'neutral'
                                : post.authorStatus === 'current'
                                ? 'success'
                                : 'info'
                            }
                            size="sm"
                          >
                            {post.authorStatus === 'alumni'
                              ? '🏛️ Alumni'
                              : post.authorStatus === 'current'
                              ? '🎓 Current Student'
                              : '✈️ Incoming'}
                          </Badge>

                          {/* Verified Status */}
                          {post.authorVerified && (
                            <Badge variant="verified" size="sm">
                              Verified
                            </Badge>
                          )}
                        </div>

                        <div className={styles.authorAcademicLine}>
                          <span>{post.authorUniversity}</span>
                          <span>•</span>
                          <span className={styles.postTimestamp}>
                            {new Date(post.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Options / Report / Block */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenReport('post', post.id, post.title)}
                        className={styles.actionBtn}
                        title="Report this post"
                      >
                        🚩
                      </button>
                      {!post.isAnonymous && post.authorId !== currentUserId && (
                        <button
                          onClick={() => handleBlockUser(post.authorId, post.authorName)}
                          className={styles.actionBtn}
                          title="Block this author"
                        >
                          🚫
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Content */}
                  <h3 className={styles.postTitle}>{post.title}</h3>
                  <p className={styles.postContent}>{post.content}</p>

                  {/* Tags */}
                  <div className={styles.tagRow}>
                    <span className={styles.categoryTag}>🏷️ {post.category}</span>
                    {post.isSeniorAsk && (
                      <span className={styles.seniorAskTag}>
                        ⚡ Question for Seniors & Alumni
                      </span>
                    )}
                  </div>

                  {/* Post Actions Bar */}
                  <div className={styles.postActions}>
                    <div className={styles.actionButtonGroup}>
                      {/* Like Button */}
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`${styles.actionBtn} ${isLiked ? styles.actionBtnActiveLike : ''}`}
                      >
                        <span>{isLiked ? '❤️' : '🤍'}</span>
                        <span>{post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}</span>
                      </button>

                      {/* Comments Toggle Button */}
                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className={styles.actionBtn}
                      >
                        <span>💬</span>
                        <span>
                          {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
                        </span>
                      </button>
                    </div>

                    {/* 1-to-1 Message Author (if not anonymous and not self) */}
                    {!post.isAnonymous && post.authorId !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="✉️"
                        onClick={() =>
                          handleOpenDm({
                            id: post.authorId,
                            name: post.authorName,
                            avatar: post.authorAvatar,
                            university: post.authorUniversity,
                            status: post.authorStatus,
                            isVerified: post.authorVerified,
                          })
                        }
                      >
                        Message Author
                      </Button>
                    )}
                  </div>

                  {/* ── Expandable Comments ── */}
                  {isCommentsOpen && (
                    <div className={styles.commentsSection}>
                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Discussion ({comments.length})
                      </h4>

                      {comments.length === 0 ? (
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          No replies yet. Be the first to reply!
                        </p>
                      ) : (
                        comments.map((c) => (
                          <div
                            key={c.id}
                            className={`${styles.commentItem} ${c.isSeniorAnswer ? styles.seniorAnswerItem : ''}`}
                          >
                            <div className={styles.commentHeader}>
                              <div className={styles.commentAuthorMeta}>
                                <strong>{c.isAnonymous ? '🕵️‍♂️ Anonymous Student' : c.authorName}</strong>
                                {c.isSeniorAnswer && (
                                  <Badge variant="ai" size="sm">
                                    ⭐ Senior Answer
                                  </Badge>
                                )}
                                {c.authorVerified && (
                                  <Badge variant="verified" size="sm">
                                    Verified
                                  </Badge>
                                )}
                                <span style={{ color: 'var(--text-muted)' }}>
                                  ({c.authorUniversity})
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {new Date(c.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <button
                                  onClick={() => handleOpenReport('comment', c.id)}
                                  className={styles.actionBtn}
                                  style={{ padding: '0 4px', fontSize: '11px' }}
                                  title="Report comment"
                                >
                                  🚩
                                </button>
                              </div>
                            </div>
                            <p className={styles.commentText}>{c.content}</p>
                          </div>
                        ))
                      )}

                      {/* Add Comment Form */}
                      <div className={styles.commentForm}>
                        <textarea
                          placeholder="Write a helpful answer or question..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          className={styles.commentInput}
                        />

                        <div className={styles.commentFormBottom}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={!!commentAnonymous[post.id]}
                              onChange={(e) =>
                                setCommentAnonymous((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.checked,
                                }))
                              }
                            />
                            <span>🕵️‍♂️ Comment anonymously</span>
                          </label>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim()}
                          >
                            Post Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Right Column: Verified Seniors & Community Widgets */}
        <aside className={styles.sideColumn}>
          {/* Ask a Senior Card */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitle}>
              <span>⚡</span>
              <span>Ask a Senior in {currentHub?.country}</span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Verified seniors and alumni actively enrolled in {currentHub?.country} universities who volunteer to guide newcomers:
            </p>

            {seniors.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                No registered seniors currently listed for this country.
              </p>
            ) : (
              seniors.map((snr) => (
                <div key={snr.id} className={styles.seniorItem}>
                  <div className={styles.seniorItemTop}>
                    <Image unoptimized width={48} height={48} src={snr.avatar} alt={snr.name} className={styles.seniorAvatar} />
                    <div className={styles.seniorMeta}>
                      <span className={styles.seniorName}>{snr.name}</span>
                      <span className={styles.seniorUni}>{snr.university}</span>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                        <Badge variant="verified" size="sm">
                          Verified Senior
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className={styles.seniorBio}>{snr.bio}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      🏆 Helped {snr.helpedCount} students
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="💬"
                      onClick={() =>
                        handleOpenDm({
                          id: snr.id,
                          name: snr.name,
                          avatar: snr.avatar,
                          university: snr.university,
                          status: snr.status,
                          isVerified: snr.isVerified,
                        })
                      }
                    >
                      1-to-1 Chat
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Community Safety & Integrity */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitle}>
              <span>🛡️</span>
              <span>Network Guidelines</span>
            </div>

            <div className={styles.guidelinesList}>
              <div className={styles.guidelineItem}>
                <span>✓</span>
                <span><strong>No Unofficial Fees:</strong> Never pay anyone for visa appointments or university admissions through personal channels.</span>
              </div>
              <div className={styles.guidelineItem}>
                <span>✓</span>
                <span><strong>Anonymous Support:</strong> Use anonymous posting whenever discussing sensitive visa delays or personal documents.</span>
              </div>
              <div className={styles.guidelineItem}>
                <span>✓</span>
                <span><strong>Report Misinformation:</strong> Flag false consultancies or misleading embassy advice to keep peers safe.</span>
              </div>
            </div>
          </div>

          {/* Blocked Users Widget (if any) */}
          {blockedUsers.length > 0 && (
            <div className={styles.widgetCard}>
              <div className={styles.widgetTitle}>
                <span>🚫</span>
                <span>Blocked Accounts ({blockedUsers.length})</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                These users cannot message you and their posts are hidden.
              </p>
              {blockedUsers.map((id) => (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    padding: '6px 0',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>User ID: {id}</span>
                  <button
                    onClick={() => handleUnblockUser(id)}
                    className={styles.actionBtn}
                    style={{ fontSize: '11px' }}
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* ── Modal: Create Post ── */}
      {isCreateModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Create Discussion in {currentHub?.country} Hub
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className={styles.closeBtn}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost}>
              <div className={styles.modalBody}>
                {/* Fixed Country Alert */}
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍 <strong>Destination:</strong></span>
                  <HubFlagIcon code={currentHub?.countryCode} size="sm" />
                  <span>{currentHub?.country} (Will only be visible inside this country group)</span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhaka Embassy visa appointment timeline for Winter semester"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category *</label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className={styles.formSelect}
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <p>Your academic status and verification come from your approved hub membership.</p>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Details & Question *</label>
                  <textarea
                    required
                    placeholder="Share specific context, requirements, dates, or what advice you need..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className={styles.formTextarea}
                  />
                </div>

                {/* Anonymous & Senior Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newPostIsAnonymous}
                      onChange={(e) => setNewPostIsAnonymous(e.target.checked)}
                    />
                    <span>
                      🕵️‍♂️ <strong>Post Anonymously</strong> (Hide your name and photo from public view)
                    </span>
                  </label>

                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newPostIsSeniorAsk}
                      onChange={(e) => setNewPostIsSeniorAsk(e.target.checked)}
                    />
                    <span>
                      ⚡ <strong>Ask a Senior</strong> (Highlight this question for verified seniors in {currentHub?.country})
                    </span>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Publish to {currentHub?.country} Hub
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: 1-to-1 Direct Messaging ── */}
      {dmTarget && activeDmThread && (
        <div className={styles.modalBackdrop} onClick={() => setDmTarget(null)}>
          <div
            className={styles.modalContent}
            style={{ maxWidth: '620px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Image unoptimized width={48} height={48}
                  src={dmTarget.avatar || currentUserAvatar}
                  alt={dmTarget.name}
                  style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid var(--border)' }}
                />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {dmTarget.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--blue-light)' }}>
                    {dmTarget.university} {dmTarget.isVerified && '• ✓ Verified'}
                  </div>
                </div>
              </div>

              <button onClick={() => setDmTarget(null)} className={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div className={styles.dmContainer}>
              <div className={styles.dmMessagesBox}>
                {activeDmThread.messages.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', margin: 'auto' }}>
                    👋 Start a 1-to-1 conversation with {dmTarget.name}. Discuss course choices, housing, or visa prep.
                  </p>
                ) : (
                  activeDmThread.messages.map((m) => {
                    const isMe = m.senderId === currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={`${styles.dmBubble} ${isMe ? styles.dmSent : styles.dmReceived}`}
                      >
                        <div>{m.content}</div>
                        <span className={styles.dmTime}>
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendDm} className={styles.dmInputRow}>
                <input
                  type="text"
                  placeholder={`Write a direct message to ${dmTarget.name}...`}
                  value={dmInput}
                  onChange={(e) => setDmInput(e.target.value)}
                  className={styles.formInput}
                />
                <Button type="submit" variant="primary" disabled={!dmInput.trim()}>
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Report Functionality ── */}
      {reportTarget && (
        <div className={styles.modalBackdrop} onClick={() => setReportTarget(null)}>
          <div
            className={styles.modalContent}
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Report Content</h3>
              <button onClick={() => setReportTarget(null)} className={styles.closeBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport}>
              <div className={styles.modalBody}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Help us maintain an honest and safe student community. Why are you reporting this {reportTarget.type}?
                </p>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="Spam or Advertising">Spam or Commercial Consultancy Ad</option>
                    <option value="Misleading Visa Advice">False / Misleading Visa / Embassy Advice</option>
                    <option value="Harassment or Abuse">Harassment, Abuse, or Inappropriate Language</option>
                    <option value="Scam or Financial Fraud">Scam, Illegal Fee, or Housing Fraud</option>
                    <option value="Other">Other violation</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Additional Details (Optional)</label>
                  <textarea
                    placeholder="Provide details to assist moderators..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className={styles.formTextarea}
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button type="button" variant="ghost" onClick={() => setReportTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger">
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Feedback ── */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
