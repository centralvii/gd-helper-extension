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
    default: 'rounded-xl bg-white',
    gradient: 'rounded-xl bg-white ring-1 ring-inset ring-gd-border-green',
    muted: 'rounded-xl bg-gd-fill-2',
    danger: 'rounded-xl bg-[#ff3b30]/[0.06] ring-1 ring-inset ring-[#ff3b30]/20',
    bordered: 'rounded-xl bg-white ring-1 ring-inset ring-gd-border-green',
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
