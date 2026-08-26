import { ImplementationSection, ImplementationChangeItem } from '../types';

export interface TabInfo {
  url: string;
  title: string;
  cleanTitle: string;
  detectedSectionName?: string; // e.g. 'Алгоритмы', 'Типы объекта', 'Визуалы', 'Бизнес-процессы'
  detectedRawType?: string;     // e.g. 'Форма по умолчанию', 'Алгоритм', 'Тип объекта', 'Визуальное представление'
  breadcrumb?: string;
  activeTabName?: string;
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
  visuals: {
    canonical: 'Визуалы',
    keywords: [
      'форма по умолчанию', 'форма', 'формы', 'экранная форма', 'экранные формы',
      'визуал', 'визуалы', 'визуальное представление', 'визуальные представления',
      'visual', 'visuals', 'view', 'views', 'form', 'forms', 'ui', 'интерфейс',
      'карточка', 'карточки', 'виджет', 'виджеты', 'компонент', 'компоненты',
      'разметка', 'layout'
    ],
  },
  algorithms: {
    canonical: 'Алгоритмы',
    keywords: [
      'алгоритм', 'алгоритмы', 'algorithm', 'algorithms', 'algo', 'alg',
      'скрипт', 'скрипты', 'script', 'scripts', 'код', 'code',
      'вычисление', 'расчет', 'calc', 'calculation', 'рассчитать',
      'валидация', 'valid', 'validation', 'проверка', 'проверки',
      'фильтр', 'фильтрация', 'filter', 'filtering',
      'обработчик', 'handler', 'событие', 'event',
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
    const hintLow = domTypeHint.toLowerCase().trim();
    for (const group of Object.values(SECTION_SEMANTIC_GROUPS)) {
      if (group.keywords.some((kw) => hintLow.includes(kw) || kw.includes(hintLow))) {
        return { sectionName: group.canonical, rawType: domTypeHint };
      }
    }
  }

  // Check Title & URL heuristics
  for (const group of Object.values(SECTION_SEMANTIC_GROUPS)) {
    if (group.keywords.some((kw) => kw.length >= 4 && combined.includes(kw))) {
      return { sectionName: group.canonical, rawType: domTypeHint || group.canonical };
    }
  }

  return null;
}

/**
 * Intelligently scores and matches a detected GreenData type, tab info, or file name
 * against the user's actual created sections in the current task.
 */
export function matchSectionForType(
  input: {
    detectedRawType?: string;
    detectedSectionName?: string;
    title?: string;
    url?: string;
    fileName?: string;
    breadcrumb?: string;
    activeTab?: string;
  },
  sections: ImplementationSection[]
): { section: ImplementationSection; reason: string } | null {
  if (!sections || sections.length === 0) return null;

  let bestSection: ImplementationSection | null = null;
  let bestScore = 0;
  let bestReason = '';

  const rawType = (input.detectedRawType || '').toLowerCase().trim();
  const secName = (input.detectedSectionName || '').toLowerCase().trim();
  const title = (input.title || '').toLowerCase().trim();
  const fileName = (input.fileName || '').toLowerCase().trim();
  const breadcrumb = (input.breadcrumb || '').toLowerCase().trim();
  const activeTab = (input.activeTab || '').toLowerCase().trim();

  // Primary search targets
  const allInputText = `${rawType} ${secName} ${title} ${fileName} ${breadcrumb} ${activeTab}`.toLowerCase();

  for (const sec of sections) {
    const sName = sec.name.toLowerCase().trim();
    let score = 0;
    const matchReasons: string[] = [];

    // 1. Exact match with section name
    if (rawType && (sName === rawType || sName.replace(/\s*\([^)]*\)/g, '').trim() === rawType)) {
      score += 150;
      matchReasons.push(`точное совпадение с «${input.detectedRawType}»`);
    } else if (secName && (sName === secName || sName.replace(/\s*\([^)]*\)/g, '').trim() === secName)) {
      score += 120;
      matchReasons.push(`совпадение с категорией «${input.detectedSectionName}»`);
    }

    // 2. Substring containment
    // e.g. section "Форма по умолчанию (визуалы)" contains "Форма по умолчанию"
    if (rawType && rawType.length >= 3 && sName.includes(rawType)) {
      score += 110;
      matchReasons.push(`раздел содержит «${input.detectedRawType}»`);
    } else if (rawType && rawType.length >= 3 && rawType.includes(sName)) {
      score += 90;
      matchReasons.push(`тип содержит «${sec.name}»`);
    }

