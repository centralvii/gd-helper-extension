import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastMsg } from '../components/ui/Toast';

const MAX = 2;
const TTL = 2800;

/** Тосты: одинаковые схлопываются (таймер обновляется), одновременно не больше двух. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const notify = useCallback((text: string, error?: boolean) => {
    const key = `${error ? 'e' : 'o'}:${text}`;
    clearTimeout(timers.current.get(key));
    setToasts((t) => [...t.filter((x) => x.key !== key), { id: Date.now() + Math.random(), key, text, error }].slice(-MAX));
    timers.current.set(key, setTimeout(() => {
      timers.current.delete(key);
      setToasts((t) => t.filter((x) => x.key !== key));
    }, TTL));
  }, []);

  useEffect(() => {
    const m = timers.current;
    return () => m.forEach(clearTimeout);
  }, []);

  return { toasts, notify };
}
