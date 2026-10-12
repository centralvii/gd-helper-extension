import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowUp,
  Square,
  Trash2,
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
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { useAiChat } from '../../hooks/useAiChat';
import { AiMessageItem } from './AiMessageItem';
import { AiSettingsModal } from './AiSettingsModal';
import { Button, Modal, IconButton } from '../ui';
import { getActiveTabInfo, TabInfo } from '../../utils/tabUtils';
import { AiAgent } from '../../types';

export const AiChatContainer: React.FC = () => {
  const {
    settings,
    messages,
    isLoading,
    isStreaming,
    activeAgent,
    allAgents,
    selectAgent,
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
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
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
      .map((m) => `**${m.role === 'user' ? '👤 Пользователь' : `🤖 ${activeAgent.name}`}**:\n${m.content}\n`)
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

  const getAgentIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'code':
        return <Code2 className={className} />;
      case 'database':
        return <Layers className={className} />;
      case 'package':
        return <FileCode className={className} />;
      case 'bot':
      default:
        return <Bot className={className} />;
    }
  };

  const getAgentBadgeColor = (agent: AiAgent) => {
    switch (agent.badgeColor) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:border-indigo-300';
      case 'sky':
        return 'bg-sky-50 text-sky-800 border-sky-200 hover:border-sky-300';
      case 'purple':
        return 'bg-purple-50 text-purple-800 border-purple-200 hover:border-purple-300';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 flex-1 bg-gd-bg overflow-hidden relative font-sans">
      {/* ── Top Bar with Agent Switcher ── */}
      <div className="flex items-center justify-between px-3 py-1.5 gd-glass border-b border-gd-border flex-shrink-0 z-20">
        {/* Agent Switcher Dropdown Button */}
        <div className="relative min-w-0">
          <button
            type="button"
            onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12.5px] font-semibold transition-all cursor-pointer group ${getAgentBadgeColor(
              activeAgent
            )}`}
            title="Сменить активного ИИ-агента"
          >
            {getAgentIcon(activeAgent.avatarIcon, 'w-3.5 h-3.5 flex-shrink-0')}
            <span className="truncate max-w-[130px]">{activeAgent.name}</span>
            <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-transform" />
          </button>

          {/* Agent Selection Popover Menu */}
          {isAgentMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsAgentMenuOpen(false)}
              />
              <div className="gd-menu absolute top-full mt-1.5 left-0 w-64 p-1.5 space-y-0.5 z-40">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Выборка ИИ-агентов
                </div>
                {allAgents.map((agent) => {
                  const isSelected = agent.id === activeAgent.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        selectAgent(agent.id);
                        setIsAgentMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/90 text-emerald-950 border border-emerald-200'
                          : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {getAgentIcon(agent.avatarIcon, 'w-3.5 h-3.5')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs truncate">
                            {agent.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 line-clamp-1 block">
                          {agent.role}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Model Badge */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-gd-fill hover:bg-slate-200 text-slate-700 text-[11px] font-mono font-semibold transition-all cursor-pointer max-w-[130px] truncate shadow-2xs"
            title={`Модель: ${settings.model || 'gpt-4o-mini'}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isConfigured ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="truncate">{settings.model || 'Модель'}</span>
          </button>

          {messages.length > 0 && (
            <>
              <IconButton
                size="sm"
                variant="ghost"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsClearModalOpen(true)}
                title="Начать новый диалог"
              />

              <IconButton
                size="sm"
                variant="ghost"
                icon={
                  copiedAll ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
                onClick={handleCopyEntireChat}
                title="Скопировать весь диалог"
              />
            </>
          )}

          <IconButton
            size="sm"
            variant="ghost"
            icon={<Settings2 className="w-3.5 h-3.5" />}
            onClick={() => setIsSettingsOpen(true)}
            title="Настройки ИИ подключения"
          />
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-3 sm:p-4 overflow-y-auto overscroll-contain space-y-3 bg-gd-bg min-h-0 select-text"
      >
        {messages.length === 0 ? (
          <div className="py-3 px-1 text-center max-w-sm mx-auto space-y-3 animate-fade-in">
            {/* Agent Hero */}
            <div className="space-y-2">
              <div
                className={`w-11 h-11 rounded-xl text-white flex items-center justify-center mx-auto shadow-md ${
                  activeAgent.badgeColor === 'emerald'
                    ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 shadow-emerald-600/20'
                    : activeAgent.badgeColor === 'indigo'
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-600/20'
                    : activeAgent.badgeColor === 'sky'
                    ? 'bg-gradient-to-tr from-sky-600 to-cyan-600 shadow-sky-600/20'
                    : 'bg-gradient-to-tr from-purple-600 to-pink-600 shadow-purple-600/20'
                }`}
              >
                {getAgentIcon(activeAgent.avatarIcon, 'w-5 h-5')}
              </div>

              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  <span>{activeAgent.name}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 pt-0.5">
                  {activeAgent.role}
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {activeAgent.description}
                </p>
              </div>

              {/* Agent Quick Switcher Chips */}
              <div className="flex items-center justify-center gap-1 pt-1 flex-wrap">
                {allAgents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => selectAgent(agent.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      agent.id === activeAgent.id
                        ? 'bg-emerald-600 text-white border border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {getAgentIcon(agent.avatarIcon, 'w-2.5 h-2.5')}
                    <span>{agent.shortName}</span>
                  </button>
                ))}
              </div>

              {/* Active Tab Detection Banner */}
              {activeTabInfo && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleAttachActiveTabContext}
                    className="w-full inline-flex items-center justify-between gap-2 p-3 rounded-xl bg-white hover:bg-gd-fill-2 text-left transition-colors group cursor-pointer shadow-2xs"
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

            {/* Agent Specific Starter Prompts */}
            <div className="space-y-1.5 pt-1 text-left">
              <span className="gd-section-title !px-1.5 !pb-1 block">
                Сценарии для {activeAgent.shortName}:
              </span>
              <div className="gd-group grid grid-cols-1 gd-stagger">
                {activeAgent.starterSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputVal(item.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="gd-row gd-row--tap !items-start !py-2.5 text-left w-full group"
                  >
                    <div className="gd-row-icon mt-0.5">
                      {getAgentIcon(activeAgent.avatarIcon, 'w-3 h-3 text-emerald-600')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900 text-[13.5px] block truncate">
                        {item.title}
                      </span>
                      <span className="text-[12px] text-gd-muted line-clamp-1 leading-tight block">
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
          className="absolute bottom-[96px] right-3 z-20 w-9 h-9 grid place-items-center rounded-full gd-glass text-gd-green shadow-gd-float transition-transform hover:scale-105 cursor-pointer animate-pop-in"
          title="Прокрутить вниз"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* ── Floating Composer Bar ── */}
      <div className="px-3 pt-2 pb-2.5 gd-glass border-t border-gd-border flex-shrink-0 z-10">
        <div className="relative rounded-[20px] bg-white border border-gd-border focus-within:border-gd-green focus-within:ring-4 focus-within:ring-emerald-500/15 transition-all px-3 pt-2.5 pb-2 space-y-1.5">
          {/* Quick Prompt Templates Popover */}
          {showQuickMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowQuickMenu(false)}
              />
              <div className="gd-menu absolute bottom-full mb-2 left-0 right-0 p-1.5 space-y-0.5 z-30 !origin-bottom">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 flex items-center justify-between">
                  <span>Шаблоны для {activeAgent.shortName}:</span>
                  <button
                    onClick={() => setShowQuickMenu(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs p-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                {activeAgent.starterSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputVal(item.prompt);
                      setShowQuickMenu(false);
                      textareaRef.current?.focus();
                    }}
                    className="w-full text-left px-2 py-1 rounded-lg hover:bg-emerald-50 text-[11px] text-slate-800 hover:text-emerald-900 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="text-[9.5px] text-slate-400 flex-shrink-0 ml-1">Вставить ↵</span>
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
            placeholder={
              activeAgent.id === 'gdsl_agent'
                ? 'Вставьте скрипт GDSL (LaTeX или JS) или задайте вопрос...'
                : `Спросите ${activeAgent.name}...`
            }
            className="w-full bg-transparent text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-36 leading-relaxed font-normal"
          />

          {/* Bottom Toolbar inside Composer */}
          <div className="flex items-center justify-between gap-1 pt-1">
            {/* Left Action Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-gd-fill hover:bg-gd-green-light text-slate-700 hover:text-gd-green text-[11.5px] font-semibold transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Шаблоны</span>
              </button>

              <button
                type="button"
                onClick={handleAttachActiveTabContext}
                disabled={isFetchingTab}
                title="Прикрепить контекст активной страницы"
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-gd-fill hover:bg-gd-green-light text-slate-700 hover:text-gd-green text-[11.5px] font-semibold transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
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
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={(!inputVal.trim() && !attachedContext) || isLoading}
                  title="Отправить (Enter)"
                  data-icon-anim="bounce"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    (inputVal.trim() || attachedContext) && !isLoading
                      ? 'bg-gd-green hover:bg-gd-green-dark text-white cursor-pointer animate-pop-in'
                      : 'bg-gd-fill text-gd-faint cursor-not-allowed'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" strokeWidth={2.75} />
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
