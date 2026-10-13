import React, { useEffect, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';

interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Дополнительные круглые кнопки справа (перед «Во весь экран») */
  actions?: React.ReactNode;
  /** Только компактная строка без крупного заголовка (ИИ-чат) */
  compact?: boolean;
}

const COLLAPSE_AT_PX = 34;

/**
 * Навигационная панель iOS: крупный заголовок, который при прокрутке
 * сворачивается в компактную строку со стеклянным фоном.
 * Прокручивается #root (см. src/index.css), поэтому слушаем его.
 */
export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions, compact = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const scroller = document.getElementById('root');
    if (!scroller) return;
    const onScroll = () => setIsCollapsed(scroller.scrollTop > COLLAPSE_AT_PX);
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  const showSmallTitle = compact || isCollapsed;

  const handleOpenFullscreen = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <>
      {/* Компактная строка (всегда прилипает к верху) */}
      <header
        className={clsx(
          'sticky top-0 z-30 transition-[background-color,box-shadow] duration-200',
          showSmallTitle ? 'gd-glass shadow-gd-header' : 'bg-transparent'
        )}
      >
        <div className="relative flex h-11 items-center justify-end gap-2 px-4">
          <div
            className={clsx(
              'pointer-events-none absolute inset-x-24 text-center text-[15px] font-semibold tracking-[-0.015em] text-slate-900 truncate transition-all duration-200',
              showSmallTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            )}
          >
            {title}
          </div>
          {actions}
          <button
            type="button"
            onClick={handleOpenFullscreen}
            title="Открыть во весь экран (в новой вкладке)"
            aria-label="Во весь экран"
            className="icon-btn"
          >
            <Maximize2 className="h-[15px] w-[15px]" />
          </button>
        </div>
      </header>

      {/* Крупный заголовок */}
      {!compact && (
        <div
          className={clsx(
            'px-4 pb-3 pt-0.5 transition-opacity duration-200',
            isCollapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          <h1 key={title} className="text-[28px] font-bold leading-[1.1] tracking-[-0.025em] text-slate-900 animate-fade-in">
            {title}
          </h1>
          {subtitle && <div className="mt-0.5 truncate text-[13px] text-gd-muted">{subtitle}</div>}
        </div>
      )}
    </>
  );
};
