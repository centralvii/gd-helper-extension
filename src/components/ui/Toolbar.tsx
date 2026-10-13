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
        'flex items-center justify-between gap-1.5 p-1.5 bg-white rounded-xl',
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
  titleAttr?: string;
  badge?: React.ReactNode;
  statusDot?: 'success' | 'warning' | 'danger' | 'offline';
  statusTitle?: string;
  className?: string;
}

export const ToolbarTitle: React.FC<ToolbarTitleProps> = ({
  icon,
  title,
  titleAttr,
  badge,
  statusDot,
  statusTitle,
  className,
}) => {
  return (
    <div className={twMerge('flex items-center gap-2 pl-1.5 min-w-0', className)}>
      {icon && (
        <div
          title={titleAttr || (typeof title === 'string' ? title : undefined)}
          className="w-7 h-7 rounded-[8px] bg-gd-green text-white flex items-center justify-center flex-shrink-0 font-bold [&_svg]:text-white"
        >
          {icon}
        </div>
      )}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[13px] font-semibold text-slate-900 truncate">{title}</span>
        {badge}
        {statusDot && (
          <span
            className={clsx(
              'w-2 h-2 rounded-full flex-shrink-0 transition-colors',
              statusDot === 'success' && 'bg-[#34c759]',
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
          'relative inline-flex items-center justify-center gap-1 h-7 px-2.5 sm:px-3 rounded-full text-[12px] font-semibold leading-none transition-colors cursor-pointer whitespace-nowrap select-none',
          isActive
            ? 'bg-gd-green-light text-gd-green'
            : 'bg-gd-fill hover:bg-slate-200 text-slate-900'
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
          className={clsx(
            'w-1.5 h-1.5 rounded-full bg-gd-green',
            !children ? 'absolute top-1 right-1' : ''
          )}
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
          'h-7 w-7 inline-flex items-center justify-center rounded-full bg-gd-fill transition-colors cursor-pointer flex-shrink-0',
          variant === 'danger'
            ? 'text-slate-600 hover:text-[#ff3b30] hover:bg-[#ff3b30]/10'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
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
