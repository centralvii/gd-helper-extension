import React, { useState } from 'react';
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Link as LinkIcon,
  Package,
  Lock,
  Hash,
} from 'lucide-react';
import { ImplementationChangeItem } from '../../types';
import {
  formatChangeItemMarkdown,
  extractCardIdFromUrl,
  isGreenDataUpdatePackage,
  parseLastPackageFileNumberFromGreenData,
} from '../../utils/tabUtils';
import { IconButton, Button, Badge } from '../ui';

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
  onApplyPackageNumber?: (item: ImplementationChangeItem, number: number, fileName?: string) => void;
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
  onApplyPackageNumber,
}) => {
  const [copied, setCopied] = useState(false);
  const [isParsingNumber, setIsParsingNumber] = useState(false);
  const [parseFeedback, setParseFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [urlInput, setUrlInput] = useState(item.linkUrl || '');
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const isUpdatePackage = Boolean(
    item.isUpdatePackage ||
    isGreenDataUpdatePackage(item.description, item.linkUrl) ||
    isGreenDataUpdatePackage(item.linkTitle, item.linkUrl)
  );

  const handleAutoParseNumber = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl ?? urlInput ?? item.linkUrl ?? '').trim();
    setIsParsingNumber(true);
    setParseFeedback(null);
    try {
      const result = await parseLastPackageFileNumberFromGreenData(targetUrl || undefined);
      if (result.success && result.lastNumber !== undefined) {
        const updatedItem = {
          ...item,
          linkUrl: targetUrl || item.linkUrl,
          lastFileNumber: result.lastNumber,
          lastFileName: result.lastFileName,
          isUpdatePackage: true,
        };
        onApplyPackageNumber?.(updatedItem, result.lastNumber, result.lastFileName);
        const currentInfo = result.currentLastNumber ? ` (последний: ${result.currentLastNumber})` : '';
        setParseFeedback({
          message: `Следующий № ${result.lastNumber}${currentInfo}: ${result.lastFileName || ''}`,
          isError: false,
        });
        setIsEditingUrl(false);
      } else {
        setParseFeedback({
          message: result.error || 'Не удалось получить номер файла. Проверьте ссылку на релизный пакет',
          isError: true,
        });
      }
    } catch {
      setParseFeedback({
        message: 'Не удалось получить номер. Откройте карточку релизного пакета и повторите',
        isError: true,
      });
    } finally {
      setIsParsingNumber(false);
      setTimeout(() => setParseFeedback(null), 5000);
    }
  };

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuItemClass =
    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-slate-900 hover:bg-gd-fill-2 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer';

  return (
    <div className={`gd-row group !items-start !py-2.5 ${isMenuOpen ? 'z-30' : ''}`}>
      {/* Чекбокс «Собран» */}
      {onToggleCollected ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={Boolean(item.isCollected)}
          onClick={() => onToggleCollected(item.id)}
          title={item.isCollected ? 'Объект собран. Нажмите, чтобы сбросить статус' : 'Отметить как собранный'}
          data-icon-anim="pop"
          className={`mt-0.5 grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-200 cursor-pointer ${
            item.isCollected
              ? 'border-gd-accent bg-gd-accent text-white'
              : 'border-slate-300 hover:border-gd-accent'
          }`}
        >
          {item.isCollected && <Check className="h-3.5 w-3.5 animate-pop-in" strokeWidth={3} />}
        </button>
      ) : (
        <span className="mt-0.5 w-[22px] text-center text-[11px] font-semibold text-gd-muted tabular-nums">{index + 1}</span>
      )}

      {/* Описание и метаданные */}
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={`text-[13.5px] leading-snug break-words transition-colors ${
            item.isCollected ? 'text-gd-muted' : 'text-slate-900'
          }`}
        >
          {item.description}
        </p>

        {(item.linkUrl || matchingPackageFile || isUpdatePackage) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 text-[12px]">
            {isUpdatePackage && (!item.linkUrl || isEditingUrl) ? (
              <div className="flex items-center gap-1.5 w-full animate-fade-in">
                <div className="relative flex-1 min-w-0">
                  <LinkIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gd-faint" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAutoParseNumber(urlInput);
                      }
                    }}
                    placeholder="Ссылка на релизный пакет: https://expo.greendatasoft.ru/#/card/…"
                    className="gd-field !pl-7 !py-1 font-mono !text-[11.5px]"
                  />
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleAutoParseNumber(urlInput)}
                  disabled={isParsingNumber || !urlInput.trim()}
                  isLoading={isParsingNumber}
                  leftIcon={<Hash className="w-3 h-3" />}
                >
                  №
                </Button>
                {item.linkUrl && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setUrlInput(item.linkUrl || '');
                      setIsEditingUrl(false);
                    }}
                  >
                    Отмена
                  </Button>
                )}
              </div>
            ) : (
              <>
                {item.linkUrl && (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`Открыть в GreenData: ${item.linkTitle ? `${item.linkTitle} (${item.linkUrl})` : item.linkUrl}`}
                    className="inline-flex items-center gap-1 min-w-0 max-w-full font-medium text-gd-accent hover:underline cursor-pointer"
                  >
                    <LinkIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{item.linkTitle || item.linkUrl}</span>
                    {cardId && <span className="font-mono text-[11px] text-gd-muted flex-shrink-0">· {cardId}</span>}
                  </a>
                )}
                {isUpdatePackage && item.linkUrl && (
                  <button
                    type="button"
                    onClick={() => setIsEditingUrl(true)}
                    title="Изменить ссылку на релизный пакет"
                    className="text-gd-muted hover:text-slate-900 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
                {isUpdatePackage && (
                  <span
                    title="Релизный пакет GreenData (только для чтения)"
                    className="inline-flex items-center gap-1 font-medium text-[#c26a00] flex-shrink-0 select-none"
                  >
                    <Package className="w-3 h-3" />
                    Релизный пакет
                  </span>
                )}
                {(isUpdatePackage || item.linkUrl) && (
                  <button
                    type="button"
                    onClick={() => handleAutoParseNumber()}
                    disabled={isParsingNumber}
                    title="Получить номер последнего файла из таблицы «Прикрепленные файлы» в GreenData"
                    className="inline-flex items-center gap-0.5 font-medium text-gd-muted hover:text-gd-accent cursor-pointer disabled:opacity-60 flex-shrink-0"
                  >
                    <Hash className={`w-3 h-3 ${isParsingNumber ? 'animate-spin' : ''}`} />
                    {isParsingNumber ? 'Загрузка…' : 'Номер'}
                  </button>
                )}
                {item.lastFileNumber !== undefined && (
                  <Badge variant="success" size="xs" className="font-mono" title={`Номер из релизного пакета: ${item.lastFileName || item.lastFileNumber}`}>
                    № {item.lastFileNumber}
                  </Badge>
                )}
              </>
            )}

            {matchingPackageFile && (
              <button
                type="button"
                onClick={() => {
                  if (!item.isCollected && onToggleCollected) onToggleCollected(item.id);
                }}
                title={`Файл есть в привязанном пакете: #${matchingPackageFile.order} ${matchingPackageFile.newName || matchingPackageFile.originalName}${!item.isCollected ? '. Нажмите, чтобы отметить собранным' : ''}`}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-px text-[11px] font-semibold flex-shrink-0 ${
                  item.isCollected
                    ? 'bg-[#007aff]/10 text-[#0062cc] cursor-default'
                    : 'bg-[#007aff]/10 text-[#0062cc] hover:bg-gd-accent-light hover:text-gd-accent cursor-pointer'
                }`}
              >
                <Package className="w-3 h-3" />В пакете #{matchingPackageFile.order}
                {!item.isCollected && <span className="hidden xs:inline">· собрать</span>}
              </button>
            )}
          </div>
        )}

        {parseFeedback && (
          <p className={`text-[11.5px] font-medium animate-fade-in ${parseFeedback.isError ? 'text-[#d70015]' : 'text-gd-accent'}`}>
            {parseFeedback.message}
          </p>
        )}
      </div>

      {/* Действия */}
      <div className="relative flex items-center gap-0.5 flex-shrink-0 -mr-1">
        <IconButton
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          title="Копировать пункт"
          icon={copied ? <Check className="w-3.5 h-3.5 text-gd-accent animate-pop-in" strokeWidth={2.75} /> : <Copy className="w-3.5 h-3.5" />}
        />
        {isUpdatePackage ? (
          <span
            title="Релизный пакет GreenData нельзя изменить в расширении"
            className="grid w-7 h-7 place-items-center text-[#ff9500] cursor-not-allowed select-none"
          >
            <Lock className="w-3.5 h-3.5" />
          </span>
        ) : (
          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => onEdit(item)}
            title="Изменить пункт"
            icon={<Edit2 className="w-3.5 h-3.5" />}
          />
        )}
        <IconButton
          size="sm"
          variant="ghost"
          isActive={isMenuOpen}
          onClick={() => setIsMenuOpen((v) => !v)}
          title="Ещё: порядок и удаление"
          icon={<MoreHorizontal className="w-4 h-4" />}
        />

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
            <div className="gd-menu absolute right-0 top-full mt-1 z-50 p-1 min-w-[180px]">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => {
                  onMoveUp(item.id);
                  setIsMenuOpen(false);
                }}
                className={menuItemClass}
              >
                <ChevronUp className="w-4 h-4 text-gd-muted" />
                Переместить выше
              </button>
              <button
                type="button"
                disabled={index === totalCount - 1}
                onClick={() => {
                  onMoveDown(item.id);
                  setIsMenuOpen(false);
                }}
                className={menuItemClass}
              >
                <ChevronDown className="w-4 h-4 text-gd-muted" />
                Переместить ниже
              </button>
              <div className="h-px bg-gd-border my-1 mx-2" />
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete(item.id);
                }}
                className={`${menuItemClass} !text-[#ff3b30]`}
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
