import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald' | 'outline';
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
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none will-change-transform active:scale-[0.97] active:transition-none cursor-pointer whitespace-nowrap';

  const variants = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-xs shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-600/25 focus:ring-2 focus:ring-emerald-500/30',
    emerald:
      'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border border-emerald-600/90 shadow-sm shadow-emerald-600/25 hover:shadow-md hover:shadow-emerald-600/35 focus:ring-2 focus:ring-emerald-500/30',
    secondary:
      'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50/80 hover:border-slate-300 hover:text-slate-900 shadow-2xs focus:ring-2 focus:ring-slate-200',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 shadow-xs hover:shadow-md hover:shadow-rose-600/20 focus:ring-2 focus:ring-rose-400/30',
    ghost:
      'bg-transparent text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 focus:ring-2 focus:ring-emerald-500/20',
    outline:
      'bg-transparent text-emerald-700 border border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20',
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
