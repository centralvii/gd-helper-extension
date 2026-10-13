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
    default: 'bg-gd-fill text-slate-600',
    success: 'bg-gd-green-light text-gd-green',
    warning: 'bg-[#ff9500]/15 text-[#c26a00]',
    danger: 'bg-[#ff3b30]/[0.12] text-[#d70015]',
    info: 'bg-[#007aff]/[0.12] text-[#0062cc]',
    purple: 'bg-[#af52de]/[0.12] text-[#8944ab]',
  };

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-gd-green',
    warning: 'bg-[#ff9500]',
    danger: 'bg-[#ff3b30]',
    info: 'bg-[#007aff]',
    purple: 'bg-[#af52de]',
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
