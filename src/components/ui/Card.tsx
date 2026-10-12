import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'muted' | 'danger' | 'bordered';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ variant = 'default', children, className, ...props }) => {
  const variants = {
    default: 'rounded-xl border border-slate-200 bg-white shadow-sm',
    gradient:
      'rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 shadow-sm',
    muted: 'rounded-xl border border-slate-200 bg-slate-50/80 shadow-xs',
    danger: 'rounded-xl border border-rose-200 bg-rose-50/60 shadow-xs',
    bordered: 'rounded-xl border border-emerald-300 bg-white shadow-sm shadow-emerald-600/5',
  };

  return (
    <div className={twMerge('overflow-hidden transition-all', variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        'flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-2.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className, ...props }) => {
  return (
    <div className={twMerge('p-3 space-y-3', className)} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        'flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
