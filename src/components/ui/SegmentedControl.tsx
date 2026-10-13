import React, { useLayoutEffect, useRef, useState } from 'react';
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

interface ThumbRect {
  left: number;
  width: number;
}

/**
 * Сегментный переключатель iOS: белый «ползунок» плавно переезжает
 * под выбранный сегмент на пружине.
 */
export function SegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  size = 'sm',
  className,
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    xs: 'h-6 px-2 text-[11px]',
    sm: 'h-7 px-2.5 text-[12px]',
    md: 'h-8 px-3 text-[13px]',
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [thumb, setThumb] = useState<ThumbRect | null>(null);
  const activeIndex = options.findIndex((opt) => opt.value === value);

  useLayoutEffect(() => {
    const measure = () => {
      const btn = buttonRefs.current[activeIndex];
      if (!btn) {
        setThumb(null);
        return;
      }
      setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (observer && containerRef.current) observer.observe(containerRef.current);
    return () => observer?.disconnect();
  }, [activeIndex, options.length]);

  return (
    <div
      ref={containerRef}
      className={twMerge(
        'relative inline-flex items-center p-0.5 bg-gd-fill rounded-[9px] flex-shrink-0 select-none',
        className
      )}
    >
      {thumb && (
        <span
          aria-hidden
          className="absolute top-0.5 bottom-0.5 rounded-[7px] bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)] transition-[left,width] duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)]"
          style={{ left: thumb.left, width: thumb.width }}
        />
      )}
      {options.map((opt, idx) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.title}
            className={twMerge(
              clsx(
                'relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-[7px] font-semibold leading-none whitespace-nowrap transition-colors duration-200 cursor-pointer',
                sizeClasses[size],
                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
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
