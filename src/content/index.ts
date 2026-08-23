/**
 * GDHelper Content Script
 * Automatically injects enabled custom CSS rules on matched websites in real-time.
 * Listens to chrome.storage.onChanged for instant zero-latency updates.
 */

// Helper to check if current URL matches a rule pattern
function urlMatchesPattern(url: string, pattern: string): boolean {
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

    // Direct domain or substring match (e.g. "expo.greendatasoft.ru" or "greendatasoft")
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

interface SiteCssRule {
  id: string;
  name: string;
  urlPattern: string;
  css: string;
  isEnabled: boolean;
}

// Function to apply or remove a style element in the document
function applyRuleToDom(rule: SiteCssRule, currentUrl: string) {
  const styleId = `gd-helper-css-${rule.id}`;
  const isMatch = rule.isEnabled && urlMatchesPattern(currentUrl, rule.urlPattern);

  if (isMatch && rule.css && rule.css.trim()) {
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.setAttribute('data-source', 'GDHelper');
      styleEl.setAttribute('data-rule-name', rule.name || 'Custom CSS');
      (document.head || document.documentElement || document.body).appendChild(styleEl);
    }
    styleEl.textContent = rule.css;
  } else {
    const existing = document.getElementById(styleId);
    if (existing) {
      existing.remove();
    }
  }
}

// Sync all rules from storage
async function syncAllRules() {
  const currentUrl = window.location.href;
  if (!currentUrl) return;

  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(['siteCssRules']);
      const rules: SiteCssRule[] = data.siteCssRules || [];
      for (const rule of rules) {
        applyRuleToDom(rule, currentUrl);
      }
    }
  } catch (err) {
    console.warn('[GDHelper Content Script] Error syncing rules:', err);
  }
}

// 1. Run immediately on load (document_start)
syncAllRules();

// 2. Also run on DOMContentLoaded and window load to make sure head/body are ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => syncAllRules());
}
window.addEventListener('load', () => syncAllRules());

// 3. Listen for real-time changes to chrome.storage.local
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.siteCssRules) {
      const currentUrl = window.location.href;
      const newRules: SiteCssRule[] = changes.siteCssRules.newValue || [];
      const oldRules: SiteCssRule[] = changes.siteCssRules.oldValue || [];

      // Remove deleted rules
      for (const oldRule of oldRules) {
        if (!newRules.some((r) => r.id === oldRule.id)) {
          const el = document.getElementById(`gd-helper-css-${oldRule.id}`);
          if (el) el.remove();
        }
      }

      // Apply new/updated rules
      for (const rule of newRules) {
        applyRuleToDom(rule, currentUrl);
      }
    }
  });
}

// 4. Listen for direct runtime messages
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && (message.type === 'SYNC_ALL_SITE_CSS' || message.type === 'APPLY_SITE_CSS')) {
      syncAllRules();
      sendResponse({ status: 'ok', url: window.location.href });
    }
  });
}
