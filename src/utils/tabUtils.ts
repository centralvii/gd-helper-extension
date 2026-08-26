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
 * Semantic keyword dictionary for matching GreenData types to sections
 */
export const SECTION_SEMANTIC_GROUPS = {
  algorithms: {
    canonical: 'Алгоритмы',
    keywords: [
      'алгоритм', 'алгоритмы', 'algorithm', 'algorithms', 'algo', 'alg',
      'скрипт', 'скрипты', 'script', 'scripts', 'код', 'code',
      'вычисление', 'расчет', 'calc', 'calculation', 'рассчитать',
      'валидация', 'valid', 'validation', 'проверка', 'проверки',
      'фильтр', 'фильтрация', 'filter', 'filtering',
      'обработчик', 'handler', 'жц', 'событие', 'event',
      'до сохранения', 'после сохранения', 'before_save', 'after_save'
    ],
  },
  objectTypes: {
    canonical: 'Типы объекта',
    keywords: [
      'тип объекта', 'типы объекта', 'типы объектов', 'object type', 'object types',
      'objecttype', 'object-type', 'object_type', 'struct', 'structure', 'структура', 'структуры',
      'сущность', 'сущности', 'entity', 'entities', 'модель данных', 'data model',
      'атрибут', 'атрибуты', 'поле', 'поля', 'свойства'
    ],
  },
  visuals: {
    canonical: 'Визуалы',
    keywords: [
      'визуал', 'визуалы', 'визуальное представление', 'визуальные представления',
      'экранная форма', 'экранные формы', 'форма', 'формы',
      'visual', 'visuals', 'view', 'views', 'form', 'forms', 'ui', 'интерфейс',
      'карточка', 'карточки', 'виджет', 'виджеты', 'компонент', 'компоненты',
      'разметка', 'layout'
    ],
  },
  processes: {
    canonical: 'Бизнес-процессы',
    keywords: [
      'бизнес-процесс', 'бизнес процесс', 'бизнес-процессы', 'бизнес процессы',
      'процесс', 'процессы', 'process', 'processes', 'workflow', 'workflows',
      'бп', 'bp', 'маршрут', 'маршруты', 'статус', 'статусы', 'жизненный цикл'
    ],
  },
  reports: {
    canonical: 'Печатные формы',
    keywords: [
      'печатная форма', 'печатные формы', 'print form', 'printform', 'печать',
      'отчет', 'отчеты', 'report', 'reports', 'документ', 'документы',
      'шаблон документа', 'excel', 'word', 'pdf'
    ],
  },
  tables: {
    canonical: 'Справочники и таблицы',
    keywords: [
      'таблица', 'таблицы', 'table', 'tables', 'справочник', 'справочники',
      'dictionary', 'dictionaries', 'dict', 'реестр', 'реестры', 'список', 'списки', 'grid'
    ],
  },
  integrations: {
    canonical: 'Интеграции',
    keywords: [
      'интеграция', 'интеграции', 'integration', 'integrations',
      'api', 'rest', 'soap', 'сервис', 'веб-сервис', 'внешняя система'
    ],
  },
};

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
 * Match raw detected type or title/URL string against standard GreenData categories
 */
export function detectGreenDataSection(
  title: string,
  url: string,
  domTypeHint?: string
): { sectionName: string; rawType?: string } | null {
  const combined = `${domTypeHint || ''} ${title} ${url}`.toLowerCase();

  // Check DOM Type Hint first
  if (domTypeHint) {
    const hintLow = domTypeHint.toLowerCase();
    for (const group of Object.values(SECTION_SEMANTIC_GROUPS)) {
      if (group.keywords.some((kw) => hintLow.includes(kw))) {
        return { sectionName: group.canonical, rawType: domTypeHint };
      }
    }
  }

  // Check Title & URL heuristics
  for (const group of Object.values(SECTION_SEMANTIC_GROUPS)) {
    if (group.keywords.some((kw) => combined.includes(kw))) {
      return { sectionName: group.canonical, rawType: group.keywords[0] };
    }
  }

  return null;
}

/**
 * Intelligently matches a detected GreenData type, tab info, or file name
 * against the user's actual created sections in the current task.
 */
