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
 * Плавающий стеклянный док (Aurora Glass): капсула с 4 разделами.
 * Активный раздел — белая «линза» с индиго-иконкой; счётчик файлов — на «Упаковке».
 * Иконка подпрыгивает при нажатии (глобальная анимация иконок).
 */
export const TabBar: React.FC<TabBarProps> = ({ activeTool, fileCount, onSelectTool }) => (
  <>
  {/* Мягкое затухание контента под доком */}
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-[150px] bg-gradient-to-t from-[#eef1fa] via-[#eef1fa]/75 to-[#eef1fa]/0"
  />
  <nav className="fixed inset-x-3 bottom-3 z-40" aria-label="Разделы">
    <div className="gd-glass mx-auto flex h-[60px] max-w-xl items-stretch gap-0.5 rounded-[30px] p-[5px]">
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
              'relative flex flex-1 flex-col items-center justify-center gap-[2px] rounded-[25px] text-[10px] tracking-[-0.01em] cursor-pointer select-none transition-[background-color,box-shadow,color] duration-300',
              isActive
                ? 'bg-white/90 text-gd-accent font-semibold shadow-[0_4px_14px_rgba(40,48,110,0.14)]'
                : 'text-slate-600 font-medium hover:bg-white/40'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.9} />
            <span>{label}</span>
            {badge !== null && (
              <span className="absolute top-1 right-[calc(50%-22px)] min-w-[16px] h-4 px-1 rounded-full bg-gd-accent text-white text-[9.5px] font-semibold leading-4 text-center tabular-nums font-mono animate-pop-in">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </nav>
  </>
);
