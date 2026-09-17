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
import { formatChangeItemMarkdown, extractCardIdFromUrl } from '../../utils/tabUtils';
import { IconButton } from '../ui';

interface ChangeItemRowProps {
  item: ImplementationChangeItem;
  index: number;
  totalCount: number;
  onEdit: (item: ImplementationChangeItem) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleCollected?: (id: string) => void;
  matchingPackageFile?: { order: number; newName?: string; originalName: string; cardId?: string };
}

export const ChangeItemRow: React.FC<ChangeItemRowProps> = React.memo(({
  item,
  index,
  totalCount,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleCollected,
  matchingPackageFile,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const formatted = formatChangeItemMarkdown(
      item.description,
      item.linkTitle,
      item.linkUrl,
      item.isCollected
    );
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group relative rounded-xl border p-3 transition-all space-y-2 ${
      item.isCollected
        ? 'border-emerald-200/90 bg-emerald-50/20'
        : 'border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs'
    }`}>
      {/* Top Header: Index badge + Item label on left, Action buttons on right */}
      <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold shadow-2xs">
            {index + 1}
          </span>
          <span className="text-[11px] font-bold text-slate-500 truncate">
            Пункт {index + 1}
          </span>

          {onToggleCollected && (
            <button
              type="button"
              onClick={() => onToggleCollected(item.id)}
              title={
                item.isCollected
                  ? 'Объект собран. Нажмите, чтобы сбросить статус'
                  : 'Нажмите, чтобы отметить как собранный'
              }
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                item.isCollected
                  ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {item.isCollected && <Check className="w-3 h-3 text-emerald-700" />}
              <span>{item.isCollected ? 'Собран' : 'Не собран'}</span>
            </button>
          )}

          {matchingPackageFile && (
            <div className="inline-flex items-center gap-1">
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs"
                title={`Файл найден в связанном пакете сборки под номером #${matchingPackageFile.order}: ${matchingPackageFile.newName || matchingPackageFile.originalName}`}
              >
                📦 В пакете #{matchingPackageFile.order}
              </span>

              {!item.isCollected && onToggleCollected && (
                <button
                  type="button"
                  onClick={() => onToggleCollected(item.id)}
                  title="Файл уже есть в сборке. Нажмите, чтобы сразу отметить пункт собранным"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Собрать</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <IconButton
            size="xs"
            variant="ghost"
            onClick={() => onMoveUp(item.id)}
            disabled={index === 0}
            title="Переместить выше"
            icon={<ChevronUp className="w-3.5 h-3.5" />}
          />

          <IconButton
            size="xs"
            variant="ghost"
            onClick={() => onMoveDown(item.id)}
            disabled={index === totalCount - 1}
            title="Переместить ниже"
            icon={<ChevronDown className="w-3.5 h-3.5" />}
          />

          <IconButton
            size="xs"
            variant="emerald"
            onClick={handleCopy}
            title="Копировать пункт"
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          />

          <IconButton
            size="xs"
            variant="sky"
            onClick={() => onEdit(item)}
            title="Редактировать"
            icon={<Edit2 className="w-3.5 h-3.5" />}
          />

          <IconButton
            size="xs"
            variant="danger"
            onClick={() => onDelete(item.id)}
            title="Удалить"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Full width Description */}
      <p className="text-xs text-slate-900 leading-relaxed break-words font-medium">
        {item.description}
      </p>

      {/* Attached Link (full width) */}
      {item.linkUrl && (
        <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
          {extractCardIdFromUrl(item.linkUrl) && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/90 font-mono text-[9.5px] font-bold shadow-2xs"
              title={`ID карточки в GreenData: ${extractCardIdFromUrl(item.linkUrl)}`}
            >
              <span className="text-slate-400 font-normal">ID:</span>
              {extractCardIdFromUrl(item.linkUrl)}
            </span>
          )}
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
