import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ToolRowProps {
  icon: React.ReactNode;
  label: React.ReactNode;
  /** Значение справа серым (счётчик, статус) */
  value?: React.ReactNode;
  title?: string;
  accent?: boolean;
  onClick: () => void;
}

/**
 * Строка-переход группы iOS: иконка, подпись, значение и шеврон.
 * Используется внутри .gd-group.
 */
export const ToolRow: React.FC<ToolRowProps> = ({ icon, label, value, title, accent, onClick }) => (
  <button type="button" onClick={onClick} title={title} className="gd-row gd-row--tap w-full text-left">
    <span className={`gd-row-icon relative ${accent ? 'gd-row-icon--accent' : ''}`}>{icon}</span>
    <span className="flex-1 min-w-0 text-[14px] text-slate-900 truncate">{label}</span>
    {value !== undefined && <span className="text-[13.5px] text-gd-muted tabular-nums flex-shrink-0">{value}</span>}
    <ChevronRight className="w-4 h-4 text-gd-faint flex-shrink-0" />
  </button>
);
