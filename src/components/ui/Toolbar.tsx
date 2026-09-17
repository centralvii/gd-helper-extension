import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> & {
  Title: React.FC<ToolbarTitleProps>;
  Actions: React.FC<ToolbarActionsProps>;
  Button: React.FC<ToolbarButtonProps>;
  IconButton: React.FC<ToolbarIconButtonProps>;
} = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        'flex items-center justify-between gap-1.5 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface ToolbarTitleProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  badge?: React.ReactNode;
  statusDot?: 'success' | 'warning' | 'danger' | 'offline';
  statusTitle?: string;
  className?: string;
}

export const ToolbarTitle: React.FC<ToolbarTitleProps> = ({
  icon,
  title,
  badge,
  statusDot,
  statusTitle,
  className,
}) => {
  return (
    <div className={twMerge('flex items-center gap-2 pl-1.5 min-w-0', className)}>
      {icon && (
        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold shadow-2xs">
          {icon}
        </div>
      )}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-bold text-slate-800 truncate">{title}</span>
        {badge}
        {statusDot && (
          <span
            className={clsx(
              'w-2 h-2 rounded-full flex-shrink-0 transition-colors',
              statusDot === 'success' && 'bg-emerald-500',
              statusDot === 'warning' && 'bg-amber-400',
              statusDot === 'danger' && 'bg-rose-500',
              statusDot === 'offline' && 'bg-slate-300'
            )}
            title={statusTitle}
          />
        )}
      </div>
    </div>
  );
};

interface ToolbarActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const ToolbarActions: React.FC<ToolbarActionsProps> = ({ children, className }) => {
  return <div className={twMerge('flex items-center gap-1 flex-shrink-0', className)}>{children}</div>;
};

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  dot?: boolean;
  isActive?: boolean;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  children,
  icon,
  badge,
  dot,
  isActive,
  className,
  ...props
}) => {
  return (
    <button
      type="button"
      className={twMerge(
        clsx(
          'relative inline-flex items-center justify-center gap-1 h-7 px-2 sm:px-2.5 rounded-xl text-[11px] font-semibold leading-none transition-all shadow-2xs cursor-pointer whitespace-nowrap select-none active:scale-[0.97]',
          isActive
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs'
            : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300'
        ),
        className
      )}
      {...props}
    >
      {icon}
      {children && <span>{children}</span>}
      {badge}
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
          style={{ boxShadow: '0 0 4px rgba(34,197,94,0.7)' }}
        />
      )}
    </button>
  );
};

interface ToolbarIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger';
}

export const ToolbarIconButton: React.FC<ToolbarIconButtonProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  return (
    <button
      type="button"
      className={twMerge(
        clsx(
          'h-7 w-7 inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-95 flex-shrink-0',
          variant === 'danger'
            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        ),
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

Toolbar.Title = ToolbarTitle;
Toolbar.Actions = ToolbarActions;
Toolbar.Button = ToolbarButton;
Toolbar.IconButton = ToolbarIconButton;
