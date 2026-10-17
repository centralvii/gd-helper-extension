import React from 'react';
import { Archive, ListChecks, SquareCheckBig, Zap, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { ActiveTool } from '../../types';

interface TabBarProps {
  activeTool: ActiveTool;
  fileCount: number;
  onSelectTool: (tool: ActiveTool) => void;
}

interface TabItem {
  id: ActiveTool;
  label: string;
  title: string;
  Icon: LucideIcon;
}

const TABS: TabItem[] = [
  { id: 'packer', label: 'Упаковка', title: 'Упаковка GUF файлов', Icon: Archive },
  { id: 'implementation', label: 'Реализация', title: 'Инструмент описания реализации', Icon: ListChecks },
  { id: 'youtrack', label: 'YouTrack', title: 'Задачи YouTrack (РЭЦ_Fin)', Icon: SquareCheckBig },
  { id: 'extra', label: 'Утилиты', title: 'Утилиты: генератор ID алгоритмов', Icon: Zap },
];

/**
 * Нижний таб-бар в стиле iOS (4 раздела): стекло, иконка + подпись, счётчик-бейдж.
 * Иконка активного таба подпрыгивает при нажатии (глобальная анимация иконок).
 */
export const TabBar: React.FC<TabBarProps> = ({ activeTool, fileCount, onSelectTool }) => (
  <nav
    className="fixed inset-x-0 bottom-0 z-40 gd-glass border-t border-gd-border"
    style={{ height: 'var(--tabbar-h)' }}
    aria-label="Разделы"
  >
    <div className="mx-auto flex h-full max-w-xl items-stretch justify-around px-1 pb-1">
      {TABS.map(({ id, label, title, Icon }) => {
        const isActive = activeTool === id;
        const badge = id === 'packer' && fileCount > 0 ? fileCount : null;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectTool(id)}
            title={title}
            aria-current={isActive ? 'page' : undefined}
            data-icon-anim="bounce"
            className={clsx(
              'relative flex flex-1 flex-col items-center justify-center gap-[3px] pt-1 text-[10px] font-medium tracking-[-0.01em] cursor-pointer select-none',
              isActive ? 'text-gd-green' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.3 : 1.9} />
            <span className={isActive ? 'font-semibold' : ''}>{label}</span>
            {badge !== null && (
              <span className="absolute top-0.5 left-1/2 ml-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#ff3b30] text-white text-[10px] font-bold leading-[17px] text-center tabular-nums ring-2 ring-[#f9f9fb] animate-pop-in">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </nav>
);
