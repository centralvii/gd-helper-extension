import React, { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCcw,
  Star,
  Wand2,
  Hash,
  Package,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { FileRow, VariableDefinition } from '../../types';
import { parseLastPackageFileNumberFromGreenData, getActiveTabInfo } from '../../utils/tabUtils';
import { Button } from '../ui';

interface TemplateEditorProps {
  template: string;
  primaryTemplate: string;
  startNumber: number;
  variables?: VariableDefinition[];
  firstFile?: FileRow;
  initialPackageUrl?: string;
  onSetTemplate: (template: string) => void;
  onSetPrimaryTemplate: (template: string) => void;
  onSetStartNumber: (num: number) => void;
  onResetTemplate: () => void;
  onShowToast?: (notification: { fileName: string; number: number }) => void;
  /** Дополнительные чипы под шаблоном (теги, README) */
  chips?: React.ReactNode;
  onOpenPresets?: () => void;
  presetsCount?: number;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  primaryTemplate,
  startNumber,
  initialPackageUrl,
  onSetTemplate,
  onSetPrimaryTemplate,
  onSetStartNumber,
  onResetTemplate,
  onShowToast,
  chips,
  onOpenPresets,
  presetsCount,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPrimary = template === primaryTemplate;
  const [isParsing, setIsParsing] = useState(false);
  const [packageUrl, setPackageUrl] = useState<string>(() => {
    return initialPackageUrl || localStorage.getItem('gd_last_package_url') || '';
  });
  const [parseFeedback, setParseFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (initialPackageUrl && initialPackageUrl.trim() !== '') {
      setPackageUrl(initialPackageUrl.trim());
    }
  }, [initialPackageUrl]);

  // Подсказка под полем исчезает сама через 6 с (таймер сбрасывается при новой подсказке)
  useEffect(() => {
    if (!parseFeedback) return;
    const timer = setTimeout(() => setParseFeedback(null), 6000);
    return () => clearTimeout(timer);
  }, [parseFeedback]);

  const handleFetchUrlFromActiveTab = async () => {
    try {
      const tabInfo = await getActiveTabInfo();
      if (tabInfo?.url) {
        setPackageUrl(tabInfo.url);
        try {
          localStorage.setItem('gd_last_package_url', tabInfo.url);
        } catch {}
        setParseFeedback({ type: 'success', text: 'Ссылка из вкладки вставлена — нажмите №' });
      } else {
        setParseFeedback({ type: 'error', text: 'Не удалось получить ссылку активной вкладки' });
      }
    } catch (e) {
      console.warn('Failed to fetch active tab URL:', e);
      setParseFeedback({ type: 'error', text: 'Не удалось получить ссылку активной вкладки' });
    }
  };

  const handleAutoParseNumber = async () => {
    setIsParsing(true);
    setParseFeedback(null);
    try {
      const target = packageUrl.trim() || undefined;
      const res = await parseLastPackageFileNumberFromGreenData(target);
      if (res.success && res.lastNumber !== undefined) {
        onSetStartNumber(res.lastNumber);
        if (onShowToast) {
          onShowToast({
            fileName: res.lastFileName || `Пакет № ${res.lastNumber}`,
            number: res.lastNumber,
          });
        }
        const currentInfo = res.currentLastNumber ? ` (последний: ${res.currentLastNumber})` : '';
        setParseFeedback({
          type: 'success',
          text: `Следующий № ${res.lastNumber}${currentInfo}: ${res.lastFileName || ''}`,
        });
        if (target) {
          try {
            localStorage.setItem('gd_last_package_url', target);
          } catch {}
        }
      } else {
        setParseFeedback({
          type: 'error',
          text: res.error || 'В релизном пакете не найдены файлы .guf. Проверьте ссылку',
        });
      }
    } catch (err) {
      console.warn('Error auto-parsing package number:', err);
      setParseFeedback({
        type: 'error',
        text: 'Не удалось получить номер. Откройте карточку релизного пакета и повторите',
      });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div>
      <div className="gd-section-title">
        <span className="inline-flex items-center gap-1.5">
          Шаблон имени
          {isPrimary ? (
            <Star
              className="h-3 w-3 fill-[#f59e3b] text-[#f59e3b]"
              aria-label="Основной шаблон"
            />
          ) : (
            <button
              type="button"
              onClick={() => onSetPrimaryTemplate(template)}
              title="Сделать шаблон основным (по умолчанию)"
              className="text-gd-faint hover:text-[#f59e3b] cursor-pointer"
            >
              <Star className="h-3 w-3" />
            </button>
          )}
        </span>
        {onOpenPresets && (
          <button
            type="button"
            onClick={onOpenPresets}
            title="Пресеты шаблонов имён"
            className="normal-case tracking-normal text-[12px] font-semibold text-accent-700 cursor-pointer"
          >
            Пресеты{presetsCount ? ` · ${presetsCount}` : ''}
          </button>
        )}
      </div>

      <div className="gd-group p-2.5 space-y-2.5">
        {/* Шаблон */}
        <div className="flex items-center gap-2 rounded-xl bg-white/70 pl-2.5 pr-1">
          <Wand2 className="h-3.5 w-3.5 flex-shrink-0 text-accent-600" />
          <input
            ref={inputRef}
            type="text"
            value={template}
            onChange={(e) => onSetTemplate(e.target.value)}
            placeholder="{indexPad6}_{type}_{module}_{task}_{cleanName}"
            spellCheck={false}
            aria-label="Шаблон имени файла"
            className="min-w-0 flex-1 bg-transparent py-2 font-mono text-[12px] font-medium text-slate-900 outline-none placeholder:text-gd-faint"
          />
          <button
            type="button"
            onClick={onResetTemplate}
            title="Сбросить к основному шаблону"
            className="icon-btn icon-btn--plain !w-7 !h-7"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Компактные параметры: начальный номер + чипы */}
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="gd-chip !cursor-text" title="Начальный номер файлов">
            <Hash className="h-3.5 w-3.5 text-accent-600" />
            <input
              type="number"
              min={1}
              value={startNumber}
              onChange={(e) => onSetStartNumber(parseInt(e.target.value, 10) || 1)}
              aria-label="Начальный номер"
              className="w-12 bg-transparent font-mono text-[12px] font-semibold outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </label>
          {chips}
        </div>

        {/* Релизный пакет GreenData → автопарсинг номера */}
        <div className="flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <Package className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gd-faint" />
            <input
              type="url"
              value={packageUrl}
              onChange={(e) => {
                setPackageUrl(e.target.value);
                try {
                  localStorage.setItem('gd_last_package_url', e.target.value);
                } catch {}
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAutoParseNumber();
                }
              }}
              placeholder="Ссылка на релизный пакет"
              aria-label="Ссылка на релизный пакет GreenData"
              className="gd-field !py-1.5 !pl-8 !text-[12px]"
            />
          </div>
          <button
            type="button"
            onClick={handleFetchUrlFromActiveTab}
            disabled={isParsing}
            title="Вставить ссылку из активной вкладки"
            className="icon-btn !w-8 !h-8 disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoParseNumber}
            disabled={isParsing}
            isLoading={isParsing}
            title="Получить последний номер файла .guf из релизного пакета и подставить следующий"
            leftIcon={!isParsing ? <Hash className="h-3.5 w-3.5" /> : undefined}
          >
            {isParsing ? '…' : '№'}
          </Button>
        </div>

        {parseFeedback && (
          <div
            className={`flex items-center gap-1.5 px-1 text-[12px] font-medium animate-fade-in ${
              parseFeedback.type === 'success' ? 'text-[#0f7a5c]' : 'text-[#b42328]'
            }`}
          >
            {parseFeedback.type === 'success' ? (
              <Check className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate">{parseFeedback.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
