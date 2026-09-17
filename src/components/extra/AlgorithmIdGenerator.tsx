import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  History,
  Trash2,
  BookOpen,
  AlertCircle,
  BookA,
  Plus,
  Sparkles,
  Zap,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import {
  generateAlgorithmId,
  DEFAULT_CUSTOM_DICTIONARY,
} from '../../utils/algorithmIdGenerator';
import { AlgorithmHistoryItem, AlgorithmType, AiAlgorithmIdResult } from '../../types';
import { generateAlgorithmIdViaAi, isAiConfigured } from '../../services/aiAlgorithmGenerator';
import { useAiChat } from '../../hooks/useAiChat';
import { AiSettingsModal } from '../ai/AiSettingsModal';
import {
  Modal,
  Badge,
  Button,
  Input,
  Select,
  Toolbar,
  SegmentedControl,
  Textarea,
} from '../ui';
import confetti from 'canvas-confetti';

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
  const {
    settings: aiSettings,
    updateSettings: updateAiSettings,
    resetSettings: resetAiSettings,
    testConnection: testAiConnection,
  } = useAiChat();

  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isDictOpen, setIsDictOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [aiResult, setAiResult] = useState<AiAlgorithmIdResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<'ai' | 'local'>('local');

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

  const [newRuWord, setNewRuWord] = useState('');
  const [newEnCode, setNewEnCode] = useState('');
  const [dictSearch, setDictSearch] = useState('');

  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<AlgorithmHistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const savedHist = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHist) setHistory(JSON.parse(savedHist));
    } catch {
      // ignore
    }
  }, []);

  const handleSetInputText = (val: string) => {
    setInputText(val);
    setActiveSource('local');
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

  const handleGenerateAi = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (!isAiConfigured()) {
      setIsAiSettingsOpen(true);
      return;
    }

    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await generateAlgorithmIdViaAi(trimmed, { postfix });
      setAiResult(res);
      setActiveSource('ai');
    } catch (err: any) {
      setAiError(err?.message || 'Не удалось сгенерировать ID через AI модель.');
    } finally {
      setIsAiLoading(false);
    }
  };

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

  const saveToHistory = (item: AlgorithmHistoryItem) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.generatedId !== item.generatedId);
      const next = [item, ...filtered].slice(0, 20);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const currentGeneratedId =
    activeSource === 'ai' && aiResult?.primaryId ? aiResult.primaryId : parsed.generatedId;
  const currentDetectedType: AlgorithmType =
    activeSource === 'ai' && aiResult?.detectedType ? aiResult.detectedType : parsed.detectedType;

  const handleCopy = (idToCopy?: string, itemType?: AlgorithmType) => {
    const textToCopy = idToCopy || currentGeneratedId;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setCopiedId(textToCopy);
    setTimeout(() => {
      setCopied(false);
      setCopiedId(null);
    }, 2000);

    saveToHistory({
      id: crypto.randomUUID(),
      russianName: inputText.trim(),
      generatedId: textToCopy,
      type: itemType || currentDetectedType,
      createdAt: Date.now(),
    });

    try {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#10b981', '#059669', '#34d399'],
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
        return 'Фильтрация';
      case 'card_action':
        return 'Карточка';
      case 'calculation':
        return 'Расчет';
      case 'validation':
        return 'Валидация';
      default:
        return 'Общий';
    }
  };

  const filteredDictEntries = useMemo(() => {
    const q = dictSearch.toLowerCase().trim();
    return Object.entries(customDict).filter(([ru, en]) => {
      if (!q) return true;
      return ru.includes(q) || en.toLowerCase().includes(q);
    });
  }, [customDict, dictSearch]);

  const activeVariants = useMemo(() => {
    if (activeSource === 'ai' && aiResult?.variants && aiResult.variants.length > 0) {
      return aiResult.variants;
    }
    const list: Array<{ id: string; desc?: string }> = [];
    if (parsed.variants?.scopeFirstId && parsed.variants.scopeFirstId !== parsed.generatedId) {
      list.push({ id: parsed.variants.scopeFirstId, desc: 'Префикс блока' });
    }
    if (
      parsed.variants?.compactId &&
      parsed.variants.compactId !== parsed.generatedId &&
      parsed.variants.compactId !== parsed.variants?.scopeFirstId
    ) {
      list.push({ id: parsed.variants.compactId, desc: 'Компактный' });
    }
    return list;
  }, [activeSource, aiResult, parsed]);

  return (
    <div className="space-y-3">
      {/* ── Top Toolbar Bar (Project Standard Style) ── */}
      <Toolbar className="animate-fade-in">
        <Toolbar.Title
          icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          title={<span className="hidden xs:inline">Инструменты</span>}
          titleAttr="Инструменты"
        />

        <Toolbar.Actions>
          <Toolbar.Button
            onClick={() => setIsHistoryOpen(true)}
            title="История генераций"
            icon={<History className="w-3.5 h-3.5 text-emerald-600" />}
            badge={
              history.length > 0 ? (
                <span className="px-1 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  {history.length}
                </span>
              ) : undefined
            }
            className={
              history.length > 0
                ? 'px-1.5 xs:px-2.5 flex-shrink-0'
                : 'w-7 h-7 p-0 xs:w-auto xs:px-2.5 justify-center flex-shrink-0'
            }
          >
            <span className="hidden xs:inline">История</span>
          </Toolbar.Button>

          <Toolbar.Button
            onClick={() => setIsDictOpen(true)}
            title="Словарь терминов и сокращений"
            icon={<BookA className="w-3.5 h-3.5 text-emerald-600" />}
            className="w-7 h-7 p-0 xs:w-auto xs:px-2.5 justify-center flex-shrink-0"
          >
            <span className="hidden xs:inline">Словарь</span>
          </Toolbar.Button>

          <Toolbar.Button
            onClick={() => setIsRulesOpen(true)}
            title="Стандарты именования алгоритмов GreenData"
            icon={<BookOpen className="w-3.5 h-3.5 text-emerald-600" />}
            className="w-7 h-7 p-0 xs:w-auto xs:px-2.5 justify-center flex-shrink-0"
          >
            <span className="hidden xs:inline">Правила</span>
          </Toolbar.Button>

          <Toolbar.Button
            onClick={() => setIsAiSettingsOpen(true)}
            title={
              isAiConfigured()
                ? `Параметры AI (${aiSettings.model || 'OpenAI'} подключен)`
                : 'Настройка подключения AI'
            }
            icon={<Settings className="w-3.5 h-3.5 text-emerald-600" />}
            dot={isAiConfigured()}
            className="w-7 h-7 p-0 justify-center flex-shrink-0"
          />
        </Toolbar.Actions>
      </Toolbar>

      {/* ── Input Card (Clean & Compact) ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs space-y-2.5">
        <Textarea
          value={inputText}
          onChange={(e) => handleSetInputText(e.target.value)}
          placeholder="Например: Лимиты. Рассчитать VaR по портфелю..."
          rows={2}
          showClear
          onClear={() => handleSetInputText('')}
        />

        {/* Controls row: Postfix selector & AI Generation button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[11px] text-slate-500 font-medium flex-shrink-0">Постфикс:</span>
            <Select
              size="sm"
              value={postfix}
              onChange={(val) => handleSetPostfix(val)}
              options={POSTFIX_OPTIONS}
              className="flex-1 min-w-0 text-xs"
            />
          </div>

          <Button
            variant="emerald"
            size="sm"
            onClick={handleGenerateAi}
            disabled={isAiLoading || !inputText.trim()}
            className="w-full sm:w-auto h-8 px-3 text-xs font-semibold shadow-2xs cursor-pointer bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white flex-shrink-0"
            leftIcon={
              isAiLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              )
            }
          >
            <span>{isAiLoading ? 'AI думает...' : 'AI Генерация'}</span>
          </Button>
        </div>

        {/* Error notification */}
        {aiError && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2 text-xs text-rose-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <span className="text-[11px] text-rose-700 truncate">{aiError}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAiSettingsOpen(true)}
              className="text-[10px] font-bold text-rose-700 underline hover:text-rose-900 whitespace-nowrap flex-shrink-0 cursor-pointer"
            >
              Настройки AI
            </button>
          </div>
        )}
      </div>

      {/* ── Generated Result Card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {aiResult ? (
              <SegmentedControl<'ai' | 'local'>
                size="xs"
                value={activeSource}
                onChange={setActiveSource}
                options={[
                  { value: 'ai', label: 'AI', icon: <Sparkles className="w-3 h-3" /> },
                  { value: 'local', label: 'Локальный', icon: <Zap className="w-3 h-3" /> },
                ]}
              />
            ) : (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                <Zap className="w-3 h-3 text-amber-500" />
                Локальный перевод
              </span>
            )}

            <Badge variant={getTypeBadgeVariant(currentDetectedType)} size="xs" dot>
              {getTypeLabel(currentDetectedType)}
            </Badge>
          </div>

          {currentGeneratedId && (
            <span className="text-[10px] font-mono font-bold text-slate-500 whitespace-nowrap">
              {currentGeneratedId.length} симв.
            </span>
          )}
        </div>

        {/* Result Content */}
        <div className="p-3 space-y-2.5">
          {currentGeneratedId ? (
            <>
              {/* Monospace ID block with full-width text and top-right copy icon */}
              <div
                onClick={() => handleCopy()}
                title="Нажмите, чтобы скопировать"
                className="group/id relative p-3 pr-10 rounded-xl border border-emerald-200/90 bg-emerald-50/50 hover:bg-emerald-50/80 transition-all cursor-pointer shadow-2xs"
              >
                <div className="font-mono text-xs font-bold text-emerald-950 break-all select-all leading-relaxed">
                  {currentGeneratedId}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  title="Скопировать идентификатор"
                  className={`absolute top-2.5 right-2.5 h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                    copied && (!copiedId || copiedId === currentGeneratedId)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 hover:border-emerald-400 active:scale-95'
                  }`}
                >
                  {copied && (!copiedId || copiedId === currentGeneratedId) ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Dedicated Copy Button */}
              <Button
                variant="emerald"
                size="sm"
                onClick={() => handleCopy()}
                className="w-full h-8 text-xs font-semibold shadow-2xs cursor-pointer"
                leftIcon={
                  copied && (!copiedId || copiedId === currentGeneratedId) ? (
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                  )
                }
              >
                <span>
                  {copied && (!copiedId || copiedId === currentGeneratedId)
                    ? 'Скопировано в буфер!'
                    : 'Копировать идентификатор'}
                </span>
              </Button>

              {/* Semantic explanation note */}
              {activeSource === 'ai' && aiResult?.explanation && (
                <div className="text-[11px] text-slate-600 bg-slate-50/80 p-2 rounded-xl border border-slate-100 leading-relaxed flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span>{aiResult.explanation}</span>
                </div>
              )}

              {/* Local breakdown badges */}
              {activeSource === 'local' && (
                <div className="flex items-center gap-1.5 flex-wrap text-[10.5px]">
                  {parsed.block && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                      Блок: <strong className="text-emerald-700 font-mono">{parsed.blockCode}</strong>
                    </span>
                  )}
                  {parsed.targetObject && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                      Объект: <strong className="text-emerald-700 font-mono">{parsed.targetObjectCode}</strong>
                    </span>
                  )}
                  {parsed.filterParams && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                      Фильтр: <strong className="text-emerald-700 font-mono">{parsed.filterParamsCode}</strong>
                    </span>
                  )}
                  <span className="text-slate-500 truncate max-w-full">
                    {parsed.explanation}
                  </span>
                </div>
              )}

              {/* Alternative Variants as compact chips */}
              {activeVariants.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Варианты (клик для копирования):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeVariants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleCopy(v.id)}
                        title={v.desc}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 text-[11px] font-mono font-medium transition-all shadow-2xs cursor-pointer group"
                      >
                        <span className="break-all">{v.id}</span>
                        {v.desc && (
                          <span className="text-[9.5px] font-sans text-slate-400 group-hover:text-emerald-700">
                            ({v.desc})
                          </span>
                        )}
                        {copied && copiedId === v.id ? (
                          <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5 text-xs text-slate-400">
              Введите русское название алгоритма выше для генерации идентификатора
            </div>
          )}
        </div>
      </div>

      {/* ── Dictionary Modal ── */}
      <Modal
        isOpen={isDictOpen}
        onClose={() => setIsDictOpen(false)}
        title="Словарь терминов и исключений"
        maxWidth="md"
      >
        <div className="space-y-3">
          <div className="text-xs text-slate-500">
            Пользовательские сокращения имеют высший приоритет при формировании идентификаторов.
          </div>

          <form onSubmit={handleAddCustomTerm} className="flex items-center gap-1.5">
            <Input
              value={newRuWord}
              onChange={(e) => setNewRuWord(e.target.value)}
              placeholder="Русское слово (напр. сппр)"
              className="flex-1 text-xs"
            />
            <Input
              value={newEnCode}
              onChange={(e) => setNewEnCode(e.target.value)}
              placeholder="Код (напр. SPPR)"
              className="flex-1 text-xs font-mono uppercase"
            />
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={!newRuWord.trim() || !newEnCode.trim()}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs flex-shrink-0"
            >
              Добавить
            </Button>
          </form>

          <div className="space-y-1.5">
            <input
              type="text"
              value={dictSearch}
              onChange={(e) => setDictSearch(e.target.value)}
              placeholder="Поиск по терминам..."
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
            />

            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
              {filteredDictEntries.map(([ru, en]) => (
                <span
                  key={ru}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-medium shadow-2xs"
                >
                  <span className="text-slate-700">{ru}</span>
                  <span className="text-slate-300">→</span>
                  <strong className="font-mono text-emerald-700">{en}</strong>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomTerm(ru)}
                    title="Удалить из словаря"
                    className="text-slate-300 hover:text-rose-600 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Rules Modal ── */}
      <Modal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        title="Стандарты именования GreenData"
        maxWidth="md"
      >
        <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white font-bold">1</span>
              Каноническая формула и префиксы блоков:
            </div>
            <p className="text-[11px] text-slate-600">
              <code className="font-mono text-[10.5px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-emerald-700">
                [ПРЕФИКС_БЛОКА]_[СУБЪЕКТ]_[ДЕЙСТВИЕ]_[ПОСТФИКС]
              </code>
            </p>
            <p className="text-[11px] text-slate-600">
              Например: «Лимиты. Рассчитать VaR по портфелю» → <code className="font-mono font-bold text-emerald-700">LIM_VAR_CALC_ALG</code>.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white font-bold">2</span>
              Алгоритмы карточек объектов:
            </div>
            <p className="text-[11px] text-slate-600">
              Действие всегда содержит глагол в инфинитиве (CREATE, UPDATE, DELETE, EXEC, SEND, APPROVE). Постфикс: <code className="font-mono font-bold">_CARD_ALG</code> или <code className="font-mono font-bold">_ALG</code>.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white font-bold">3</span>
              Условия фильтрации для выбора элементов:
            </div>
            <p className="text-[11px] text-slate-600">
              Конструкция: <code className="font-mono text-[10.5px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-emerald-700">
                FILTER_&lt;ТИП_ОБЪЕКТА&gt;_BY_&lt;ПАРАМЕТРЫ&gt;[_BASED_ON_&lt;БАЗОВЫЙ_ОБЪЕКТ&gt;]
              </code>. Постфикс: <code className="font-mono font-bold">_FILTER_ALG</code>.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white font-bold">4</span>
              Расчеты и валидации:
            </div>
            <p className="text-[11px] text-slate-600">
              Для проверок используется ключевой токен <code className="font-mono font-bold text-amber-700">CHECK</code> (постфикс <code className="font-mono font-bold">_VALID_ALG</code>). Для вычислений — токен <code className="font-mono font-bold text-emerald-700">CALC</code> (постфикс <code className="font-mono font-bold">_CALC_ALG</code>).
            </p>
          </div>
        </div>
      </Modal>

      {/* ── History Modal ── */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="История генераций"
        maxWidth="md"
        footer={
          history.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Очистить историю
            </Button>
          ) : undefined
        }
      >
        {history.length > 0 ? (
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 transition-colors text-xs"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    handleSetInputText(item.russianName);
                    setIsHistoryOpen(false);
                  }}
                  title="Вставить в поле ввода"
                >
                  <div className="font-mono font-bold text-slate-900 truncate">
                    {item.generatedId}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {item.russianName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(item.generatedId, item.type)}
                  title="Скопировать"
                  className="p-1 text-slate-400 hover:text-emerald-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            История пуста
          </div>
        )}
      </Modal>

      {/* ── AI Settings Modal ── */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        settings={aiSettings}
        onSave={updateAiSettings}
        onReset={resetAiSettings}
        onTestConnection={testAiConnection}
      />
    </div>
  );
};
