import React from 'react';

interface ConsoleCardProps {
    children: React.ReactNode;
    label?: string;
    className?: string;
    active?: boolean;
    noPadding?: boolean;
}

/**
 * ConsoleCard — карточка-обёртка в стиле терминала GreenData.
 * Содержит тонкую зелёную border, опциональный monospace-заголовок,
 * и hover-эффект свечения.
 */
export const ConsoleCard: React.FC<ConsoleCardProps> = ({
    children,
    label,
    className = '',
    active = false,
    noPadding = false,
}) => {
    return (
        <div
            className={`console-card${active ? ' console-card--active' : ''} ${noPadding ? '' : 'p-3'} ${className}`}
        >
            {label && (
                <div className="flex items-center gap-2 mb-2.5">
                    <span
                        className="console-label console-label--green"
                        style={{ letterSpacing: '0.16em' }}
                    >
                        [{label}]
                    </span>
                    <div
                        className="flex-1 h-px"
                        style={{ background: 'linear-gradient(to right, rgba(34,197,94,0.18), transparent)' }}
                    />
                </div>
            )}
            {children}
        </div>
    );
};
