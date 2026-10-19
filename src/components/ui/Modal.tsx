import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { isModKey } from '../../utils/shortcuts';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Основное действие шторки: Ctrl/⌘ + Enter в любом поле и Enter
   * в однострочном поле. Обработчик сам проверяет валидность.
   */
  onSubmit?: () => void;
  /** Куда ставить фокус при открытии: первое поле ввода (по умолчанию) или сама шторка */
  initialFocus?: 'field' | 'sheet';
}

const CLOSE_ANIMATION_MS = 260;
const DRAG_CLOSE_THRESHOLD_PX = 110;

// Сколько шторок открыто сейчас — фон «утапливается», пока открыта хотя бы одна
let openSheetsCount = 0;
const setSheetOpen = (open: boolean) => {
  openSheetsCount = Math.max(0, openSheetsCount + (open ? 1 : -1));
  document.body.classList.toggle('gd-sheet-open', openSheetsCount > 0);
};

// Стек открытых шторок: Esc закрывает только верхнюю
let sheetIdSeq = 0;
const sheetStack: number[] = [];

const FIELD_SELECTOR =
  'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SINGLE_LINE_INPUT_TYPES = new Set(['text', 'search', 'url', 'email', 'number', 'tel', 'password']);

/**
 * Модальное окно в виде iOS-шторки (sheet):
 * выезжает снизу на пружине, страница под ней уменьшается и затемняется,
 * закрывается крестиком, по Esc, тапом по фону или свайпом вниз за шапку.
 * Клавиатура: фокус на первом поле при открытии, Tab не уходит за шторку,
 * Ctrl/⌘ + Enter (и Enter в однострочном поле) — основное действие (`onSubmit`),
 * после закрытия фокус возвращается туда, откуда шторку открыли.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  onSubmit,
  initialFocus = 'field',
}) => {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [mounted, setMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; dy: number; pointerId: number } | null>(null);
  const sheetIdRef = useRef(0);
  if (sheetIdRef.current === 0) {
    sheetIdSeq += 1;
    sheetIdRef.current = sheetIdSeq;
  }
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  // Синхронно реагируем на смену isOpen во время рендера
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setMounted(true);
      setIsClosing(false);
    } else if (mounted) {
      setIsClosing(true);
    }
  }

  // Кэш содержимого: при анимации закрытия контент не пропадает и не схлопывается
  const cachedChildrenRef = useRef(children);
  const cachedFooterRef = useRef(footer);
  const cachedTitleRef = useRef(title);

  if (isOpen) {
    if (children) cachedChildrenRef.current = children;
    if (footer !== undefined) cachedFooterRef.current = footer;
    if (title) cachedTitleRef.current = title;
  }

  // Таймер анимации закрытия
  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, CLOSE_ANIMATION_MS);
      return () => clearTimeout(timer);
    }
  }, [isClosing]);

  // «Утопленный» фон, пока шторка видна
  const isPresented = mounted && !isClosing;
  useEffect(() => {
    if (!isPresented) return;
    setSheetOpen(true);
    const id = sheetIdRef.current;
    sheetStack.push(id);
    return () => {
      setSheetOpen(false);
      const idx = sheetStack.lastIndexOf(id);
      if (idx !== -1) sheetStack.splice(idx, 1);
    };
  }, [isPresented]);

  // Esc — только верхняя шторка и только если событие не обработано
  // вложенным элементом (выпадающий список, меню, командная палитра)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isOpen || isClosing || e.defaultPrevented) return;
      if (sheetStack[sheetStack.length - 1] !== sheetIdRef.current) return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, onClose]);

  // Фокус: при открытии — первое поле (или сама шторка), при закрытии — обратно
  useEffect(() => {
    if (!isPresented) return;
    const opener = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      const sheet = sheetRef.current;
      if (!sheet || sheet.contains(document.activeElement)) return;
      const field =
        initialFocus === 'field'
          ? sheet.querySelector<HTMLElement>(`.gd-sheet-body :is(${FIELD_SELECTOR})`)
          : null;
      (field ?? sheet).focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      const sheet = sheetRef.current;
      const active = document.activeElement;
      const focusIsLost = !active || active === document.body || Boolean(sheet?.contains(active));
      if (opener && opener !== document.body && opener.isConnected && focusIsLost) {
        opener.focus({ preventScroll: true });
      }
    };
    // initialFocus читается только в момент открытия
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresented]);

  // Клавиатура внутри шторки: ловушка Tab и основное действие
  const handleSheetKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const sheet = sheetRef.current;
    if (!sheet || e.defaultPrevented) return;

    if (e.key === 'Tab') {
      const focusables = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === sheet)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || active === sheet)) {
        e.preventDefault();
        first.focus();
      }
      return;
    }

    const submit = onSubmitRef.current;
    if (e.key !== 'Enter' || !submit || e.nativeEvent.isComposing) return;
    const target = e.target as HTMLElement;
    const isSingleLineInput =
      target instanceof HTMLInputElement && SINGLE_LINE_INPUT_TYPES.has(target.type);
    if (isModKey(e) || (isSingleLineInput && !e.shiftKey && !e.altKey)) {
      e.preventDefault();
      submit();
    }
  };

  const requestClose = () => {
    if (!isClosing) onClose();
  };

  // ── Свайп вниз за шапку ──
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as Element).closest('button')) return;
    dragRef.current = { startY: e.clientY, dy: 0, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !sheetRef.current) return;
    const raw = e.clientY - drag.startY;
    // Вверх тянется с сопротивлением, вниз — свободно
    drag.dy = raw < 0 ? raw / 6 : raw;
    sheetRef.current.style.transform = `translateY(${drag.dy}px)`;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    const sheet = sheetRef.current;
    if (!sheet) return;
    if (drag.dy > DRAG_CLOSE_THRESHOLD_PX) {
      sheet.style.setProperty('--sheet-drag', `${drag.dy}px`);
      sheet.style.transform = '';
      sheet.style.transition = '';
      requestClose();
    } else {
      sheet.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1)';
      sheet.style.transform = 'translateY(0)';
    }
  };

  if (!mounted && !isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const renderedChildren = children || cachedChildrenRef.current;
  const renderedFooter = footer !== undefined ? footer : cachedFooterRef.current;
  const renderedTitle = title || cachedTitleRef.current;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Затемнение */}
      <div
        className={`fixed inset-0 bg-[#1b1f3b]/25 pointer-events-auto ${
          isClosing ? 'modal-backdrop-out' : 'modal-backdrop-in'
        }`}
        onClick={requestClose}
      />

      {/* Шторка */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label={renderedTitle}
          tabIndex={-1}
          onKeyDown={handleSheetKeyDown}
          className={`outline-none w-[calc(100%-12px)] mb-1.5 ${maxWidthClasses[maxWidth]} flex flex-col overflow-hidden max-h-[92vh] rounded-[28px] pointer-events-auto bg-[rgba(246,247,252,0.9)] backdrop-blur-[30px] backdrop-saturate-[180%] border border-white/80 shadow-[inset_0_1px_0_#fff,0_-10px_50px_rgba(30,36,90,0.25)] ${
            isClosing ? 'modal-sheet-out' : 'modal-sheet-in'
          }`}
        >
          {/* Шапка: «ручка» + заголовок. За неё шторку можно стянуть вниз */}
          <div
            className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="flex justify-center pt-1.5">
              <div className="w-9 h-[5px] rounded-full bg-slate-300/80" />
            </div>
            <div className="relative flex items-center justify-center px-12 pt-2 pb-3">
              <h3 className="text-[15px] font-semibold text-slate-900 tracking-[-0.01em] truncate">
                {renderedTitle}
              </h3>
              <button
                type="button"
                onClick={requestClose}
                title="Закрыть (Esc)"
                aria-label="Закрыть"
                className="absolute right-3 top-1 icon-btn !w-[30px] !h-[30px] text-slate-500"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <div className="h-px bg-gd-border mx-0" />
          </div>

          {/* Содержимое */}
          <div className="gd-sheet-body px-4 py-4 overflow-y-auto flex-1 space-y-4 text-[13px] text-slate-900 overscroll-contain">
            {renderedChildren}
          </div>

          {/* Действия */}
          {renderedFooter && (
            <div className="flex flex-wrap items-center justify-end gap-2 px-4 pt-3 pb-4 border-t border-gd-border flex-shrink-0">
              {renderedFooter}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
