import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  BookOpen,
  History,
  AlertCircle,
  Wand2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateAlgorithmId } from '../../utils/algorithmIdGenerator';
import { AlgorithmHistoryItem, AlgorithmType } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const EXAMPLES = [
  {
    label: 'НПП (ЮЛ): Объекты проверки',
    text: 'Алгоритм определения объектов проверки для проверки НПП (юл)',
    desc: 'Определение объектов + правовая форма',
  },
  {
    label: 'Лимиты: VaR',
    text: 'Лимиты. Рассчитать VaR по портфелю',
    desc: 'Блок + расчет параметра',
  },
  {
    label: 'КИБ: Экспертиза рисков',
    text: 'КИБ. ЗПР. Создать экземпляр экспертизы рисков',
    desc: 'Карточка объекта (инфинитив)',
  },
  {
    label: 'Фильтрация с основанием',
    text: 'Лимиты. Фильтрация Договоров по валюте и дате, на основании Заявки',
    desc: 'Условие фильтрации',
  },
  {
    label: 'Сделки: Проверка прав',
    text: 'Сделки. Проверка полномочий пользователя',
    desc: 'Алгоритм валидации',
  },
];

const POSTFIX_OPTIONS = [
  { value: '_ALG', label: '_ALG (Стандарт)' },
  { value: '_FILTER_ALG', label: '_FILTER_ALG (Фильтр)' },
  { value: '_CARD_ALG', label: '_CARD_ALG (Карточка)' },
  { value: '_VALID_ALG', label: '_VALID_ALG (Валидация)' },
  { value: '_CALC_ALG', label: '_CALC_ALG (Расчет)' },
  { value: '', label: 'Без постфикса' },
];

const HISTORY_STORAGE_KEY = 'gd_alg_id_history';

