/**
 * GreenData Algorithm Comment Header Injector
 * Injects comment header (e.g. "//07.09.2026. Кучин В.В. FINAPP-5638. 11-2026.")
 * directly into the GreenData formula/algorithm editor (MathQuill).
 */

export interface CommentInjectionResult {
  success: boolean;
  editorFound: boolean;
  message: string;
  copiedToClipboard: boolean;
}

/**
 * Copies comment to clipboard and attempts to inject it into the active GreenData page editor.
 */
export async function injectAlgorithmComment(
  commentText: string,
  insertNewline: boolean = true
): Promise<CommentInjectionResult> {
  let copiedToClipboard = false;

  // 1. Copy to clipboard first so user always has it
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(commentText + (insertNewline ? '\n' : ''));
      copiedToClipboard = true;
    }
  } catch (e) {
    console.warn('Clipboard write failed:', e);
  }

  // 2. Query active browser tab
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
    return {
      success: copiedToClipboard,
      editorFound: false,
      copiedToClipboard,
      message: copiedToClipboard
        ? 'Комментарий скопирован в буфер обмена (расширение не имеет доступа к scripting)'
        : 'Не удалось получить доступ к вкладке',
    };
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      return {
        success: copiedToClipboard,
        editorFound: false,
        copiedToClipboard,
        message: copiedToClipboard
          ? 'Комментарий скопирован в буфер обмена (нет активной вкладки)'
          : 'Активная вкладка не найдена',
      };
    }

    // Execute injection script inside the active tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      args: [commentText, insertNewline],
      func: (text: string, addNewline: boolean) => {
        const fullText = text + (addNewline ? '\n' : '');

        // 1. Search for GreenData formula/algorithm MathQuill editors
        const mqSelectors = [
          '.formula-editor-box .mq-editable-field',
          '.formula-editor-box .mq_containeer',
          '.mq_containeer.mq-editable-field',
          '.mq-editable-field.mq-math-mode',
          '.formula-editor-box',
        ];

        const allCandidates = Array.from(
          document.querySelectorAll<HTMLElement>(mqSelectors.join(', '))
        );

        if (allCandidates.length > 0) {
          // Find the most suitable candidate
          // A. An editor with an active cursor or focus
          let target = allCandidates.find(
            (el) =>
              el.classList.contains('mq-focused') ||
              el.querySelector('.mq-cursor') !== null ||
              el.querySelector('textarea') === document.activeElement
          );

          // B. If not focused, pick the first visible one
          if (!target) {
            target = allCandidates.find((el) => el.offsetWidth > 0 && el.offsetHeight > 0);
          }

          // C. Fallback to first candidate
          if (!target) {
            target = allCandidates[0];
          }

          const textarea = target.querySelector<HTMLTextAreaElement>('textarea') ||
            target.closest('.formula-editor-box')?.querySelector<HTMLTextAreaElement>('textarea');

          const rootBlock = target.querySelector<HTMLElement>('.mq-root-block');
          const hasExistingCursor = target.querySelector('.mq-cursor') !== null;

          // If no existing cursor was placed by user, move cursor to the very beginning (top)
          if (!hasExistingCursor) {
            // Attempt A: MathQuill JS API if present on window
            try {
              const win = window as any;
              const MQ = win.MathQuill?.getInterface ? win.MathQuill.getInterface(2) : win.MathQuill;
              if (typeof MQ === 'function') {
                const mqField = MQ(target);
                if (mqField && typeof mqField.moveToLeftEnd === 'function') {
                  mqField.moveToLeftEnd();
                }
              }
            } catch (e) {
              // ignore
            }

            // Attempt B: Click at start of root block to place cursor at top
            if (rootBlock) {
              try {
                const firstChild = rootBlock.firstElementChild || rootBlock;
                const rect = firstChild.getBoundingClientRect();
                const clientX = Math.max(0, rect.left + 2);
                const clientY = Math.max(0, rect.top + 2);

                firstChild.dispatchEvent(
                  new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX, clientY })
                );
                firstChild.dispatchEvent(
                  new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX, clientY })
                );
                firstChild.dispatchEvent(
                  new MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY })
                );
              } catch (e) {
                // ignore
              }
            }

            // Attempt C: Send Ctrl+Home to textarea
            if (textarea) {
              try {
                textarea.focus();
                textarea.dispatchEvent(
                  new KeyboardEvent('keydown', {
                    key: 'Home',
                    code: 'Home',
                    ctrlKey: true,
                    bubbles: true,
                  })
                );
              } catch (e) {
                // ignore
              }
            }
          }

          // Perform insertion into MathQuill
          let inserted = false;

          // Technique 1: Simulate paste on MathQuill textarea
          if (textarea) {
            textarea.focus();
            try {
              const dt = new DataTransfer();
              dt.setData('text/plain', fullText);
              const pasteEvent = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: dt,
              });
              textarea.dispatchEvent(pasteEvent);
              inserted = true;
            } catch (e) {
              // ignore
            }

            // Technique 2: document.execCommand('insertText')
            try {
              document.execCommand('insertText', false, fullText);
              inserted = true;
            } catch (e) {
              // ignore
            }
          }

          // Technique 3: MathQuill API typedText or write
          try {
            const win = window as any;
            const MQ = win.MathQuill?.getInterface ? win.MathQuill.getInterface(2) : win.MathQuill;
            if (typeof MQ === 'function') {
              const mqField = MQ(target);
              if (mqField) {
                if (typeof mqField.typedText === 'function') {
                  mqField.typedText(fullText);
                  inserted = true;
                } else if (typeof mqField.write === 'function') {
                  mqField.write(fullText);
                  inserted = true;
                }
              }
            }
          } catch (e) {
            // ignore
          }

          // Trigger visual scroll to top if needed
          if (!hasExistingCursor && target) {
            try {
              target.scrollTop = 0;
              const scrollbar = target.closest('.ps-container');
              if (scrollbar) {
                scrollbar.scrollTop = 0;
              }
            } catch (e) {
              // ignore
            }
          }

          return {
            success: true,
            editorFound: true,
            inserted,
            cursorPosition: hasExistingCursor ? 'cursor' : 'top',
          };
        }

        // 2. Fallback for standard Textarea / Input if page uses plain editor
        const active = document.activeElement as HTMLTextAreaElement | HTMLInputElement | null;
        if (active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type === 'text'))) {
          try {
            const start = active.selectionStart || 0;
            const end = active.selectionEnd || 0;
            const val = active.value;
            active.value = val.substring(0, start) + fullText + val.substring(end);
            active.selectionStart = active.selectionEnd = start + fullText.length;
            active.dispatchEvent(new Event('input', { bubbles: true }));
            active.dispatchEvent(new Event('change', { bubbles: true }));
            return {
              success: true,
              editorFound: true,
              inserted: true,
              cursorPosition: 'cursor',
            };
          } catch (e) {
            // ignore
          }
        }

        return {
          success: false,
          editorFound: false,
          inserted: false,
        };
      },
    });

    // Check if any frame reported successful editor injection
    const successfulFrame = results?.find((r) => r.result && r.result.success);

    if (successfulFrame && successfulFrame.result) {
      const posText =
        successfulFrame.result.cursorPosition === 'cursor'
          ? 'в позицию курсора'
          : 'в начало алгоритма';
      return {
        success: true,
        editorFound: true,
        copiedToClipboard,
        message: `Комментарий успешно добавлен ${posText}!`,
      };
    }

    return {
      success: copiedToClipboard,
      editorFound: false,
      copiedToClipboard,
      message: copiedToClipboard
        ? 'Редактор алгоритма на странице не найден, но комментарий скопирован в буфер обмена!'
        : 'Редактор формулы/алгоритма не найден на открытой странице.',
    };
  } catch (err: any) {
    return {
      success: copiedToClipboard,
      editorFound: false,
      copiedToClipboard,
      message: copiedToClipboard
        ? `Скопировано в буфер (ошибка страницы: ${err.message || 'нет доступа'})`
        : `Ошибка: ${err.message || 'Не удалось вставить комментарий'}`,
    };
  }
}
