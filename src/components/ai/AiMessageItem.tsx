import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Brain,
  AlertCircle,
  RotateCcw,
  Terminal,
  Pencil,
  ThumbsUp,
  ThumbsDown,
  WrapText,
} from 'lucide-react';
import { AiChatMessage } from '../../types';

interface AiMessageItemProps {
  message: AiChatMessage;
  onRetry?: () => void;
  onEditPrompt?: (content: string) => void;
}

export const AiMessageItem: React.FC<AiMessageItemProps> = React.memo(({ message, onRetry, onEditPrompt }) => {
  const isUser = message.role === 'user';
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [wrappedCodeMap, setWrappedCodeMap] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const toggleWrapCode = (idx: number) => {
    setWrappedCodeMap((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback((prev) => (prev === type ? null : type));
  };

  // Helper for inline markdown: `code`, **bold**, *italic*
  const renderInlineFormatting = (text: string): React.ReactNode => {
    const codeParts = text.split(/(`[^`]+`)/g);

    return codeParts.map((part, pIdx) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-emerald-50 text-emerald-900 font-mono text-[11px] font-semibold border border-emerald-200/80 shadow-2xs select-all"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length >= 4) {
          return (
            <strong key={bIdx} className="font-bold text-slate-950">
              {bPart.slice(2, -2)}
            </strong>
          );
        }

        const italicParts = bPart.split(/(\*[^*]+\*)/g);
        return italicParts.map((iPart, iIdx) => {
          if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length >= 2) {
            return (
              <em key={iIdx} className="italic text-slate-800">
                {iPart.slice(1, -1)}
              </em>
            );
          }
          return iPart;
        });
      });
    });
  };

  // Helper to parse markdown tables
  const renderMarkdownTable = (tableLines: string[], keyIdx: number) => {
    if (tableLines.length < 2) return null;

    const parseRow = (row: string) =>
      row
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());

    const headerCells = parseRow(tableLines[0]);
    const bodyRows = tableLines.slice(2).map(parseRow);

    return (
      <div key={keyIdx} className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
              {headerCells.map((h, hIdx) => (
                <th key={hIdx} className="px-3 py-2 border-r border-slate-200 last:border-r-0">
                  {renderInlineFormatting(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-emerald-50/30 transition-colors">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="px-3 py-2 text-slate-800 border-r border-slate-100 last:border-r-0 text-[11.5px] leading-relaxed"
                  >
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Main Markdown & Code Parser
  const renderFormattedContent = (content: string) => {
    if (!content) {
      if (message.isStreaming) {
        return (
          <div className="flex items-center gap-2.5 py-2 text-xs text-slate-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-800 text-xs animate-pulse">Генерация ответа...</span>
          </div>
        );
      }
      return null;
    }

    const codeBlockRegex = /(```[\s\S]*?```)/g;
    const parts = content.split(codeBlockRegex);
    let codeBlockCounter = 0;

    return (
      <div className="space-y-2.5 text-[13px] leading-[1.68] break-words text-slate-800 selection:bg-emerald-100 selection:text-emerald-950">
        {parts.map((part, pIdx) => {
          // ── 1. Code Block (ChatGPT / Grok Style) ──
          if (part.startsWith('```') && part.endsWith('```')) {
            const currentIdx = codeBlockCounter++;
            const lines = part.slice(3, -3).split('\n');
            const language = lines[0].trim() || 'code';
            const code = (lines[0].trim() ? lines.slice(1) : lines).join('\n');
            const lineCount = code.split('\n').length;
            const isWrapped = Boolean(wrappedCodeMap[currentIdx]);

            return (
              <div
                key={pIdx}
                className="my-3 rounded-2xl overflow-hidden border border-slate-800 bg-[#0b0f17] text-slate-100 shadow-md font-mono text-[11.5px]"
              >
                {/* Modern Dark Header */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-[#131a26] border-b border-slate-800 select-none">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="flex items-center gap-1.5 ml-1 text-slate-400 text-[10.5px] font-semibold font-mono">
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 uppercase tracking-wider">{language}</span>
                      <span className="text-slate-500 font-normal">({lineCount} строк)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleWrapCode(currentIdx)}
                      title={isWrapped ? 'Отключить перенос строк' : 'Включить перенос строк'}
                      className={`p-1 rounded-lg text-[10.5px] transition-colors cursor-pointer ${
                        isWrapped ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <WrapText className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(code, currentIdx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[10.5px] font-sans font-medium cursor-pointer shadow-2xs"
                    >
                      {copiedCodeIdx === currentIdx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Копировать</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Body */}
                <pre
                  className={`p-3.5 leading-relaxed text-[#e6edf3] bg-[#0b0f17] font-mono scrollbar-thin select-all ${
                    isWrapped ? 'whitespace-pre-wrap break-words' : 'overflow-x-auto whitespace-pre'
                  }`}
                >
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          // ── 2. Markdown Text with Headers, Tables, Lists, Quotes ──
          const rawLines = part.split('\n');
          const renderedElements: React.ReactNode[] = [];
          let currentTableLines: string[] = [];

          const flushTable = () => {
            if (currentTableLines.length > 0) {
              renderedElements.push(renderMarkdownTable(currentTableLines, renderedElements.length));
              currentTableLines = [];
            }
          };

          rawLines.forEach((line, lIdx) => {
            const trimmed = line.trim();

            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
              currentTableLines.push(trimmed);
              return;
            } else {
              flushTable();
            }

            // Headers
            if (trimmed.startsWith('### ')) {
              renderedElements.push(
                <h4
                  key={`h3-${lIdx}`}
                  className="font-bold text-slate-900 text-[13.5px] mt-3.5 mb-1.5 flex items-center gap-2 text-emerald-950"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>{renderInlineFormatting(trimmed.slice(4))}</span>
                </h4>
              );
              return;
            }
            if (trimmed.startsWith('## ')) {
              renderedElements.push(
                <h3
                  key={`h2-${lIdx}`}
                  className="font-bold text-slate-900 text-[15px] mt-4 mb-2 pb-1 border-b border-slate-200 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{renderInlineFormatting(trimmed.slice(3))}</span>
                </h3>
              );
              return;
            }
            if (trimmed.startsWith('# ')) {
              renderedElements.push(
                <h2
                  key={`h1-${lIdx}`}
                  className="font-bold text-slate-900 text-base mt-4 mb-2 pb-1.5 border-b border-slate-300"
                >
                  {renderInlineFormatting(trimmed.slice(2))}
                </h2>
              );
              return;
            }

            // Horizontal Rule
            if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
              renderedElements.push(<hr key={`hr-${lIdx}`} className="my-3 border-slate-200" />);
              return;
            }

            // Blockquote
            if (trimmed.startsWith('> ')) {
              renderedElements.push(
                <div
                  key={`quote-${lIdx}`}
                  className="pl-3 py-1.5 my-1.5 border-l-3 border-emerald-500 bg-emerald-50/60 rounded-r-xl text-slate-800 text-xs italic leading-relaxed shadow-2xs"
                >
                  {renderInlineFormatting(trimmed.slice(2))}
                </div>
              );
              return;
            }

            // Unordered List Bullet (- or *)
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              renderedElements.push(
                <div key={`li-${lIdx}`} className="flex items-start gap-2 ml-1 my-0.5">
                  <span className="text-emerald-600 font-bold text-xs mt-0.5 flex-shrink-0">•</span>
                  <span className="flex-1 text-slate-800 leading-relaxed">
                    {renderInlineFormatting(trimmed.slice(2))}
                  </span>
                </div>
              );
              return;
            }

            // Ordered List (1. 2. 3.)
            const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
            if (numMatch) {
              renderedElements.push(
                <div key={`num-${lIdx}`} className="flex items-start gap-2 ml-1 my-0.5">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[9.5px] font-mono flex-shrink-0 mt-0.5 shadow-2xs">
                    {numMatch[1]}
                  </span>
                  <span className="flex-1 text-slate-800 leading-relaxed">
                    {renderInlineFormatting(numMatch[2])}
                  </span>
                </div>
              );
              return;
            }

            // Empty spacing line
            if (!trimmed) {
              renderedElements.push(<div key={`sp-${lIdx}`} className="h-1" />);
              return;
            }

            // Regular paragraph line
            renderedElements.push(
              <p key={`p-${lIdx}`} className="text-slate-800 leading-relaxed my-0.5">
                {renderInlineFormatting(line)}
              </p>
            );
          });

          flushTable();

          return <div key={pIdx} className="space-y-1">{renderedElements}</div>;
        })}
      </div>
    );
  };

  return (
    <div
      className={`flex items-start gap-2.5 sm:gap-3 ${
        isUser ? 'justify-end' : 'justify-start'
      } group animate-fade-in`}
    >
      {/* Assistant Avatar (Grok + ChatGPT style) */}
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
          {message.error ? (
            <AlertCircle className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`max-w-[90%] sm:max-w-[86%] min-w-[120px] ${
          isUser ? 'items-end' : 'items-start flex-1 min-w-0'
        }`}
      >
        {isUser ? (
          /* User Message Bubble: Sleek Obsidian ChatGPT / Grok style card */
          <div className="relative rounded-3xl rounded-br-sm px-4.5 py-3 bg-[#1e293b] text-white border border-slate-700/70 shadow-sm hover:border-slate-600 transition-colors">
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap select-text font-normal text-slate-100">
              {message.content}
            </div>
            {/* Hover Actions: Edit Prompt & Copy */}
            <div className="flex items-center justify-end gap-2 pt-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEditPrompt && (
                <button
                  type="button"
                  onClick={() => onEditPrompt(message.content)}
                  title="Редактировать запрос"
                  className="text-slate-400 hover:text-white text-[10px] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Изменить</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyMessage}
                title="Скопировать сообщение"
                className="text-slate-400 hover:text-white text-[10px] inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedMsg ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Копировать</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Assistant Message Body */
          <div className="space-y-2 py-0.5 min-w-0">
            {/* Reasoning / Thinking Accordion Box (Grok / DeepSeek R1 / Claude 3.7) */}
            {message.reasoningContent && (
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 overflow-hidden text-xs transition-all shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-amber-900 hover:bg-amber-100/50 font-medium transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Brain className="w-3.5 h-3.5 text-amber-600 animate-pulse flex-shrink-0" />
                    <span className="font-bold text-amber-950 truncate">Процесс рассуждений (Reasoning)</span>
                    <span className="text-[10px] text-amber-800 bg-amber-200/70 px-1.5 py-0.2 rounded-md font-mono font-bold flex-shrink-0">
                      {message.reasoningContent.length} симв.
                    </span>
                  </div>
                  {isThinkingOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 ml-1" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 ml-1" />
                  )}
                </button>
                {isThinkingOpen && (
                  <div className="p-3 text-slate-700 leading-relaxed font-mono whitespace-pre-wrap border-t border-amber-200/80 text-[11px] bg-white/90 max-h-64 overflow-y-auto">
                    {message.reasoningContent}
                  </div>
                )}
              </div>
            )}

            {/* Error Message Box */}
            {message.error ? (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs shadow-2xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-950">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Ошибка при выполнении запроса</span>
                </div>
                <p className="text-[11.5px] text-rose-800 leading-relaxed">{message.content}</p>
                {onRetry && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={onRetry}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Повторить запрос</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              renderFormattedContent(message.content)
            )}

            {/* Streaming Cursor */}
            {message.isStreaming && message.content && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-600 animate-pulse align-middle rounded-xs" />
            )}

            {/* ChatGPT / Grok Message Footer Action Toolbar */}
            <div className="flex items-center gap-2 pt-1 text-[10.5px] text-slate-400 select-none">
              {message.model && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[9px] font-bold border border-slate-200">
                  {message.model}
                </span>
              )}
              <span>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 ml-auto opacity-70 group-hover:opacity-100 transition-opacity">
                {message.content && !message.error && (
                  <>
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      title="Скопировать ответ"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedMsg ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] text-emerald-600 font-bold">Скопировано</span>
                        </>
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>

                    {/* Regenerate Button */}
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        title="Сгенерировать заново"
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}

                    {/* Thumbs Up / Down */}
                    <button
                      type="button"
                      onClick={() => handleFeedback('up')}
                      title="Хороший ответ"
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        feedback === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback('down')}
                      title="Плохой ответ"
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        feedback === 'down' ? 'text-rose-600 bg-rose-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
});
