import { YouTrackIssue } from '../types';

export interface GreenDataTaskFillResult {
  success: boolean;
  message: string;
  filled: {
    tfs: string;
    yt: string;
    name: string;
  };
  missingFields?: string[];
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

/**
 * Injects YouTrack issue data into the active GreenData task creation modal on the active tab.
 */
export async function injectYouTrackIntoGreenDataTask(
  issue: YouTrackIssue
): Promise<GreenDataTaskFillResult> {
  const tfsNumber = extractTfsNumberFromSummary(issue.summary);
  const ytGit = issue.id || '';
  const taskName = (issue.summary || '').trim();

  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
    return {
      success: false,
      message: 'Расширение не имеет доступа к API Chrome tabs/scripting',
      filled: { tfs: tfsNumber, yt: ytGit, name: taskName },
    };
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      return {
        success: false,
        message: 'Активная вкладка браузера не найдена',
        filled: { tfs: tfsNumber, yt: ytGit, name: taskName },
      };
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      args: [tfsNumber, ytGit, taskName],
      func: (tfsVal: string, ytVal: string, nameVal: string) => {
        // Helper to update React-controlled inputs
        function setReactValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
          element.focus();

          const nativeInputSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;

          if (element instanceof HTMLTextAreaElement && nativeTextareaSetter) {
            nativeTextareaSetter.call(element, value);
          } else if (nativeInputSetter) {
            nativeInputSetter.call(element, value);
          } else {
            element.value = value;
          }

          // Dispatch input & change events for React/Redux listeners
          element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

          // Animate brief emerald highlight
          const origBg = element.style.backgroundColor;
          const origBorder = element.style.borderColor;
          const origBoxShadow = element.style.boxShadow;
          const origTransition = element.style.transition;

          element.style.transition = 'all 0.3s ease';
          element.style.backgroundColor = '#ecfdf5'; // light emerald
          element.style.borderColor = '#10b981';
          element.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.3)';

          setTimeout(() => {
            element.style.backgroundColor = origBg || '';
            element.style.borderColor = origBorder || '';
            element.style.boxShadow = origBoxShadow || '';
            element.style.transition = origTransition || '';
          }, 1500);

          element.blur();
        }

        // 1. Locate TFS (US/BP) input: data-ident="TFS_STR"
        let tfsInput = document.querySelector<HTMLInputElement>(
          '[data-ident="TFS_STR"] input, [data-ident="TFS_STR"] .base-theme-input'
        );
        if (!tfsInput) {
          // Label search fallback
          const allWrappers = Array.from(document.querySelectorAll('.visual-group-attribute, .control-wrapper'));
          for (const w of allWrappers) {
            if ((w.textContent || '').includes('TFS (US/BP)')) {
              tfsInput = w.querySelector<HTMLInputElement>('input');
              if (tfsInput) break;
            }
          }
        }

        // 2. Locate YT/Git input: data-ident="YT_STR"
        let ytInput = document.querySelector<HTMLInputElement>(
          '[data-ident="YT_STR"] input, [data-ident="YT_STR"] .base-theme-input'
        );
        if (!ytInput) {
          const allWrappers = Array.from(document.querySelectorAll('.visual-group-attribute, .control-wrapper'));
          for (const w of allWrappers) {
            if ((w.textContent || '').includes('YT/Git') || (w.textContent || '').includes('YT/GIT')) {
              ytInput = w.querySelector<HTMLInputElement>('input');
              if (ytInput) break;
            }
          }
        }

        // 3. Locate Наименование задачи input: data-ident="NAME_TASK_STR"
        let nameInput = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          '[data-ident="NAME_TASK_STR"] input, [data-ident="NAME_TASK_STR"] textarea, [data-ident="NAME_TASK_STR"] .base-theme-input'
        );
        if (!nameInput) {
          const allWrappers = Array.from(document.querySelectorAll('.visual-group-attribute, .control-wrapper'));
          for (const w of allWrappers) {
            if ((w.textContent || '').includes('Наименование задачи')) {
              nameInput = w.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
              if (nameInput) break;
            }
          }
        }

        // If none of the fields found in this frame, return false
        if (!tfsInput && !ytInput && !nameInput) {
          return { found: false };
        }

        let filledCount = 0;
        const missing: string[] = [];

        if (tfsInput && tfsVal) {
          setReactValue(tfsInput, tfsVal);
          filledCount++;
        } else if (!tfsInput) {
          missing.push('TFS (US/BP)');
        }

        if (ytInput && ytVal) {
          setReactValue(ytInput, ytVal);
          filledCount++;
        } else if (!ytInput) {
          missing.push('YT/Git');
        }

        if (nameInput && nameVal) {
          setReactValue(nameInput, nameVal);
          filledCount++;
        } else if (!nameInput) {
          missing.push('Наименование задачи');
        }

        return {
          found: true,
          filledCount,
          missing,
        };
      },
    });

    const successfulFrame = results?.find((r) => r.result?.found === true)?.result;

    if (successfulFrame) {
      return {
        success: true,
        message: `Поля задачи заполнены в GreenData (TFS: ${tfsNumber || '—'}, YT: ${ytGit})`,
        filled: { tfs: tfsNumber, yt: ytGit, name: taskName },
        missingFields: successfulFrame.missing,
      };
    }

    return {
      success: false,
      message: 'Модальное окно создания задачи не найдено на открытой странице GreenData',
      filled: { tfs: tfsNumber, yt: ytGit, name: taskName },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Ошибка заполнения полей задачи в GreenData',
      filled: { tfs: tfsNumber, yt: ytGit, name: taskName },
    };
  }
}
