import React, { useState, useEffect, useMemo } from 'react';
import {
  Wand2,
  Copy,
  Check,
  History,
  Trash2,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookA,
  Plus,
} from 'lucide-react';
import {
  generateAlgorithmId,
  DEFAULT_CUSTOM_DICTIONARY,
} from '../../utils/algorithmIdGenerator';
import { AlgorithmHistoryItem, AlgorithmType } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import confetti from 'canvas-confetti';

const EXAMPLES = [
  {
    label: 'Расчет VaR',
    text: 'Лимиты. Рассчитать VaR по портфелю',
    desc: 'Блок + Расчет параметров',
  },
  {
    label: 'Экспертиза КИБ',
    text: 'КИБ. ЗПР. Создать экземпляр экспертизы рисков',
    desc: 'Многоуровневый блок + Карточка объекта',
  },
  {
    label: 'Проверка НПП (юл)',
    text: 'Алгоритм определения объектов проверки для проверки НПП (юл)',
    desc: 'Определение объектов + Юрлицо',
  },
  {
    label: 'Стирание заключений',
    text: 'ФИН. ЗИ. Проверка НПП (юл). Стирание заключений переставших соответствовать требованиям',
    desc: 'Комплексный блок + Стирание заключений',
  },
  {
    label: 'ЖЦ до сохранения',
    text: 'Изменен алгоритм ЖЦ до сохранения НПП контракты, добавлена проверка типа ЗИ',
    desc: 'Жизненный цикл + Событие до сохранения + Контракты',
  },
  {
    label: 'Фильтрация счетов',
    text: 'Фильтрация расчетных счетов по валюте, на основании договора',
    desc: 'Условие фильтрации элементов',
  },
];

const POSTFIX_OPTIONS = [
  { value: '_ALG', label: '_ALG (Стандартный)' },
  { value: '_FILTER_ALG', label: '_FILTER_ALG (Фильтр)' },
  { value: '_CARD_ALG', label: '_CARD_ALG (Карточка)' },
  { value: '_VALID_ALG', label: '_VALID_ALG (Валидация)' },
  { value: '_CALC_ALG', label: '_CALC_ALG (Расчет)' },
  { value: '', label: 'Без постфикса' },
];

const HISTORY_STORAGE_KEY = 'gd_alg_id_history';
const CUSTOM_DICT_STORAGE_KEY = 'gd_custom_terms_dictionary';
const ALG_INPUT_KEY = 'gd-helper-alg-input';
const ALG_POSTFIX_KEY = 'gd-helper-alg-postfix';

