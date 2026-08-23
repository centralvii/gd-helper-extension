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
export function urlMatchesPattern(url: string, pattern: string): boolean {
  if (!url || !pattern) return false;
  const p = pattern.trim().toLowerCase();
  if (p === '*' || p === '<all_urls>' || p === '') return true;

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();

    // Ignore browser internal schemes
    if (['chrome:', 'chrome-extension:', 'about:', 'edge:', 'devtools:', 'view-source:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Direct domain or substring match (e.g. "expo.greendatasoft.ru" or "greendata")
    if (!p.includes('://') && !p.includes('*')) {
      return host === p || host.endsWith('.' + p) || fullUrl.includes(p);
    }

    // Wildcard domain match (e.g. "*.greendatasoft.ru")
    if (!p.includes('://') && p.startsWith('*.')) {
      const baseDomain = p.slice(2);
      return host === baseDomain || host.endsWith('.' + baseDomain);
    }

    // Convert Chrome match pattern e.g. "*://expo.greendatasoft.ru/*"
    let cleanPattern = p;
    // Normalize *:// to match http or https
    cleanPattern = cleanPattern.replace(/^\*:\/\//, 'https?://');
    // If ends with /*, match with or without path
    if (cleanPattern.endsWith('/*')) {
      cleanPattern = cleanPattern.slice(0, -2);
      const regexStr = '^' + cleanPattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*') + '(?:\/.*)?$';
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

// Inject or remove CSS for a single tab
async function syncCssForTab(tabId: number, url: string) {
  if (!url || typeof chrome === 'undefined' || !chrome.scripting) return;

  try {
    const data = await chrome.storage.local.get(['siteCssRules']);
    const rules: Array<{ id: string; name: string; urlPattern: string; css: string; isEnabled: boolean }> = data.siteCssRules || [];

    for (const rule of rules) {
      if (!rule.css || !rule.css.trim()) continue;

      const isMatch = rule.isEnabled && urlMatchesPattern(url, rule.urlPattern);
      const styleId = `gd-css-${rule.id}`;

      if (isMatch) {
        // 1. Try native user stylesheet injection
        try {
          await chrome.scripting.insertCSS({
            target: { tabId, allFrames: true },
            css: rule.css,
            origin: 'USER',
          });
        } catch {
          // Ignore if permission or restricted frame
        }

        // 2. Also inject DOM <style> tag for 100% guarantee & visibility in DevTools Elements
        try {
          await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
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
                el.textContent = cssText;
              } catch (e) {
                // ignore
              }
            },
            args: [styleId, rule.css, rule.name || 'Custom CSS'],
          });
        } catch {
          // May fail on restricted pages
        }
      } else {
        // 1. Remove native insertCSS
        try {
          await chrome.scripting.removeCSS({
            target: { tabId, allFrames: true },
            css: rule.css,
            origin: 'USER',
          });
        } catch {
          // Ignore
        }

        // 2. Remove DOM <style> tag
        try {
          await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            func: (sId: string) => {
              try {
                const el = document.getElementById(sId);
                if (el) el.remove();
              } catch (e) {
                // ignore
              }
            },
            args: [styleId],
          });
        } catch {
          // Ignore
        }
      }
    }
  } catch (err) {
    console.warn('Error syncing CSS for tab:', err);
  }
}

// Listen for tab updates to inject matching CSS
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const currentUrl = tab.url || tab.pendingUrl;
  if ((changeInfo.status === 'complete' || changeInfo.status === 'loading') && currentUrl) {
    syncCssForTab(tabId, currentUrl);
  }
});

// Listen for messages from Side Panel to sync all open tabs
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && (message.type === 'SYNC_ALL_SITE_CSS' || message.type === 'APPLY_SITE_CSS')) {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        const url = tab.url || tab.pendingUrl;
        if (tab.id && url) {
          syncCssForTab(tab.id, url);
        }
      }
      sendResponse({ status: 'ok' });
    });
    return true;
  }
});
