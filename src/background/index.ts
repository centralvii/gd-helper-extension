/**
 * GDHelper Extension Background Service Worker
 * Configures Side Panel behavior for Chrome Manifest V3.
 * Also handles auto-collect of .guf downloads.
 */

// ── Side Panel setup ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
      console.error('Error setting panel behavior:', error);
    });
  }
  console.log('GDHelper Extension installed successfully.');
});

chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open && tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn('Could not open sidePanel directly:', err);
    }
  }
});

import { sanitizeCleanName, trimGreenDataUrl, isUpdateCreationPage } from '../utils/tabUtils';

// ── Auto-Collector: .guf download watcher ────────────────────────────────────
// chrome.downloads.onChanged MUST be in the background service worker —
// it does NOT fire in side panel / content scripts.

const AUTO_COLLECT_KEY = 'gd-helper-auto-collect-enabled';
const AUTO_COLLECT_MODE_KEY = 'gd-helper-auto-collect-mode';
const processedDownloads = new Set<number>();
const ignoredDownloadIds = new Set<number>();
const recentInternalDownloads = new Map<string, number>();

// Listen for internal downloads registered by side panel UI
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'REGISTER_INTERNAL_DOWNLOAD' && message.payload?.filename) {
    const fn = String(message.payload.filename).toLowerCase().trim();
    recentInternalDownloads.set(fn, Date.now());
    // Cleanup old items > 60s
    const now = Date.now();
    for (const [key, ts] of recentInternalDownloads.entries()) {
      if (now - ts > 60000) recentInternalDownloads.delete(key);
    }
    sendResponse?.({ status: 'ok' });
  }
});

/**
 * Checks whether a download was initiated by or originates from this extension
 */
function isInternalExtensionDownload(item: chrome.downloads.DownloadItem): boolean {
  const myExtId = chrome.runtime.id;

  // 1. Explicit initiated by our extension ID
  if (item.byExtensionId && item.byExtensionId === myExtId) {
    return true;
  }

  // 2. Extension URL or Blob URL originating from our extension
  const url = item.url || '';
  const finalUrl = item.finalUrl || '';

  if (
    url.startsWith(`blob:chrome-extension://${myExtId}`) ||
    url.startsWith(`chrome-extension://${myExtId}`) ||
    finalUrl.startsWith(`blob:chrome-extension://${myExtId}`) ||
    finalUrl.startsWith(`chrome-extension://${myExtId}`) ||
    url.includes(myExtId) ||
    finalUrl.includes(myExtId) ||
    url.startsWith('blob:chrome-extension://') ||
    finalUrl.startsWith('blob:chrome-extension://')
  ) {
    return true;
  }

  // 3. Filename registered by our UI within 20s
  const fullPath = item.filename || '';
  const rawFilename = fullPath.replace(/\\/g, '/').split('/').pop() || '';
  if (rawFilename) {
    const lower = rawFilename.toLowerCase().trim();
    const regTime = recentInternalDownloads.get(lower);
    if (regTime && Date.now() - regTime < 20000) {
      return true;
    }
  }

  return false;
}

interface DownloadMeta {
  downloadId: number;
  tabId?: number;
  tabUrl?: string;
  pageName?: string;
  createdAt: number;
}

const downloadMetaMap = new Map<number, DownloadMeta>();

/**
 * Self-contained DOM extractor for injection into GreenData tabs
 */
