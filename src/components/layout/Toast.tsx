import React from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  /** Строка под заголовком (имя файла и т.п.) — моноширинная */
  detail?: string;
  /** Метки справа от заголовка */
  meta?: React.ReactNode;
  onClose: () => void;
}

/**
 * Всплывающее уведомление iOS: стеклянная капсула сверху экрана,
 * выезжает на пружине (animate-toast-in).
 */
export const Toast: React.FC<ToastProps> = ({ icon, title, detail, meta, onClose }) => (
  <div className="fixed top-2 inset-x-3 z-50 flex justify-center pointer-events-none animate-toast-in">
    <div className="pointer-events-auto w-full max-w-sm gd-glass bg-white/85 rounded-[22px] shadow-gd-float pl-2 pr-1.5 py-1.5 flex items-center gap-2.5 select-none">
      <div className="w-8 h-8 rounded-full bg-gd-accent text-white flex items-center justify-center flex-shrink-0 [&_svg]:w-4 [&_svg]:h-4 [&_svg]:animate-icon-pop">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13px] font-semibold text-slate-900 truncate">{title}</span>
          {meta}
        </div>
        {detail && (
          <p className="text-[11.5px] font-mono text-gd-muted truncate leading-tight" title={detail}>
            {detail}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-gd-fill flex items-center justify-center flex-shrink-0 cursor-pointer"
        title="Закрыть уведомление"
        aria-label="Закрыть уведомление"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  </div>
);
