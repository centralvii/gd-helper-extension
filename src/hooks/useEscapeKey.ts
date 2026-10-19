import { useEffect, useRef } from 'react';

/**
 * Закрытие по Esc (меню «⋯», выпадающие списки, inline-редакторы).
 * Событие помечается обработанным (preventDefault), чтобы шторка под меню не закрылась.
 */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  const handlerRef = useRef(onEscape);
  handlerRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      handlerRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);
}
