import { YouTrackIssue } from '../types';
import { getErrorMessage } from './errorUtils';

export interface GreenDataTaskFillResult {
  success: boolean;
  message: string;
  filled: {
    tfs: string;
    yt: string;
    name: string;
  };
  missingFields?: string[];
  moduleStatus?: GreenDataModuleStatus;
}

/**
 * Extracts TFS number from issue summary.
 * For example: "FINAPP-8269 - Ошибка при заполнении критериев/факторов на СФМ KYC"
 * extracts "FINAPP-8269".
 */
export function extractTfsNumberFromSummary(summary: string): string {
  if (!summary) return '';
  const trimmed = summary.trim();

  // 1. Look for standard patterns like FINAPP-8269, US-1234, BP-567, EXP-9999 at the beginning or in brackets/spaces
  const match = trimmed.match(/(?:^|[\s\[(])([A-Za-zА-Яа-я0-9_-]+-\d+)(?:[\s\]):—-]|$)/);
  if (match && match[1]) {
    return match[1].trim();
  }

  // 2. Fallback: match any prefix with dash and numbers
  const generalMatch = trimmed.match(/([a-zA-Zа-яА-Я0-9_-]+-\d+)/);
  if (generalMatch && generalMatch[1]) {
    return generalMatch[1].trim();
  }

  return '';
}

/**
 * Checks if the GreenData task creation modal window is currently active on the active Chrome tab.
 */
export async function checkGreenDataTaskModalActive(): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
    return false;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || !tab.url) return false;

    // Skip chrome:// or internal browser pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      return false;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => {
        // Look for GreenData task form control wrappers
        const hasTfs = Boolean(
          document.querySelector('[data-ident="TFS_STR"] input, [data-ident="TFS_STR"]')
        );
        const hasName = Boolean(
          document.querySelector(
            '[data-ident="NAME_TASK_STR"] textarea, [data-ident="NAME_TASK_STR"] input, [data-ident="NAME_TASK_STR"]'
          )
        );
        const hasYt = Boolean(
          document.querySelector('[data-ident="YT_STR"] input, [data-ident="YT_STR"]')
        );

        // Also check by label texts as fallback
        const labels = Array.from(document.querySelectorAll('label, .card-attr-label-container'));
        const hasTfsLabel = labels.some((l) => (l.textContent || '').includes('TFS (US/BP)'));
        const hasNameLabel = labels.some((l) => (l.textContent || '').includes('Наименование задачи'));

        return hasTfs || (hasYt && hasName) || (hasTfsLabel && hasNameLabel);
      },
    });

    if (results && Array.isArray(results)) {
      return results.some((r) => r.result === true);
    }
  } catch (e) {
    // Tab might be in restricted origin or executing navigation
  }

  return false;
}

/** Модуль, который выбирается в форме задачи GreenData при переносе из YouTrack */
export const GREENDATA_DEFAULT_MODULE = 'Финансовый модуль';

export type GreenDataModuleStatus = 'selected' | 'already' | 'field_not_found' | 'option_not_found';

/**
 * Injects YouTrack issue data into the active GreenData task creation modal on the active tab.
 *
 * Поля заполняются «как пользователь»: фокус → посимвольный ввод через
 * document.execCommand('insertText') (браузер генерирует доверенные события
 * beforeinput/input) с keydown/keypress/keyup → change → blur. Простая подмена
 * value не снимает красную подсветку обязательных полей: форма GreenData
 * отмечает поле заполненным только по реальному вводу и потере фокуса.
 * Затем в поле «Модуль» выбирается GREENDATA_DEFAULT_MODULE через его окно выбора.
 */
