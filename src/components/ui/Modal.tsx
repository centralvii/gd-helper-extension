import React, { useState, useEffect, useRef } from 'react';
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
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered && !isClosing) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered, isClosing]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, onClose]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isRendered) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isRendered]);

  if (!isRendered) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden pointer-events-auto">
      {/* Backdrop with Fade-In / Fade-Out */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] ${
          isClosing ? 'modal-backdrop-out' : 'modal-backdrop-in'
        }`}
        onClick={() => {
          if (!isClosing) onClose();
        }}
      />

      {/* Modal Container — smooth slide-up from bottom on open, slide-down on close */}
      <div
        ref={contentRef}
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white border border-gray-200 shadow-2xl
          flex flex-col max-h-[92vh] z-10 rounded-t-2xl sm:rounded-2xl ${
            isClosing ? 'modal-content-out' : 'modal-content-in'
          }`}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="w-full flex justify-center pt-2 pb-0.5 sm:hidden bg-white rounded-t-2xl">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white rounded-t-2xl flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-900">
            {title}
          </h3>
          <button
            onClick={() => {
              if (!isClosing) onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs text-gray-700">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
