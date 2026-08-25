import { useState, useEffect, useRef, useCallback } from 'react';
import { AiChatMessage, AiSettings } from '../types';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  systemPrompt: `Ты — профессиональный ИИ-ассистент и эксперт по платформе GreenData (GDHelper).
Твоя задача — помогать разработчикам, аналитикам и инженерам GreenData:
- Составлять и оптимизировать алгоритмы, формулы и скрипты GreenData.
- Проектировать структуры объектов, экранные формы и бизнес-процессы.
- Писать SQL-запросы, парсить JSON и формировать пакеты обновлений (.guf).
- Генерировать стандартные идентификаторы алгоритмов по регламенту GD.
- Помогать с отладкой ошибок и реализацией задач.
Отвечай структурированно, понятно, с примерами кода и на русском языке.`,
  temperature: 0.7,
  stream: true,
  maxTokens: 4096,
};

const AI_SETTINGS_STORAGE_KEY = 'gd_ai_settings';
const AI_MESSAGES_STORAGE_KEY = 'gd_ai_chat_history';

export const AI_PROVIDER_PRESETS = [
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'o3-mini', 'gpt-3.5-turbo'],
    placeholderKey: 'sk-...',
  },
  {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'],
    placeholderKey: 'sk-...',
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.0-flash-001',
    models: [
      'google/gemini-2.0-flash-001',
      'anthropic/claude-3.5-sonnet',
      'deepseek/deepseek-r1',
      'meta-llama/llama-3.3-70b-instruct',
    ],
    placeholderKey: 'sk-or-...',
  },
  {
    name: 'Ollama (Локально)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'qwen2.5-coder', 'deepseek-r1:8b', 'mistral'],
    placeholderKey: 'Не требуется (или ollama)',
  },
  {
    name: 'LM Studio (Локально)',
    baseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    models: ['local-model'],
    placeholderKey: 'Не требуется',
  },
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    placeholderKey: 'gsk_...',
  },
];

