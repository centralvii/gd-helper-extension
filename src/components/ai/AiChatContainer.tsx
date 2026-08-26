import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Square,
  Trash2,
  Sliders,
  Sparkles,
  Zap,
  Code2,
  FileCode,
  Layers,
  ChevronDown,
  ArrowDown,
  Copy,
  Check,
  Globe,
  Plus,
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
    desc: 'Скрипт проверки обязательных полей',
    prompt: 'Напиши пример скрипта алгоритма для валидации обязательных полей карточки GreenData с выводом ошибок.',
    icon: <Code2 className="w-4 h-4 text-emerald-600" />,
    gradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/60',
  },
  {
    title: 'Стандарты именования ID',
    desc: 'Генерация кода по регламенту GD',
    prompt: 'Как правильно составить идентификатор алгоритма GreenData для задачи: "Проверка полномочий согласующего лица при изменении статуса договора"?',
    icon: <Zap className="w-4 h-4 text-amber-500" />,
    gradient: 'from-amber-500/10 to-orange-500/10 border-amber-200/60',
  },
  {
    title: 'SQL выборка в GD',
    desc: 'Запрос к БД для фильтрации данных',
    prompt: 'Помоги составить эффективный SQL-запрос для выборки активных договоров со связанными контрагентами и суммами больше 1 000 000 руб.',
    icon: <Layers className="w-4 h-4 text-sky-600" />,
    gradient: 'from-sky-500/10 to-blue-500/10 border-sky-200/60',
  },
  {
    title: 'Структура пакета .guf',
    desc: 'Правила упаковки и README.txt',
    prompt: 'Объясни правила формирования структуры пакетов обновлений .guf и составления файла README.txt в GreenData.',
    icon: <FileCode className="w-4 h-4 text-purple-600" />,
    gradient: 'from-purple-500/10 to-pink-500/10 border-purple-200/60',
  },
];

