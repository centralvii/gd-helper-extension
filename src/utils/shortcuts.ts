import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

/** true на macOS — для подписи клавиш (⌘ вместо Ctrl) */
export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

/** Подпись модификатора для подсказок: «⌘» на macOS, «Ctrl» иначе */
export const MOD_KEY_LABEL = IS_MAC ? '⌘' : 'Ctrl';

/** Нажат ли основной модификатор (⌘ на macOS, Ctrl иначе) */
export const isModKey = (e: KeyboardEvent | ReactKeyboardEvent): boolean => (IS_MAC ? e.metaKey : e.ctrlKey);
