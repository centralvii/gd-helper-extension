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
      sm: 'px-2.5 py-1 text-xs rounded-xl min-h-[30px]',
      md: 'px-3 py-2 text-xs rounded-xl min-h-[36px]',
    };

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-800">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-2xs">
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
                'block w-full bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none disabled:opacity-50 disabled:bg-slate-50 font-normal',
                sizeClasses[size],
                leftElement && 'pl-8.5',
                rightElement && 'pr-8.5',
                error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15',
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
          <p className="text-[10.5px] font-medium text-rose-600">{error}</p>
        ) : helperText ? (
          <p className="text-[10.5px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
