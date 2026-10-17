import { useEffect } from 'react';
import { ActiveTool } from '../types';
import { isModKey } from '../utils/shortcuts';

const TOOL_BY_DIGIT: Record<string, ActiveTool> = {
  '1': 'packer',
  '2': 'implementation',
  '3': 'youtrack',
  '4': 'extra',
};

/**
 * Глобальные сочетания клавиш боковой панели:
 * Ctrl/⌘ + K — командная палитра; Alt + 1…4 — переключение разделов
 * (Ctrl + цифра Chrome забирает под переключение вкладок браузера).
 */
export function usePaletteShortcuts(onTogglePalette: () => void, onSelectTool: (tool: ActiveTool) => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isModKey(e) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onTogglePalette();
        return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const digit = e.code.startsWith('Digit') ? e.code.slice(5) : '';
        const tool = TOOL_BY_DIGIT[digit];
        if (tool) {
          e.preventDefault();
          onSelectTool(tool);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onTogglePalette, onSelectTool]);
}
