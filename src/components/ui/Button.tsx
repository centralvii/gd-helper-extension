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
  // iOS: заливка без рамок и теней, мягкое затемнение при hover, пружина при нажатии (глобально в index.css)
  const base =
    'inline-flex items-center justify-center font-semibold tracking-[-0.01em] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-35 disabled:cursor-not-allowed select-none cursor-pointer whitespace-nowrap';

  // Aurora Glass: капсулы; основная — индиго с мягким свечением, вторичная — стекло
  const filledAccent =
    'bg-gd-accent hover:bg-gd-accent-dark text-white shadow-gd-accent focus-visible:ring-accent-500/40';

  const variants = {
    primary: filledAccent,
    emerald: filledAccent, // устаревший псевдоним primary
    secondary:
      'bg-white/75 hover:bg-white text-slate-900 border border-white/80 shadow-[inset_0_1px_0_#fff,0_4px_12px_rgba(40,48,110,0.08)] focus-visible:ring-slate-400/40',
    danger:
      'bg-[#e5484d] hover:bg-[#d13c41] text-white shadow-[0_6px_18px_rgba(229,72,77,0.3)] focus-visible:ring-rose-400/40',
    ghost:
      'bg-transparent text-accent-700 hover:bg-gd-accent-light focus-visible:ring-accent-500/30',
    outline:
      'bg-gd-accent-light text-accent-700 hover:bg-accent-500/20 focus-visible:ring-accent-500/30',
    toolbar:
      'bg-white/75 hover:bg-white text-slate-900 border border-white/80 focus-visible:ring-slate-400/40',
  };

  const sizes = {
    xs: 'text-[11px] h-6 px-2.5 gap-1 rounded-full',
    sm: 'text-[12.5px] h-8 px-3 gap-1.5 rounded-full',
    md: 'text-[13px] h-9 px-4 gap-2 rounded-full',
    lg: 'text-[14px] h-11 px-5 gap-2 rounded-full',
  };

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current"
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
