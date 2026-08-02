'use client';
import React, { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth, UserRole } from '@/context/AuthContext';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user, updateProfile, linkStudent, unlinkStudent, linkedStudents, linkedParents, switchActiveRole, logout } = useAuth();

  const [copied, setCopied] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkMessage, setLinkMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Form states initialized from user
  const [targetField, setTargetField] = useState(user?.studentDetails?.targetField || 'Computer Science');
  const [budgetRange, setBudgetRange] = useState(user?.studentDetails?.budgetRange || '৳15L - ৳25L / year');
  const [ieltsScore, setIeltsScore] = useState(user?.studentDetails?.ieltsScore || '7.5');
  const [targetCountriesStr, setTargetCountriesStr] = useState(user?.studentDetails?.targetCountries?.join(', ') || 'Canada, Australia, UK');

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!user) {
    return (
      <div className={`${styles.page} container`} style={{ paddingTop: 'var(--topbar-height)' }}>
        <GlassCard padding="lg">
          <h2>You are not signed in.</h2>
          <Button size="md" onClick={() => switchActiveRole('student')}>Sign in as Demo Student</Button>
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

  const handleSaveStudentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      studentDetails: {
        targetField,
        budgetRange,
        ieltsScore,
        targetCountries: targetCountriesStr.split(',').map((s) => s.trim()),
        linkCode: user.studentDetails?.linkCode || 'ETHOS-STU-8821',
      },
    });
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
    <main className={styles.page} style={{ paddingTop: 'calc(var(--topbar-height) + 2rem)' }}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.title}>Account Profile & Settings</h1>
              <p className={styles.subtitle}>Manage your role preferences, guardian linkages, and student credentials.</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Left Column: User Summary Card */}
          <GlassCard padding="lg" className={styles.userCard}>
            <div className={styles.avatar}>{user.name.charAt(0)}</div>
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

            {/* Demo Role Switcher */}
            <div className={styles.roleSwitcherCard}>
              <span className={styles.roleSwitcherTitle}>⚡ Instant Role Switcher (Demo)</span>
              <div className={styles.roleBtnGroup}>
                {(['student', 'parent', 'agency', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`${styles.roleBtn} ${user.role === r ? styles.roleBtnActive : ''}`}
                    onClick={() => switchActiveRole(r)}
                  >
                    {r === 'student' ? '🎓 Student' : r === 'parent' ? '👨‍👧 Parent' : r === 'agency' ? '🏢 Agency' : '🛡️ Admin'}
                  </button>
                ))}
              </div>
            </div>
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
                        Enter your child's <strong>Ethos Link Code</strong> (e.g. <code>ETHOS-STU-8821</code>) or registered email address.
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
                      No student accounts linked yet. Use the box above to link your child's profile.
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

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Agency Business Name</label>
                    <input type="text" className={styles.input} value={user.agencyDetails?.agencyName || user.name} readOnly />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Government License Number</label>
                    <input type="text" className={styles.input} value={user.agencyDetails?.licenseNo || 'MOE-BD-2024-889'} readOnly />
                  </div>

                  <div className={styles.fieldGroupFull}>
                    <label className={styles.label}>Countries Served</label>
                    <input type="text" className={styles.input} value={user.agencyDetails?.countriesServed.join(', ')} readOnly />
                  </div>
                </div>
              </>
            )}

            {/* Admin Role Panel */}
            {user.role === 'admin' && (
              <>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>🛡️ System Administrator Controls</h2>
                  <Badge variant="danger">SUPERADMIN ACCESS</Badge>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  You have full governance access to audit agencies, review flagged agreements, resolve student-agency escrow disputes, and issue verification badges.
                </p>
              </>
            )}
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
