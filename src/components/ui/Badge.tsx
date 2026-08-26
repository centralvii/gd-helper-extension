import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
}) => {
  const baseStyles =
    'inline-flex items-center font-semibold rounded-full border select-none transition-colors';

  const variants = {
    default: 'bg-slate-100/80 text-slate-700 border-slate-200/90',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    warning: 'bg-amber-50 text-amber-900 border-amber-300/90',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/90',
    info: 'bg-sky-50 text-sky-800 border-sky-200/90',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/90',
  };

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
  };

  const sizes = {
    xs: 'text-[9.5px] px-1.5 py-0.2 gap-1',
    sm: 'text-[10.5px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
