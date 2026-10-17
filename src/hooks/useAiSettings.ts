import { useState, useEffect, useCallback } from 'react';
import { AiSettings } from '../types';
import { getErrorMessage } from '../utils/errorUtils';

/**
 * Подключение к OpenAI-совместимому API для генерации ID алгоритмов (вкладка «Утилиты»).
 * Настройки хранятся под прежним ключом — сохранённое подключение пользователя не теряется.
 */
export const DEFAULT_AI_SETTINGS: AiSettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  authType: 'bearer',
  model: 'gpt-4o-mini',
  customHeadersJson: '',
};

const AI_SETTINGS_STORAGE_KEY = 'gd_ai_settings';
// История удалённого ИИ-чата: очищается при первом запуске новой версии
const LEGACY_CHAT_HISTORY_KEY = 'gd_ai_chat_history';

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

export function useAiSettings() {
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

  // Подтягиваем настройки из chrome.storage.local и убираем историю удалённого чата
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_CHAT_HISTORY_KEY);
    } catch {
      // ignore
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([AI_SETTINGS_STORAGE_KEY], (res) => {
        if (res[AI_SETTINGS_STORAGE_KEY]) {
          setSettings((prev) => ({ ...prev, ...res[AI_SETTINGS_STORAGE_KEY] }));
        }
      });
      chrome.storage.local.remove(LEGACY_CHAT_HISTORY_KEY);
    }
  }, []);

  const persist = (next: AiSettings) => {
    try {
      localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(next));
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [AI_SETTINGS_STORAGE_KEY]: next });
      }
    } catch {
      // ignore
    }
  };

  const updateSettings = useCallback((updates: Partial<AiSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      persist(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_AI_SETTINGS);
    persist(DEFAULT_AI_SETTINGS);
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
      } catch (err) {
        const latencyMs = Date.now() - startTime;
        return {
          ok: false,
          message: `Ошибка сети / CORS: ${getErrorMessage(err, 'Сервер недоступен по указанному адресу')}`,
          latencyMs,
        };
      }
    },
    [settings]
  );

  return { settings, updateSettings, resetSettings, testConnection };
}
