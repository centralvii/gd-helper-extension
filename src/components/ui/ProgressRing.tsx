import React from 'react';

interface ProgressRingProps {
  /** Процент заполнения 0–100 */
  value: number;
  /** Текст в центре (например, «2/5») */
  label?: string;
  size?: number;
}

/** Кольцо прогресса: индиго-дуга с плавной анимацией заполнения */
export const ProgressRing: React.FC<ProgressRingProps> = ({ value, label, size = 40 }) => {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <span className="relative inline-grid flex-shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(27,31,59,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--gd-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      {label && (
        <span className="absolute font-mono text-[10px] font-semibold tabular-nums text-slate-900">{label}</span>
      )}
    </span>
  );
};
