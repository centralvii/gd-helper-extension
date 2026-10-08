import { YouTrackIssue, YouTrackCacheData, YouTrackParsedResult } from '../types';

export const DEFAULT_YOUTRACK_URL =
  'https://youtrack.greendatasoft.ru/issues?q=%D0%98%D1%81%D0%BF%D0%BE%D0%BB%D0%BD%D0%B8%D1%82%D0%B5%D0%BB%D1%8C:%20%D0%9A%D1%83%D1%87%D0%B8%D0%BD_%D0%92%D0%BB%D0%B0%D0%B4%D0%B8%D0%BC%D0%B8%D1%80_%D0%92%D0%B0%D0%BB%D0%B5%D1%80%D1%8C%D0%B5%D0%B2%D0%B8%D1%87%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82:%20%D0%A0%D0%AD%D0%A6_Fin&u=1';

export const YOUTRACK_CACHE_KEY = 'gd_youtrack_issues_cache';

/**
 * Loads cached issues from localStorage
 */
export function loadYouTrackCache(): YouTrackCacheData | null {
  try {
    const raw = localStorage.getItem(YOUTRACK_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as YouTrackCacheData;
    if (parsed && Array.isArray(parsed.issues) && parsed.issues.length > 0) {
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
    const match = url.match(/[?&]q=([^&#]+)/);
    if (match) return decodeURIComponent(match[1]).trim();
  }
  return 'Исполнитель: Кучин_Владимир_Валерьевич проект: РЭЦ_Fin';
}

/**
 * Normalizes raw API response item into YouTrackIssue
 */
export function normalizeApiIssue(item: any): YouTrackIssue {
  const id = item.idReadable || item.id || '';
  let state: string | undefined;
  let priority: string | undefined;
  let type: string | undefined;
  let assignee: string | undefined;
  const rawFields: Record<string, string> = {};

  if (Array.isArray(item.customFields)) {
    for (const cf of item.customFields) {
      const name = cf.name || '';
      const valObj = cf.value;
      let val = '';
      if (valObj) {
        if (typeof valObj === 'string') val = valObj;
        else if (valObj.name) val = valObj.name;
        else if (valObj.presentation) val = valObj.presentation;
        else if (valObj.text) val = valObj.text;
      }
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

  return {
    id,
    summary: item.summary || id,
    description: typeof item.description === 'string' ? item.description : undefined,
    state: state || (item.resolved ? 'Решена' : 'В работе'),
    priority: priority || 'Обычный',
    type: type || 'Доработка',
    project: item.project?.name || item.project?.shortName || 'РЭЦ_Fin',
    assignee: assignee || 'Кучин Владимир Валерьевич',
    url: `https://youtrack.greendatasoft.ru/issue/${id}`,
    created: item.created,
    updatedAt: item.updated || Date.now(),
    rawFields,
  };
}

/**
 * Script executed directly inside a tab of https://youtrack.greendatasoft.ru.
 * Because it runs inside the origin of YouTrack, the browser automatically attaches
 * all login cookies and session identifiers with window.fetch.
 */
export async function executeInTabYouTrackExtraction(queryStr: string): Promise<{
  success: boolean;
  issues: any[];
  error?: string;
  source: 'api' | 'dom';
}> {
  // 1. Try In-Tab Fetch to REST API (same-origin, cookies attached)
  try {
    const fields =
      'id,idReadable,summary,description,resolved,created,updated,project(name,shortName),customFields(name,value(name,text,presentation))';
    const apiUrl = `/api/issues?query=${encodeURIComponent(queryStr)}&fields=${fields}&$top=150`;

    const resp = await window.fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          success: true,
          issues: data,
          source: 'api',
        };
      }
    } else if (resp.status === 401 || resp.status === 403) {
      return {
        success: false,
        issues: [],
        error: `Требуется авторизация в YouTrack (HTTP ${resp.status}). Пожалуйста, войдите в систему на https://youtrack.greendatasoft.ru`,
        source: 'api',
      };
    }
  } catch (err: any) {
    // Continue to DOM extraction if API threw
  }

  // 2. Fallback: Parse DOM of current page
  try {
    const issuesMap = new Map<string, any>();
    const issueLinkRegex = /\/issue\/([a-zA-Zа-яА-Я0-9_-]+-\d+)/i;
    const links = document.querySelectorAll('a[href*="/issue/"]');

    links.forEach((a) => {
      const href = a.getAttribute('href') || '';
      const match = href.match(issueLinkRegex);
      if (!match) return;

      const id = match[1].trim();
      const idKey = id.toLowerCase();
      if (issuesMap.has(idKey)) return;

      const container =
        a.closest('tr, li, div[class*="item"], div[class*="row"], div[class*="card"], div[data-test]') ||
        a.parentElement;

      let summary = '';
      if (container) {
        const sumEl = container.querySelector(
          '[data-test*="summary"], [class*="summary"], [class*="issue-summary"], a[class*="summary"], span[class*="summary"]'
        );
        summary = sumEl?.textContent?.trim() || '';
      }
      if (!summary) {
        summary = a.getAttribute('title')?.trim() || a.textContent?.trim() || id;
        if (summary === id && container) {
          const clone = container.cloneNode(true) as HTMLElement;
          clone
            .querySelectorAll('button, svg, [class*="badge"], [class*="avatar"]')
            .forEach((e) => e.remove());
          summary = (clone.textContent || '').replace(id, '').replace(/\s+/g, ' ').trim();
        }
      }

      let state = '';
      if (container) {
        const stateEl = container.querySelector(
          '[data-test*="badge"], [class*="badge"], [class*="state"], [class*="status"], [class*="issue-state"]'
        );
        state = stateEl?.textContent?.trim() || '';
      }

      const fullUrl = href.startsWith('http') ? href : `https://youtrack.greendatasoft.ru/issue/${id}`;

      issuesMap.set(idKey, {
        idReadable: id,
        id,
        summary: summary || id,
        state: state || 'В работе',
        project: { name: 'РЭЦ_Fin' },
        url: fullUrl,
      });
    });

    if (issuesMap.size > 0) {
      return {
        success: true,
        issues: Array.from(issuesMap.values()),
        source: 'dom',
      };
    }
  } catch (domErr: any) {
    // ignore
  }

  return {
    success: false,
    issues: [],
    error: 'Задачи не найдены в YouTrack по данному запросу.',
    source: 'api',
  };
}

/**
 * Main parser: fetches REAL issues for Vladimir Kuchin from YouTrack
 */
export async function parseYouTrackIssues(
  targetUrl: string = DEFAULT_YOUTRACK_URL
): Promise<YouTrackParsedResult> {
  const query = extractQueryFromYouTrackUrl(targetUrl);
  const now = Date.now();

  // 1. First, try Direct Fetch from Extension context with credentials
  try {
    const fields =
      'id,idReadable,summary,description,resolved,created,updated,project(name,shortName),customFields(name,value(name,text,presentation))';
    const apiUrl = `https://youtrack.greendatasoft.ru/api/issues?query=${encodeURIComponent(
      query
    )}&fields=${fields}&$top=150`;

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
        const issues: YouTrackIssue[] = data.map(normalizeApiIssue);
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
  } catch (directErr) {
    // Cross-origin cookie stripping may occur, proceed to In-Tab execution
  }

  // 2. In-Tab Execution (guaranteed same-origin cookies and session)
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.scripting) {
    let targetTabId: number | undefined;
    let isTemporaryTab = false;

    try {
      // Find an existing tab on youtrack.greendatasoft.ru
      const allTabs = await chrome.tabs.query({});
      const existingTab = allTabs.find(
        (t) => t.url && t.url.includes('youtrack.greendatasoft.ru')
      );

      if (existingTab && existingTab.id) {
        targetTabId = existingTab.id;
      } else {
        // Create a background tab to establish origin session
        const createdTab = await chrome.tabs.create({ url: targetUrl, active: false });
        if (createdTab && createdTab.id) {
          targetTabId = createdTab.id;
          isTemporaryTab = true;

          // Wait for tab status complete
          await new Promise<void>((resolve) => {
            let done = false;
            const timeout = setTimeout(() => {
              if (!done) {
                done = true;
                try {
                  chrome.tabs.onUpdated.removeListener(listener);
                } catch {}
                resolve();
              }
            }, 10000);

            const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
              if (tabId === createdTab.id && changeInfo.status === 'complete') {
                if (!done) {
                  done = true;
                  clearTimeout(timeout);
                  try {
                    chrome.tabs.onUpdated.removeListener(listener);
                  } catch {}
                  resolve();
                }
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
          });

          // Brief delay for SPA bootstrap
          await new Promise((r) => setTimeout(r, 1200));
        }
      }

      if (targetTabId) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          func: executeInTabYouTrackExtraction,
          args: [query],
        });

        if (results && results[0] && results[0].result) {
          const res = results[0].result as Awaited<
            ReturnType<typeof executeInTabYouTrackExtraction>
          >;

          if (res.success && Array.isArray(res.issues) && res.issues.length > 0) {
            const issues: YouTrackIssue[] = res.issues.map(normalizeApiIssue);

            saveYouTrackCache({
              issues,
              lastSyncedAt: now,
              targetUrl,
            });

            return {
              success: true,
              issues,
              count: issues.length,
              source: res.source,
              syncedAt: now,
            };
          } else if (res.error) {
            console.warn('In-Tab extraction reported error:', res.error);
          }
        }
      }
    } catch (tabErr) {
      console.warn('In-Tab YouTrack execution failed:', tabErr);
    } finally {
      if (isTemporaryTab && targetTabId) {
        try {
          await chrome.tabs.remove(targetTabId);
        } catch {}
      }
    }
  }

  // 3. Cache fallback if offline/disconnected
  const cached = loadYouTrackCache();
  if (cached && cached.issues.length > 0) {
    return {
      success: true,
      issues: cached.issues,
      count: cached.issues.length,
      source: 'cache',
      syncedAt: cached.lastSyncedAt,
      error:
        'Не удалось подключиться к YouTrack (проверьте VPN / авторизацию). Отображены ранее сохраненные задачи из кэша.',
    };
  }

  // 4. Strict Real-Data Error: NEVER return mock data!
  return {
    success: false,
    issues: [],
    count: 0,
    source: 'api',
    syncedAt: now,
    error:
      'Не удалось загрузить задачи из YouTrack. Убедитесь, что вы авторизованы на https://youtrack.greendatasoft.ru и подключены к корпоративному контуру (VPN).',
  };
}