function extractPageNameInTab(): string | null {
  const checkUpdateCreation = (str: string | null | undefined): string | null => {
    if (!str) return null;
    const low = str.toLowerCase();
    if (
      low.includes('создание обновлен') ||
      low.includes('создание пакета обновлен') ||
      low.includes('создания обновлен') ||
      low === 'пакет обновления' ||
      low === 'пакет обновлений'
    ) {
      return 'Пакет обновления';
    }
    return str;
  };

  // 1. Primary: .page-name-wrapper .page-h
  const selectors = [
    '.page-name-wrapper .page-h',
    '.page-name-wrapper [title]',
    '[class*="page-name-wrapper"] [class*="page-h"]',
    '[class*="page-name-wrapper"] [title]',
    '.page-name-wrapper span',
    '.page-name-wrapper',
    '.page-h',
    '[class*="page-h"]',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const titleAttr = el.getAttribute('title')?.trim();
      if (titleAttr) return checkUpdateCreation(titleAttr);
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('button, svg, [class*="tooltip"], i').forEach((e) => e.remove());
      const text = clone.textContent?.trim();
      if (text) return checkUpdateCreation(text);
    }
  }

  // 2. Secondary: page-header-title, form-title, h1
  const secondary = [
    '.page-header-title',
    '.form-title',
    'h1',
    '[class*="page-title"]',
    '[class*="pageTitle"]',
    '[class*="card-title"]',
  ];
  for (const sel of secondary) {
    const el = document.querySelector(sel);
    if (el) {
      const titleAttr = el.getAttribute('title')?.trim();
      if (titleAttr) return checkUpdateCreation(titleAttr);
      const text = el.textContent?.trim();
      if (text) return checkUpdateCreation(text);
    }
  }

  // 3. Fallback: document.title without portal suffixes
  if (document.title) {
    let t = document.title.trim();
    t = t
      .replace(/^GreenData\s*[-|–—:]\s*/i, '')
      .replace(/\s*[-|–—:]\s*GreenData$/i, '')
      .trim();
    if (t && t !== 'Главная' && !t.toLowerCase().includes('greendata')) {
      return checkUpdateCreation(t);
    }
  }

  return null;
}

// Intercept the download at the exact moment it is created to capture the active tab
chrome.downloads.onCreated.addListener(async (item) => {
  // Ignore downloads originating from our own extension
  if (isInternalExtensionDownload(item)) {
    ignoredDownloadIds.add(item.id);
    return;
  }

  let isOriginalMode = false;
  try {
    const stored = await chrome.storage.local.get([AUTO_COLLECT_KEY, AUTO_COLLECT_MODE_KEY]);
    if (stored[AUTO_COLLECT_KEY] !== true) return;
    isOriginalMode = stored[AUTO_COLLECT_MODE_KEY] === 'original';
  } catch {
    return;
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const activeTab = tabs[0] || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

    if (
      activeTab &&
      activeTab.id &&
      activeTab.url &&
      !activeTab.url.startsWith('chrome://') &&
      !activeTab.url.startsWith('edge://')
    ) {
      let pageName: string | undefined;

      // Direct check: active tab title or url indicates update creation
      if (isUpdateCreationPage(activeTab.title) || isUpdateCreationPage(activeTab.url)) {
        pageName = 'Пакет обновления';
      } else if (!isOriginalMode) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: extractPageNameInTab,
          });
          if (results && results[0] && typeof results[0].result === 'string') {
            const raw = results[0].result.trim();
            if (raw) {
              pageName = isUpdateCreationPage(raw) ? 'Пакет обновления' : sanitizeCleanName(raw);
            }
          }
        } catch (err) {
          console.warn('[GDHelper BG] Scripting onCreated error:', err);
        }
      }

      const sanitizedCardUrl = trimGreenDataUrl(activeTab.url);

      downloadMetaMap.set(item.id, {
        downloadId: item.id,
        tabId: activeTab.id,
        tabUrl: sanitizedCardUrl || undefined,
        pageName,
        createdAt: Date.now(),
      });
    }
  } catch (err) {
    console.warn('[GDHelper BG] onCreated error:', err);
  }
});

