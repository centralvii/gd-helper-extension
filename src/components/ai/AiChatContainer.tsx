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
} from 'lucide-react';
import { useAiChat } from '../../hooks/useAiChat';
import { AiMessageItem } from './AiMessageItem';
import { AiSettingsModal } from './AiSettingsModal';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

const PROMPT_SUGGESTIONS = [
  {
    title: 'Алгоритм валидации',
    prompt: 'Напиши пример скрипта алгоритма для валидации обязательных полей карточки GreenData.',
    icon: <Code2 className="w-3.5 h-3.5 text-emerald-600" />,
  },
  {
    title: 'Стандарты именования ID',
    prompt: 'Как правильно назвать алгоритм по стандартам GreenData для: "Проверка полномочий согласующего лица"?',
    icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
  },
  {
    title: 'SQL выборка в GD',
    prompt: 'Помоги составить SQL-запрос для выборки активных договоров с суммами больше 1 000 000 руб.',
    icon: <Layers className="w-3.5 h-3.5 text-sky-600" />,
  },
  {
    title: 'Структура пакета .guf',
    prompt: 'Объясни, как формируются файлы README.txt и структура пакетов обновлений в GreenData.',
    icon: <FileCode className="w-3.5 h-3.5 text-purple-600" />,
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputVal]);

  const handleSend = () => {
    if (!inputVal.trim() || isLoading) return;
    sendMessage(inputVal);
    setInputVal('');
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

  const isConfigured = Boolean(
    settings.apiKey.trim() ||
      settings.baseUrl.includes('localhost') ||
      settings.baseUrl.includes('127.0.0.1')
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] min-h-[500px] max-h-[900px] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                isConfigured ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-gray-900 truncate">ИИ Ассистент GreenData</h2>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="px-1.5 py-0.2 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200 truncate transition-colors"
                title="Нажмите для смены модели и настроек"
              >
                {settings.model}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 truncate">
              {isConfigured ? 'Готов к работе • OpenAI Compatibility' : 'Требуется настройка ключа API'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              title="Очистить историю чата"
              className="icon-btn p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="Настройки подключения (API Key, Base URL, Model)"
            className="icon-btn p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages Scroll Area ── */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-gray-50/40">
        {messages.length === 0 ? (
          <div className="py-6 px-2 text-center max-w-md mx-auto space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
              <Bot className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900">
                Привет! Чем я могу помочь по GreenData?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Задайте любой вопрос по платформе: написание алгоритмов, проектирование сущностей,
                составление SQL, формул или разбор ошибок.
              </p>
            </div>

            {!isConfigured && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Подключение не настроено</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Для начала общения введите ваш API-ключ (OpenAI, DeepSeek, OpenRouter, Groq) или
                  подключите локальную модель (Ollama, LM Studio).
                </p>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => setIsSettingsOpen(true)}
                  leftIcon={<Sliders className="w-3.5 h-3.5" />}
                  className="w-full justify-center"
                >
                  Настроить подключение
                </Button>
              </div>
            )}

            {/* Starter Suggestion Chips */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">
                Попробуйте один из запросов:
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
                    className="p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-xs text-xs text-gray-800 transition-all flex items-start gap-2 group"
                  >
                    <span className="mt-0.5">{item.icon}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-gray-900 block group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                        {item.prompt}
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

      {/* ── Input Bar ── */}
      <div className="p-2.5 bg-white border-t border-gray-200 space-y-1.5">
        <div className="relative flex items-end gap-1.5 bg-gray-50 border border-gray-200 focus-within:border-emerald-500 focus-within:bg-white rounded-xl p-1.5 transition-colors">
          <textarea
            ref={textareaRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Спросите что-нибудь у ИИ по GreenData (Enter для отправки)..."
            rows={1}
            disabled={isLoading && !isStreaming}
            className="flex-1 bg-transparent border-none outline-none text-xs text-gray-900 placeholder:text-gray-400 resize-none py-1.5 px-2 max-h-32 min-h-[32px] leading-relaxed"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={stopGeneration}
              title="Остановить генерацию"
              className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex-shrink-0"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputVal.trim() || isLoading}
              title="Отправить сообщение"
              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white shadow-xs transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-1 text-[10px] text-gray-400">
          <span>
            <code>Enter</code> — отправить, <code>Shift+Enter</code> — перенос строки
          </span>
          <span className="font-mono">{inputVal.length > 0 ? `${inputVal.length} симв.` : ''}</span>
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
