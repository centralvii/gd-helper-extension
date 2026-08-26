/**
 * GDHelper Content Script v2
 * Injects custom CSS rules into web pages.
 * Runs at document_start and re-applies on DOMContentLoaded + load.
 * Listens to chrome.storage.onChanged for real-time updates without page reload.
 */

function urlMatchesPattern(url: string, pattern: string): boolean {
  if (!url || !pattern) return false;
  const p = pattern.trim().toLowerCase();
  if (p === '*' || p === '<all_urls>' || p === '') return true;

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();

    // Ignore browser-internal pages
    const internalSchemes = ['chrome:', 'chrome-extension:', 'about:', 'edge:', 'devtools:', 'view-source:', 'data:'];
    if (internalSchemes.some(s => parsedUrl.protocol === s || parsedUrl.protocol.startsWith(s))) {
      return false;
    }

    // Plain domain or substring match: "expo.greendatasoft.ru" or "greendata"
    if (!p.includes('://') && !p.includes('*')) {
      return host === p || host.endsWith('.' + p) || fullUrl.includes(p);
    }

    // Wildcard domain: "*.greendatasoft.ru"
    if (!p.includes('://') && p.startsWith('*.')) {
      const base = p.slice(2);
      return host === base || host.endsWith('.' + base);
    }

    // Full Chrome match pattern: "*://expo.greendatasoft.ru/*"
    let clean = p.replace(/^\*:\/\//, '');  // strip *://
    const isHttpPattern = !clean.startsWith('http');

    let regexStr = '^https?:\\/\\/' + (isHttpPattern ? '' : '') +
      clean
        .replace(/^https?:\/\//, '')
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');

    if (regexStr.endsWith('\\/\\*') || regexStr.endsWith('.*')) {
      // Already has wildcard path
      regexStr = regexStr.replace(/\\\.\*$/, '(?:\\/.*)?').replace(/\\\\/g, '/') + '$';
    }

    return new RegExp(regexStr, 'i').test(fullUrl);
  } catch {
    return url.toLowerCase().includes(pattern.trim().toLowerCase());
  }
}

interface SiteCssRule {
  id: string;
  name: string;
  urlPattern: string;
  css: string;
  isEnabled: boolean;
}

/**
 * Inject or remove a <style> tag for this rule.
 * Always uses the existing element if present (idempotent).
 */
function applyRuleToDom(rule: SiteCssRule, currentUrl: string): void {
  const styleId = `gd-helper-css-${rule.id}`;
  const shouldApply = rule.isEnabled && !!(rule.css && rule.css.trim()) && urlMatchesPattern(currentUrl, rule.urlPattern);

  if (shouldApply) {
    // Find or create the style element
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.setAttribute('data-source', 'GDHelper');
      styleEl.setAttribute('data-rule', rule.name || 'custom');
      // Append to head if available, else documentElement
      const target = document.head || document.documentElement;
      if (target) {
        target.appendChild(styleEl);
      } else {
        // documentElement may also be null at document_start — observe for it
        return;
      }
    }
    if (styleEl.textContent !== rule.css) {
      styleEl.textContent = rule.css;
    }
  } else {
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();
  }
}

let _rules: SiteCssRule[] = [];

function applyAllRules(): void {
  const currentUrl = window.location.href;
  for (const rule of _rules) {
    applyRuleToDom(rule, currentUrl);
  }
}

async function loadAndApply(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(['siteCssRules']);
      _rules = data.siteCssRules || [];
      applyAllRules();
    }
  } catch (err) {
    // Silently fail on restricted pages
  }
}

// ── 1. Run immediately (may be before <head> exists) ──
loadAndApply();

// ── 2. Re-apply once DOM is interactive ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndApply, { once: true });
} else {
  // Already interactive or complete
  loadAndApply();
}

// ── 3. Re-apply once fully loaded (images, etc.) ──
window.addEventListener('load', loadAndApply, { once: true });

// ── 4. If <head> does not exist yet at document_start, wait for it with a shallow observer ──
if (typeof MutationObserver !== 'undefined' && !document.head) {
  const headObserver = new MutationObserver(() => {
    if (document.head) {
      headObserver.disconnect();
      if (_rules.length > 0) {
        applyAllRules();
      }
    }
  });
  if (document.documentElement) {
    headObserver.observe(document.documentElement, { childList: true });
  }
}

// ── 5. Real-time: listen to chrome.storage.onChanged ──
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.siteCssRules) return;

    const currentUrl = window.location.href;
    const newRules: SiteCssRule[] = changes.siteCssRules.newValue || [];
    const oldRules: SiteCssRule[] = changes.siteCssRules.oldValue || [];

    // Remove styles for deleted rules
    for (const old of oldRules) {
      if (!newRules.find(r => r.id === old.id)) {
        const el = document.getElementById(`gd-helper-css-${old.id}`);
        if (el) el.remove();
      }
    }

    _rules = newRules;

    // Apply updated rules
    for (const rule of newRules) {
      applyRuleToDom(rule, currentUrl);
    }
  });
}

// ── 6. Respond to background script messages ──
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && (message.type === 'SYNC_ALL_SITE_CSS' || message.type === 'APPLY_SITE_CSS')) {
      loadAndApply().then(() => {
        sendResponse({ status: 'ok', url: window.location.href });
      });
      return true; // keep channel open for async sendResponse
    }
  });
}
