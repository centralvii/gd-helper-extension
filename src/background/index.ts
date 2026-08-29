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
