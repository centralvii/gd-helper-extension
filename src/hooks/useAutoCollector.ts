import { useState, useEffect, useCallback, useRef } from 'react';

const AUTO_COLLECT_STORAGE_KEY = 'gd-helper-auto-collect-enabled';

interface UseAutoCollectorProps {
  onFileCollected: (file: File) => void;
}

export function useAutoCollector({ onFileCollected }: UseAutoCollectorProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_COLLECT_STORAGE_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [notification, setNotification] = useState<{
    id: string;
    fileName: string;
    timestamp: number;
  } | null>(null);

  const processedDownloadIdsRef = useRef<Set<number>>(new Set());
  const onFileCollectedRef = useRef(onFileCollected);
  onFileCollectedRef.current = onFileCollected;

  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AUTO_COLLECT_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    if (typeof chrome === 'undefined' || !chrome.downloads || !chrome.downloads.onChanged) {
      return;
    }

    const handleDownloadChange = async (delta: chrome.downloads.DownloadDelta) => {
      // Check if download completed
      if (delta.state && delta.state.current === 'complete') {
        const downloadId = delta.id;
        if (processedDownloadIdsRef.current.has(downloadId)) {
          return;
        }

        try {
          const items = await chrome.downloads.search({ id: downloadId });
          if (!items || items.length === 0) return;

          const item = items[0];
          const fullPath = item.filename || '';
          const filename = fullPath.split(/[/\\]/).pop() || 'downloaded.guf';

          if (!filename.toLowerCase().endsWith('.guf')) {
            return;
          }

          processedDownloadIdsRef.current.add(downloadId);

          // Attempt to fetch file blob from download URL
          const downloadUrl = item.finalUrl || item.url;
          if (!downloadUrl) return;

          const response = await fetch(downloadUrl);
          if (!response.ok) {
            console.warn(`Could not fetch downloaded file (${response.statusText}):`, downloadUrl);
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

          // Auto dismiss notification after 4s
          setTimeout(() => {
            setNotification((curr) => (curr?.fileName === filename ? null : curr));
          }, 4000);
        } catch (err) {
          console.warn('AutoCollector error processing download:', err);
        }
      }
    };

    chrome.downloads.onChanged.addListener(handleDownloadChange);

    return () => {
      chrome.downloads.onChanged.removeListener(handleDownloadChange);
    };
  }, [isEnabled]);

  return {
    isEnabled,
    toggleEnabled,
    notification,
    clearNotification,
  };
}
