import { ImplementationSection, ImplementationChangeItem } from '../types';

export interface TabInfo {
  url: string;
  title: string;
  cleanTitle: string;
  detectedSectionName?: string; // e.g. 'Алгоритмы', 'Типы объекта', 'Визуалы', 'Бизнес-процессы'
  detectedRawType?: string;     // e.g. 'Алгоритм', 'Тип объекта', 'Визуальное представление'
}

export const DEFAULT_IMPLEMENTATION_SECTIONS: ImplementationSection[] = [
  { id: 'sec-algorithms', name: 'Алгоритмы', order: 0 },
  { id: 'sec-object-types', name: 'Типы объекта', order: 1 },
  { id: 'sec-visuals', name: 'Визуалы', order: 2 },
  { id: 'sec-business-processes', name: 'Бизнес-процессы', order: 3 },
];

/**
 * Clean up tab title by removing common website suffix/prefixes
 */
export function cleanTabTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  let title = rawTitle.trim();

  // Remove common portal prefixes/suffixes
  title = title
    .replace(/^GreenData\s*[-|–—:]\s*/i, '')
    .replace(/\s*[-|–—:]\s*GreenData$/i, '')
    .replace(/\s*[-|–—:]\s*Jira$/i, '')
    .replace(/\s*[-|–—:]\s*Confluence$/i, '')
    .replace(/\s*[-|–—:]\s*GitLab$/i, '')
    .replace(/\s*[-|–—:]\s*GitHub$/i, '');

  return title.trim() || rawTitle.trim();
}

/**
 * Match raw detected type or title/URL string against standard section names
 */
export function detectGreenDataSection(
  title: string,
  url: string,
  domTypeHint?: string
): { sectionName: string; rawType?: string } | null {
  const combined = `${domTypeHint || ''} ${title} ${url}`.toLowerCase();

  // 1. Direct DOM hint matching (e.g. from GreenData visualSettingsControl "Для 'Алгоритм'")
  if (domTypeHint) {
    const hintLow = domTypeHint.toLowerCase();
    if (hintLow.includes('алгоритм') || hintLow.includes('algorithm')) {
      return { sectionName: 'Алгоритмы', rawType: domTypeHint };
    }
    if (hintLow.includes('тип объекта') || hintLow.includes('типы объекта') || hintLow.includes('object-type') || hintLow.includes('objecttype')) {
      return { sectionName: 'Типы объекта', rawType: domTypeHint };
    }
    if (hintLow.includes('визуал') || hintLow.includes('экранн') || hintLow.includes('форма') || hintLow.includes('представлен')) {
      return { sectionName: 'Визуалы', rawType: domTypeHint };
    }
    if (hintLow.includes('бизнес-процесс') || hintLow.includes('бизнес процесс') || hintLow.includes('процесс') || hintLow.includes('workflow')) {
      return { sectionName: 'Бизнес-процессы', rawType: domTypeHint };
    }
    if (hintLow.includes('печатн') || hintLow.includes('отчет') || hintLow.includes('report')) {
      return { sectionName: 'Печатные формы', rawType: domTypeHint };
    }
  }

  // 2. Heuristics from Title & URL
  if (
    combined.includes('алгоритм') ||
    combined.includes('algorithm') ||
    combined.includes('/algorithm/') ||
    combined.includes('_alg') ||
    combined.includes('событие до сохранения') ||
    combined.includes('событие после сохранения')
  ) {
    return { sectionName: 'Алгоритмы', rawType: 'Алгоритм' };
  }

  if (
    combined.includes('тип объекта') ||
    combined.includes('типы объектов') ||
    combined.includes('/object-type/') ||
    combined.includes('/objecttype/') ||
    combined.includes('/entity/')
  ) {
    return { sectionName: 'Типы объекта', rawType: 'Тип объекта' };
  }

  if (
    combined.includes('визуальное представление') ||
    combined.includes('экранная форма') ||
    combined.includes('экранные формы') ||
    combined.includes('/visual/') ||
    combined.includes('/form/') ||
    combined.includes('/view/') ||
    combined.includes('виджет')
  ) {
    return { sectionName: 'Визуалы', rawType: 'Визуальное представление' };
  }

  if (
    combined.includes('бизнес-процесс') ||
    combined.includes('бизнес процесс') ||
    combined.includes('бизнес-процессы') ||
    combined.includes('/process/') ||
    combined.includes('/workflow/') ||
    combined.includes('/bp/')
  ) {
    return { sectionName: 'Бизнес-процессы', rawType: 'Бизнес-процесс' };
  }

  if (
    combined.includes('печатная форма') ||
    combined.includes('печатные формы') ||
    combined.includes('отчет') ||
    combined.includes('/report/')
  ) {
    return { sectionName: 'Печатные формы', rawType: 'Печатная форма' };
  }

  return null;
}

/**
 * Retrieves the currently active browser tab in Chrome and inspects GreenData DOM
 */
