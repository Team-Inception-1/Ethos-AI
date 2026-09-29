'use client';
import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'verified' | 'pending' | 'rejected' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'ai' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const icons: Partial<Record<BadgeVariant, string>> = {
  verified: '✓',
  pending:  '◐',
  rejected: '✕',
};

export default function Badge({ variant = 'neutral', children, size = 'md', dot = false }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]}`}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {!dot && icons[variant] && <span className={styles.icon} aria-hidden="true">{icons[variant]}</span>}
      {children}
    </span>
  );
}
