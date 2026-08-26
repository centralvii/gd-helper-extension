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

// ── Auto-Collector: .guf download watcher ────────────────────────────────────
// chrome.downloads.onChanged MUST be in the background service worker —
// it does NOT fire in side panel / content scripts.

const AUTO_COLLECT_KEY = 'gd-helper-auto-collect-enabled';
const processedDownloads = new Set<number>();

chrome.downloads.onChanged.addListener(async (delta) => {
  // Only react to completed downloads
  if (!delta.state || delta.state.current !== 'complete') return;

  // Check if auto-collect is enabled
  try {
    const stored = await chrome.storage.local.get([AUTO_COLLECT_KEY]);
    const isEnabled = stored[AUTO_COLLECT_KEY] === true;
    if (!isEnabled) return;
  } catch {
    return;
  }

  const downloadId = delta.id;
  if (processedDownloads.has(downloadId)) return;

  try {
    // Get full download info
    const items = await chrome.downloads.search({ id: downloadId });
    if (!items || items.length === 0) return;

    const item = items[0];
    const fullPath = item.filename || '';
    const filename = fullPath.replace(/\\/g, '/').split('/').pop() || '';

    // Only process .guf files
    if (!filename.toLowerCase().endsWith('.guf')) return;

    processedDownloads.add(downloadId);

    // Read the file content using XMLHttpRequest with the file:// path
    // Background SW cannot use fetch() for file:// URLs, so we use chrome.downloads.search
    // and send the download item info to the side panel which can fetch it.

    // Strategy: send a message to all side panel ports / runtime with the download info.
    // The side panel will fetch the blob URL (item.url is still valid as a blob: URL if it was blob:).
    // If it was a regular https:// URL, we can re-fetch it.

    const downloadUrl = item.url || '';
    const finalUrl = item.finalUrl || item.url || '';

    // Send message to side panel
    chrome.runtime.sendMessage({
      type: 'GUF_DOWNLOAD_COMPLETE',
      payload: {
        downloadId,
        filename,
        url: finalUrl || downloadUrl,
        mime: item.mime || 'application/octet-stream',
      },
    }).catch(() => {
      // Side panel may not be open — store in pending queue
      storePendingDownload({ downloadId, filename, url: finalUrl || downloadUrl });
    });
  } catch (err) {
    console.warn('[GDHelper BG] AutoCollector error:', err);
  }
});

// Store pending downloads for when side panel opens
async function storePendingDownload(info: {
  downloadId: number;
  filename: string;
  url: string;
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

// ── CSS injection for Site CSS Styler ────────────────────────────────────────

export function urlMatchesPattern(url: string, pattern: string): boolean {
  if (!url || !pattern) return false;
  const p = pattern.trim().toLowerCase();
  if (p === '*' || p === '<all_urls>' || p === '') return true;

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();

    const internalSchemes = ['chrome:', 'chrome-extension:', 'about:', 'edge:', 'devtools:', 'view-source:'];
    if (internalSchemes.includes(parsedUrl.protocol)) {
      return false;
    }

    if (!p.includes('://') && !p.includes('*')) {
      return host === p || host.endsWith('.' + p) || fullUrl.includes(p);
    }

    if (!p.includes('://') && p.startsWith('*.')) {
      const baseDomain = p.slice(2);
      return host === baseDomain || host.endsWith('.' + baseDomain);
    }

    let cleanPattern = p;
    cleanPattern = cleanPattern.replace(/^\*:\/\//, 'https?://');
    if (cleanPattern.endsWith('/*')) {
      cleanPattern = cleanPattern.slice(0, -2);
      const regexStr = '^' + cleanPattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*') + '(?:\\/.*)?$';
      return new RegExp(regexStr, 'i').test(fullUrl);
    }

    const regexStr = '^' + cleanPattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*') + '$';
    return new RegExp(regexStr, 'i').test(fullUrl);
  } catch {
    return url.toLowerCase().includes(p);
  }
}

interface SiteCssRule {
  id: string;
  name: string;
  urlPattern: string;
  css: string;
  isEnabled: boolean;
}

let cachedRules: SiteCssRule[] = [];

// Initialize rules cache
chrome.storage.local.get(['siteCssRules'], (data) => {
  cachedRules = data.siteCssRules || [];
});

// Keep rules cache in sync
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.siteCssRules) {
    cachedRules = changes.siteCssRules.newValue || [];
  }
});

async function syncCssForTab(tabId: number, url: string) {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) return;
  if (!cachedRules || cachedRules.length === 0) return;
  if (typeof chrome === 'undefined' || !chrome.scripting) return;

  const activeMatchingRules = cachedRules.filter(
    (r) => r.isEnabled && !!r.css && r.css.trim() && urlMatchesPattern(url, r.urlPattern)
  );

  if (activeMatchingRules.length === 0) return;

  try {
    for (const rule of activeMatchingRules) {
      const styleId = `gd-css-${rule.id}`;
      try {
        await chrome.scripting.executeScript({
          target: { tabId, allFrames: false },
          func: (sId: string, cssText: string, ruleName: string) => {
            try {
              let el = document.getElementById(sId) as HTMLStyleElement | null;
              if (!el) {
                el = document.createElement('style');
                el.id = sId;
                el.setAttribute('data-source', 'GDHelper');
                el.setAttribute('data-rule-name', ruleName);
                (document.head || document.documentElement).appendChild(el);
              }
              if (el.textContent !== cssText) {
                el.textContent = cssText;
              }
            } catch { /* ignore */ }
          },
          args: [styleId, rule.css, rule.name || 'Custom CSS'],
        });
      } catch { /* restricted */ }
    }
  } catch (err) {
    console.warn('Error syncing CSS for tab:', err);
  }
}

// Only sync when a webpage has finished loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    syncCssForTab(tabId, tab.url);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && (message.type === 'SYNC_ALL_SITE_CSS' || message.type === 'APPLY_SITE_CSS')) {
    chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, (tabs) => {
      for (const tab of tabs) {
        if (tab.id && tab.url) {
          syncCssForTab(tab.id, tab.url);
        }
      }
      sendResponse({ status: 'ok' });
    });
    return true;
  }
});
