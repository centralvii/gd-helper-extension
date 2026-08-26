import React, { useState } from 'react';
import {
  ExternalLink,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Link as LinkIcon,
} from 'lucide-react';
import { ImplementationChangeItem } from '../../types';
import { formatChangeItemMarkdown } from '../../utils/tabUtils';

interface ChangeItemRowProps {
  item: ImplementationChangeItem;
  index: number;
  totalCount: number;
  onEdit: (item: ImplementationChangeItem) => void;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const ChangeItemRow: React.FC<ChangeItemRowProps> = React.memo(({
  item,
  index,
  totalCount,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const formatted = formatChangeItemMarkdown(item.description, item.linkTitle, item.linkUrl);
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative rounded-2xl border border-slate-200/90 bg-white p-3 hover:border-emerald-300 hover:shadow-xs transition-all space-y-2">
      {/* Top Header: Index badge + Item label on left, Action buttons on right */}
      <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold shadow-2xs">
            {index + 1}
          </span>
          <span className="text-[11px] font-bold text-slate-500 truncate">
            Пункт {index + 1}
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            title="Переместить выше"
            className="icon-btn p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onMoveDown}
            disabled={index === totalCount - 1}
            title="Переместить ниже"
            className="icon-btn p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="Копировать пункт"
            className="icon-btn p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onEdit(item)}
            title="Редактировать"
            className="icon-btn p-1 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(item.id)}
            title="Удалить"
            className="icon-btn icon-btn--danger p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Full width Description */}
      <p className="text-xs text-slate-900 leading-relaxed break-words font-medium">
        {item.description}
      </p>

      {/* Attached Link (full width) */}
      {item.linkUrl && (
        <div className="pt-0.5">
          <a
            href={item.linkUrl}
            target="_blank"
            rel="noreferrer"
            title={item.linkUrl}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 rounded-xl text-[11px] font-bold transition-all max-w-full truncate shadow-2xs"
          >
            <LinkIcon className="w-3 h-3 flex-shrink-0 text-emerald-600" />
            <span className="truncate">{item.linkTitle || item.linkUrl}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70 text-emerald-600" />
          </a>
        </div>
      )}
    </div>
  );
});
