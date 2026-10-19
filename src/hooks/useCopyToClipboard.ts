import { useCallback, useEffect, useRef, useState } from 'react';
import { createElement } from 'react';
import { AlertTriangle } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { useToast } from './useToast';

/**
 * Копирование с обратной связью: `copiedKey` держит ключ скопированного
 * (для галочки «Скопировано» на нужной кнопке) `resetMs` миллисекунд.
 * При ошибке показывает уведомление.
 */
export function useCopyToClipboard(resetMs = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useToast();

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const copy = useCallback(
    async (text: string, key = 'default'): Promise<boolean> => {
      const ok = await copyToClipboard(text);
      if (ok) {
        setCopiedKey(key);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopiedKey(null), resetMs);
      } else {
        toast.show({
          tone: 'danger',
          icon: createElement(AlertTriangle),
          title: 'Не удалось скопировать',
          detail: 'Буфер обмена недоступен — выделите текст вручную',
        });
      }
      return ok;
    },
    [resetMs, toast]
  );

  return {
    copy,
    copiedKey,
    /** true, если только что скопировано (ключ по умолчанию или указанный) */
    isCopied: (key = 'default') => copiedKey === key,
  };
}
