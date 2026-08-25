import { useState, useEffect, useRef, useCallback } from 'react';
import { AiChatMessage, AiSettings } from '../types';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  authType: 'bearer',
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
  customHeadersJson: '',
};

const AI_SETTINGS_STORAGE_KEY = 'gd_ai_settings';
const AI_MESSAGES_STORAGE_KEY = 'gd_ai_chat_history';

export const AI_PROVIDER_PRESETS = [
  {
    name: 'GreenData (Сеть GD)',
    baseUrl: 'http://ai.greendata.ru/v1',
    defaultModel: 'deepseek-coder',
    models: ['deepseek-coder', 'deepseek-chat', 'qwen2.5-coder', 'llama3.1'],
    authType: 'none' as const,
    placeholderKey: 'Оставьте пустым (или введите корпоративный токен)',
  },
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'o3-mini', 'gpt-3.5-turbo'],
    authType: 'bearer' as const,
    placeholderKey: 'sk-...',
  },
  {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'],
    authType: 'bearer' as const,
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
    authType: 'bearer' as const,
    placeholderKey: 'sk-or-...',
  },
  {
    name: 'Ollama (Локально)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'qwen2.5-coder', 'deepseek-r1:8b', 'mistral'],
    authType: 'none' as const,
    placeholderKey: 'Не требуется',
  },
  {
    name: 'LM Studio (Локально)',
    baseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    models: ['local-model'],
    authType: 'none' as const,
    placeholderKey: 'Не требуется',
  },
  {
    name: 'Azure OpenAI',
    baseUrl: 'https://<your-resource>.openai.azure.com/openai/deployments/<deployment-name>',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini'],
    authType: 'api-key' as const,
    placeholderKey: 'Azure API Key...',
  },
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    authType: 'bearer' as const,
    placeholderKey: 'gsk_...',
  },
];

/**
 * Intelligent endpoint resolution that avoids duplicating `/chat/completions`
 */
export function resolveApiEndpoint(rawUrl: string): string {
  const clean = (rawUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
  if (!clean) return 'https://api.openai.com/v1/chat/completions';

  // If already contains chat/completions or custom path
  if (clean.includes('/chat/completions')) {
    return clean;
  }

  return `${clean}/chat/completions`;
}

/**
 * Build request headers without sending forbidden or unrecognized headers to corporate gateways
 */
export function buildRequestHeaders(settings: AiSettings): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const key = settings.apiKey.trim();
  const authType = settings.authType || (key ? 'bearer' : 'none');

  if (key && authType !== 'none') {
    if (authType === 'bearer') {
      headers['Authorization'] = `Bearer ${key}`;
    } else if (authType === 'api-key') {
      headers['api-key'] = key;
    } else if (authType === 'x-api-key') {
      headers['X-API-Key'] = key;
    }
  }

  // OpenRouter requires HTTP-Referer, but corporate proxies reject it. Only send for openrouter!
  if (settings.baseUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'https://greendata.ru/gdhelper';
    headers['X-Title'] = 'GDHelper Extension';
  }

  // Custom User Headers
  if (settings.customHeadersJson?.trim()) {
    try {
      const parsed = JSON.parse(settings.customHeadersJson);
      if (typeof parsed === 'object' && parsed !== null) {
        Object.assign(headers, parsed);
      }
    } catch {
      // ignore
    }
  }

  return headers;
}

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
      const endpoint = resolveApiEndpoint(targetSettings.baseUrl);
      const headers = buildRequestHeaders(targetSettings);

      const startTime = Date.now();
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: targetSettings.model || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Ping' }],
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
          const text = await res.text();
          try {
            const errJson = JSON.parse(text);
            if (errJson.error?.message) {
              errDetail = errJson.error.message;
            } else if (errJson.message) {
              errDetail = errJson.message;
            }
          } catch {
            if (text && text.length < 300) {
              errDetail = `${errDetail}: ${text}`;
            }
          }
        } catch {
          // ignore
        }

        if (res.status === 403) {
          return {
            ok: false,
            message: `Ошибка 403 (Доступ запрещен):\n${errDetail}\n\n💡 Совет для сети GreenData: Если сервер авторизует по IP/сети, выберите «Тип авторизации: Без заголовка (None)» и очистите поле API-ключа, либо укажите точный заголовок (api-key / Bearer).`,
            latencyMs,
          };
        }

        return { ok: false, message: `Ошибка сервера: ${errDetail}`, latencyMs };
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        return {
          ok: false,
          message: `Ошибка сети / CORS: ${err.message || 'Сервер недоступен по указанному адресу'}`,
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
        const endpoint = resolveApiEndpoint(settings.baseUrl);
        const headers = buildRequestHeaders(settings);

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
            const rawText = await response.text();
            try {
              const errData = JSON.parse(rawText);
              if (errData.error?.message) {
                errMsg = errData.error.message;
              } else if (errData.message) {
                errMsg = errData.message;
              }
            } catch {
              if (rawText && rawText.length < 400) {
                errMsg += ` (${rawText})`;
              }
            }
          } catch {
            // ignore
          }

          if (response.status === 403) {
            errMsg = `Ошибка 403 (Доступ запрещен): ${errMsg}\n\n💡 Рекомендации для корпоративной сети GreenData:\n1. Если сервер работает без токена (по IP/VPN сети), откройте ⚙️ Настройки и выберите «Тип авторизации: Без заголовка (None)» и сотрите API-ключ.\n2. Если используется корпоративный прокси/шлюз, проверьте точный адрес эндпоинта (например, http://...:8000/v1).\n3. Если используется Azure OpenAI — выберите тип заголовка «api-key».`;
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
                  content: `❌ ${errText}`,
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
