import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Узкая центрированная модалка (подтверждения). */
  compact?: boolean;
}

/** Нижняя шторка на телефоне, модалка по центру на компьютере. */
export function Modal({ open, onClose, title, children, compact }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" role="presentation">
      <div className="anim-fade absolute inset-0 bg-[rgba(27,31,59,0.45)]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'gd-glass anim-sheet relative flex max-h-[90dvh] w-full flex-col overflow-hidden outline-none',
          'rounded-t-[28px] pb-[var(--sab)] lg:rounded-[28px] lg:pb-0',
          compact ? 'lg:max-w-md' : 'lg:max-w-2xl',
          'mx-0 lg:mx-4',
        )}
        style={{ background: 'rgba(250,251,255,0.94)' }}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-300 lg:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between gap-2 px-5 pb-1 pt-3">
          <h2 className="min-w-0 truncate text-[17px] font-bold tracking-[-0.02em]">{title}</h2>
          <Button variant="ghost" icon aria-label="Закрыть" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <div className="scroll-y min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
