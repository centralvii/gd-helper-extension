import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  isAction?: boolean; // For items like "+ Создать раздел..."
  badge?: string;
}

export interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
  leftIcon?: React.ReactNode;
  id?: string;
  name?: string;
  title?: string;
  'aria-label'?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Выберите…',
  disabled = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  size = 'md',
  leftIcon,
  id,
  title,
  'aria-label': ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<React.CSSProperties | null>(null);

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Esc закрывает только список (событие помечается обработанным — шторка под ним остаётся открытой)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Меню рендерится в портале с fixed-позицией: стеклянные группы (overflow: hidden)
  // его не обрезают. Если снизу мало места — раскрывается вверх.
  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const trigger = containerRef.current?.getBoundingClientRect();
      if (!trigger) return;
      const gap = 6;
      const margin = 8;
      const menuHeight = Math.min(menuRef.current?.scrollHeight ?? 256, 256);
      const spaceBelow = window.innerHeight - trigger.bottom - margin;
      const openUp = spaceBelow < menuHeight && trigger.top > spaceBelow;
      // Выравнивание по левому краю триггера; не влезает — по правому
      const menuWidth = Math.max(trigger.width, menuRef.current?.offsetWidth ?? 0);
      const fitsRight = trigger.left + menuWidth <= window.innerWidth - margin;
      const left = Math.max(margin, fitsRight ? trigger.left : trigger.right - menuWidth);
      setMenuPos({
        position: 'fixed',
        left,
        minWidth: trigger.width,
        maxWidth: window.innerWidth - margin * 2,
        maxHeight: Math.max(120, Math.min(256, openUp ? trigger.top - gap - margin : spaceBelow - gap)),
        ...(openUp
          ? { bottom: window.innerHeight - trigger.top + gap }
          : { top: trigger.bottom + gap }),
      });
    };
    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    document.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string, optDisabled?: boolean) => {
    if (optDisabled) return;
    onChange(optValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Клавиатура: при открытии фокус на выбранном пункте, ↑↓ / Home / End — навигация
  const getOptionButtons = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? []);

  useEffect(() => {
    if (!isOpen || !menuPos) return;
    const buttons = getOptionButtons();
    const selected = menuRef.current?.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]:not(:disabled)');
    (selected ?? buttons[0])?.focus({ preventScroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, Boolean(menuPos)]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || isOpen) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = getOptionButtons();
    if (buttons.length === 0) return;
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;
    if (e.key === 'ArrowDown') next = idx < 0 ? 0 : (idx + 1) % buttons.length;
    else if (e.key === 'ArrowUp') next = idx < 0 ? buttons.length - 1 : (idx - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else if (e.key === 'Tab') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (next >= 0) {
      e.preventDefault();
      buttons[next].focus();
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-[12px] rounded-lg min-h-[30px]'
      : 'px-3 py-1.5 text-[13px] rounded-xl min-h-[36px]';

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        title={title}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={`gd-select-trigger w-full flex items-center justify-between gap-2 border text-left transition-all cursor-pointer ${
          isOpen
            ? 'bg-white border-gd-accent ring-4 ring-accent-500/15'
            : 'bg-gd-fill border-transparent hover:bg-white/70'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : ''
        } ${sizeClasses} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leftIcon && <span className="flex-shrink-0 text-slate-400">{leftIcon}</span>}
          {selectedOption ? (
            <span className="flex items-center gap-1.5 truncate text-slate-900 font-medium">
              {selectedOption.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="px-1.5 py-px rounded-full bg-gd-accent-light text-gd-accent text-[10px] font-bold flex-shrink-0 ml-1">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        {/* Custom Chevron Down */}
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-gd-accent' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          onKeyDown={handleMenuKeyDown}
          style={menuPos ?? { position: 'fixed', visibility: 'hidden' }}
          className={`gd-menu z-[70] p-1 overflow-y-auto animate-slide-down origin-top ${dropdownClassName}`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-center text-slate-400 text-[11px]">
              Нет доступных вариантов
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-[13px] transition-colors cursor-pointer outline-none focus-visible:bg-gd-fill ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-50'
                      : opt.isAction
                      ? 'text-gd-accent font-semibold hover:bg-gd-accent-light border-t border-gd-border mt-0.5'
                      : isSelected
                      ? 'text-slate-900 font-semibold'
                      : 'text-slate-900 hover:bg-gd-fill font-normal'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="px-1.5 py-px rounded-full bg-gd-accent-light text-gd-accent text-[10px] font-bold flex-shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  {isSelected && !opt.isAction && (
                    <Check className="w-4 h-4 text-gd-accent flex-shrink-0 ml-1" strokeWidth={2.5} />
                  )}
                </button>
              );
            })
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
