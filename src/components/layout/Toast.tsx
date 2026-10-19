import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { ToastAction, ToastTone } from '../../types';

interface ToastProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  /** Строка под заголовком (имя файла и т.п.) — моноширинная */
  detail?: string;
  /** Метки справа от заголовка */
  meta?: React.ReactNode;
  /** Цвет кружка с иконкой: акцент (по умолчанию), готово, внимание, ошибка */
  tone?: ToastTone;
  /** Кнопка действия справа, например «Отменить» */
  action?: ToastAction;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const TONE_CLASSES: Record<ToastTone, string> = {
  accent: 'bg-gd-accent',
  success: 'bg-gd-success',
  warning: 'bg-gd-warn',
  danger: 'bg-gd-red',
};

/**
 * Всплывающее уведомление iOS: стеклянная капсула, выезжает на пружине (animate-toast-in).
 * Располагается в общем контейнере уведомлений сверху экрана (см. App).
 */
export const Toast: React.FC<ToastProps> = ({
  icon,
  title,
  detail,
  meta,
  tone = 'accent',
  action,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => (
  <div
    role={tone === 'danger' ? 'alert' : 'status'}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className="pointer-events-auto w-full max-w-sm gd-glass bg-white/85 rounded-[22px] shadow-gd-float pl-2 pr-1.5 py-1.5 flex items-center gap-2.5 select-none animate-toast-in"
  >
    <div
      className={clsx(
        'w-8 h-8 rounded-full text-white flex items-center justify-center flex-shrink-0 [&_svg]:w-4 [&_svg]:h-4 [&_svg]:animate-icon-pop',
        TONE_CLASSES[tone]
      )}
    >
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
    {action && (
      <button
        type="button"
        onClick={() => {
          action.onClick();
          onClose();
        }}
        className="h-7 px-3 rounded-full text-[12.5px] font-semibold text-accent-700 bg-gd-accent-light hover:bg-accent-500/20 flex-shrink-0 cursor-pointer"
      >
        {action.label}
      </button>
    )}
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
);
