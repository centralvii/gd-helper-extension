import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  title?: string;
}

interface SegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  size = 'sm',
  className,
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    xs: 'h-6 px-2 text-[10px]',
    sm: 'h-7 px-2.5 text-[11px]',
    md: 'h-8 px-3 text-xs',
  };

  return (
    <div
      className={twMerge(
        'inline-flex items-center p-0.5 bg-slate-100/90 border border-slate-200/90 rounded-xl shadow-2xs flex-shrink-0 select-none',
        className
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.title}
            className={twMerge(
              clsx(
                'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold leading-none transition-all duration-150 cursor-pointer',
                sizeClasses[size],
                isActive
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent'
              )
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.badge}
          </button>
        );
      })}
    </div>
  );
}