export async function getActiveTabInfo(): Promise<TabInfo | null> {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const activeTab = tabs[0] || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

      if (activeTab && activeTab.url && activeTab.id) {
        const rawTitle = activeTab.title || activeTab.url;
        const clean = cleanTabTitle(rawTitle);

        let domTypeHint: string | undefined;

        // Try inspecting GreenData DOM if chrome.scripting is available
        if (chrome.scripting && !activeTab.url.startsWith('chrome://') && !activeTab.url.startsWith('edge://')) {
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: () => {
                // 1. Look for GreenData visualSettingsControl / "Для <Тип>"
                const vsElements = document.querySelectorAll(
                  '.visualSettingsControl, .visual-settings-control, [class*="visual-settings"], [class*="visualSettings"]'
                );
                for (const el of Array.from(vsElements)) {
                  const text = el.textContent || '';
                  const match = text.match(/Для\s*["«]([^"»]+)["»]/i);
                  if (match && match[1]) {
                    return match[1].trim();
                  }
                }

                // 2. Look for modal / breadcrumb / page header
                const breadcrumbs = document.querySelectorAll(
                  '.breadcrumb, .breadcrumbs, .ant-breadcrumb, [class*="breadcrumb"], .page-header, .header-title'
                );
                for (const b of Array.from(breadcrumbs)) {
                  const text = (b.textContent || '').trim();
                  if (text) return text;
                }

                // 3. Fallback: check document title or specific heading tags
                const h1 = document.querySelector('h1, h2, .title');
                if (h1 && h1.textContent) {
                  return h1.textContent.trim();
                }

                return null;
              },
            });

            if (results && results[0] && results[0].result) {
              domTypeHint = results[0].result as string;
            }
          } catch (scriptErr) {
            // Scripting may be restricted on some domains, fallback to title/url regex
          }
        }

        const detected = detectGreenDataSection(clean, activeTab.url, domTypeHint);

        return {
          url: activeTab.url,
          title: rawTitle,
          cleanTitle: clean,
          detectedSectionName: detected?.sectionName,
          detectedRawType: detected?.rawType,
        };
      }
    }
  } catch (error) {
    console.warn('Could not query active Chrome tab:', error);
  }

  // Fallback for development / mock
  if (typeof window !== 'undefined' && window.location) {
    const rawTitle = document.title || 'Текущая страница';
    const clean = cleanTabTitle(rawTitle);
    const detected = detectGreenDataSection(clean, window.location.href);
    return {
      url: window.location.href,
      title: rawTitle,
      cleanTitle: clean,
      detectedSectionName: detected?.sectionName,
      detectedRawType: detected?.rawType,
    };
  }

  return null;
}

/**
 * Formats a change description and optional link into Markdown / text
 */
export function formatChangeItemMarkdown(description: string, linkTitle?: string, linkUrl?: string): string {
  const desc = description.trim();
  const title = (linkTitle || '').trim();
  const url = (linkUrl || '').trim();

  if (url) {
    const label = title || url;
    return `${desc} [${label}](${url})`.trim();
  }

  return desc;
}

/**
 * Formats a full implementation task into Markdown, grouping items by sections
 */
export function formatTaskToMarkdown(task: {
  taskNumber: string;
  title: string;
  summary: string;
  sections?: ImplementationSection[];
  items: ImplementationChangeItem[];
}): string {
  const lines: string[] = [];

  // Header
  const headerParts = [task.taskNumber.trim(), task.title.trim()].filter(Boolean);
  if (headerParts.length > 0) {
    lines.push(`## ${headerParts.join(': ')}`);
    lines.push('');
  }

  // Summary
  if (task.summary && task.summary.trim()) {
    lines.push('### Описание реализации');
    lines.push(task.summary.trim());
    lines.push('');
  }

  // Changes
  if (task.items && task.items.length > 0) {
    lines.push('### Внесённые изменения');

    const sections = task.sections || DEFAULT_IMPLEMENTATION_SECTIONS;
    const sortedSections = [...sections].sort((a, b) => a.order - b.order);

    const sectionMap = new Map<string, ImplementationChangeItem[]>();
    const unsectioned: ImplementationChangeItem[] = [];

    // Group items by sectionId or match by detectedSection
    task.items.forEach((item) => {
      if (item.sectionId) {
        const list = sectionMap.get(item.sectionId) || [];
        list.push(item);
        sectionMap.set(item.sectionId, list);
      } else {
        unsectioned.push(item);
      }
    });

    let hasAnyGrouped = false;

    // Output grouped sections in order
    sortedSections.forEach((sec) => {
      const items = sectionMap.get(sec.id);
      if (items && items.length > 0) {
        hasAnyGrouped = true;
        lines.push(`#### ${sec.name}`);
        items.forEach((item) => {
          const formatted = formatChangeItemMarkdown(item.description, item.linkTitle, item.linkUrl);
          if (formatted) {
            lines.push(`- ${formatted}`);
          }
        });
        lines.push('');
      }
    });

    // Output any remaining items without section
    if (unsectioned.length > 0) {
      if (hasAnyGrouped) {
        lines.push('#### Прочее / Без раздела');
      }
      unsectioned.forEach((item) => {
        const formatted = formatChangeItemMarkdown(item.description, item.linkTitle, item.linkUrl);
        if (formatted) {
          lines.push(`- ${formatted}`);
        }
      });
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}
