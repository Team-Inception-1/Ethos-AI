'use client';

import React, { useId } from 'react';
import styles from './EthosLogo.module.css';

interface EthosLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: 'default' | 'monochrome' | 'badge';
  textClassName?: string;
}

export function EthosLogoIcon({ size = 28, variant = 'default', className = '' }: { size?: number; variant?: 'default' | 'monochrome' | 'badge'; className?: string }) {
  const uid = useId().replace(/:/g, '');

  return (
    <span className={`${styles.iconWrapper} ${className}`} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad-top-${uid}`} x1="16" y1="8" x2="48" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4F8EF7" />
            <stop offset="100%" stopColor="#2FD3E8" />
          </linearGradient>
          <linearGradient id={`grad-right-${uid}`} x1="48" y1="20" x2="32" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9B6BFF" />
            <stop offset="100%" stopColor="#4F8EF7" />
          </linearGradient>
          <linearGradient id={`grad-left-${uid}`} x1="16" y1="20" x2="32" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#17C989" />
            <stop offset="100%" stopColor="#2FD3E8" />
          </linearGradient>
          <linearGradient id={`grad-core-${uid}`} x1="32" y1="24" x2="32" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFD60A" />
            <stop offset="100%" stopColor="#FF9F1C" />
          </linearGradient>
        </defs>

        {/* Isometric Facet 1: Top Bar */}
        <path
          d="M32 6 L54 18.5 L43 25 L32 18.5 L21 25 L10 18.5 Z"
          fill={variant === 'monochrome' ? 'currentColor' : `url(#grad-top-${uid})`}
        />

        {/* Isometric Facet 2: Right Descending Bar */}
        <path
          d="M54 18.5 L54 43.5 L43 37 L43 25 L32 31.5 L32 44 L21 37.5 L21 25 L32 18.5 L43 25 L54 18.5 Z"
          fill={variant === 'monochrome' ? 'currentColor' : `url(#grad-right-${uid})`}
          opacity={variant === 'monochrome' ? 0.8 : 1}
        />

        {/* Isometric Facet 3: Left Winding Interlock */}
        <path
          d="M10 18.5 L21 25 L21 37.5 L32 44 L32 56.5 L10 43.5 Z"
          fill={variant === 'monochrome' ? 'currentColor' : `url(#grad-left-${uid})`}
          opacity={variant === 'monochrome' ? 0.6 : 1}
        />

        {/* Central Floating Cyber Diamond / Core Prism */}
        <polygon
          points="32,24 39,28.5 39,36.5 32,41 25,36.5 25,28.5"
          fill={variant === 'monochrome' ? 'currentColor' : `url(#grad-core-${uid})`}
          stroke="#15141B"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}

export function EthosLogo({
  size = 28,
  showText = true,
  className = '',
  textClassName = '',
  variant = 'default',
}: EthosLogoProps) {
  return (
    <div className={`${styles.logoContainer} ${className}`}>
      <EthosLogoIcon size={size} variant={variant} />
      {showText && (
        <span className={`${styles.logoText} ${textClassName}`}>
          Ethos <span className={styles.logoAI}>AI</span>
        </span>
      )}
    </div>
  );
}

export default EthosLogo;