export const AlgorithmIdGenerator: React.FC = () => {
  const [inputText, setInputText] = useState('Лимиты. Рассчитать VaR по портфелю');
  const [postfix, setPostfix] = useState('_ALG');
  const [copied, setCopied] = useState(false);
  const [showRulesGuide, setShowRulesGuide] = useState(false);
  const [history, setHistory] = useState<AlgorithmHistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const parsed = useMemo(() => {
    return generateAlgorithmId(inputText, { postfix });
  }, [inputText, postfix]);

  // Save to history when valid ID generated
  const saveToHistory = (item: AlgorithmHistoryItem) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.generatedId !== item.generatedId);
      const next = [item, ...filtered].slice(0, 15);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCopy = (idToCopy?: string) => {
    const textToCopy = idToCopy || parsed.generatedId;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Save to history
    saveToHistory({
      id: crypto.randomUUID(),
      russianName: inputText.trim(),
      generatedId: textToCopy,
      type: parsed.detectedType,
      createdAt: Date.now(),
    });

    try {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#22c55e', '#16a34a', '#86efac'],
      });
    } catch {
      // ignore
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const getTypeBadgeVariant = (type: AlgorithmType) => {
    switch (type) {
      case 'filter_condition':
        return 'info';
      case 'card_action':
        return 'purple';
      case 'calculation':
        return 'success';
      case 'validation':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: AlgorithmType) => {
    switch (type) {
      case 'filter_condition':
        return 'Фильтрация элементов';
      case 'card_action':
        return 'Карточка объекта';
      case 'calculation':
        return 'Расчет параметров';
      case 'validation':
        return 'Валидация';
      default:
        return 'Общий алгоритм';
    }
  };

  return (
    <div className="space-y-3">
      {/* ── Input Card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Wand2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">
                Название алгоритма на русском
              </div>
              <div className="text-[10px] text-gray-500">
                Автоматически преобразуется в стандартный ID по правилам GreenData
              </div>
            </div>
          </div>

          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Очистить
            </button>
          )}
        </div>

        {/* Input Text Area */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Например: Лимиты. Рассчитать VaR по портфелю"
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/60 p-2.5 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Quick Example Chips */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Готовые примеры по правилам GreenData:
          </div>

          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setInputText(ex.text)}
                title={`${ex.desc}: "${ex.text}"`}
                className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Postfix and Settings Row */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-gray-600">
              Постфикс:
            </label>
            <select
              value={postfix}
              onChange={(e) => setPostfix(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-800 outline-none focus:border-emerald-500"
            >
              {POSTFIX_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowRulesGuide(!showRulesGuide)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
          >
            <BookOpen className="w-3 h-3" />
            {showRulesGuide ? 'Скрыть правила' : 'Справочник правил'}
            {showRulesGuide ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* ── Generated Result Card ── */}
      <div className="overflow-hidden rounded-xl border border-emerald-300 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/70 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Сгенерированный Идентификатор
            </span>
            <Badge
              variant={getTypeBadgeVariant(parsed.detectedType)}
              size="sm"
            >
              {getTypeLabel(parsed.detectedType)}
            </Badge>
          </div>

          {parsed.generatedId && (
            <span className="text-[10px] font-mono text-emerald-700">
              {parsed.generatedId.length} символов
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-3 space-y-3">
          {parsed.generatedId ? (
            <div className="space-y-2.5">
              {/* ID display and Copy button */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/30 p-2.5">
                <span className="break-all font-mono text-sm font-extrabold text-emerald-800 select-all">
                  {parsed.generatedId}
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={
                    copied ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                  onClick={() => handleCopy()}
                  className="flex-shrink-0"
                >
                  {copied ? 'Скопировано!' : 'Копировать'}
                </Button>
              </div>

              {/* Semantic breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {parsed.blockCode && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-1.5">
                    <span className="text-gray-500 block text-[10px]">Блок:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {parsed.blockCode}
                    </span>
                    {parsed.block && (
                      <span className="text-gray-500 text-[10px] ml-1">
                        ({parsed.block})
                      </span>
                    )}
                  </div>
                )}

                {parsed.actionCode && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-1.5">
                    <span className="text-gray-500 block text-[10px]">Действие:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {parsed.actionCode}
                    </span>
                    {parsed.actionVerb && (
                      <span className="text-gray-500 text-[10px] ml-1">
                        ({parsed.actionVerb})
                      </span>
                    )}
                  </div>
                )}

                {parsed.targetObjectCode && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-1.5">
                    <span className="text-gray-500 block text-[10px]">Объект:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {parsed.targetObjectCode}
                    </span>
                    {parsed.targetObject && (
                      <span className="text-gray-500 text-[10px] ml-1">
                        ({parsed.targetObject})
                      </span>
                    )}
                  </div>
                )}

                {parsed.filterParamsCode && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-1.5">
                    <span className="text-gray-500 block text-[10px]">Фильтр по:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {parsed.filterParamsCode}
                    </span>
                  </div>
                )}

                {parsed.baseObjectCode && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-1.5">
                    <span className="text-gray-500 block text-[10px]">Основание:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {parsed.baseObjectCode}
                    </span>
                  </div>
                )}
              </div>

              {/* Alternative Variations */}
              {parsed.variants && (
                <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Альтернативные варианты формата (клик для копирования):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.variants.scopeFirstId && parsed.variants.scopeFirstId !== parsed.generatedId && (
                      <button
                        type="button"
                        onClick={() => handleCopy(parsed.variants.scopeFirstId)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-[11px] font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-1"
                        title="Вариант с префиксом предметной области / юр. формы в начале"
                      >
                        <Copy className="w-3 h-3 text-emerald-600" />
                        <span>{parsed.variants.scopeFirstId}</span>
                      </button>
                    )}
                    {parsed.variants.compactId && parsed.variants.compactId !== parsed.generatedId && parsed.variants.compactId !== parsed.variants.scopeFirstId && (
                      <button
                        type="button"
                        onClick={() => handleCopy(parsed.variants.compactId)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-[11px] font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-1"
                        title="Компактный вариант"
                      >
                        <Copy className="w-3 h-3 text-emerald-600" />
                        <span>{parsed.variants.compactId}</span>
                      </button>
                    )}
                    {parsed.variants.fullId && parsed.variants.fullId !== parsed.generatedId && parsed.variants.fullId !== parsed.variants.scopeFirstId && (
                      <button
                        type="button"
                        onClick={() => handleCopy(parsed.variants.fullId)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-[11px] font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-1"
                        title="Развернутый вариант (полные английские слова)"
                      >
                        <Copy className="w-3 h-3 text-emerald-600" />
                        <span>{parsed.variants.fullId}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings if any */}
              {parsed.warnings.length > 0 && (
                <div className="space-y-1 pt-1">
                  {parsed.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-gray-400">
              Введите русское название алгоритма выше для генерации идентификатора
            </div>
          )}
        </div>
      </div>

      {/* ── Rules Reference Guide (Collapsible) ── */}
      {showRulesGuide && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm space-y-2.5 animate-slide-down">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-gray-900">
              Стандарты именования алгоритмов GreenData
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
            <div className="rounded-lg bg-gray-50 p-2 border border-gray-100 space-y-1">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white">
                  1
                </span>
                Общий принцип и префиксы блоков:
              </div>
              <p className="text-[11px] text-gray-600">
                Все алгоритмы должны называться осмысленно. Если алгоритм относится к блоку, в начале добавляется префикс (например «Лимиты. Рассчитать VaR по портфелю» → <code className="font-mono font-bold text-emerald-700 bg-white px-1 py-0.5 rounded">LIM_VAR_CALC_ALG</code>).
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-2 border border-gray-100 space-y-1">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white">
                  2
                </span>
                Алгоритм карточки объектов:
              </div>
              <p className="text-[11px] text-gray-600">
                Название экземпляра типа «Алгоритма. карточки объектов» должно содержать глагол в инфинитиве (например «КИБ. ЗПР. Создать экземпляр экспертизы рисков»).
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-2 border border-gray-100 space-y-1">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white">
                  3
                </span>
                Условие фильтрации для выбора элементов:
              </div>
              <p className="text-[11px] text-gray-600">
                Конструкция: <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded">&lt;Блок&gt;. Фильтрация &lt;Тип объекта&gt; по &lt;Параметры&gt;[, на основании &lt;Базовый объект&gt;]</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── History of Generated IDs ── */}
      {history.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <History className="w-3.5 h-3.5 text-gray-500" />
              <span>История генераций ({history.length})</span>
            </div>

            <button
              onClick={handleClearHistory}
              className="text-[10px] text-gray-400 hover:text-rose-600 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Очистить
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50/80 hover:bg-emerald-50/40 border border-gray-200 transition-colors text-xs"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => setInputText(item.russianName)}
                  title="Нажмите, чтобы вставить в поле ввода"
                >
                  <span className="block truncate font-mono font-bold text-emerald-800">
                    {item.generatedId}
                  </span>
                  <span className="block truncate text-[10px] text-gray-500">
                    {item.russianName}
                  </span>
                </div>

                <button
                  onClick={() => handleCopy(item.generatedId)}
                  title="Скопировать этот ID"
                  className="icon-btn p-1 text-gray-400 hover:text-emerald-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
