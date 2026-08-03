'use client';
import React from 'react';
import styles from './GlassCard.module.css';

type Variant = 'default' | 'elevated' | 'frosted' | 'bordered';
type Accent = 'none' | 'blue' | 'emerald' | 'purple' | 'amber' | 'danger';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  hover?: boolean;
  glow?: boolean;
  accent?: Accent;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = false,
  glow = false,
  accent = 'none',
  padding = 'md',
  onClick,
}: GlassCardProps) {
  return (
    <div
      className={[
        styles.card,
        variant !== 'default' ? styles[variant] : '',
        hover    ? styles.hoverable : '',
        glow     ? styles.glow      : '',
        accent !== 'none' ? styles[`accent-${accent}`] : '',
        styles[`pad-${padding}`],
        className,
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {children}
    </div>
  );
}
