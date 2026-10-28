import { useEffect } from 'react';

/** Ставит html[data-input="key"|"pointer"]: рамка фокуса видна только при управлении с клавиатуры. */
export function useInputModality() {
  useEffect(() => {
    const root = document.documentElement;
    const set = (v: string) => root.dataset.input !== v && (root.dataset.input = v);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Escape' || e.key === ' ') set('key');
    };
    const onPointer = () => set('pointer');
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointer, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointer, true);
    };
  }, []);
}
