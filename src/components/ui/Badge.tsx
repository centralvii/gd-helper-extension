import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  dot?: boolean;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
  title,
}) => {
  // iOS: плоские «пилюли» с тонированной заливкой, без рамок
  const baseStyles =
    'inline-flex items-center font-semibold rounded-full select-none transition-colors whitespace-nowrap tabular-nums';

  const variants = {
    default: 'bg-gd-fill text-slate-700',
    success: 'bg-[#22b58a]/[0.16] text-[#0f7a5c]',
    warning: 'bg-[#f59e3b]/[0.18] text-[#a4500f]',
    danger: 'bg-[#e5484d]/[0.14] text-[#b42328]',
    info: 'bg-gd-accent-light text-accent-700',
    purple: 'bg-[#8b5cf6]/[0.14] text-[#6d3fd0]',
  };

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-[#22b58a]',
    warning: 'bg-[#f59e3b]',
    danger: 'bg-[#e5484d]',
    info: 'bg-gd-accent',
    purple: 'bg-[#8b5cf6]',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-px gap-1 leading-tight',
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  };

  return (
    <span
      title={title}
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
