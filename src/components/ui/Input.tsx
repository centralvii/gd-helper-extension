import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftElement,
      rightElement,
      size = 'md',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const sizeClasses = {
      sm: 'px-2.5 py-1 text-xs rounded-lg min-h-[30px]',
      md: 'px-3 py-2 text-[13px] rounded-xl min-h-[36px]',
    };

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block px-1 text-[12px] font-medium text-slate-500">
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                'block w-full bg-gd-fill border border-transparent text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:border-gd-accent focus:ring-4 focus:ring-accent-500/15 focus:outline-none disabled:opacity-50 font-normal',
                sizeClasses[size],
                leftElement && 'pl-8',
                rightElement && 'pr-8',
                error && 'border-[#ff3b30]/60 bg-[#ff3b30]/[0.06] focus:border-[#ff3b30] focus:ring-[#ff3b30]/15',
                className
              )
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="px-1 text-[11px] font-medium text-[#d70015]">{error}</p>
        ) : helperText ? (
          <p className="px-1 text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
