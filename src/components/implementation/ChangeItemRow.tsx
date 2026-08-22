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

export const ChangeItemRow: React.FC<ChangeItemRowProps> = ({
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
    <div className="group relative flex items-start gap-2.5 p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl transition-all">
      {/* Index indicator */}
      <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 mt-0.5 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
        {index + 1}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs text-slate-200 leading-relaxed break-words">
          {item.description}
        </p>

        {/* Attached Link */}
        {item.linkUrl && (
          <div className="mt-1.5 flex items-center gap-1">
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noreferrer"
              title={item.linkUrl}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-md text-[11px] font-medium transition-colors max-w-full truncate"
            >
              <LinkIcon className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{item.linkTitle || item.linkUrl}</span>
              <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />
            </a>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          title="Переместить выше"
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-20 disabled:hover:bg-transparent"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onMoveDown}
          disabled={index === totalCount - 1}
          title="Переместить ниже"
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-20 disabled:hover:bg-transparent"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleCopy}
          title="Копировать пункт"
          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => onEdit(item)}
          title="Редактировать"
          className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onDelete(item.id)}
          title="Удалить"
          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
