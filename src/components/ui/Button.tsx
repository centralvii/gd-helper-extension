import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald' | 'outline' | 'toolbar';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed select-none will-change-transform active:scale-[0.97] active:transition-none cursor-pointer whitespace-nowrap';

  const canonicalPrimary =
    'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white border border-emerald-600/90 shadow-sm shadow-emerald-600/25 hover:shadow-md hover:shadow-emerald-600/35 hover:-translate-y-px focus-visible:ring-emerald-500/40';

  const variants = {
    primary: canonicalPrimary,
    emerald: canonicalPrimary,
    secondary:
      'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50/40 hover:border-emerald-300 hover:text-emerald-800 shadow-xs focus-visible:ring-emerald-500/30',
    danger:
      'bg-gradient-to-b from-rose-500 to-rose-600 hover:to-rose-700 text-white border border-rose-600 shadow-sm shadow-rose-600/20 hover:shadow-md hover:shadow-rose-600/30 focus-visible:ring-rose-400/40',
    ghost:
      'bg-transparent text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:ring-emerald-500/30',
    outline:
      'bg-transparent text-emerald-700 border border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 focus-visible:ring-emerald-500/30',
    toolbar:
      'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 shadow-2xs font-semibold focus-visible:ring-emerald-500/30',
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-1 gap-1',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-3.5 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
