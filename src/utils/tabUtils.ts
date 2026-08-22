export interface TabInfo {
  url: string;
  title: string;
  cleanTitle: string;
}

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
 * Retrieves the currently active browser tab in Chrome
 */
export async function getActiveTabInfo(): Promise<TabInfo | null> {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      // Query active tab in the current or last focused window
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const activeTab = tabs[0] || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

      if (activeTab && activeTab.url) {
        const title = activeTab.title || activeTab.url;
        return {
          url: activeTab.url,
          title: title,
          cleanTitle: cleanTabTitle(title),
        };
      }
    }
  } catch (error) {
    console.warn('Could not query active Chrome tab:', error);
  }

  // Fallback for development / mock
  if (typeof window !== 'undefined' && window.location) {
    return {
      url: window.location.href,
      title: document.title || 'Текущая страница',
      cleanTitle: cleanTabTitle(document.title || 'Текущая страница'),
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
 * Formats a full implementation task into Markdown
 */
export function formatTaskToMarkdown(task: {
  taskNumber: string;
  title: string;
  summary: string;
  items: Array<{ description: string; linkTitle?: string; linkUrl?: string }>;
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
    lines.push('### Внесенные изменения');
    task.items.forEach((item) => {
      const formatted = formatChangeItemMarkdown(item.description, item.linkTitle, item.linkUrl);
      if (formatted) {
        lines.push(`- ${formatted}`);
      }
    });
    lines.push('');
  }

  return lines.join('\n').trim();
}
