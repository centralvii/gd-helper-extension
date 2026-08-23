/**
 * useAutoCollector
 *
 * Architecture fix: .guf download detection happens in the background service worker
 * (chrome.downloads.onChanged is NOT available in side panel contexts).
 *
 * This hook:
 *  1. Stores the isEnabled flag in chrome.storage.local so the background can read it.
 *  2. Listens for the 'GUF_DOWNLOAD_COMPLETE' message from the background worker.
 *  3. Fetches the file blob from the provided URL and calls onFileCollected.
 *  4. On mount, checks for any pending downloads the background stored while panel was closed.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const AUTO_COLLECT_STORAGE_KEY = 'gd-helper-auto-collect-enabled';
const PENDING_DOWNLOADS_KEY = 'gd_pending_guf_downloads';

interface UseAutoCollectorProps {
  onFileCollected: (file: File) => void;
}

interface PendingDownload {
  downloadId: number;
  filename: string;
  url: string;
}

export function useAutoCollector({ onFileCollected }: UseAutoCollectorProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    id: string;
    fileName: string;
    timestamp: number;
  } | null>(null);

  const processedIdsRef = useRef<Set<number>>(new Set());
  const onFileCollectedRef = useRef(onFileCollected);
  onFileCollectedRef.current = onFileCollected;

  // ── Load initial enabled state from chrome.storage ──
  useEffect(() => {
    const load = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          const res = await chrome.storage.local.get([AUTO_COLLECT_STORAGE_KEY]);
          setIsEnabled(res[AUTO_COLLECT_STORAGE_KEY] === true);
        } else {
          // Dev fallback
          const saved = localStorage.getItem(AUTO_COLLECT_STORAGE_KEY);
          setIsEnabled(saved === 'true');
        }
      } catch {
        setIsEnabled(false);
      }
    };
    load();
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          // Save to chrome.storage so background SW can read it
          chrome.storage.local.set({ [AUTO_COLLECT_STORAGE_KEY]: next });
        } else {
          localStorage.setItem(AUTO_COLLECT_STORAGE_KEY, String(next));
        }
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // ── Process a downloaded .guf file by URL ──
  const processGufDownload = useCallback(async (payload: PendingDownload) => {
    const { downloadId, filename, url } = payload;

    if (processedIdsRef.current.has(downloadId)) return;
    processedIdsRef.current.add(downloadId);

    try {
      // Fetch the file blob
      // blob: URLs are still accessible in extension context
      // https: URLs require no special permission
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[AutoCollector] Failed to fetch: ${url} (${response.status})`);
        return;
      }

      const blob = await response.blob();
      const file = new File([blob], filename, {
        type: blob.type || 'application/octet-stream',
        lastModified: Date.now(),
      });

      onFileCollectedRef.current(file);

      setNotification({
        id: crypto.randomUUID(),
        fileName: filename,
        timestamp: Date.now(),
      });

      // Auto-dismiss after 4s
      setTimeout(() => {
        setNotification((curr) =>
          curr && curr.fileName === filename ? null : curr
        );
      }, 4000);
    } catch (err) {
      console.warn('[AutoCollector] Error fetching downloaded file:', err);
    }
  }, []);

  // ── Listen for background messages ──
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) return;

    const handler = (
      message: { type: string; payload?: PendingDownload },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (r: unknown) => void,
    ) => {
      if (message?.type === 'GUF_DOWNLOAD_COMPLETE' && message.payload) {
        // Only handle if auto-collect is enabled
        // Read from ref to avoid stale closure
        if (isEnabledRef.current) {
          processGufDownload(message.payload);
        }
        sendResponse({ ok: true });
      }
      return false;
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [processGufDownload]);

  // Ref for isEnabled to avoid stale closure in message handler
  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;

  // ── On mount: drain pending downloads stored while panel was closed ──
  useEffect(() => {
    const drainPending = async () => {
      if (!isEnabled) return;
      if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

      try {
        const stored = await chrome.storage.local.get([PENDING_DOWNLOADS_KEY]);
        const pending: PendingDownload[] = stored[PENDING_DOWNLOADS_KEY] || [];
        if (pending.length === 0) return;

        // Clear the queue first to prevent double-processing
        await chrome.storage.local.set({ [PENDING_DOWNLOADS_KEY]: [] });

        for (const item of pending) {
          // Process one by one with small delay to avoid overwhelming
          await processGufDownload(item);
          await new Promise((r) => setTimeout(r, 200));
        }
      } catch (err) {
        console.warn('[AutoCollector] Error draining pending downloads:', err);
      }
    };

    drainPending();
  }, [isEnabled, processGufDownload]);

  return {
    isEnabled,
    toggleEnabled,
    notification,
    clearNotification,
  };
}
