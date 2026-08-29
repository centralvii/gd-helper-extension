import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowUp,
  Square,
  Trash2,
  Zap,
  Code2,
  FileCode,
  Layers,
  ArrowDown,
  Copy,
  Check,
  Globe,
  Plus,
  Settings2,
  Bot,
  X,
  Bug,
  Workflow,
} from 'lucide-react';
import { useAiChat } from '../../hooks/useAiChat';
import { AiMessageItem } from './AiMessageItem';
import { AiSettingsModal } from './AiSettingsModal';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { getActiveTabInfo, TabInfo } from '../../utils/tabUtils';

interface CategoryScenario {
  id: string;
  name: string;
  icon: React.ReactNode;
  cards: {
    title: string;
    desc: string;
    prompt: string;
    icon: React.ReactNode;
    badge: string;
  }[];
}

const CATEGORIES: CategoryScenario[] = [
  {
    id: 'all',
    name: 'Все сценарии',
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
    cards: [
      {
        title: 'Алгоритм валидации',
        desc: 'Скрипт проверки обязательных полей карточки с ошибками',
        prompt: 'Напиши пример скрипта алгоритма для валидации обязательных полей карточки GreenData с выводом ошибок пользователю.',
        icon: <Code2 className="w-4 h-4 text-emerald-600" />,
        badge: 'Скрипты',
      },
      {
        title: 'Стандарты именования ID',
        desc: 'Генерация кода идентификатора по регламенту GD',
        prompt: 'Как правильно составить идентификатор алгоритма GreenData для задачи: "Проверка полномочий согласующего лица при изменении статуса договора"?',
        icon: <Zap className="w-4 h-4 text-amber-500" />,
        badge: 'Регламент',
      },
      {
        title: 'SQL выборка в GD',
        desc: 'Оптимизированный SQL-запрос для выборки данных в GreenData',
        prompt: 'Помоги составить эффективный SQL-запрос для выборки активных договоров со связанными контрагентами и суммами больше 1 000 000 руб.',
        icon: <Layers className="w-4 h-4 text-sky-600" />,
        badge: 'SQL / БД',
      },
      {
        title: 'Структура пакета .guf',
        desc: 'Правила упаковки и файл README.txt',
        prompt: 'Объясни правила формирования структуры пакетов обновлений .guf и составления файла README.txt в GreenData.',
        icon: <FileCode className="w-4 h-4 text-purple-600" />,
        badge: 'Упаковка',
      },
    ],
  },
  {
    id: 'scripts',
    name: 'Алгоритмы & JS',
    icon: <Code2 className="w-3.5 h-3.5 text-emerald-600" />,
    cards: [
      {
        title: 'Оптимизация формулы',
        desc: 'Поиск узких мест и ускорение вычислений',
        prompt: 'Оптимизируй следующий алгоритм GreenData для быстродействия и найди потенциальные ошибки:\n```javascript\n\n```',
        icon: <Zap className="w-4 h-4 text-amber-500" />,
        badge: 'Оптимизация',
      },
      {
        title: 'Парсинг JSON и HTTP',
        desc: 'Обработка внешних REST API ответов в GD',
        prompt: 'Напиши пример скрипта алгоритма GreenData для разбора входящего JSON-ответа от внешнего сервиса и заполнения полей объекта.',
        icon: <Code2 className="w-4 h-4 text-emerald-600" />,
        badge: 'REST API',
      },
    ],
  },
  {
    id: 'sql',
    name: 'SQL & База данных',
    icon: <Layers className="w-3.5 h-3.5 text-sky-600" />,
    cards: [
      {
        title: 'Сложный JOIN и агрегаты',
        desc: 'Группировка с фильтрацией по статусам',
        prompt: 'Составь SQL-запрос с объединением таблиц и группировкой для формирования отчёта по исполнителям и среднему времени обработки задач.',
        icon: <Layers className="w-4 h-4 text-sky-600" />,
        badge: 'Агрегаты',
      },
      {
        title: 'Поиск дубликатов в БД',
        desc: 'Выявление повторяющихся записей по ключам',
        prompt: 'Напиши SQL-запрос для поиска дублирующихся карточек контрагентов по ИНН и КПП в базе GreenData.',
        icon: <Bug className="w-4 h-4 text-rose-500" />,
        badge: 'Анализ',
      },
    ],
  },
  {
    id: 'bp',
    name: 'Бизнес-процессы',
    icon: <Workflow className="w-3.5 h-3.5 text-indigo-600" />,
    cards: [
      {
        title: 'Маршрут согласования',
        desc: 'Логика параллельных и последовательных этапов',
        prompt: 'Опиши архитектуру и логику развилок бизнес-процесса многоуровневого согласования заявок на оплату с контролем сроков.',
        icon: <Workflow className="w-4 h-4 text-indigo-600" />,
        badge: 'BPMN',
      },
      {
        title: 'Описание для теста',
        desc: 'Техническая памятка тестировщику по задаче',
        prompt: 'Помоги составить краткое техническое описание доработок и чек-лист сценариев проверки для передачи задачи в тестирование.',
        icon: <Check className="w-4 h-4 text-emerald-600" />,
        badge: 'Тестирование',
      },
    ],
  },
];

