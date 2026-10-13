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
          <label htmlFor={inputId} className="block px-1 text-[12px] font-medium text-slate-500">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            value={value}
            className={twMerge(
              clsx(
                'block w-full rounded-[10px] border border-transparent bg-gd-fill p-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-gd-green focus:bg-white focus:ring-4 focus:ring-emerald-500/15 resize-none',
                showClear && hasValue && 'pr-7',
                error && 'border-[#ff3b30]/60 focus:border-[#ff3b30] focus:ring-[#ff3b30]/15',
                className
              )
            )}
            {...props}
          />
          {showClear && hasValue && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2.5 right-2 w-5 h-5 grid place-items-center rounded-full bg-slate-400 text-white hover:bg-slate-500 transition-colors cursor-pointer"
              title="Очистить"
            >
              <X className="w-3 h-3" strokeWidth={3} />
            </button>
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

Textarea.displayName = 'Textarea';