chrome.downloads.onChanged.addListener(async (delta) => {
  // Only react to completed downloads
  if (!delta.state || delta.state.current !== 'complete') return;

  const downloadId = delta.id;
  if (ignoredDownloadIds.has(downloadId)) {
    ignoredDownloadIds.delete(downloadId);
    return;
  }

  if (processedDownloads.has(downloadId)) return;

  try {
    // Get full download info
    const items = await chrome.downloads.search({ id: downloadId });
    if (!items || items.length === 0) return;

    const item = items[0];

    // Exclude downloads from our own extension
    if (isInternalExtensionDownload(item)) {
      return;
    }

    const fullPath = item.filename || '';
    const filename = fullPath.replace(/\\/g, '/').split('/').pop() || '';

    // Only process .guf files
    if (!filename.toLowerCase().endsWith('.guf')) return;

    // Check if registered by side panel UI recently
    const lowerName = filename.toLowerCase().trim();
    const regTime = recentInternalDownloads.get(lowerName);
    if (regTime && Date.now() - regTime < 20000) {
      recentInternalDownloads.delete(lowerName);
      return;
    }

    // Check if auto-collect is enabled
    let isOriginalMode = false;
    try {
      const stored = await chrome.storage.local.get([AUTO_COLLECT_KEY, AUTO_COLLECT_MODE_KEY]);
      const isEnabled = stored[AUTO_COLLECT_KEY] === true;
      if (!isEnabled) return;
      isOriginalMode = stored[AUTO_COLLECT_MODE_KEY] === 'original';
    } catch {
      return;
    }

    processedDownloads.add(downloadId);

    // Retrieve or extract page name & tab URL
    let pageName: string | undefined = undefined;
    let tabUrl: string | undefined = downloadMetaMap.get(downloadId)?.tabUrl;

    if (!tabUrl) {
      try {
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        const activeTab = tabs[0] || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
        if (activeTab?.url && !activeTab.url.startsWith('chrome://') && !activeTab.url.startsWith('edge://')) {
          const trimmed = trimGreenDataUrl(activeTab.url);
          tabUrl = trimmed || undefined;
        }
      } catch {
        // ignore
      }
    }

    if (isUpdateCreationPage(tabUrl)) {
      pageName = 'Пакет обновления';
    } else if (!isOriginalMode) {
      pageName = downloadMetaMap.get(downloadId)?.pageName;

      if (!pageName) {
        try {
          let targetTabId: number | undefined = downloadMetaMap.get(downloadId)?.tabId;
          if (!targetTabId) {
            const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            const activeTab = tabs[0] || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
            if (activeTab?.id && activeTab.url && !activeTab.url.startsWith('chrome://') && !activeTab.url.startsWith('edge://')) {
              targetTabId = activeTab.id;
            }
          }

          if (targetTabId) {
            const results = await chrome.scripting.executeScript({
              target: { tabId: targetTabId },
              func: extractPageNameInTab,
            });
            if (results && results[0] && typeof results[0].result === 'string') {
              const raw = results[0].result.trim();
              if (raw) {
                pageName = isUpdateCreationPage(raw) ? 'Пакет обновления' : sanitizeCleanName(raw);
              }
            }
          }
        } catch (err) {
          console.warn('[GDHelper BG] Fallback scripting error:', err);
        }
      }
    }

    if (isUpdateCreationPage(pageName)) {
      pageName = 'Пакет обновления';
    }

    const downloadUrl = item.url || '';
    const finalUrl = item.finalUrl || item.url || '';

    // Send message to side panel
    chrome.runtime.sendMessage({
      type: 'GUF_DOWNLOAD_COMPLETE',
      payload: {
        downloadId,
        filename,
        url: finalUrl || downloadUrl,
        tabUrl,
        mime: item.mime || 'application/octet-stream',
        pageName,
      },
    }).catch(() => {
      // Side panel may not be open — store in pending queue
      storePendingDownload({
        downloadId,
        filename,
        url: finalUrl || downloadUrl,
        tabUrl,
        pageName,
      });
    });

    // Clean up old entries from downloadMetaMap (older than 10 mins)
    const now = Date.now();
    for (const [id, meta] of downloadMetaMap.entries()) {
      if (now - meta.createdAt > 600000) {
        downloadMetaMap.delete(id);
      }
    }
  } catch (err) {
    console.warn('[GDHelper BG] AutoCollector error:', err);
  }
});

// Store pending downloads for when side panel opens
async function storePendingDownload(info: {
  downloadId: number;
  filename: string;
  url: string;
  tabUrl?: string;
  pageName?: string;
}) {
  try {
    const stored = await chrome.storage.local.get(['gd_pending_guf_downloads']);
    const pending: typeof info[] = stored.gd_pending_guf_downloads || [];
    // Keep only last 20 to avoid stale entries
    const next = [info, ...pending].slice(0, 20);
    await chrome.storage.local.set({ gd_pending_guf_downloads: next });
  } catch {
    // ignore
  }
}

