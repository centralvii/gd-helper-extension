import { useState, useEffect, useCallback } from 'react';
import { SiteCssRule } from '../types';

const STORAGE_KEY = 'siteCssRules';

// Helpful default starter presets
const DEFAULT_RULES: SiteCssRule[] = [
  {
    id: 'preset-greendata-compact',
    name: 'GreenData Portal — Компактный вид',
    urlPattern: '*://*.greendata.ru/*',
    css: `/* Компактный режим GreenData */
.gd-table-row {
  height: 32px !important;
  font-size: 12px !important;
}
.gd-card-header {
  padding: 6px 12px !important;
}
.gd-sidebar {
  width: 220px !important;
}`,
    isEnabled: false,
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  },
  {
    id: 'preset-tables-mono',
    name: 'Улучшенная читаемость числовых таблиц',
    urlPattern: '*',
    css: `/* Моноширинный шрифт для сумм и числовых колонок */
td.number, td.amount, td.currency, .mono-col {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace !important;
  letter-spacing: -0.02em !important;
}`,
    isEnabled: false,
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
  },
  {
    id: 'preset-hide-scrollbars',
    name: 'Скрытие полос прокрутки (минимализм)',
    urlPattern: '*',
    css: `/* Скрытие системных скроллбаров */
* {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}
*::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}`,
    isEnabled: false,
    createdAt: Date.now() - 20000,
    updatedAt: Date.now() - 20000,
  },
];

export function useSiteCssRules() {
  const [rules, setRules] = useState<SiteCssRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load from storage on mount
  useEffect(() => {
    const loadRules = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const res = await chrome.storage.local.get([STORAGE_KEY]);
          if (res[STORAGE_KEY] && Array.isArray(res[STORAGE_KEY])) {
            setRules(res[STORAGE_KEY]);
          } else {
            setRules(DEFAULT_RULES);
            await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_RULES });
          }
        } else {
          const local = localStorage.getItem(STORAGE_KEY);
          if (local) {
            setRules(JSON.parse(local));
          } else {
            setRules(DEFAULT_RULES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RULES));
          }
        }
      } catch (err) {
        console.warn('Error loading site CSS rules:', err);
        setRules(DEFAULT_RULES);
      } finally {
        setIsLoading(false);
      }
    };

    loadRules();
  }, []);

  // Save rules and notify background
  const persistRules = useCallback(async (newRules: SiteCssRule[]) => {
    setRules(newRules);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [STORAGE_KEY]: newRules });
        chrome.runtime.sendMessage({ type: 'SYNC_ALL_SITE_CSS' }).catch(() => {});
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules));
      }
    } catch (err) {
      console.warn('Error saving site CSS rules:', err);
    }
  }, []);

  const addRule = useCallback((name: string, urlPattern: string, css: string) => {
    const newRule: SiteCssRule = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Новое правило стилей',
      urlPattern: urlPattern.trim() || '*',
      css,
      isEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistRules([newRule, ...rules]);
    return newRule;
  }, [rules, persistRules]);

  const updateRule = useCallback((id: string, updates: Partial<Omit<SiteCssRule, 'id' | 'createdAt'>>) => {
    const updated = rules.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          ...updates,
          updatedAt: Date.now(),
        };
      }
      return r;
    });
    persistRules(updated);
  }, [rules, persistRules]);

  const deleteRule = useCallback((id: string) => {
    const filtered = rules.filter((r) => r.id !== id);
    persistRules(filtered);
  }, [rules, persistRules]);

  const toggleRule = useCallback((id: string) => {
    const updated = rules.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          isEnabled: !r.isEnabled,
          updatedAt: Date.now(),
        };
      }
      return r;
    });
    persistRules(updated);
  }, [rules, persistRules]);

  const getCurrentTabUrl = useCallback(async (): Promise<string | null> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          return tab.url;
        }
      }
    } catch (err) {
      console.warn('Could not get active tab url:', err);
    }
    return null;
  }, []);

  const syncAllTabs = useCallback(async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        await chrome.runtime.sendMessage({ type: 'SYNC_ALL_SITE_CSS' });
      }
    } catch {
      // ignore
    }
  }, []);

  return {
    rules,
    isLoading,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    getCurrentTabUrl,
    syncAllTabs,
  };
}
