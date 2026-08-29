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
} from 'lucide-react';
import { useAiChat } from '../../hooks/useAiChat';
import { AiMessageItem } from './AiMessageItem';
import { AiSettingsModal } from './AiSettingsModal';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { getActiveTabInfo, TabInfo } from '../../utils/tabUtils';

const PROMPT_SUGGESTIONS = [
  {
    title: 'Алгоритм валидации',
    desc: 'Скрипт проверки обязательных полей карточки',
    prompt: 'Напиши пример скрипта алгоритма для валидации обязательных полей карточки GreenData с выводом ошибок пользователю.',
    icon: <Code2 className="w-3.5 h-3.5 text-emerald-600" />,
  },
  {
    title: 'Стандарты именования ID',
    desc: 'Генерация ID алгоритма по регламенту GD',
    prompt: 'Как правильно составить идентификатор алгоритма GreenData для задачи: "Проверка полномочий согласующего лица при изменении статуса договора"?',
    icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
  },
  {
    title: 'SQL выборка в GD',
    desc: 'Оптимизированный SQL-запрос для выборки данных',
    prompt: 'Помоги составить эффективный SQL-запрос для выборки активных договоров со связанными контрагентами и суммами больше 1 000 000 руб.',
    icon: <Layers className="w-3.5 h-3.5 text-sky-600" />,
  },
  {
    title: 'Структура пакета .guf',
    desc: 'Правила упаковки и файл README.txt',
    prompt: 'Объясни правила формирования структуры пакетов обновлений .guf и составления файла README.txt в GreenData.',
    icon: <FileCode className="w-3.5 h-3.5 text-purple-600" />,
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
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

  return (
    <div className="flex flex-col h-full w-full min-h-0 flex-1 bg-white overflow-hidden relative font-sans">
      {/* ── Minimalist Top Bar ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex-shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-2xs">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1.5 ring-white ${
                isConfigured ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
              }`}
              title={isConfigured ? 'ИИ подключен' : 'Требуется настройка API'}
            />
          </div>

          {/* Model Pill Button -> Opens Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100/90 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 text-[10.5px] font-mono font-bold border border-slate-200 hover:border-emerald-300 transition-all max-w-[150px] cursor-pointer group truncate"
            title="Настройки подключения модели"
          >
            <span className="truncate">{settings.model || 'Кастомная модель'}</span>
            <Settings2 className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 flex-shrink-0 ml-0.5" />
          </button>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {messages.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                title="Начать новый диалог"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>Новый</span>
              </button>

              <button
                type="button"
                onClick={handleCopyEntireChat}
                title="Скопировать весь диалог"
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
            title="Настройки подключения"
            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-3 sm:p-3.5 overflow-y-auto overscroll-contain space-y-3 bg-[#fafafa] min-h-0 select-text scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="py-4 px-1 text-center max-w-sm mx-auto space-y-3.5 animate-fade-in">
            {/* Hero */}
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/15">
                <Sparkles className="w-5 h-5" />
              </div>

              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">
                  GreenData AI Ассистент
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Алгоритмы, скрипты валидации, оптимизация SQL и структура .guf
                </p>
              </div>

              {/* Active Tab Detection Banner */}
              {activeTabInfo && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={handleAttachActiveTabContext}
                    className="w-full inline-flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-900 block truncate group-hover:text-emerald-800">
                          {activeTabInfo.cleanTitle || activeTabInfo.title}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block truncate">
                          {activeTabInfo.detectedSectionName || 'GreenData'} • Прикрепить контекст
                        </span>
                      </div>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
              )}
            </div>

            {/* Prompt Starter Cards */}
            <div className="space-y-1.5 pt-1 text-left">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block px-0.5">
                Частые сценарии:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {PROMPT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputVal(item.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="p-2.5 rounded-xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/30 text-left transition-all flex items-start gap-2.5 group cursor-pointer shadow-2xs"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-white transition-colors flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 group-hover:text-emerald-900 transition-colors text-[11.5px] block truncate">
                        {item.title}
                      </span>
                      <span className="text-[10.5px] text-slate-500 line-clamp-1 leading-tight block">
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
          className="absolute bottom-22 right-3 z-20 p-1.5 rounded-full bg-white text-emerald-700 hover:text-emerald-800 shadow-md border border-slate-200 transition-all hover:scale-105 cursor-pointer"
          title="Прокрутить вниз"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* ── Floating Composer Bar ── */}
      <div className="p-2 sm:p-2.5 bg-white border-t border-slate-200 flex-shrink-0 z-10">
        <div className="relative rounded-2xl bg-white border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 shadow-sm transition-all p-2.5 space-y-1.5">
          {/* Quick Prompt Templates Popover */}
          {showQuickMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowQuickMenu(false)}
              />
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-2 space-y-1 z-30 animate-slide-down">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 flex items-center justify-between">
                  <span>Шаблоны запросов:</span>
                  <button
                    onClick={() => setShowQuickMenu(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs p-0.5 cursor-pointer"
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
                    className="w-full text-left px-2 py-1 rounded-lg hover:bg-emerald-50 text-[11px] text-slate-800 hover:text-emerald-900 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <span className="text-[9.5px] text-slate-400">Вставить ↵</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Attached Context Pill Badge */}
          {attachedContext && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10.5px] font-medium w-fit animate-fade-in">
              <Globe className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span className="max-w-[200px] truncate">{attachedContext}</span>
              <button
                type="button"
                onClick={() => setAttachedContext(null)}
                className="text-emerald-700 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                title="Открепить контекст"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Спросите о коде GreenData, SQL или .guf пакетах..."
            className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-36 leading-relaxed font-normal"
          />

          {/* Bottom Toolbar inside Composer */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
            {/* Left Action Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[10.5px] font-bold border border-slate-200 transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Шаблоны</span>
              </button>

              <button
                type="button"
                onClick={handleAttachActiveTabContext}
                disabled={isFetchingTab}
                title="Прикрепить контекст активной страницы"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[10.5px] font-bold border border-slate-200 transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
              >
                <Globe className="w-3 h-3 text-emerald-600" />
                <span>Контекст</span>
              </button>
            </div>

            {/* Right Action: Counter & Send / Stop Button */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {inputVal.length > 0 && (
                <span className="text-[9.5px] text-slate-400 font-mono hidden xs:inline">
                  {inputVal.length}
                </span>
              )}

              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  title="Остановить генерацию"
                  className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95 animate-pulse"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={(!inputVal.trim() && !attachedContext) || isLoading}
                  title="Отправить (Enter)"
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-xs ${
                    (inputVal.trim() || attachedContext) && !isLoading
                      ? 'bg-slate-900 hover:bg-emerald-600 text-white hover:scale-105 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
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
