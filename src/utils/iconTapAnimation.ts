/**
 * Анимация иконки при нажатии (iOS SF Symbols «symbol effect»).
 *
 * Один глобальный слушатель pointerdown: находит нажатую кнопку, берёт её
 * lucide-иконку и проигрывает эффект по смыслу иконки — «обновить» крутится,
 * «удалить» трясётся, «добавить/скачать» подпрыгивает, остальные пружинят.
 * Переопределить эффект можно атрибутом data-icon-anim="spin|shake|bounce|pop|wiggle|none".
 */

type IconTapEffect = 'pop' | 'spin' | 'shake' | 'bounce' | 'wiggle';

const EFFECT_CLASSES: IconTapEffect[] = ['pop', 'spin', 'shake', 'bounce', 'wiggle'];

// Сопоставление по имени иконки lucide (класс `lucide-<name>`)
const EFFECT_RULES: Array<[RegExp, IconTapEffect]> = [
  [/refresh|rotate|loader|settings|cog|repeat|history/, 'spin'],
  [/trash|eraser|^x$|circle-x|ban|alert/, 'shake'],
  [/plus|download|upload|import|arrow-down|arrow-up|folder-plus|file-plus|send/, 'bounce'],
  [/bell|zap|sparkle|wand|bot/, 'wiggle'],
];

function pickEffect(button: HTMLElement, svg: SVGElement): IconTapEffect | null {
  const forced = button.dataset.iconAnim;
  if (forced === 'none') return null;
  if (forced && (EFFECT_CLASSES as string[]).includes(forced)) return forced as IconTapEffect;

  const iconClass = Array.from(svg.classList).find((c) => c.startsWith('lucide-')) || '';
  const name = iconClass.slice('lucide-'.length);
  for (const [pattern, effect] of EFFECT_RULES) {
    if (pattern.test(name)) return effect;
  }
  return 'pop';
}

function playEffect(svg: SVGElement, effect: IconTapEffect): void {
  EFFECT_CLASSES.forEach((e) => svg.classList.remove(`gd-icon-tap-${e}`));
  // Принудительный reflow, чтобы анимация перезапускалась при повторном нажатии
  void svg.getBoundingClientRect();
  svg.classList.add(`gd-icon-tap-${effect}`);
  svg.addEventListener(
    'animationend',
    () => svg.classList.remove(`gd-icon-tap-${effect}`),
    { once: true }
  );
}

let installed = false;

export function installIconTapAnimation(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

      const target = event.target as Element | null;
      const button = target?.closest<HTMLElement>('button:not(:disabled), [role="button"], a');
      if (!button) return;

      const svg = button.querySelector<SVGElement>('svg.lucide');
      if (!svg) return;

      const effect = pickEffect(button, svg);
      if (effect) playEffect(svg, effect);
    },
    { passive: true }
  );
}
