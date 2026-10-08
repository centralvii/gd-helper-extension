import React, { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCcw,
  Star,
  Wand2,
  Hash,
  Package,
  ExternalLink,
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

  const handleFetchUrlFromActiveTab = async () => {
    try {
      const tabInfo = await getActiveTabInfo();
      if (tabInfo?.url) {
        setPackageUrl(tabInfo.url);
        try {
          localStorage.setItem('gd_last_package_url', tabInfo.url);
        } catch {}
      }
    } catch (e) {
      console.warn('Failed to fetch active tab URL:', e);
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
        setParseFeedback({
          type: 'success',
          text: `Спарсен № ${res.lastNumber}: ${res.lastFileName || ''}`,
        });
        if (target) {
          try {
            localStorage.setItem('gd_last_package_url', target);
          } catch {}
        }
      } else {
        setParseFeedback({
          type: 'error',
          text: res.error || 'Не удалось найти файлы .guf в таблице пакета',
        });
      }
    } catch (err) {
      console.warn('Error auto-parsing package number:', err);
      setParseFeedback({
        type: 'error',
        text: 'Ошибка при выполнении парсинга номера',
      });
    } finally {
      setIsParsing(false);
      setTimeout(() => setParseFeedback(null), 6000);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all">
      {/* Header bar */}
      <div className="border-b border-slate-100 bg-slate-50/70 px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 min-w-0 flex-1 mr-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shadow-2xs flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="whitespace-nowrap flex-shrink-0">Шаблон имени</span>

            {isPrimary ? (
              <span
                title="Этот шаблон выбран основным и применяется всегда по умолчанию"
                className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 shadow-2xs whitespace-nowrap flex-shrink-0"
              >
                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500 flex-shrink-0" />
                <span className="hidden sm:inline">Основной</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSetPrimaryTemplate(template)}
                title="Сделать текущий шаблон основным по умолчанию"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 transition-all hover:border-amber-400 hover:text-amber-700 shadow-2xs cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <Star className="h-2.5 w-2.5 text-slate-400 hover:text-amber-500 flex-shrink-0" />
                <span className="hidden sm:inline">Сделать основным</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-1.5 py-0.5 shadow-2xs flex-shrink-0">
            <span className="text-[11px] font-bold text-slate-400 select-none" title="Стартовый номер">
              №
            </span>
            <input
              type="number"
              min={1}
              value={startNumber}
              onChange={(e) =>
                onSetStartNumber(parseInt(e.target.value, 10) || 1)
              }
              title="Стартовый номер"
              className="w-11 rounded-lg border border-slate-200 bg-slate-50 px-1 py-0.5 text-center text-xs font-bold text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={handleAutoParseNumber}
              disabled={isParsing}
              title="Автопарсинг номера последнего файла из таблицы «Прикрепленные файлы» в GreenData"
              className="rounded-lg p-0.5 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              <Hash className={`h-3.5 w-3.5 ${isParsing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onResetTemplate}
              title="Сбросить к основному шаблону"
              className="rounded-lg p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer flex-shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-2.5 space-y-2">
        {/* Main Template Input */}
        <div className="relative">
          <Wand2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-600" />
          <input
            ref={inputRef}
            type="text"
            value={template}
            onChange={(e) => onSetTemplate(e.target.value)}
            placeholder="{indexPad6}_{type}_{module}_{task}_{cleanName}"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2 font-mono text-xs font-bold text-emerald-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 shadow-2xs"
          />
        </div>

        {/* GreenData Release Package Link Bar */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <div className="flex items-center gap-1.5 min-w-0">
              <Package className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Ссылка на релизный пакет для автопарсинга №</span>
            </div>
            <button
              type="button"
              onClick={handleFetchUrlFromActiveTab}
              disabled={isParsing}
              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline flex items-center gap-1"
              title="Вставить ссылку из текущей открытой вкладки Chrome"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Из вкладки</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 min-w-0">
              <ExternalLink className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
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
                placeholder="https://expo.greendatasoft.ru/#/card/9634532"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-7 pr-2.5 py-1 text-xs font-mono text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            <Button
              size="xs"
              variant="emerald"
              onClick={handleAutoParseNumber}
              disabled={isParsing}
              isLoading={isParsing}
              title="Спарсить последний номер .guf файла по указанной ссылке"
              leftIcon={<Hash className="w-3 h-3" />}
            >
              {isParsing ? 'Парсинг...' : 'Спарсить №'}
            </Button>
          </div>

          {parseFeedback && (
            <div
              className={`text-[10.5px] px-2 py-1 rounded-lg border font-medium flex items-center gap-1.5 animate-fade-in ${
                parseFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {parseFeedback.type === 'success' ? (
                <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0" />
              )}
              <span className="truncate flex-1 min-w-0">{parseFeedback.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
