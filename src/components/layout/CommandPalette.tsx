import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { PaletteCommand } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
}

const MAX_PER_GROUP = 6;

/** Подсветка совпадения запроса в названии команды */
const highlight = (text: string, query: string): React.ReactNode => {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <b className="font-semibold">{text.slice(idx, idx + query.length)}</b>
      {text.slice(idx + query.length)}
    </>
  );
};

/**
 * Командная палитра (Ctrl/⌘ + K): поиск по действиям, разделам, задачам и пакетам.
 * ↑↓ — выбор, Enter — выполнить, Esc — закрыть.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Отфильтрованные команды, сгруппированные с сохранением порядка групп
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? commands.filter((c) =>
          `${c.title} ${c.subtitle ?? ''} ${c.keywords ?? ''}`.toLowerCase().includes(q)
        )
      : commands;
    const byGroup = new Map<string, PaletteCommand[]>();
    matched.forEach((c) => {
      const list = byGroup.get(c.group) ?? [];
      if (list.length < MAX_PER_GROUP) list.push(c);
      byGroup.set(c.group, list);
    });
    return Array.from(byGroup.entries());
  }, [commands, query]);

  const flat = useMemo(() => groups.flatMap(([, list]) => list), [groups]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(flat.length - 1, 0)));
  }, [flat.length]);

  // Держим выбранную строку в видимой области
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-cmd-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  const runCommand = (cmd: PaletteCommand | undefined) => {
    if (!cmd) return;
    onClose();
    cmd.run();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(flat[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  let runningIndex = -1;

  return createPortal(
    <div className="fixed inset-0 z-[60]" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-[#1b1f3b]/20 backdrop-blur-[2px] modal-backdrop-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Командная палитра"
        className="gd-glass absolute inset-x-3 top-14 mx-auto flex max-h-[70vh] max-w-md flex-col rounded-[24px] p-2 animate-pop-in origin-top"
      >
        <label className="flex h-11 items-center gap-2.5 border-b border-gd-border px-2.5 text-gd-accent">
          <Search className="h-[18px] w-[18px] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Команда, задача или пакет"
            aria-label="Поиск команды"
            className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-gd-faint"
          />
          <span className="gd-kbd">esc</span>
        </label>

        <div ref={listRef} className="overflow-y-auto overscroll-contain py-1">
          {flat.length === 0 && (
            <div className="px-3 py-6 text-center text-[13px] text-gd-muted">Ничего не найдено</div>
          )}
          {groups.map(([group, list]) => (
            <div key={group}>
              <div className="gd-label px-3 pb-1 pt-2.5">{group}</div>
              {list.map((cmd) => {
                runningIndex += 1;
                const index = runningIndex;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    data-cmd-index={index}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => runCommand(cmd)}
                    className={clsx(
                      'flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[13px] cursor-pointer !scale-100',
                      isActive ? 'bg-gd-accent text-white' : 'text-slate-900'
                    )}
                  >
                    <span
                      className={clsx(
                        'grid h-[26px] w-[26px] flex-shrink-0 place-items-center rounded-lg [&>svg]:h-3.5 [&>svg]:w-3.5',
                        isActive ? 'bg-white/20 text-white' : 'bg-white/80 text-slate-700'
                      )}
                    >
                      {cmd.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {highlight(cmd.title, query.trim())}
                      {cmd.subtitle && (
                        <span className={clsx('ml-1.5 text-[11.5px]', isActive ? 'text-white/75' : 'text-gd-muted')}>
                          {cmd.subtitle}
                        </span>
                      )}
                    </span>
                    {cmd.shortcut && (
                      <span className={clsx('gd-kbd', isActive && '!border-white/40 !bg-transparent !text-white')}>
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex gap-3.5 border-t border-gd-border px-3 pb-1 pt-2 text-[11px] text-gd-muted">
          <span><span className="gd-kbd">↑↓</span> выбор</span>
          <span><span className="gd-kbd">↵</span> выполнить</span>
          <span><span className="gd-kbd">Alt 1–4</span> разделы</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