export const AlgorithmIdGenerator: React.FC = () => {
  const [inputText, setInputText] = useState<string>(() => {
    try {
      return localStorage.getItem(ALG_INPUT_KEY) ?? 'Лимиты. Рассчитать VaR по портфелю';
    } catch {
      return 'Лимиты. Рассчитать VaR по портфелю';
    }
  });

  const [postfix, setPostfix] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ALG_POSTFIX_KEY);
      return POSTFIX_OPTIONS.some((o) => o.value === saved) ? saved! : '_ALG';
    } catch {
      return '_ALG';
    }
  });

  const [customDict, setCustomDict] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_DICT_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CUSTOM_DICTIONARY, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_CUSTOM_DICTIONARY;
  });

  const [showDictModal, setShowDictModal] = useState(false);
  const [newRuWord, setNewRuWord] = useState('');
  const [newEnCode, setNewEnCode] = useState('');
  const [dictSearch, setDictSearch] = useState('');

  const handleSetInputText = (val: string) => {
    setInputText(val);
    try {
      localStorage.setItem(ALG_INPUT_KEY, val);
    } catch {
      // ignore
    }
  };

  const handleSetPostfix = (val: string) => {
    setPostfix(val);
    try {
      localStorage.setItem(ALG_POSTFIX_KEY, val);
    } catch {
      // ignore
    }
  };

  const [copied, setCopied] = useState(false);
  const [showRulesGuide, setShowRulesGuide] = useState(false);
  const [history, setHistory] = useState<AlgorithmHistoryItem[]>([]);

  // Load history & storage on mount
  useEffect(() => {
    try {
      const savedHist = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHist) setHistory(JSON.parse(savedHist));
    } catch {
      // ignore
    }
  }, []);

  const handleAddCustomTerm = (e: React.FormEvent) => {
    e.preventDefault();
    const ru = newRuWord.trim().toLowerCase();
    const en = newEnCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (!ru || !en) return;

    const updated = { ...customDict, [ru]: en };
    setCustomDict(updated);
    try {
      localStorage.setItem(CUSTOM_DICT_STORAGE_KEY, JSON.stringify(updated));
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [CUSTOM_DICT_STORAGE_KEY]: updated });
      }
    } catch {
      // ignore
    }
    setNewRuWord('');
    setNewEnCode('');
  };

  const handleDeleteCustomTerm = (ruWord: string) => {
    const updated = { ...customDict };
    delete updated[ruWord.toLowerCase()];
    setCustomDict(updated);
    try {
      localStorage.setItem(CUSTOM_DICT_STORAGE_KEY, JSON.stringify(updated));
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [CUSTOM_DICT_STORAGE_KEY]: updated });
      }
    } catch {
      // ignore
    }
  };

  const parsed = useMemo(() => {
    return generateAlgorithmId(inputText, { postfix, customDictionary: customDict });
  }, [inputText, postfix, customDict]);

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
        return 'purple';
      case 'card_action':
        return 'info';
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

  const filteredDictEntries = useMemo(() => {
    const q = dictSearch.toLowerCase().trim();
    return Object.entries(customDict).filter(([ru, en]) => {
      if (!q) return true;
      return ru.includes(q) || en.toLowerCase().includes(q);
    });
  }, [customDict, dictSearch]);

  return (
    <div className="space-y-3">
      {/* ── Input Card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Wand2 className="w-4 h-4 flex-shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-gray-900 truncate">
                Название алгоритма на русском
              </div>
              <div className="text-[10px] text-gray-500 truncate">
                Автоматически переводится в смысловой ID GreenData
              </div>
            </div>
          </div>

          {inputText && (
            <button
              onClick={() => handleSetInputText('')}
              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              Очистить
            </button>
          )}
        </div>

        {/* Input Text Area */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => handleSetInputText(e.target.value)}
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
                onClick={() => handleSetInputText(ex.text)}
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
              onChange={(e) => handleSetPostfix(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-800 outline-none focus:border-emerald-500"
            >
              {POSTFIX_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDictModal(!showDictModal)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:text-sky-800 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200 transition-colors"
            >
              <BookA className="w-3 h-3 text-sky-600" />
              <span>Словарь терминов ({Object.keys(customDict).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRulesGuide(!showRulesGuide)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
            >
              <BookOpen className="w-3 h-3" />
              <span>{showRulesGuide ? 'Скрыть правила' : 'Правила'}</span>
              {showRulesGuide ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Custom Dictionary Section (Collapsible) ── */}
      {showDictModal && (
        <div className="rounded-xl border border-sky-200 bg-white p-3 shadow-sm space-y-3 animate-slide-down">
          <div className="flex items-center justify-between border-b border-sky-100 pb-2">
            <div className="flex items-center gap-2">
              <BookA className="w-4 h-4 text-sky-600" />
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Словарь терминов и сокращений
                </span>
                <span className="text-[10px] text-gray-500 block">
                  Добавляйте свои сокращения — они имеют высший приоритет при переводе
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowDictModal(false)}
              className="text-[11px] text-gray-400 hover:text-gray-600"
            >
              Свернуть
            </button>
          </div>

          {/* Add Term Form */}
          <form onSubmit={handleAddCustomTerm} className="flex items-center gap-1.5">
            <Input
              value={newRuWord}
              onChange={(e) => setNewRuWord(e.target.value)}
              placeholder="Слово (напр. сппр, участник)"
              className="flex-1"
            />
            <Input
              value={newEnCode}
              onChange={(e) => setNewEnCode(e.target.value)}
              placeholder="Код (напр. SPPR, PARTICIPANT)"
              className="flex-1 font-mono uppercase"
            />
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={!newRuWord.trim() || !newEnCode.trim()}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Добавить
            </Button>
          </form>

          {/* Search Term */}
          <div className="space-y-1.5">
            <input
              type="text"
              value={dictSearch}
              onChange={(e) => setDictSearch(e.target.value)}
              placeholder="Поиск по словарю..."
              className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-sky-500 outline-none"
            />

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-gray-50/50 rounded-lg border border-gray-100">
              {filteredDictEntries.map(([ru, en]) => (
                <span
                  key={ru}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[11px] font-medium shadow-2xs"
                >
                  <span className="text-gray-700">{ru}</span>
                  <span className="text-gray-300">→</span>
                  <strong className="font-mono text-emerald-700">{en}</strong>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomTerm(ru)}
                    title="Удалить из словаря"
                    className="text-gray-300 hover:text-rose-600 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Generated Result Card ── */}
      <div className="overflow-hidden rounded-xl border border-emerald-300 bg-white shadow-sm">
        {/* Header — single compact row: label left, char-count right */}
        <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/70 px-3 py-2">
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 whitespace-nowrap">
              Сгенерированный ID
            </span>
            <Badge variant={getTypeBadgeVariant(parsed.detectedType)} size="sm">
              {getTypeLabel(parsed.detectedType)}
            </Badge>
          </div>

          {parsed.generatedId && (
            <span className="flex-shrink-0 text-[11px] font-medium text-emerald-700 whitespace-nowrap">
              {parsed.generatedId.length} симв.
            </span>
          )}
        </div>

        {/* Result Content */}
        <div className="p-3 space-y-3">
          {parsed.generatedId ? (
            <div className="space-y-3">
              {/* Main ID Block */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-2.5 space-y-2">
                <div className="font-mono text-xs font-bold text-gray-900 break-all select-all tracking-wide leading-relaxed">
                  {parsed.generatedId}
                </div>

                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => handleCopy()}
                  leftIcon={
                    copied ? (
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                    )
                  }
                  className="w-full justify-center"
                >
                  <span>{copied ? 'Скопировано в буфер!' : 'Копировать'}</span>
                </Button>
              </div>

              {/* Semantic Breakdown Details */}
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {parsed.block && (
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 border border-gray-100">
                    <span className="text-gray-500 text-[11px]">
                      Функциональный блок:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {parsed.block}{' '}
                      <code className="text-emerald-700 font-mono">
                        ({parsed.blockCode})
                      </code>
                    </span>
                  </div>
                )}

                {parsed.detectedType === 'filter_condition' && (
                  <>
                    {parsed.targetObject && (
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 border border-gray-100">
                        <span className="text-gray-500 text-[11px]">
                          Тип объекта:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {parsed.targetObject}{' '}
                          <code className="text-emerald-700 font-mono">
                            ({parsed.targetObjectCode})
                          </code>
                        </span>
                      </div>
                    )}
                    {parsed.filterParams && (
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 border border-gray-100">
                        <span className="text-gray-500 text-[11px]">
                          Параметры фильтрации:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {parsed.filterParams}{' '}
                          <code className="text-emerald-700 font-mono">
                            ({parsed.filterParamsCode})
                          </code>
                        </span>
                      </div>
                    )}
                    {parsed.baseObject && (
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 border border-gray-100">
                        <span className="text-gray-500 text-[11px]">
                          Базовый объект:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {parsed.baseObject}{' '}
                          <code className="text-emerald-700 font-mono">
                            ({parsed.baseObjectCode})
                          </code>
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 border border-gray-100">
                  <span className="text-gray-500 text-[11px]">Тип правила:</span>
                  <span className="font-medium text-gray-700 text-[11px]">
                    {parsed.explanation}
                  </span>
                </div>
              </div>

              {/* Alternative Variations */}
              {parsed.variants && (
                <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Альтернативные варианты (клик для копирования):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.variants.scopeFirstId &&
                      parsed.variants.scopeFirstId !== parsed.generatedId && (
                        <button
                          type="button"
                          onClick={() => handleCopy(parsed.variants.scopeFirstId)}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-[11px] font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-1"
                          title="Вариант с префиксом предметной области в начале"
                        >
                          <Copy className="w-3 h-3 text-emerald-600" />
                          <span>{parsed.variants.scopeFirstId}</span>
                        </button>
                      )}
                    {parsed.variants.compactId &&
                      parsed.variants.compactId !== parsed.generatedId &&
                      parsed.variants.compactId !== parsed.variants.scopeFirstId && (
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