export function matchSectionForType(
  input: {
    detectedRawType?: string;
    detectedSectionName?: string;
    title?: string;
    url?: string;
    fileName?: string;
  },
  sections: ImplementationSection[]
): { section: ImplementationSection; reason: string } | null {
  if (!sections || sections.length === 0) return null;

  const rawType = (input.detectedRawType || '').toLowerCase().trim();
  const secName = (input.detectedSectionName || '').toLowerCase().trim();
  const title = (input.title || '').toLowerCase().trim();
  const fileName = (input.fileName || '').toLowerCase().trim();
  const url = (input.url || '').toLowerCase().trim();

  const combinedSearch = `${rawType} ${secName} ${fileName} ${title} ${url}`.toLowerCase();

  // 1. Direct match: Exact section name in rawType or sectionName
  for (const sec of sections) {
    const sName = sec.name.toLowerCase().trim();
    if (
      sName === secName ||
      sName === rawType ||
      (rawType && sName.includes(rawType)) ||
      (rawType && rawType.includes(sName)) ||
      (secName && sName.includes(secName))
    ) {
      return { section: sec, reason: `Прямое совпадение с «${sec.name}»` };
    }
  }

  // 2. Semantic Group Match:
  // Determine which semantic group the input belongs to
  let matchedGroupKey: keyof typeof SECTION_SEMANTIC_GROUPS | null = null;

  for (const [key, group] of Object.entries(SECTION_SEMANTIC_GROUPS)) {
    const hasKeyword = group.keywords.some((kw) => {
      // Check if keyword is in rawType, fileName, secName or title
      if (rawType && rawType.includes(kw)) return true;
      if (secName && secName.includes(kw)) return true;
      if (fileName) {
        // e.g. 000001_algo_... or _ALG.guf
        const fileTokens = fileName.split(/[_.\s-]+/);
        if (fileTokens.includes(kw) || fileName.includes(`_${kw}_`) || fileName.includes(`_${kw}.`)) {
          return true;
        }
      }
      return combinedSearch.includes(kw);
    });

    if (hasKeyword) {
      matchedGroupKey = key as keyof typeof SECTION_SEMANTIC_GROUPS;
      break;
    }
  }

  // If a group was identified, find which created section matches any keyword of that group
  if (matchedGroupKey) {
    const group = SECTION_SEMANTIC_GROUPS[matchedGroupKey];

    // Check each created section for any group keyword
    for (const sec of sections) {
      const sLow = sec.name.toLowerCase();
      if (group.keywords.some((kw) => sLow.includes(kw))) {
        return {
          section: sec,
          reason: `Определен тип: «${input.detectedRawType || group.canonical}» → Раздел «${sec.name}»`,
        };
      }
    }
  }

  // 3. Fallback: Word stem matching across existing sections
  for (const sec of sections) {
    const sLow = sec.name.toLowerCase();
    const secTokens = sLow.split(/[\s/.,\-_]+/).filter((t) => t.length >= 3);
    for (const tok of secTokens) {
      if (combinedSearch.includes(tok)) {
        return {
          section: sec,
          reason: `Совпадение по ключевому слову «${tok}» → Раздел «${sec.name}»`,
        };
      }
    }
  }

  return null;
}

/**
 * Automatically determines the appropriate section for a package file
 */
export function detectFileSection(
  file: { newName?: string; cleanName?: string; originalName: string },
  sections: ImplementationSection[]
): ImplementationSection | null {
  const name = file.newName || file.cleanName || file.originalName;
  const matchResult = matchSectionForType({ fileName: name, title: name }, sections);
  return matchResult ? matchResult.section : null;
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
                  const match = text.match(/Для\s*["'«]([^"'»]+)["'»]/i);
                  if (match && match[1]) {
                    return match[1].trim();
                  }
                  // Check direct text like "Тип: Алгоритм"
                  const matchType = text.match(/Тип[:\s]+(["'«]?)([^"'»\n]+)\1/i);
                  if (matchType && matchType[2]) {
                    return matchType[2].trim();
                  }
                }

                // 2. Check type badges / entity indicators
                const badges = document.querySelectorAll(
                  '.object-type-badge, .gd-type-badge, [class*="type-badge"], [class*="typeBadge"], [class*="objectType"], [class*="object-type"], [data-type], [data-object-type]'
                );
                for (const b of Array.from(badges)) {
                  const val = b.getAttribute('data-type') || b.getAttribute('data-object-type') || b.textContent || '';
                  if (val.trim()) return val.trim();
                }

                // 3. Look for active tab or modal header
                const activeTabs = document.querySelectorAll('.ant-tabs-tab-active, .tab-header.active, .active-tab');
                for (const at of Array.from(activeTabs)) {
                  const text = (at.textContent || '').trim();
                  if (text && (text.includes('Алгоритм') || text.includes('Форма') || text.includes('Визуал') || text.includes('Процесс') || text.includes('Тип'))) {
                    return text;
                  }
                }

                // 4. Look for modal / breadcrumb / page header
                const breadcrumbs = document.querySelectorAll(
                  '.breadcrumb, .breadcrumbs, .ant-breadcrumb, [class*="breadcrumb"], .page-header, .header-title, .ant-page-header-heading-title'
                );
                for (const b of Array.from(breadcrumbs)) {
                  const text = (b.textContent || '').trim();
                  if (text) return text;
                }

                // 5. Fallback: check document title or specific heading tags
                const h1 = document.querySelector('h1, h2, .title, .form-title');
                if (h1 && h1.textContent) {
                  return h1.textContent.trim();
                }

                return null;
              },
            });

            if (results && results[0] && results[0].result) {
              domTypeHint = results[0].result as string;
            }
          } catch {
            // Scripting may be restricted on some domains, fallback to title/url regex
          }
        }

        const detected = detectGreenDataSection(clean, activeTab.url, domTypeHint);

        return {
          url: activeTab.url,
          title: rawTitle,
          cleanTitle: clean,
          detectedSectionName: detected?.sectionName,
          detectedRawType: detected?.rawType || domTypeHint,
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
  packageId?: string;
  sections?: ImplementationSection[];
  items: ImplementationChangeItem[];
  linkedPackage?: { name: string; files?: { newName?: string; originalName: string; order: number }[] };
  linkedPackages?: { name: string; files?: { newName?: string; originalName: string; order: number }[] }[];
}): string {
  const lines: string[] = [];

  // Header
  const headerParts = [task.taskNumber.trim(), task.title.trim()].filter(Boolean);
  if (headerParts.length > 0) {
    lines.push(`## ${headerParts.join(': ')}`);
    lines.push('');
  }

  // Linked Packages info (1 task -> N packages)
  const allLinked = task.linkedPackages || (task.linkedPackage ? [task.linkedPackage] : []);
  if (allLinked.length > 0) {
    lines.push('### Пакеты обновления .guf');
    allLinked.forEach((pkg) => {
      const count = pkg.files?.length || 0;
      lines.push(`- **Пакет:** \`${pkg.name}\` (${count} ${count === 1 ? 'файл' : 'файлов'})`);
    });
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

    // Group items by sectionId
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
