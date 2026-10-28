import { Search, Route } from 'lucide-react';
import { cn } from '../lib/cn';

export type Tab = 'search' | 'route';

export function BottomNav({ tab, onTab, count }: { tab: Tab; onTab: (t: Tab) => void; count: number }) {
  const items = [
    { id: 'search' as const, label: 'Поиск', icon: Search },
    { id: 'route' as const, label: 'Маршрут', icon: Route },
  ];
  return (
    <nav
      aria-label="Разделы"
      className="fixed inset-x-0 bottom-0 z-40 px-4 lg:hidden"
      style={{ paddingBottom: 'calc(var(--sab) + 10px)' }}
    >
      <div className="gd-glass mx-auto flex max-w-md gap-1 rounded-full p-1.5">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onTab(it.id)}
            aria-current={tab === it.id ? 'page' : undefined}
            className={cn(
              'flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full text-[14px] font-semibold transition-colors',
              tab === it.id ? 'bg-accent-600 text-white' : 'text-slate-700 hover:text-accent-700',
            )}
          >
            <it.icon size={18} aria-hidden="true" />
            {it.label}
            {it.id === 'route' && (
              <span
                aria-label={`мест в маршруте: ${count}`}
                className={cn(
                  'min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[12px] font-bold',
                  tab === 'route' ? 'bg-white/25 text-white' : 'bg-[var(--gd-accent-light)] text-accent-700',
                )}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