const QUICK_PROMPTS_MENU = [
  {
    label: '✨ Написать алгоритм валидации',
    text: 'Напиши алгоритм валидации для объекта GreenData: ',
  },
  {
    label: '⚡ Оптимизировать скрипт / формулу',
    text: 'Оптимизируй следующий код/формулу GreenData и найди ошибки:\n```javascript\n\n```',
  },
  {
    label: '📊 Составить SQL-запрос',
    text: 'Помоги написать SQL запрос для: ',
  },
  {
    label: '🧩 Описать бизнес-процесс',
    text: 'Опиши пошаговую логику и развилки для бизнес-процесса: ',
  },
  {
    label: '📝 Описание реализации для задачи',
    text: 'Помоги составить краткое техническое описание изменений для передачи в тестирование: ',
  },
];

export const AiChatContainer: React.FC = () => {
  const {
    settings,
    messages,
    isLoading,
    isStreaming,
    updateSettings,
    resetSettings,
    sendMessage,
    stopGeneration,
    clearMessages,
    retryLastMessage,
    testConnection,
  } = useAiChat();

  const [inputVal, setInputVal] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [attachedContext, setAttachedContext] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeTabInfo, setActiveTabInfo] = useState<TabInfo | null>(null);
  const [isFetchingTab, setIsFetchingTab] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check active tab on mount
  useEffect(() => {
    getActiveTabInfo()
      .then((tab) => {
        if (tab && (tab.url.includes('greendata') || tab.detectedRawType)) {
          setActiveTabInfo(tab);
        }
      })
      .catch(() => {});
  }, []);

  // Handle scroll position to show/hide "scroll to bottom" button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto-scroll when messages update
  useEffect(() => {
    if (!showScrollBottom || isStreaming) {
      scrollToBottom(isStreaming ? 'auto' : 'smooth');
    }
  }, [messages, isStreaming]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputVal]);

  const handleSend = () => {
    if ((!inputVal.trim() && !attachedContext) || isLoading) return;
    
    let finalPrompt = inputVal.trim();
    if (attachedContext) {
      finalPrompt = `${attachedContext}\n\n${finalPrompt}`;
    }

    sendMessage(finalPrompt);
    setInputVal('');
    setAttachedContext(null);
    setShowQuickMenu(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachActiveTabContext = async () => {
    setIsFetchingTab(true);
    try {
      const tab = await getActiveTabInfo();
      if (tab) {
        setActiveTabInfo(tab);
        const contextString = `[Контекст страницы: ${tab.cleanTitle || tab.title} | ${tab.detectedSectionName || 'GreenData'} | ${tab.url}]`;
        setAttachedContext(contextString);
        textareaRef.current?.focus();
      }
    } catch {
      // ignore
    } finally {
      setIsFetchingTab(false);
    }
  };

  const handleCopyEntireChat = () => {
    if (messages.length === 0) return;
    const text = messages
      .map((m) => `**${m.role === 'user' ? '👤 Пользователь' : '🤖 GreenData AI'}**:\n${m.content}\n`)
      .join('\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const isConfigured = Boolean(
    settings.apiKey.trim() ||
      settings.authType === 'none' ||
      settings.baseUrl.includes('greendata') ||
      settings.baseUrl.includes('localhost') ||
      settings.baseUrl.includes('127.0.0.1')
  );

  const activeCategoryCards = CATEGORIES.find((c) => c.id === selectedCategory)?.cards || CATEGORIES[0].cards;

  return (
    <div className="flex flex-col h-full w-full min-h-0 flex-1 bg-[#fcfcfd] border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden animate-fade-in relative font-sans">
      {/* ── Modern ChatGPT / Grok Minimal Top Bar ── */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex-shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                isConfigured ? 'bg-emerald-500 shadow-xs' : 'bg-amber-400 animate-pulse'
              }`}
              title={isConfigured ? 'ИИ подключен и готов к работе' : 'Требуется настройка подключения'}
            />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              GreenData AI
            </span>

            {/* Custom Model Pill Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/90 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 text-[10.5px] font-mono font-bold border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs max-w-[150px] cursor-pointer group"
              title="Настроить подключение модели (OpenAI compatibility)"
            >
              <span className="truncate">{settings.model || 'Кастомная модель'}</span>
              <Settings2 className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 group-hover:rotate-45 transition-all flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {messages.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                title="Начать новый диалог"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">Новый чат</span>
              </button>

              <button
                type="button"
                onClick={handleCopyEntireChat}
                title="Скопировать весь диалог"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {copiedAll ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="Настройки ИИ подключения"
            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages Scroll View ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-3.5 sm:p-4 overflow-y-auto overscroll-contain space-y-4 bg-slate-50/40 min-h-0 select-text scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="py-4 px-1 text-center max-w-md mx-auto space-y-4 animate-fade-in">
            {/* ChatGPT / Grok Animated Hero */}
            <div className="space-y-2.5">
              <div className="relative inline-block">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Чем могу помочь сегодня?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Составление алгоритмов GreenData, оптимизация SQL, отладка ошибок и пакеты .guf.
                </p>
              </div>

              {/* Active Tab Detection Banner (Grok Web Context Style) */}
              {activeTabInfo && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleAttachActiveTabContext}
                    className="w-full inline-flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white border border-emerald-200/90 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11.5px] font-bold text-slate-900 block truncate group-hover:text-emerald-800">
                          {activeTabInfo.cleanTitle || activeTabInfo.title}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {activeTabInfo.detectedSectionName || 'Вкладка GreenData'} • Прикрепить контекст страницы
                        </span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-emerald-600 flex-shrink-0 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
              )}
            </div>

            {/* Grok-style Category Filter Chips */}
            <div className="space-y-2 pt-1 text-left">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex-shrink-0 cursor-pointer shadow-2xs ${
                      selectedCategory === cat.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Responsive Scenario Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeCategoryCards.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputVal(item.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 hover:shadow-xs text-left transition-all flex items-start gap-2.5 group cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-white transition-colors flex-shrink-0 shadow-2xs">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-slate-900 group-hover:text-emerald-900 transition-colors text-[11.5px] truncate">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-slate-500 line-clamp-2 leading-tight block">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <AiMessageItem
                key={msg.id}
                message={msg}
                onRetry={retryLastMessage}
                onEditPrompt={(content) => {
                  setInputVal(content);
                  textareaRef.current?.focus();
                }}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-26 right-4 z-20 p-2 rounded-full bg-white text-emerald-700 hover:text-emerald-800 shadow-lg border border-slate-200 transition-all hover:scale-105 cursor-pointer"
          title="Прокрутить вниз"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* ── Modern ChatGPT / Grok Floating Composer Bar ── */}
      <div className="p-2.5 sm:p-3 bg-gradient-to-t from-[#fcfcfd] via-[#fcfcfd]/95 to-transparent flex-shrink-0 z-10">
        <div className="relative rounded-3xl bg-white border border-slate-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 shadow-lg transition-all p-3 space-y-2">
          {/* Quick Prompt Templates Popover */}
          {showQuickMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowQuickMenu(false)}
              />
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 space-y-1 z-30 animate-slide-down">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                  <span>Готовые шаблоны запросов:</span>
                  <button
                    onClick={() => setShowQuickMenu(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                {QUICK_PROMPTS_MENU.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputVal(item.text);
                      setShowQuickMenu(false);
                      textareaRef.current?.focus();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-xs text-slate-800 hover:text-emerald-900 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-400">Вставить ↵</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Attached Context Pill Badge (ChatGPT File/Web Search Style) */}
          {attachedContext && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-medium w-fit animate-fade-in">
              <Globe className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="max-w-[220px] truncate">{attachedContext}</span>
              <button
                type="button"
                onClick={() => setAttachedContext(null)}
                className="text-emerald-700 hover:text-rose-600 p-0.5 rounded-md transition-colors cursor-pointer ml-1"
                title="Открепить контекст"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Auto-expanding Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Спросите о коде GreenData, SQL-запросах или структуре .guf..."
            className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-40 leading-relaxed font-normal"
          />

          {/* Bottom Toolbar inside Composer */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
            {/* Left Action Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[11px] font-bold border border-slate-200/80 transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Шаблоны</span>
              </button>

              <button
                type="button"
                onClick={handleAttachActiveTabContext}
                disabled={isFetchingTab}
                title="Прикрепить контекст активной страницы браузера"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[11px] font-bold border border-slate-200/80 transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
              >
                <Globe className="w-3 h-3 text-emerald-600" />
                <span>Контекст вкладки</span>
              </button>
            </div>

            {/* Right Action: Counter & Send / Stop Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {inputVal.length > 0 && (
                <span className="text-[10px] text-slate-400 font-mono hidden xs:inline">
                  {inputVal.length}
                </span>
              )}

              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  title="Остановить генерацию"
                  className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95 animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={(!inputVal.trim() && !attachedContext) || isLoading}
                  title="Отправить (Enter)"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
                    (inputVal.trim() || attachedContext) && !isLoading
                      ? 'bg-slate-900 hover:bg-emerald-600 text-white hover:scale-105 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        onReset={resetSettings}
        onTestConnection={testConnection}
      />

      {/* Clear Chat Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Очистить историю диалога?"
        maxWidth="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsClearModalOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                clearMessages();
                setIsClearModalOpen(false);
              }}
            >
              Очистить
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Вы уверены, что хотите удалить все сообщения из истории диалога? Это действие необратимо.
        </p>
      </Modal>
    </div>
  );
};
