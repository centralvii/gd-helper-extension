import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'tint' | 'ghost' | 'danger' | 'danger-ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent-600 text-white hover:bg-accent-700 shadow-[0_6px_16px_rgba(79,91,213,0.28)]',
  tint: 'bg-[var(--gd-accent-light)] text-accent-700 hover:bg-accent-200/60',
  ghost: 'bg-white/70 text-slate-900 hover:bg-white hover:text-accent-700',
  danger: 'bg-gd-red text-white hover:brightness-95',
  'danger-ghost': 'bg-white/70 text-[var(--gd-red-ink)] hover:bg-red-50',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Квадратная круглая кнопка только с иконкой (требует aria-label). */
  icon?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'tint', icon, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold transition-colors',
        'min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50',
        icon ? 'min-w-[44px] p-0' : 'px-4',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
});