const QUICK_PROMPTS_MENU = [
  {
    label: '✨ Написать алгоритм валидации',
    text: 'Напиши алгоритм валидации для объекта GreenData: ',
  },
  {
    label: '⚡ Оптимизировать формулу/скрипт',
    text: 'Оптимизируй следующий код/формулу GreenData и найди ошибки:\n```javascript\n\n```',
  },
  {
    label: '📊 Составить SQL-запрос',
    text: 'Помоги написать SQL запрос для: ',
  },
  {
    label: '🧩 Описать логику бизнес-процесса',
    text: 'Опиши пошаговую логику и развилки для бизнес-процесса: ',
  },
  {
    label: '📝 Составить описание реализации',
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
    if (!inputVal.trim() || isLoading) return;
    sendMessage(inputVal);
    setInputVal('');
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

  const handleInjectTabContext = async () => {
    setIsFetchingTab(true);
    try {
      const tab = await getActiveTabInfo();
      if (tab) {
        setActiveTabInfo(tab);
        const contextText = `[Контекст страницы: ${tab.cleanTitle || tab.title} | ${tab.detectedSectionName || 'GreenData'} | ${tab.url}]\n`;
        setInputVal((prev) => `${contextText}${prev}`);
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
    <div className="flex flex-col h-full w-full min-h-0 flex-1 bg-white border border-gray-200/90 rounded-2xl shadow-sm overflow-hidden animate-fade-in relative">
      {/* ── Modern Glassmorphism Header ── */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-b border-gray-100 flex-shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 transition-transform group-hover:scale-105">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                isConfigured ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              title={isConfigured ? 'Подключено' : 'Требуется настройка'}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-gray-900 tracking-tight truncate">
                ИИ Ассистент
              </h2>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200/80 transition-colors shadow-2xs truncate max-w-[120px]"
                title="Нажмите для смены модели или настроек"
              >
                <span className="truncate">{settings.model}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
              </button>
            </div>
            <p className="text-[9.5px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <span>GD Expert</span>
              <span>•</span>
              <span>OpenAI Compatible</span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {messages.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                title="Новый диалог / Очистить"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">Новый чат</span>
              </button>

              <button
                type="button"
                onClick={handleCopyEntireChat}
                title="Скопировать весь диалог"
                className="icon-btn p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
            className="icon-btn p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages Scroll Area ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-3.5 sm:p-4 overflow-y-auto overscroll-contain space-y-4 bg-gradient-to-b from-gray-50/30 via-white to-gray-50/20 min-h-0 select-text"
      >
        {messages.length === 0 ? (
          <div className="py-4 px-1 text-center max-w-md mx-auto space-y-4 animate-fade-in">
            {/* Hero Card */}
            <div className="relative p-5 rounded-3xl bg-gradient-to-b from-emerald-50/70 via-white to-white border border-emerald-100/80 shadow-xs space-y-2.5 overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                <Bot className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                  Чем могу помочь по платформе GreenData?
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                  Написание алгоритмов, разбор SQL, генерация идентификаторов, формул и отладка задач.
                </p>
              </div>

              {/* Active Tab Detection Banner */}
              {activeTabInfo && (
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={handleInjectTabContext}
                    className="w-full inline-flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-emerald-200/90 hover:border-emerald-400 text-left transition-all shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-gray-900 block truncate group-hover:text-emerald-700">
                          {activeTabInfo.cleanTitle || activeTabInfo.title}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {activeTabInfo.detectedSectionName || 'Вкладка GreenData'} • Добавить контекст в вопрос
                        </span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-emerald-600 flex-shrink-0 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
              )}
            </div>

            {/* Prompt Starter Cards Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block text-left px-1">
                Быстрые сценарии:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {PROMPT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputVal(item.prompt);
                      textareaRef.current?.focus();
                    }}
                    className={`p-2.5 rounded-2xl bg-white border ${item.gradient} hover:border-emerald-400 hover:shadow-md text-xs text-gray-800 transition-all flex items-start gap-2.5 group`}
                  >
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-white transition-colors flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-gray-900 block group-hover:text-emerald-700 transition-colors text-[11px]">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-gray-500 line-clamp-2 leading-tight mt-0.5">
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
                onRetry={msg.error ? retryLastMessage : undefined}
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
          className="absolute bottom-20 right-4 z-20 p-2 rounded-full bg-white/95 text-emerald-700 hover:text-emerald-800 shadow-lg border border-gray-200 backdrop-blur-md transition-all hover:scale-105"
          title="Прокрутить в конец диалога"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* ── Modern Floating Composer Bar ── */}
      <div className="p-2.5 sm:p-3 bg-white/95 backdrop-blur-md border-t border-gray-200/80 space-y-2 flex-shrink-0 z-10">
        {/* Quick Tools Header */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100/80 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 text-[11px] font-medium border border-gray-200/80 transition-colors flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Шаблоны промптов</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            <button
              type="button"
              onClick={handleInjectTabContext}
              disabled={isFetchingTab}
              title="Вставить ссылку и заголовок открытой вкладки в вопрос"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100/80 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 text-[11px] font-medium border border-gray-200/80 transition-colors flex-shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>С вкладки GD</span>
            </button>
          </div>

          <div className="text-[10px] text-gray-400 font-mono hidden xs:block">
            {inputVal.length > 0 ? `${inputVal.length} симв.` : ''}
          </div>
        </div>

        {/* Quick Menu Popover */}
        {showQuickMenu && (
          <div className="absolute bottom-full mb-2 left-3 right-3 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 space-y-1 z-30 animate-slide-down">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 flex items-center justify-between">
              <span>Выберите готовый шаблон запроса:</span>
              <button
                onClick={() => setShowQuickMenu(false)}
                className="text-gray-400 hover:text-gray-600 text-xs p-1"
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
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-xs text-gray-800 hover:text-emerald-900 transition-colors flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-gray-400">Вставить ↵</span>
              </button>
            ))}
          </div>
        )}

        {/* Text Input Container */}
        <div className="relative flex items-end gap-2 bg-gray-50/90 border border-gray-200/90 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 rounded-2xl p-2 transition-all shadow-xs">
          <textarea
            ref={textareaRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Спросите что-нибудь у ИИ по GreenData (Enter для отправки)..."
            rows={1}
            disabled={isLoading && !isStreaming}
            className="flex-1 bg-transparent border-none outline-none text-[12.5px] text-gray-900 placeholder:text-gray-400 resize-none py-1 px-2 max-h-36 min-h-[34px] leading-relaxed"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={stopGeneration}
              title="Остановить генерацию"
              className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white shadow-md shadow-rose-500/20 transition-all flex-shrink-0 animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputVal.trim() || isLoading}
              title="Отправить сообщение (Enter)"
              className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-30 disabled:hover:from-emerald-600 disabled:hover:to-teal-600 text-white shadow-md shadow-emerald-500/20 transition-all flex-shrink-0 hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Settings Modal ── */}
      <AiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        onReset={resetSettings}
        onTestConnection={testConnection}
      />

      {/* ── Clear Chat Confirm Modal ── */}
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
        <p className="text-xs text-gray-600">
          Вы уверены, что хотите удалить все сообщения из истории чата? Это действие нельзя
          отменить.
        </p>
      </Modal>
    </div>
  );
};