    if (title && title.length >= 3 && sName.includes(title)) {
      score += 70;
      matchReasons.push(`раздел содержит «${input.title}»`);
    } else if (title && title.length >= 3 && title.includes(sName)) {
      score += 70;
      matchReasons.push(`заголовок содержит «${sec.name}»`);
    }

    // 3. Multi-token overlap (e.g. "Форма", "по", "умолчанию", "визуалы")
    const sTokens = sName.split(/[\s/(),.\-_]+/).filter((t) => t.length >= 3);
    const inputTokens = allInputText.split(/[\s/(),.\-_]+/).filter((t) => t.length >= 3);

    for (const st of sTokens) {
      for (const it of inputTokens) {
        if (st === it) {
          score += 40;
          matchReasons.push(`совпадение слова «${st}»`);
        } else if (st.startsWith(it) || it.startsWith(st)) {
          score += 25;
          matchReasons.push(`совпадение корня «${st}»`);
        }
      }
    }

    // 4. Semantic group matching
    for (const group of Object.values(SECTION_SEMANTIC_GROUPS)) {
      const inputHasGroup = group.keywords.some((kw) => kw.length >= 3 && allInputText.includes(kw));
      const sectionHasGroup = group.keywords.some((kw) => kw.length >= 3 && sName.includes(kw));

      if (inputHasGroup && sectionHasGroup) {
        score += 65;
        matchReasons.push(`семантическая группа «${group.canonical}»`);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestSection = sec;
      bestReason = matchReasons[0] || `Совпадение с разделом «${sec.name}»`;
    }
  }

