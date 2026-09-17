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

  const cardId = extractCardIdFromUrl(item.linkUrl);

  return (
    <div className={`group relative rounded-xl border p-2.5 transition-all space-y-1.5 ${
      item.isCollected
        ? 'border-emerald-200/90 bg-emerald-50/20'
        : 'border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs'
    }`}>
      {/* Top Header: Index badge + Status on left, Reorder & Action buttons on right */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold shadow-2xs">
            {index + 1}
          </span>
          <span className="hidden sm:inline text-[11px] font-bold text-slate-500 truncate">
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
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer flex-shrink-0 ${
                item.isCollected
                  ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {item.isCollected && <Check className="w-2.5 h-2.5 text-emerald-700" />}
              <span>{item.isCollected ? 'Собран' : 'Не собран'}</span>
            </button>
          )}
        </div>

        {/* Action Toolbar with clear separation */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
          {/* Reorder Buttons */}
          <div className="flex items-center gap-0.5">
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
          </div>

          {/* Separator */}
          <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5 flex-shrink-0" />

          {/* Actions */}
          <div className="flex items-center gap-0.5">
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
      </div>

      {/* Full width Description */}
      <p className="text-xs text-slate-900 leading-relaxed break-words font-medium">
        {item.description}
      </p>

      {/* Attached Link, Card ID & Matched Package Badge */}
      {(item.linkUrl || matchingPackageFile) && (
        <div className="pt-0.5 flex items-center gap-1.5 min-w-0">
          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noreferrer"
              title={`Открыть в GreenData: ${item.linkTitle ? `${item.linkTitle} (${item.linkUrl})` : item.linkUrl}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 hover:border-emerald-300 rounded-lg text-[10.5px] font-medium transition-all max-w-full min-w-0 shadow-2xs group/link cursor-pointer flex-1"
            >
              <LinkIcon className="w-3 h-3 flex-shrink-0 text-emerald-600" />
              {cardId && (
                <span className="inline-flex items-center font-mono text-[9.5px] font-bold text-emerald-800 bg-emerald-100/90 px-1 py-0.2 rounded border border-emerald-200/80 flex-shrink-0">
                  ID: {cardId}
                </span>
              )}
              <span className="truncate font-semibold text-emerald-950 flex-1 min-w-0">
                {item.linkTitle || item.linkUrl}
              </span>
              <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 text-emerald-600 opacity-70 group-hover/link:opacity-100 transition-opacity" />
            </a>
          )}

          {matchingPackageFile && (
            <button
              type="button"
              onClick={() => {
                if (!item.isCollected && onToggleCollected) {
                  onToggleCollected(item.id);
                }
              }}
              title={`Файл найден в связанном пакете сборки под номером #${matchingPackageFile.order}: ${matchingPackageFile.newName || matchingPackageFile.originalName}${!item.isCollected ? '. Нажмите, чтобы отметить собранным' : ''}`}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border transition-colors shadow-2xs flex-shrink-0 ${
                item.isCollected
                  ? 'bg-sky-50 text-sky-800 border-sky-200 cursor-default'
                  : 'bg-sky-50 hover:bg-emerald-50 text-sky-800 hover:text-emerald-800 border-sky-200 hover:border-emerald-300 cursor-pointer'
              }`}
            >
              <span>📦 #{matchingPackageFile.order}</span>
              {!item.isCollected && (
                <span className="text-[9px] text-emerald-600 font-semibold hidden xs:inline">
                  (собрать)
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
});
