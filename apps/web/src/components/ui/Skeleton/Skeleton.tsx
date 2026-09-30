'use client';

import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  rounded?: 'none' | 'md' | 'lg' | 'full';
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width,
  height,
  circle = false,
  rounded = 'md',
  className = '',
  style = {},
  ...rest
}: SkeletonProps) {
  const inlineStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  const roundedClass =
    circle || rounded === 'full'
      ? styles.circle
      : rounded === 'none'
      ? styles.roundedNone
      : rounded === 'lg'
      ? styles.roundedLg
      : styles.roundedMd;

  return (
    <div
      aria-hidden="true"
      className={`${styles.skeleton} ${roundedClass} ${className}`.trim()}
      style={inlineStyle}
      {...rest}
    />
  );
}

export default Skeleton;
