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
  const contentRef = useRef<HTMLDivElement>(null);

  // Synchronously update state on isOpen prop change during render
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setMounted(true);
      setIsClosing(false);
    } else if (mounted) {
      setIsClosing(true);
    }
  }

  // Cache children, footer, and title so during exit animation content never disappears or collapses
  const cachedChildrenRef = useRef(children);
  const cachedFooterRef = useRef(footer);
  const cachedTitleRef = useRef(title);

  if (isOpen) {
    if (children) cachedChildrenRef.current = children;
    if (footer !== undefined) cachedFooterRef.current = footer;
    if (title) cachedTitleRef.current = title;
  }

  // Handle closing animation timer
  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 230);
      return () => clearTimeout(timer);
    }
  }, [isClosing]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, onClose]);

  // Lock body scroll only while modal is active & prevent focus scroll jumps
  useEffect(() => {
    if (!mounted) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    const originalScrollY = window.scrollY;

    const handleFocusIn = () => {
      // If native focus tried to scroll window, restore it immediately
      if (window.scrollY !== originalScrollY) {
        window.scrollTo(0, originalScrollY);
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('focusin', handleFocusIn);
    };
  }, [mounted]);

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
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/60 pointer-events-auto modal-backdrop ${
          isClosing ? 'modal-backdrop-out' : 'modal-backdrop-in'
        }`}
        onClick={() => {
          if (!isClosing) onClose();
        }}
      />

      {/* Sheet Container: permanently and physically anchored to the bottom edge */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
        <div
          ref={contentRef}
          className={`w-full ${maxWidthClasses[maxWidth]} bg-white border-t border-x border-slate-200/90 shadow-2xl
            flex flex-col max-h-[92vh] rounded-t-3xl pointer-events-auto modal-sheet ${
              isClosing ? 'modal-sheet-out' : 'modal-sheet-in'
            }`}
        >
          {/* Mobile / Sheet Pull Handle Indicator */}
          <div className="w-full flex justify-center pt-2.5 pb-1 bg-white rounded-t-3xl flex-shrink-0">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white flex-shrink-0">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {renderedTitle}
            </h3>
            <button
              onClick={() => {
                if (!isClosing) onClose();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
            {renderedChildren}
          </div>

          {/* Footer */}
          {renderedFooter && (
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/70 rounded-b-none flex-shrink-0">
              {renderedFooter}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