export function useAiChat() {
  const [settings, setSettings] = useState<AiSettings>(() => {
    try {
      const saved = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_AI_SETTINGS;
  });

  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(AI_MESSAGES_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load from chrome.storage.local on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([AI_SETTINGS_STORAGE_KEY, AI_MESSAGES_STORAGE_KEY], (res) => {
        if (res[AI_SETTINGS_STORAGE_KEY]) {
          setSettings((prev) => ({ ...prev, ...res[AI_SETTINGS_STORAGE_KEY] }));
        }
        if (res[AI_MESSAGES_STORAGE_KEY] && Array.isArray(res[AI_MESSAGES_STORAGE_KEY])) {
          setMessages(res[AI_MESSAGES_STORAGE_KEY]);
        }
      });
    }
  }, []);

  // Save settings
  const updateSettings = useCallback((updates: Partial<AiSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(next));
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ [AI_SETTINGS_STORAGE_KEY]: next });
        }
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_AI_SETTINGS);
    try {
      localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_AI_SETTINGS));
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [AI_SETTINGS_STORAGE_KEY]: DEFAULT_AI_SETTINGS });
      }
    } catch {
      // ignore
    }
  }, []);

  // Save messages
  const persistMessages = (nextMessages: AiChatMessage[]) => {
    setMessages(nextMessages);
    try {
      localStorage.setItem(AI_MESSAGES_STORAGE_KEY, JSON.stringify(nextMessages));
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [AI_MESSAGES_STORAGE_KEY]: nextMessages });
      }
    } catch {
      // ignore
    }
  };

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    setError(null);
    persistMessages([]);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  // Test Connection
  const testConnection = useCallback(
    async (
      overrideSettings?: AiSettings
    ): Promise<{ ok: boolean; message: string; latencyMs: number }> => {
      const targetSettings = overrideSettings || settings;
      const baseUrl = (targetSettings.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const endpoint = `${baseUrl}/chat/completions`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (targetSettings.apiKey.trim()) {
        headers['Authorization'] = `Bearer ${targetSettings.apiKey.trim()}`;
      }
      headers['HTTP-Referer'] = 'https://greendata.ru/gdhelper';
      headers['X-Title'] = 'GDHelper Extension';

      const startTime = Date.now();
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: targetSettings.model || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5,
            stream: false,
          }),
        });

        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          return { ok: true, message: `Успешно подключено! (Отклик: ${latencyMs}мс)`, latencyMs };
        }

        let errDetail = `${res.status} ${res.statusText}`;
        try {
          const errData = await res.json();
          if (errData.error?.message) {
            errDetail = errData.error.message;
          }
        } catch {
          // ignore
        }

        return { ok: false, message: `Ошибка сервера: ${errDetail}`, latencyMs };
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        return {
          ok: false,
          message: `Ошибка соединения: ${err.message || 'Проверьте адрес и CORS'}`,
          latencyMs,
        };
      }
    },
    [settings]
  );

  // Send Message
  const sendMessage = useCallback(
    async (userText: string) => {
      const cleanText = userText.trim();
      if (!cleanText || isLoading) return;

      setError(null);

      // Create user message
      const userMessage: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: cleanText,
        timestamp: Date.now(),
      };

      // Create placeholder assistant message
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: AiChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        model: settings.model,
        isStreaming: true,
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      persistMessages(updatedMessages);

      setIsLoading(true);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const baseUrl = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
        const endpoint = `${baseUrl}/chat/completions`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (settings.apiKey.trim()) {
          headers['Authorization'] = `Bearer ${settings.apiKey.trim()}`;
        }
        headers['HTTP-Referer'] = 'https://greendata.ru/gdhelper';
        headers['X-Title'] = 'GDHelper Extension';

        // Prepare context messages (system prompt + last 12 messages)
        const contextHistory = messages.slice(-12).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const chatPayload = {
          model: settings.model,
          messages: [
            { role: 'system', content: settings.systemPrompt },
            ...contextHistory,
            { role: 'user', content: cleanText },
          ],
          temperature: settings.temperature,
          stream: settings.stream,
          max_tokens: settings.maxTokens || 4096,
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(chatPayload),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errMsg = `Ошибка ${response.status}: ${response.statusText}`;
          try {
            const errData = await response.json();
            if (errData.error?.message) {
              errMsg = errData.error.message;
            }
          } catch {
            // ignore
          }
          throw new Error(errMsg);
        }

        // Streaming Response Handler
        if (settings.stream && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let accumulatedContent = '';
          let accumulatedReasoning = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;

              if (trimmed === 'data: [DONE]') {
                break;
              }

              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const delta = parsed.choices?.[0]?.delta;
                  if (delta) {
                    if (delta.content) {
                      accumulatedContent += delta.content;
                    }
                    if (delta.reasoning_content) {
                      accumulatedReasoning += delta.reasoning_content;
                    }
                    if (delta.text) {
                      accumulatedContent += delta.text;
                    }

                    // Update assistant message live
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? {
                              ...msg,
                              content: accumulatedContent,
                              reasoningContent: accumulatedReasoning || undefined,
                              isStreaming: true,
                            }
                          : msg
                      )
                    );
                  }
                } catch {
                  // ignore json chunk parse error
                }
              }
            }
          }

          // Complete message
          const finalMessages = updatedMessages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: accumulatedContent || '(Пустой ответ от модели)',
                  reasoningContent: accumulatedReasoning || undefined,
                  isStreaming: false,
                }
              : msg
          );
          persistMessages(finalMessages);
        } else {
          // Non-streaming response
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '(Пустой ответ от модели)';
          const reasoning = data.choices?.[0]?.message?.reasoning_content;

          const finalMessages = updatedMessages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content,
                  reasoningContent: reasoning || undefined,
                  isStreaming: false,
                }
              : msg
          );
          persistMessages(finalMessages);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User aborted manually
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
            )
          );
        } else {
          const errText = err.message || 'Не удалось получить ответ от ИИ';
          setError(errText);
          const errorMessages = updatedMessages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `❌ ${errText}\n\n💡 Проверьте правильность API ключа, адреса сервера или модели в настройках подключения.`,
                  error: true,
                  isStreaming: false,
                }
              : msg
          );
          persistMessages(errorMessages);
        }
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, messages, settings]
  );

  const retryLastMessage = useCallback(() => {
    if (messages.length === 0 || isLoading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove last assistant message if it was an error
      const trimmed = messages.filter((m, idx) => idx < messages.length - 1 || m.role === 'user');
      persistMessages(trimmed);
      sendMessage(lastUserMsg.content);
    }
  }, [messages, isLoading, sendMessage]);

  return {
    settings,
    messages,
    isLoading,
    isStreaming,
    error,
    updateSettings,
    resetSettings,
    sendMessage,
    stopGeneration,
    clearMessages,
    retryLastMessage,
    testConnection,
  };
}
