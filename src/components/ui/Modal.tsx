import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const CLOSE_ANIMATION_MS = 260;
const DRAG_CLOSE_THRESHOLD_PX = 110;

// Сколько шторок открыто сейчас — фон «утапливается», пока открыта хотя бы одна
let openSheetsCount = 0;
const setSheetOpen = (open: boolean) => {
  openSheetsCount = Math.max(0, openSheetsCount + (open ? 1 : -1));
  document.body.classList.toggle('gd-sheet-open', openSheetsCount > 0);
};

/**
 * Модальное окно в виде iOS-шторки (sheet):
 * выезжает снизу на пружине, страница под ней уменьшается и затемняется,
 * закрывается крестиком, по Esc, тапом по фону или свайпом вниз за шапку.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [mounted, setMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; dy: number; pointerId: number } | null>(null);

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

  // Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, onClose]);

  // «Утопленный» фон, пока шторка видна
  const isPresented = mounted && !isClosing;
  useEffect(() => {
    if (!isPresented) return;
    setSheetOpen(true);
    return () => setSheetOpen(false);
  }, [isPresented]);

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
        className={`fixed inset-0 bg-black/30 pointer-events-auto ${
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
          className={`w-full ${maxWidthClasses[maxWidth]} bg-white flex flex-col overflow-hidden max-h-[92vh] rounded-t-2xl pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.18)] ${
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
              <div className="w-9 h-[5px] rounded-full bg-slate-300" />
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
                className="absolute right-3 top-1.5 w-[30px] h-[30px] rounded-full bg-gd-fill text-slate-500 hover:text-slate-900 hover:bg-slate-200 grid place-items-center cursor-pointer"
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
