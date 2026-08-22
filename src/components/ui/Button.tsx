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
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.97]';

  const variants = {
    primary:
      'bg-[#22c55e] text-white border border-[#16a34a] hover:bg-[#16a34a] hover:shadow-[0_2px_10px_rgba(34,197,94,0.3)] focus:ring-2 focus:ring-[#22c55e]/30',
    emerald:
      'bg-[#22c55e] text-white border border-[#16a34a] hover:bg-[#16a34a] hover:shadow-[0_4px_14px_rgba(34,197,94,0.35)] focus:ring-2 focus:ring-[#22c55e]/30',
    secondary:
      'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-gray-200',
    danger:
      'bg-red-500 text-white border border-red-600 hover:bg-red-600 focus:ring-2 focus:ring-red-300',
    ghost:
      'bg-transparent text-gray-600 hover:bg-[#dcfce7] hover:text-[#16a34a] focus:ring-2 focus:ring-[#22c55e]/20',
    outline:
      'bg-transparent text-[#16a34a] border border-[rgba(34,197,94,0.4)] hover:bg-[#dcfce7] hover:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20',
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-1 gap-1',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
