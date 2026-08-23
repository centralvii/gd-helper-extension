/**
 * GDHelper Extension Background Service Worker
 * Configures Side Panel behavior for Chrome Manifest V3
 */

// Open side panel when the action (toolbar icon) is clicked
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
      console.error('Error setting panel behavior:', error);
    });
  }
  console.log('GDHelper Extension installed successfully.');
});

// Fallback click handler if setPanelBehavior is not supported
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open && tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn('Could not open sidePanel directly:', err);
    }
  }
});

// Helper: match URL against rule pattern
function urlMatchesPattern(url: string, pattern: string): boolean {
  if (!url || !pattern) return false;
  const p = pattern.trim();
  if (p === '*' || p === '<all_urls>') return true;

  try {
    const parsedUrl = new URL(url);
    // Ignore internal chrome pages
    if (parsedUrl.protocol === 'chrome:' || parsedUrl.protocol === 'chrome-extension:' || parsedUrl.protocol === 'about:') {
      return false;
    }

    // Direct domain or substring match
    if (!p.includes('*') && !p.includes('://')) {
      return parsedUrl.hostname.toLowerCase().includes(p.toLowerCase()) || url.toLowerCase().includes(p.toLowerCase());
    }

    // Convert wildcard pattern to RegExp
    const regexStr = '^' + p
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape special regex chars except *
      .replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexStr, 'i');
    return regex.test(url);
  } catch {
    return url.toLowerCase().includes(p.toLowerCase());
  }
}

// Inject or remove CSS for a single tab
async function syncCssForTab(tabId: number, url: string) {
  if (!url || typeof chrome === 'undefined' || !chrome.scripting) return;

  try {
    const data = await chrome.storage.local.get(['siteCssRules']);
    const rules: Array<{ id: string; urlPattern: string; css: string; isEnabled: boolean }> = data.siteCssRules || [];

    for (const rule of rules) {
      if (!rule.css || !rule.css.trim()) continue;

      const isMatch = rule.isEnabled && urlMatchesPattern(url, rule.urlPattern);

      if (isMatch) {
        try {
          await chrome.scripting.insertCSS({
            target: { tabId },
            css: rule.css,
          });
        } catch (err) {
          // May fail on restricted pages
        }
      } else {
        try {
          await chrome.scripting.removeCSS({
            target: { tabId },
            css: rule.css,
          });
        } catch (err) {
          // Ignore if not previously injected
        }
      }
    }
  } catch (err) {
    console.warn('Error syncing CSS for tab:', err);
  }
}

// Listen for tab updates to inject matching CSS
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    syncCssForTab(tabId, tab.url);
  }
});

// Listen for messages from Side Panel to sync all open tabs
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === 'SYNC_ALL_SITE_CSS') {
    chrome.tabs.query({}, (tabs) => {
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
