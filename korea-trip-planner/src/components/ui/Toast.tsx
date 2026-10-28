import { CheckCircle2, AlertTriangle } from 'lucide-react';

export interface ToastMsg {
  id: number;
  key: string;
  text: string;
  error?: boolean;
}

export function Toasts({ items }: { items: ToastMsg[] }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
      style={{ top: 'calc(var(--sat) + 12px)' }}
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((t) => (
        <div
          key={t.key}
          className="gd-glass anim-sheet flex max-w-md items-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-medium"
        >
          {t.error ? (
            <AlertTriangle size={16} className="shrink-0 text-[var(--gd-red-ink)]" />
          ) : (
            <CheckCircle2 size={16} className="shrink-0 text-[var(--gd-success-ink)]" />
          )}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
