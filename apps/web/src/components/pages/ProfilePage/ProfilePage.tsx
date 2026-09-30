'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user } = useAuth();
  return <ProfileEditor key={user?.id || 'signed-out'} />;
}

function ProfileEditor() {
  const { user, updateProfile, linkStudent, unlinkStudent, linkedStudents, linkedParents, logout, refreshSession } = useAuth();

  const [copied, setCopied] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkMessage, setLinkMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Form states initialized from user
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const email = user?.email || '';

  const [targetField, setTargetField] = useState(user?.studentDetails?.targetField || '');
  const [budgetRange, setBudgetRange] = useState(user?.studentDetails?.budgetRange || '');
  const [ieltsScore, setIeltsScore] = useState(user?.studentDetails?.ieltsScore || '');
  const [targetCountriesStr, setTargetCountriesStr] = useState(user?.studentDetails?.targetCountries?.join(', ') || '');

  const [agencyName, setAgencyName] = useState(user?.agencyDetails?.agencyName || user?.name || '');
  const [agencyLicense, setAgencyLicense] = useState(user?.agencyDetails?.licenseNo || '');
  const [agencyCountries, setAgencyCountries] = useState(user?.agencyDetails?.countriesServed?.join(', ') || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');


  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5MB');
      setTimeout(() => setAvatarError(null), 4000);
      return;
    }

    setUploadingAvatar(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to upload photo');
      }

      await refreshSession();
      setAvatarSuccess('Avatar saved securely!');
      setTimeout(() => setAvatarSuccess(null), 3000);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Avatar upload failed');
      setTimeout(() => setAvatarError(null), 4000);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };


  if (!user) {
    return (
      <div className={`${styles.page} container`}>
        <GlassCard padding="lg">
          <h2>You are not signed in.</h2>
          <p style={{ margin: '12px 0 20px', color: 'var(--text-secondary)' }}>
            Please sign in to access your profile settings.
          </p>
          <Link href="/login">
            <Button size="md">Sign In to Ethos AI</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const handleCopyLinkCode = () => {
    if (user.studentDetails?.linkCode) {
      navigator.clipboard.writeText(user.studentDetails.linkCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAccountDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    const saved = await updateProfile({
      name: fullName.trim(),
      phone: phone.trim(),
    });
    if (!saved) { setSaveError('Changes were not saved. Please try again.'); return; }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveAgencyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    const saved = await updateProfile({
      name: fullName.trim(),
      agencyDetails: {
        agencyName: agencyName.trim(),
        licenseNo: agencyLicense.trim(),
        licenseStatus: user?.agencyDetails?.licenseStatus || 'pending',
        countriesServed: agencyCountries.split(',').map((s) => s.trim()).filter(Boolean),
      },
    });
    if (!saved) { setSaveError('Changes were not saved. Please try again.'); return; }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveStudentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    const saved = await updateProfile({
      studentDetails: {
        targetField,
        budgetRange,
        ieltsScore,
        targetCountries: targetCountriesStr.split(',').map((s) => s.trim()),
        linkCode: user.studentDetails?.linkCode || '',
      },
    });
    if (!saved) { setSaveError('Changes were not saved. Please try again.'); return; }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLinkMessage(null);
    const res = linkStudent(linkInput);
    setLinkMessage({ success: res.success, text: res.message });
    if (res.success) setLinkInput('');
  };

  return (
    <div className={styles.page}>
      {saveError && <p role="alert">{saveError}</p>}
      {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div>
              <div className={styles.titleWithBadge}>
                <h1 className={styles.title}>Account Profile & Settings</h1>
                <Badge variant="verified" size="sm">Verified Account</Badge>
              </div>
              <p className={styles.subtitle}>
                Manage your role preferences, guardian linkages, biometric credentials, and academic profile.
              </p>
            </div>
            <div className={styles.headerActions}>
              <Link href={user?.role === 'agency' ? '/agency/dashboard' : user?.role === 'admin' ? '/admin' : '/dashboard'}>
                <Button variant="outline" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Executive Trust & Security KPI Dock */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconBox}>👤</div>
            <div className={styles.statInfo}>
              <div className={styles.statVal}>{user.role.toUpperCase()}</div>
              <div className={styles.statLabel}>Active Account Role</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBox}>🛡️</div>
            <div className={styles.statInfo}>
              <div className={styles.statVal}>{user.isVerified ? 'VERIFIED' : 'PENDING'}</div>
              <div className={styles.statLabel}>Phone & Email Status</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBox}>🔐</div>
            <div className={styles.statInfo}>
              <div className={styles.statVal}>SHA-256</div>
              <div className={styles.statLabel}>Cloud Vault Encryption</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBox}>👨‍👧</div>
            <div className={styles.statInfo}>
              <div className={styles.statVal}>
                {user.role === 'student' ? `${linkedParents.length} Linked` : user.role === 'parent' ? `${linkedStudents.length} Linked` : 'Enterprise'}
              </div>
              <div className={styles.statLabel}>Guardian Link Network</div>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Left Column: User Summary Card */}
          <GlassCard padding="lg" className={styles.userCard}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>
                {user.avatarUrl && user.avatarUrl !== failedAvatar ? (
                  <Image unoptimized width={96} height={96}
                    src={user.avatarUrl}
                    alt={user.name}
                    onError={() => setFailedAvatar(user.avatarUrl || null)}
                    className={styles.avatarImg}
                  />
                ) : (
                  (user.name?.charAt(0) || 'U').toUpperCase()
                )}
                {uploadingAvatar && (
                  <div className={styles.avatarLoadingOverlay} aria-label="Uploading...">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                      <line x1="12" y1="2" x2="12" y2="6"/>
                      <line x1="12" y1="18" x2="12" y2="22"/>
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                      <line x1="2" y1="12" x2="6" y2="12"/>
                      <line x1="18" y1="12" x2="22" y2="12"/>
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                    </svg>
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-file-input"
                className={styles.avatarEditBadge}
                title="Upload profile photo"
                aria-label="Upload profile photo"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {avatarSuccess && <p className={`${styles.avatarNotice} ${styles.avatarSuccess}`}>✓ {avatarSuccess}</p>}
            {avatarError && <p className={`${styles.avatarNotice} ${styles.avatarError}`}>⚠ {avatarError}</p>}

            <div>
              <h2 className={styles.userName}>{user.name}</h2>
              <p className={styles.userEmail}>{user.email}</p>
            </div>

            <div className={styles.badgeGroup}>
              <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'agency' ? 'info' : 'ai'}>
                {user.role.toUpperCase()}
              </Badge>
              <Badge variant={user.isVerified ? 'verified' : 'pending'}>
                {user.isVerified ? '✓ Phone & Email Verified' : '⚠ Verification Pending'}
              </Badge>
            </div>

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{user.phone}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Member Since</span>
                <span className={styles.infoValue}>{user.createdAt}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Account ID</span>
                <span className={styles.infoValue} style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  {user.id}
                </span>
              </div>
            </div>

            {/* Editable Contact Info Form */}
            <form onSubmit={handleSaveAccountDetails} className={styles.personalInfoForm}>
              <div className={styles.personalInfoTitleRow}>
                <span className={styles.personalInfoTitle}>Personal Credentials</span>
                {savedSuccess && <span style={{ fontSize: '11px', color: 'var(--emerald)', fontWeight: 700 }}>✓ Saved!</span>}
              </div>
              <div className={styles.personalInfoFields}>
                <div>
                  <label className={styles.inputFieldLabel}>Full Name</label>
                  <input
                    type="text"
                    className={styles.inputSmall}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={styles.inputFieldLabel}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.inputSmall}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={styles.inputFieldLabel}>Email Address</label>
                  <input
                    type="email"
                    className={styles.inputSmall}
                    value={email}
                    readOnly
                    required
                  />
                </div>
                <Button type="submit" size="sm" variant="outline" style={{ marginTop: '4px', width: '100%' }}>
                  Save Personal Info
                </Button>
              </div>
            </form>
          </GlassCard>

          {/* Right Column: Dynamic Role Content */}
          <GlassCard padding="lg" className={styles.sectionCard}>
            {/* Student Role Editor */}
            {user.role === 'student' && (
              <>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>🎓 Student Application Profile</h2>
                  {savedSuccess && <Badge variant="verified">✓ Profile Saved!</Badge>}
                </div>

                {/* Guardian Link Code Banner */}
                <div className={styles.linkCodeBox}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Parent Guardian Link Code
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Share this code with your parent/guardian so they can link your profile.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className={styles.linkCodeVal}>{user.studentDetails?.linkCode || 'ETHOS-STU-8821'}</span>
                    <Button size="sm" variant="outline" onClick={handleCopyLinkCode}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Linked Parents */}
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
                    Linked Guardian Parents ({linkedParents.length})
                  </h3>
                  {linkedParents.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No parent accounts linked yet.</p>
                  ) : (
                    <div className={styles.guardianList}>
                      {linkedParents.map((p) => (
                        <div key={p.id} className={styles.guardianCard}>
                          <div className={styles.guardianInfo}>
                            <div className={styles.guardianAvatar}>👨‍👧</div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{p.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.email} • {p.phone}</div>
                            </div>
                          </div>
                          <Badge variant="verified">Guardian Verified</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Profile Form */}
                <form className={styles.formGrid} onSubmit={handleSaveStudentDetails}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Target Field of Study</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={targetField}
                      onChange={(e) => setTargetField(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>English Test Score (IELTS / TOEFL)</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={ieltsScore}
                      onChange={(e) => setIeltsScore(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Annual Budget Range</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Target Countries (comma separated)</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={targetCountriesStr}
                      onChange={(e) => setTargetCountriesStr(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroupFull}>
                    <Button type="submit" size="md" glow>
                      Save Profile Changes
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* Parent Role Editor & Link Student Tool */}
            {user.role === 'parent' && (
              <>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>👨‍👧 Parent Guardian Dashboard & Student Linkage</h2>
                </div>

                {/* Link Student Form */}
                <div className={styles.linkCodeBox} style={{ background: 'rgba(79, 142, 247, 0.08)', borderColor: 'rgba(79, 142, 247, 0.3)' }}>
                  <form onSubmit={handleLinkSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Link a Student Account</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Enter your child&apos;s <strong>Ethos Link Code</strong> (e.g. <code>ETHOS-STU-8821</code>) or registered email address.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Enter Link Code (e.g. ETHOS-STU-8821)"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                      />
                      <Button type="submit" size="md" glow style={{ whiteSpace: 'nowrap' }}>
                        Link Student
                      </Button>
                    </div>

                    {linkMessage && (
                      <div style={{ fontSize: '13px', fontWeight: 600, color: linkMessage.success ? 'var(--emerald)' : 'var(--rose)' }}>
                        {linkMessage.text}
                      </div>
                    )}
                  </form>
                </div>

                {/* Linked Student Cards */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
                    Linked Student Accounts ({linkedStudents.length})
                  </h3>
                  {linkedStudents.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      No student accounts linked yet. Use the box above to link your child&apos;s profile.
                    </p>
                  ) : (
                    <div className={styles.guardianList}>
                      {linkedStudents.map((st) => (
                        <div key={st.id} className={styles.guardianCard}>
                          <div className={styles.guardianInfo}>
                            <div className={styles.guardianAvatar} style={{ background: 'var(--blue-primary)' }}>🎓</div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{st.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {st.studentDetails?.targetField} • {st.studentDetails?.targetCountries.join(', ')}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Badge variant="verified">Linked Child</Badge>
                            <Button size="sm" variant="ghost" onClick={() => unlinkStudent(st.id)}>
                              Unlink
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Agency Role Details */}
            {user.role === 'agency' && (
              <>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>🏢 Consultancy Business Credentials</h2>
                  <Badge variant={user.agencyDetails?.licenseStatus === 'verified' ? 'verified' : 'pending'}>
                    License: {user.agencyDetails?.licenseStatus?.toUpperCase()}
                  </Badge>
                </div>

                <form className={styles.formGrid} onSubmit={handleSaveAgencyDetails}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Agency Business Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Government License Number</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={agencyLicense}
                      onChange={(e) => setAgencyLicense(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroupFull}>
                    <label className={styles.label}>Countries Served (comma separated)</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={agencyCountries}
                      onChange={(e) => setAgencyCountries(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroupFull}>
                    <Button type="submit" size="md" glow>
                      Save Agency Profile
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* Admin Role Panel */}
            {user.role === 'admin' && (
              <>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>🛡️ System Administrator Controls</h2>
                  <Badge variant="outline">Administrator</Badge>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  You have full governance access to audit agencies, review flagged agreements, resolve student-agency escrow disputes, and issue verification badges.
                </p>
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <Link href="/admin">
                    <Button variant="primary" size="md">
                      Go to Admin Governance Console ➔
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </GlassCard>
        </div>
      </div>
  );
}
