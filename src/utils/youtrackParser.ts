import { YouTrackIssue, YouTrackCacheData, YouTrackParsedResult } from '../types';

export const DEFAULT_YOUTRACK_URL =
  'https://youtrack.greendatasoft.ru/issues?q=%D0%98%D1%81%D0%BF%D0%BE%D0%BB%D0%BD%D0%B8%D1%82%D0%B5%D0%BB%D1%8C:%20%D0%9A%D1%83%D1%87%D0%B8%D0%BD_%D0%92%D0%BB%D0%B0%D0%B4%D0%B8%D0%BC%D0%B8%D1%80_%D0%92%D0%B0%D0%BB%D0%B5%D1%80%D1%8C%D0%B5%D0%B2%D0%B8%D1%87%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82:%20%D0%A0%D0%AD%D0%A6_Fin&u=1';

export const YOUTRACK_CACHE_KEY = 'gd_youtrack_issues_cache';

export const MOCK_YOUTRACK_ISSUES: YouTrackIssue[] = [
  {
    id: 'REZ_FIN-8241',
    summary: 'Размер комиссии и расчет скидки для контрактов',
    description: 'Необходимо доработать алгоритм расчета процентной ставки и размера комиссии при оформлении субсидийных контрактов. Проверить граничные условия для нулевых значений.',
    state: 'В работе',
    priority: 'Высокий',
    type: 'Доработка',
    project: 'РЭЦ_Fin',
    assignee: 'Кучин Владимир Валерьевич',
    url: 'https://youtrack.greendatasoft.ru/issue/REZ_FIN-8241',
    updatedAt: Date.now() - 1000 * 60 * 30,
    created: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'REZ_FIN-8190',
    summary: 'ЖЦ до сохранения НПП контракты, проверка ЗИ',
    description: 'Добавить валидацию жизненного цикла перед сохранением объекта НПП. Учесть проверку признака заполнения заявки на изменение (ЗИ).',
    state: 'Открыта',
    priority: 'Обычный',
    type: 'Задача',
    project: 'РЭЦ_Fin',
    assignee: 'Кучин Владимир Валерьевич',
    url: 'https://youtrack.greendatasoft.ru/issue/REZ_FIN-8190',
    updatedAt: Date.now() - 1000 * 60 * 120,
    created: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'REZ_FIN-8055',
    summary: 'Оптимизация экранных форм и визуалов реестра договоров',
    description: 'Скорректировать разметку визуальных настроек карточки реестра договоров, убрать лишние отступы и выровнять кнопки действий.',
    state: 'На тестировании',
    priority: 'Обычный',
    type: 'Доработка',
    project: 'РЭЦ_Fin',
    assignee: 'Кучин Владимир Валерьевич',
    url: 'https://youtrack.greendatasoft.ru/issue/REZ_FIN-8055',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    created: Date.now() - 1000 * 60 * 60 * 24 * 8,
  },
  {
    id: 'REZ_FIN-7940',
    summary: 'Интеграция с внешним сервисом проверки реквизитов ЮЛ',
    description: 'Реализовать вызов REST-сервиса ФНС для валидации реквизитов контрагента при согласовании заявки.',
    state: 'Решена',
    priority: 'Критический',
    type: 'Доработка',
    project: 'РЭЦ_Fin',
    assignee: 'Кучин Владимир Валерьевич',
    url: 'https://youtrack.greendatasoft.ru/issue/REZ_FIN-7940',
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    created: Date.now() - 1000 * 60 * 60 * 24 * 12,
  },
];

/**
 * Loads cached issues from localStorage
 */
export function loadYouTrackCache(): YouTrackCacheData | null {
  try {
    const raw = localStorage.getItem(YOUTRACK_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as YouTrackCacheData;
    if (parsed && Array.isArray(parsed.issues)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load YouTrack cache:', e);
  }
  return null;
}

/**
 * Saves issues to localStorage cache and chrome.storage.local
 */
export function saveYouTrackCache(data: YouTrackCacheData): void {
  try {
    localStorage.setItem(YOUTRACK_CACHE_KEY, JSON.stringify(data));
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [YOUTRACK_CACHE_KEY]: data });
    }
  } catch (e) {
    console.warn('Failed to save YouTrack cache:', e);
  }
}

/**
 * Extracts query parameter from YouTrack issues URL
 */
export function extractQueryFromYouTrackUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const q = parsed.searchParams.get('q');
    if (q) return q.trim();
  } catch {
    // If not a full URL, attempt regex
    const match = url.match(/[?&]q=([^&#]+)/);
    if (match) return decodeURIComponent(match[1]).trim();
  }
  return 'Исполнитель: Кучин_Владимир_Валерьевич проект: РЭЦ_Fin';
}

/**
 * DOM extractor script executed inside YouTrack tab
 */
export function extractYouTrackDomIssues(): {
  found: boolean;
  issues: Array<{
    id: string;
    summary: string;
    description?: string;
    state?: string;
    priority?: string;
    type?: string;
    project?: string;
    assignee?: string;
    url: string;
  }>;
} {
  const issuesMap = new Map<string, {
    id: string;
    summary: string;
    description?: string;
    state?: string;
    priority?: string;
    type?: string;
    project?: string;
    assignee?: string;
    url: string;
  }>();

  // 1. Selector scan: standard JetBrains YouTrack table and card rows
  const rowSelectors = [
    '[data-test*="issue-list-item"]',
    '[data-test*="ring-list-item"]',
    'tr.yt-issue-table__row',
    '.yt-issue-list__item',
    '[data-issue-id]',
    'div[class*="issueRow"]',
    'div[class*="issue-list__item"]',
    'div[class*="issueItem"]',
    'tr[class*="table__row"]',
  ];

  const candidateRows = document.querySelectorAll(rowSelectors.join(', '));

  candidateRows.forEach((row) => {
    // Look for link pointing to /issue/...
    const link = row.querySelector('a[href*="/issue/"]') as HTMLAnchorElement | null;
    if (!link) return;

    const href = link.getAttribute('href') || '';
    const match = href.match(/\/issue\/([a-zA-Zа-яА-Я0-9_-]+-\d+)/i) || (link.textContent || '').match(/([a-zA-Zа-яА-Я0-9_-]+-\d+)/i);
    if (!match) return;

    const id = match[1].trim();
    if (issuesMap.has(id.toLowerCase())) return;

    // Summary extraction
    const summaryEl = row.querySelector(
      '[data-test*="summary"], [class*="summary"], [class*="issue-summary"], a[class*="summary"], span[class*="summary"], [data-test="issue-summary"]'
    );
    let summary = summaryEl?.textContent?.trim() || link.getAttribute('title')?.trim() || '';

    // If summary not found in special element, look for text content excluding the ID
    if (!summary) {
      const clone = row.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('button, svg, [class*="badge"], [class*="avatar"]').forEach((e) => e.remove());
      const rowText = clone.textContent?.trim() || '';
      summary = rowText.replace(id, '').replace(/\s+/g, ' ').trim();
    }

    // State / Badge extraction
    const badgeEl = row.querySelector(
      '[data-test*="badge"], [class*="badge"], [class*="state"], [class*="status"], [class*="issue-state"]'
    );
    const state = badgeEl?.textContent?.trim() || undefined;

    const fullUrl = href.startsWith('http') ? href : `https://youtrack.greendatasoft.ru/issue/${id}`;

    issuesMap.set(id.toLowerCase(), {
      id,
      summary: summary || id,
      state,
      project: 'РЭЦ_Fin',
      assignee: 'Кучин Владимир Валерьевич',
      url: fullUrl,
    });
  });

  // 2. Fallback: query all links containing /issue/ directly
  if (issuesMap.size === 0) {
    const allLinks = document.querySelectorAll('a[href*="/issue/"]');
    allLinks.forEach((a) => {
      const href = a.getAttribute('href') || '';
      const match = href.match(/\/issue\/([a-zA-Zа-яА-Я0-9_-]+-\d+)/i);
      if (match) {
        const id = match[1].trim();
        if (issuesMap.has(id.toLowerCase())) return;

        let summary = a.getAttribute('title')?.trim() || '';
        const parentRow = a.closest('tr, li, div[class*="item"], div[class*="row"]');
        if (parentRow && !summary) {
          const sumNode = parentRow.querySelector('[class*="summary"]');
          summary = sumNode?.textContent?.trim() || '';
        }
        if (!summary) {
          summary = a.textContent?.trim() || id;
        }

        const fullUrl = href.startsWith('http') ? href : `https://youtrack.greendatasoft.ru/issue/${id}`;
        issuesMap.set(id.toLowerCase(), {
          id,
          summary,
          project: 'РЭЦ_Fin',
          assignee: 'Кучин Владимир Валерьевич',
          url: fullUrl,
        });
      }
    });
  }

  const issues = Array.from(issuesMap.values());
  return {
    found: issues.length > 0,
    issues,
  };
}

/**
 * Main parser: retrieves issues for YouTrack URL using API, open tabs, background tabs, and cache fallback
 */
export async function parseYouTrackIssues(
  targetUrl: string = DEFAULT_YOUTRACK_URL
): Promise<YouTrackParsedResult> {
  const query = extractQueryFromYouTrackUrl(targetUrl);
  const now = Date.now();

  // 1. Strategy A: YouTrack REST API fetch with credentials
  try {
    const apiUrl = `https://youtrack.greendatasoft.ru/api/issues?query=${encodeURIComponent(
      query
    )}&fields=id,idReadable,summary,description,resolved,created,updated,project(name,shortName),customFields(name,value(name,text,presentation,color(background,foreground)))&$top=150`;

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const issues: YouTrackIssue[] = data.map((item: any) => {
          let state: string | undefined;
          let priority: string | undefined;
          let type: string | undefined;
          let assignee: string | undefined;
          const rawFields: Record<string, string> = {};

          if (Array.isArray(item.customFields)) {
            for (const cf of item.customFields) {
              const name = cf.name || '';
              const val = cf.value?.name || cf.value?.presentation || cf.value?.text || (typeof cf.value === 'string' ? cf.value : '');
              if (name && val) {
                rawFields[name] = val;
                const low = name.toLowerCase();
                if (low.includes('state') || low.includes('статус') || low.includes('состояние')) {
                  state = val;
                } else if (low.includes('priority') || low.includes('приоритет')) {
                  priority = val;
                } else if (low.includes('type') || low.includes('тип')) {
                  type = val;
                } else if (low.includes('assignee') || low.includes('исполнитель')) {
                  assignee = val;
                }
              }
            }
          }

          const id = item.idReadable || item.id;
          return {
            id,
            summary: item.summary || id,
            description: item.description || undefined,
            state: state || (item.resolved ? 'Решена' : 'В работе'),
            priority: priority || 'Обычный',
            type: type || 'Доработка',
            project: item.project?.name || item.project?.shortName || 'РЭЦ_Fin',
            assignee: assignee || 'Кучин Владимир Валерьевич',
            url: `https://youtrack.greendatasoft.ru/issue/${id}`,
            created: item.created,
            updatedAt: item.updated,
            rawFields,
          };
        });

        // Save successfully parsed issues to cache
        saveYouTrackCache({
          issues,
          lastSyncedAt: now,
          targetUrl,
        });

        return {
          success: true,
          issues,
          count: issues.length,
          source: 'api',
          syncedAt: now,
        };
      }
    }
  } catch (apiErr) {
    console.warn('YouTrack REST API fetch failed or network unreachable:', apiErr);
  }

  // 2. Strategy B: Chrome tab DOM parsing (check open tabs or create hidden background tab)
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.scripting) {
    let targetTabId: number | undefined;
    let isTemporaryTab = false;

    try {
      // A. Check if a tab with YouTrack is already open
      const allTabs = await chrome.tabs.query({});
      const existingTab = allTabs.find(
        (t) => t.url && t.url.includes('youtrack.greendatasoft.ru')
      );

      if (existingTab && existingTab.id) {
        targetTabId = existingTab.id;
      } else {
        // B. Create a background tab with the target URL
        const createdTab = await chrome.tabs.create({ url: targetUrl, active: false });
        if (createdTab && createdTab.id) {
          targetTabId = createdTab.id;
          isTemporaryTab = true;

          // Wait for page status complete
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              try {
                chrome.tabs.onUpdated.removeListener(listener);
              } catch {}
              resolve();
            }, 12000);

            const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
              if (tabId === createdTab.id && changeInfo.status === 'complete') {
                clearTimeout(timeout);
                try {
                  chrome.tabs.onUpdated.removeListener(listener);
                } catch {}
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
          });
        }
      }

      // C. Execute DOM extraction with polling
      if (targetTabId) {
        const maxAttempts = isTemporaryTab ? 14 : 6;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: targetTabId },
              func: extractYouTrackDomIssues,
            });

            if (results && results[0] && results[0].result) {
              const res = results[0].result as ReturnType<typeof extractYouTrackDomIssues>;
              if (res.found && res.issues.length > 0) {
                const issues: YouTrackIssue[] = res.issues.map((it) => ({
                  id: it.id,
                  summary: it.summary,
                  description: it.description,
                  state: it.state || 'В работе',
                  priority: it.priority || 'Обычный',
                  type: it.type || 'Доработка',
                  project: it.project || 'РЭЦ_Fin',
                  assignee: it.assignee || 'Кучин Владимир Валерьевич',
                  url: it.url,
                  updatedAt: now,
                }));

                saveYouTrackCache({
                  issues,
                  lastSyncedAt: now,
                  targetUrl,
                });

                return {
                  success: true,
                  issues,
                  count: issues.length,
                  source: 'dom',
                  syncedAt: now,
                };
              }
            }
          } catch (e) {
            // Tab still executing scripts or navigating
          }

          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
    } catch (tabErr) {
      console.warn('YouTrack DOM extraction failed:', tabErr);
    } finally {
      // Clean up temporary background tab
      if (isTemporaryTab && targetTabId) {
        try {
          await chrome.tabs.remove(targetTabId);
        } catch {}
      }
    }
  }

  // 3. Strategy C: Cache Fallback
  const cached = loadYouTrackCache();
  if (cached && cached.issues.length > 0) {
    return {
      success: true,
      issues: cached.issues,
      count: cached.issues.length,
      source: 'cache',
      syncedAt: cached.lastSyncedAt,
      error: 'Не удалось подключиться к YouTrack (проверьте подключение к корпоративному контуру / VPN). Показаны сохраненные задачи из кэша.',
    };
  }

  // 4. Strategy D: Mock Data Fallback (for initial local development / demonstration)
  return {
    success: true,
    issues: MOCK_YOUTRACK_ISSUES,
    count: MOCK_YOUTRACK_ISSUES.length,
    source: 'mock',
    syncedAt: now,
    error: 'YouTrack в корпоративном контуре сейчас недоступен. Показаны демонстрационные задачи.',
  };
}
