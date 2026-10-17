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
  // iOS: круглые кнопки-иконки
  const sizes = {
    xs: 'w-6 h-6 rounded-full text-xs',
    sm: 'w-7 h-7 rounded-full text-xs',
    md: 'w-8 h-8 rounded-full text-sm',
  };

  const variants = {
    ghost: clsx(
      'text-slate-500 hover:text-slate-900 hover:bg-gd-fill',
      isActive && 'bg-gd-fill text-slate-900'
    ),
    secondary: clsx(
      'bg-gd-fill text-slate-900 hover:bg-slate-200',
      isActive && 'bg-slate-200'
    ),
    danger: clsx(
      'text-slate-500 hover:text-[#ff3b30] hover:bg-[#ff3b30]/10',
      isActive && 'bg-[#ff3b30]/10 text-[#ff3b30]'
    ),
    emerald: clsx(
      'text-slate-500 hover:text-gd-accent hover:bg-gd-accent-light',
      isActive && 'bg-gd-accent-light text-gd-accent'
    ),
    sky: clsx(
      'text-slate-500 hover:text-[#007aff] hover:bg-[#007aff]/10',
      isActive && 'bg-[#007aff]/10 text-[#007aff]'
    ),
  };

  return (
    <button
      type={type}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex-shrink-0',
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
