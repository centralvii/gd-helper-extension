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
        const currentInfo = res.currentLastNumber ? ` (в пакете: ${res.currentLastNumber})` : '';
        setParseFeedback({
          type: 'success',
          text: `Спарсен след. № ${res.lastNumber}${currentInfo}: ${res.lastFileName || ''}`,
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
    <div>
      <div className="gd-section-title">
        <span>Шаблон имени</span>
        {isPrimary ? (
          <span
            title="Этот шаблон выбран основным и применяется всегда по умолчанию"
            className="inline-flex items-center gap-1 normal-case tracking-normal text-[12px] font-medium text-[#c26a00]"
          >
            <Star className="h-3 w-3 fill-[#ff9500] text-[#ff9500]" />
            Основной
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSetPrimaryTemplate(template)}
            title="Сделать текущий шаблон основным по умолчанию"
            className="inline-flex items-center gap-1 normal-case tracking-normal text-[12.5px] font-medium text-gd-green cursor-pointer"
          >
            <Star className="h-3 w-3" />
            Сделать основным
          </button>
        )}
      </div>

      <div className="gd-group gd-group--icons">
        {/* Шаблон */}
        <div className="gd-row">
          <span className="gd-row-icon gd-row-icon--accent">
            <Wand2 />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={template}
            onChange={(e) => onSetTemplate(e.target.value)}
            placeholder="{indexPad6}_{type}_{module}_{task}_{cleanName}"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-1.5 font-mono text-[12.5px] font-semibold text-slate-900 outline-none placeholder:text-gd-faint"
          />
          <button
            type="button"
            onClick={onResetTemplate}
            title="Сбросить к основному шаблону"
            className="icon-btn icon-btn--plain w-7 h-7"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Начальный номер */}
        <div className="gd-row">
          <span className="gd-row-icon">
            <Hash />
          </span>
          <span className="flex-1 min-w-0 text-[14px] text-slate-900 truncate">Начальный номер</span>
          <input
            type="number"
            min={1}
            value={startNumber}
            onChange={(e) => onSetStartNumber(parseInt(e.target.value, 10) || 1)}
            title="Стартовый номер"
            className="gd-field !w-16 !py-1 text-center font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        {/* Релизный пакет GreenData → автопарсинг номера */}
        <div className="gd-row !items-start !py-2.5">
          <span className="gd-row-icon mt-0.5">
            <Package />
          </span>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] text-slate-900 truncate">Релизный пакет</span>
              <button
                type="button"
                onClick={handleFetchUrlFromActiveTab}
                disabled={isParsing}
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-gd-green cursor-pointer flex-shrink-0 disabled:opacity-40"
                title="Вставить ссылку из текущей открытой вкладки Chrome"
              >
                <Sparkles className="w-3 h-3" />
                Из вкладки
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1 min-w-0">
                <ExternalLink className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gd-faint" />
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
                  placeholder="https://expo.greendatasoft.ru/#/card/…"
                  className="gd-field !pl-7 !py-1.5 font-mono !text-[11.5px]"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAutoParseNumber}
                disabled={isParsing}
                isLoading={isParsing}
                title="Спарсить последний номер .guf файла по указанной ссылке"
                leftIcon={!isParsing ? <Hash className="w-3.5 h-3.5" /> : undefined}
              >
                {isParsing ? 'Парсинг…' : '№'}
              </Button>
            </div>
            {parseFeedback && (
              <div
                className={`text-[12px] font-medium flex items-center gap-1.5 animate-fade-in ${
                  parseFeedback.type === 'success' ? 'text-gd-green' : 'text-[#d70015]'
                }`}
              >
                {parseFeedback.type === 'success' ? (
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span className="truncate flex-1 min-w-0">{parseFeedback.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
