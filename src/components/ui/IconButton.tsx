import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  variant?: 'ghost' | 'secondary' | 'danger' | 'emerald' | 'sky';
  size?: 'xs' | 'sm' | 'md';
  isActive?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  icon,
  variant = 'ghost',
  size = 'sm',
  isActive = false,
  className,
  type = 'button',
  ...props
}) => {
  const sizes = {
    xs: 'w-6 h-6 rounded-lg text-xs',
    sm: 'w-7 h-7 rounded-xl text-xs',
    md: 'w-8 h-8 rounded-xl text-sm',
  };

  const variants = {
    ghost: clsx(
      'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
      isActive && 'bg-slate-100 text-slate-800'
    ),
    secondary: clsx(
      'border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs',
      isActive && 'bg-white text-slate-900 border-slate-300 shadow-xs'
    ),
    danger: clsx(
      'text-slate-400 hover:text-rose-600 hover:bg-rose-50',
      isActive && 'bg-rose-50 text-rose-700'
    ),
    emerald: clsx(
      'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50',
      isActive && 'bg-emerald-50 text-emerald-800'
    ),
    sky: clsx(
      'text-slate-400 hover:text-sky-700 hover:bg-sky-50',
      isActive && 'bg-sky-50 text-sky-800'
    ),
  };

  return (
    <button
      type={type}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none active:scale-95 flex-shrink-0',
          sizes[size],
          variants[variant]
        ),
        className
      )}
      {...props}
    >
      {icon || children}
    </button>
  );
};