  if (bestSection && bestScore >= 20) {
    return { section: bestSection, reason: bestReason };
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
 * Retrieves the currently active browser tab in Chrome and thoroughly inspects GreenData DOM
 */
export async function getActiveTabInfo(): Promise<TabInfo | null> {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const activeTab = tabs[0] || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

      if (activeTab && activeTab.url && activeTab.id) {
        let rawTitle = activeTab.title || activeTab.url;
        let clean = cleanTabTitle(rawTitle);

        let domTypeHint: string | undefined;
        let domBreadcrumb: string | undefined;
        let domActiveTab: string | undefined;

        // Inspect GreenData DOM if chrome.scripting is available
        if (chrome.scripting && !activeTab.url.startsWith('chrome://') && !activeTab.url.startsWith('edge://')) {
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: () => {
                let typeHint = '';
                let titleHint = '';
                let breadcrumbHint = '';
                let activeTabHint = '';

                // 1. Check visualSettingsControl / "Для <Тип>" or visual representation selectors
                const vsControl = document.querySelector(
                  '.visualSettingsControl, .visual-settings-control, [class*="visualSettings"], [class*="visual-settings"]'
                );
                if (vsControl) {
                  // A. Look for choose-element-icon chevron or dropdown button
                  const chooseBtn = vsControl.querySelector(
                    '.choose-element-icon, [title="Выбрать элемент"], .fa-chevron-down, button'
                  );
                  if (chooseBtn) {
                    const parentContainer = chooseBtn.closest(
                      '.flex-container, ._38Gr6L_e92MVpij2eqFSw5, .visual-settings-control, div'
                    );
                    if (parentContainer) {
                      const labelEl = parentContainer.querySelector(
                        'span[class*="LJdGz"], span[class*="zhI7f"], div[class*="_12uCt"], [class*="title"], span'
                      );
                      if (labelEl) {
                        const clone = labelEl.cloneNode(true) as HTMLElement;
                        clone
                          .querySelectorAll(
                            'span[class*="_2I0rRBp"], [class*="tooltip"], button, i, svg'
                          )
                          .forEach((e) => e.remove());
                        const t = (clone.textContent || '').trim();
                        if (
                          t &&
                          !t.includes('Выбрать') &&
                          !t.includes('Редактировать') &&
                          !t.includes('Дополнительные')
                        ) {
                          typeHint = t; // e.g. "Форма по умолчанию"
                        }
                      }
                    }
                  }

                  // B. If still not found, check direct text in visual-settings-control
                  if (!typeHint) {
                    const clone = vsControl.cloneNode(true) as HTMLElement;
                    clone
                      .querySelectorAll(
                        'button, .btn, span[class*="_2I0rRBp"], [class*="tooltip"], i, svg'
                      )
                      .forEach((e) => e.remove());
                    const raw = (clone.textContent || '').trim();
                    if (raw) {
                      const match = raw.match(/Для\s*["'«]([^"'»]+)["'»]/i);
                      if (match && match[1]) {
                        typeHint = match[1].trim();
                      } else {
                        const firstLine = raw.split(/[\n\r]+/)[0]?.trim();
                        if (
                          firstLine &&
                          firstLine.length > 1 &&
                          firstLine.length < 80 &&
                          !firstLine.includes('Редактировать')
                        ) {
                          typeHint = firstLine;
                        }
                      }
                    }
                  }
                }

                // 2. Look for any active selected item or visual selector on page
                if (!typeHint) {
                  const activeSelects = document.querySelectorAll(
                    '.ant-select-selection-item, .ant-select-selection-selected-value, [class*="selected-value"], [class*="selection-item"], [data-qa*="visual"], [data-qa*="form"], [data-qa*="type"]'
                  );
                  for (const s of Array.from(activeSelects)) {
                    const text = (s.textContent || '').trim();
                    if (
                      text &&
                      (text.includes('Форма') ||
                        text.includes('форма') ||
                        text.includes('Визуал') ||
                        text.includes('Алгоритм') ||
                        text.includes('Процесс') ||
                        text.includes('Отчет') ||
                        text.includes('Справочник'))
                    ) {
                      typeHint = text;
                      break;
                    }
                  }
                }

                // 3. Badges and entity indicators
                const badges = document.querySelectorAll(
                  '.object-type-badge, .gd-type-badge, [class*="type-badge"], [class*="typeBadge"], [class*="objectType"], [class*="object-type"], [data-type], [data-object-type]'
                );
                for (const b of Array.from(badges)) {
                  const val = b.getAttribute('data-type') || b.getAttribute('data-object-type') || b.textContent || '';
                  if (val.trim()) {
                    typeHint = typeHint || val.trim();
                    break;
                  }
                }

                // 4. Breadcrumbs
                const breadcrumbs = document.querySelectorAll(
                  '.ant-breadcrumb, .breadcrumb, .breadcrumbs, [class*="breadcrumb"], .page-header, .header-title'
                );
                for (const b of Array.from(breadcrumbs)) {
                  const text = (b.textContent || '').trim();
                  if (text) {
                    breadcrumbHint = text;
                    break;
                  }
                }

                // 5. Active tabs
                const activeTabs = document.querySelectorAll(
                  '.ant-tabs-tab-active, .tab-header.active, .active-tab, [role="tab"][aria-selected="true"]'
                );
                for (const at of Array.from(activeTabs)) {
                  const text = (at.textContent || '').trim();
                  if (text) {
                    activeTabHint = text;
                    break;
                  }
                }

                // 6. Header / title element in page
                const h1 = document.querySelector(
                  'h1, h2, .title, .form-title, .page-header-title, [class*="page-title"], [class*="pageTitle"], [class*="card-title"], [class*="cardTitle"]'
                );
                if (h1 && h1.textContent) {
                  titleHint = h1.textContent.trim();
                }

                // 7. Input fields for Name / Title
                if (!titleHint) {
                  const nameInput = document.querySelector(
                    'input[name="name"], input[name="title"], input[placeholder*="название"], input[placeholder*="Наименование"], input[placeholder*="Имя"]'
                  );
                  if (nameInput && (nameInput as HTMLInputElement).value) {
                    titleHint = (nameInput as HTMLInputElement).value.trim();
                  }
                }

                return {
                  typeHint: typeHint || null,
                  titleHint: titleHint || null,
                  breadcrumbHint: breadcrumbHint || null,
                  activeTabHint: activeTabHint || null,
                };
              },
            });

            if (results && results[0] && results[0].result) {
              const res = results[0].result as {
                typeHint: string | null;
                titleHint: string | null;
                breadcrumbHint: string | null;
                activeTabHint: string | null;
              };
              if (res.typeHint) domTypeHint = res.typeHint;
              if (res.breadcrumbHint) domBreadcrumb = res.breadcrumbHint;
              if (res.activeTabHint) domActiveTab = res.activeTabHint;
              if (res.titleHint && (!clean || clean.toLowerCase().includes('greendata') || clean === 'Главная')) {
                clean = res.titleHint;
                rawTitle = res.titleHint;
              }
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
          detectedRawType: domTypeHint || detected?.rawType,
          breadcrumb: domBreadcrumb,
          activeTabName: domActiveTab,
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
