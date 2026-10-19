import React, { useEffect, useState } from 'react';
import { Maximize2, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { MOD_KEY_LABEL } from '../../utils/shortcuts';

interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Открыть командную палитру (⌘K) */
  onOpenPalette?: () => void;
  /** Дополнительные круглые кнопки справа */
  actions?: React.ReactNode;
}

const COLLAPSE_AT_PX = 24;

/**
 * Шапка Aurora Glass: заголовок раздела с подзаголовком и стеклянные кнопки
 * (⌘K, «Во весь экран»). При прокрутке сжимается в плавающую стеклянную капсулу.
 * Прокручивается #root (см. src/index.css), поэтому слушаем его.
 */
export const Header: React.FC<HeaderProps> = ({ title, subtitle, onOpenPalette, actions }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const scroller = document.getElementById('root');
    if (!scroller) return;
    const onScroll = () => setIsCollapsed(scroller.scrollTop > COLLAPSE_AT_PX);
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  const handleOpenFullscreen = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <header className="sticky top-0 z-30 px-2 pt-2">
      <div
        className={clsx(
          'flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isCollapsed
            ? 'gd-glass rounded-[22px] py-1.5 pl-4 pr-1.5'
            : 'rounded-[22px] border border-transparent px-2 pt-2 pb-2.5'
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <h1
            key={title}
            className={clsx(
              'truncate font-bold tracking-[-0.03em] text-slate-900 transition-[font-size] duration-300 animate-fade-in',
              isCollapsed ? 'text-[16px]' : 'text-[24px] leading-[1.15]'
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <div
              className={clsx(
                'truncate text-[12px] text-gd-muted transition-all duration-200',
                isCollapsed ? 'h-0 opacity-0' : 'h-4 opacity-100'
              )}
            >
              {subtitle}
            </div>
          )}
        </div>
        {actions}
        {onOpenPalette && (
          <button
            type="button"
            onClick={onOpenPalette}
            title={`Командная палитра (${MOD_KEY_LABEL} + K)`}
            aria-label="Командная палитра"
            className="icon-btn !w-auto gap-1.5 px-2.5"
          >
            <Search className="h-[15px] w-[15px]" />
            <span className="font-mono text-[10.5px] text-gd-muted">{MOD_KEY_LABEL} K</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleOpenFullscreen}
          title="Открыть в отдельной вкладке во весь экран"
          aria-label="Во весь экран"
          className="icon-btn"
        >
          <Maximize2 className="h-[15px] w-[15px]" />
        </button>
      </div>
    </header>
  );
};