export async function injectYouTrackIntoGreenDataTask(
  issue: YouTrackIssue
): Promise<GreenDataTaskFillResult> {
  const tfsNumber = extractTfsNumberFromSummary(issue.summary);
  const ytGit = issue.id || '';
  const taskName = (issue.summary || '').trim();
  const filled = { tfs: tfsNumber, yt: ytGit, name: taskName };

  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
    return { success: false, message: 'Нет доступа к вкладкам браузера (chrome.tabs / chrome.scripting)', filled };
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      return { success: false, message: 'Активная вкладка браузера не найдена', filled };
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      args: [tfsNumber, ytGit, taskName, GREENDATA_DEFAULT_MODULE],
      func: async (tfsVal: string, ytVal: string, nameVal: string, moduleName: string) => {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const norm = (t: string | null | undefined) => (t || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const isVisible = (el: Element) => {
          const rect = (el as HTMLElement).getBoundingClientRect();
          const style = getComputedStyle(el as HTMLElement);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };

        type Field = HTMLInputElement | HTMLTextAreaElement;

        const setNativeValue = (el: Field, value: string) => {
          const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          if (setter) setter.call(el, value);
          else el.value = value;
        };

        const keyEvent = (el: Element, type: string, key: string) =>
          el.dispatchEvent(
            new KeyboardEvent(type, {
              key,
              code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
              bubbles: true,
              cancelable: true,
              composed: true,
            })
          );

        const focusField = (el: HTMLElement) => {
          el.scrollIntoView({ block: 'nearest' });
          el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          el.focus();
          // Если окно страницы не в фокусе (фокус в боковой панели), браузер не шлёт focus — шлём сами
          el.dispatchEvent(new FocusEvent('focus'));
          el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
          el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
          el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        };

        const blurField = (el: HTMLElement) => {
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.blur();
          el.dispatchEvent(new FocusEvent('blur'));
          el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        };

        /** Посимвольный «ручной» ввод значения в поле */
        const typeInto = async (el: Field, value: string) => {
          focusField(el);
          // Очистка текущего значения как пользователем: выделить всё → удалить
          if (el.value) {
            el.select();
            keyEvent(el, 'keydown', 'Delete');
            if (!document.execCommand('delete')) {
              setNativeValue(el, '');
              el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
            }
            keyEvent(el, 'keyup', 'Delete');
          }
          for (const ch of value) {
            keyEvent(el, 'keydown', ch);
            keyEvent(el, 'keypress', ch);
            const before = el.value;
            const inserted = document.activeElement === el && document.execCommand('insertText', false, ch);
            if (!inserted || el.value === before) {
              setNativeValue(el, before + ch);
              el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ch }));
            }
            keyEvent(el, 'keyup', ch);
          }
          await sleep(20);
          blurField(el);

          // Короткая подсветка заполненного поля в цвете расширения
          const prev = { bg: el.style.backgroundColor, sh: el.style.boxShadow, tr: el.style.transition };
          el.style.transition = 'background-color .3s ease, box-shadow .3s ease';
          el.style.backgroundColor = '#eef0ff';
          el.style.boxShadow = '0 0 0 2px rgba(79, 91, 213, 0.35)';
          setTimeout(() => {
            el.style.backgroundColor = prev.bg;
            el.style.boxShadow = prev.sh;
            el.style.transition = prev.tr;
          }, 1500);
          return el.value === value;
        };

        const wrappers = () => Array.from(document.querySelectorAll('.visual-group-attribute, .control-wrapper, [data-ident]'));

        const findWrapper = (ident: string, labelTest: (text: string) => boolean): Element | null => {
          const byIdent = document.querySelector(`[data-ident="${ident}"]`);
          if (byIdent) return byIdent;
          const labels = Array.from(document.querySelectorAll('label, .card-attr-label-container'));
          for (const l of labels) {
            if (labelTest(norm(l.textContent))) {
              const w = l.closest('.visual-group-attribute, .control-wrapper, [data-ident]') || l.parentElement;
              if (w) return w;
            }
          }
          return wrappers().find((w) => labelTest(norm(w.textContent))) || null;
        };

        const findField = (ident: string, labelTest: (text: string) => boolean): Field | null => {
          const w = findWrapper(ident, labelTest);
          return w ? w.querySelector<Field>('textarea, input:not([type=hidden]):not([type=checkbox])') : null;
        };

        const tfsInput = findField('TFS_STR', (t) => t.includes('tfs (us/bp)'));
        const ytInput = findField('YT_STR', (t) => t.includes('yt/git'));
        const nameInput = findField('NAME_TASK_STR', (t) => t.includes('наименование задачи'));

        if (!tfsInput && !ytInput && !nameInput) return { found: false };

        const missing: string[] = [];
        const notTyped: string[] = [];
        let filledCount = 0;

        const fields: Array<[Field | null, string, string]> = [
          [tfsInput, tfsVal, 'TFS (US/BP)'],
          [ytInput, ytVal, 'YT/Git'],
          [nameInput, nameVal, 'Наименование задачи'],
        ];
        for (const [el, val, label] of fields) {
          if (!el) {
            missing.push(label);
            continue;
          }
          if (!val) continue;
          if (await typeInto(el, val)) filledCount++;
          else notTyped.push(label);
          await sleep(40);
        }

        // ── Модуль: выбор значения через окно выбора ──
        const target = norm(moduleName);
        const clickLikeUser = (el: Element) => {
          const opts = { bubbles: true, cancelable: true, view: window };
          el.dispatchEvent(new PointerEvent('pointerdown', opts));
          el.dispatchEvent(new MouseEvent('mousedown', opts));
          el.dispatchEvent(new PointerEvent('pointerup', opts));
          el.dispatchEvent(new MouseEvent('mouseup', opts));
          el.dispatchEvent(new MouseEvent('click', opts));
        };
        const waitFor = async <T,>(fn: () => T | null | undefined, timeoutMs: number): Promise<T | null> => {
          const started = Date.now();
          while (Date.now() - started < timeoutMs) {
            const res = fn();
            if (res) return res;
            await sleep(100);
          }
          return null;
        };

        let moduleStatus: 'selected' | 'already' | 'field_not_found' | 'option_not_found' = 'field_not_found';
        const moduleWrapper = (() => {
          const byIdent = Array.from(document.querySelectorAll('[data-ident]')).find((el) =>
            /MODUL/i.test(el.getAttribute('data-ident') || '')
          );
          if (byIdent) return byIdent;
          return findWrapper('__none__', (t) => t.startsWith('модуль'));
        })();

        if (moduleWrapper) {
          const currentText = norm(
            moduleWrapper.textContent +
              ' ' +
              Array.from(moduleWrapper.querySelectorAll('input')).map((i) => i.value).join(' ')
          );
          if (currentText.includes(target)) {
            moduleStatus = 'already';
          } else {
            const before = new Set(Array.from(document.querySelectorAll('body *')));
            const isOption = (el: Element) =>
              (el.textContent || '').length < 120 &&
              norm(el.textContent) === target &&
              !moduleWrapper.contains(el) &&
              isVisible(el);
            const findOption = () => {
              // Самый глубокий видимый элемент с точным текстом модуля вне самого поля;
              // приоритет — элементам, появившимся после открытия окна выбора
              const candidates = Array.from(
                document.querySelectorAll('td, li, [role=option], [role=row], [role=gridcell], div, span, a, label')
              ).filter(isOption);
              const deepest = candidates.filter((c) => !candidates.some((o) => o !== c && c.contains(o)));
              return deepest.find((c) => !visibleBefore.has(c)) || null;
            };
            // Совпадения, видимые ещё до открытия окна (например, в таблице на фоне), не выбираем
            const visibleBefore = new Set<Element>();
            Array.from(
              document.querySelectorAll('td, li, [role=option], [role=row], [role=gridcell], div, span, a, label')
            )
              .filter(isOption)
              .forEach((el) => visibleBefore.add(el));

            // Открыть окно выбора: кнопка/иконка поля, иначе клик по самому полю
            const trigger =
              Array.from(moduleWrapper.querySelectorAll('button, [role=button], .btn, [class*="icon"], [class*="select"]'))
                .filter(isVisible)
                .pop() ||
              moduleWrapper.querySelector('input:not([type=hidden])') ||
              moduleWrapper;
            const moduleInput = moduleWrapper.querySelector<HTMLInputElement>('input:not([type=hidden])');
            clickLikeUser(trigger);
            if (moduleInput && trigger !== moduleInput) clickLikeUser(moduleInput);

            let option = await waitFor(findOption, 2500);

            // Не нашли — пробуем поиск: в появившемся окне или в самом поле (если оно редактируемое)
            if (!option) {
              const searchInput =
                Array.from(document.querySelectorAll<HTMLInputElement>('input[type=text], input:not([type]), input[type=search]'))
                  .filter((i) => !before.has(i) && isVisible(i) && !i.readOnly)
                  .pop() || (moduleInput && !moduleInput.readOnly ? moduleInput : null);
              if (searchInput) {
                await typeInto(searchInput, moduleName.split(' ')[0]);
                option = await waitFor(findOption, 2500);
              }
            }

            if (option) {
              const row = option.closest('tr, li, [role=option], [role=row]') || option;
              clickLikeUser(row);
              row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
              await sleep(250);
              // Подтверждение выбора в окне, если оно осталось открытым
              const confirmBtn = Array.from(document.querySelectorAll('button, [role=button]')).find(
                (b) =>
                  !before.has(b) &&
                  isVisible(b) &&
                  !(b as HTMLButtonElement).disabled &&
                  ['выбрать', 'ок', 'ok', 'применить', 'подтвердить'].includes(norm(b.textContent))
              );
              if (confirmBtn) {
                clickLikeUser(confirmBtn);
                await sleep(250);
              }
              moduleStatus = 'selected';
            } else {
              moduleStatus = 'option_not_found';
              // Закрыть открытое окно выбора, чтобы не мешать
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            }
          }
        }

        return { found: true, filledCount, missing, notTyped, moduleStatus };
      },
    });

    const frame = results?.find((r) => r.result?.found === true)?.result;

    if (frame) {
      const moduleNote: Record<string, string> = {
        selected: `модуль: ${GREENDATA_DEFAULT_MODULE}`,
        already: `модуль уже выбран`,
        field_not_found: 'поле «Модуль» не найдено',
        option_not_found: `«${GREENDATA_DEFAULT_MODULE}» не найден в списке — выберите модуль вручную`,
      };
      const problems = [...(frame.missing ?? []), ...(frame.notTyped ?? [])];
      return {
        success: problems.length === 0,
        message:
          problems.length === 0
            ? `Задача заполнена (TFS: ${tfsNumber || '—'}, YT: ${ytGit}); ${moduleNote[frame.moduleStatus ?? 'field_not_found']}`
            : `Не удалось заполнить: ${problems.join(', ')}; ${moduleNote[frame.moduleStatus ?? 'field_not_found']}`,
        filled,
        missingFields: problems,
        moduleStatus: frame.moduleStatus,
      };
    }

    return { success: false, message: 'Окно создания задачи GreenData не найдено на открытой странице', filled };
  } catch (err) {
    return { success: false, message: getErrorMessage(err, 'Не удалось заполнить задачу в GreenData'), filled };
  }
}
