'use client';
import React from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'md',
  onClick,
}: GlassCardProps) {
  return (
    <div
      className={[
        styles.card,
        hover  ? styles.hoverable : '',
        glow   ? styles.glow      : '',
        styles[`pad-${padding}`],
        className,
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
