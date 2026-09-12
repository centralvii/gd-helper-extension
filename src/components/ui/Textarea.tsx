import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  onClear?: () => void;
  showClear?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      onClear,
      showClear,
      className,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasValue = Boolean(value && String(value).length > 0);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-800">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-2xs">
          <textarea
            ref={ref}
            id={inputId}
            value={value}
            className={twMerge(
              clsx(
                'w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 shadow-2xs resize-none',
                showClear && hasValue && 'pr-7',
                error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15',
                className
              )
            )}
            {...props}
          />
          {showClear && hasValue && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2.5 right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Очистить"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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

Textarea.displayName = 'Textarea';
