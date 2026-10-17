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
  // iOS inset grouped: белая группа на сером фоне, без рамок и теней
  const variants = {
    default: 'gd-card',
    gradient: 'gd-card ring-1 ring-inset ring-gd-border-accent',
    muted: 'rounded-[20px] bg-white/40',
    danger: 'rounded-[20px] bg-[#e5484d]/[0.07] ring-1 ring-inset ring-[#e5484d]/20',
    bordered: 'gd-card ring-1 ring-inset ring-gd-border-accent',
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
        'flex items-center justify-between gap-2 border-b border-gd-border px-3.5 py-2.5',
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
    <div className={twMerge('p-3.5 space-y-3', className)} {...props}>
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
        'flex items-center justify-end gap-2 border-t border-gd-border px-3.5 py-2.5',
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
