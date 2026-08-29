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
            className="px-1.5 py-0.5 mx-0.5 rounded bg-emerald-50 text-emerald-900 font-mono text-[11px] font-semibold border border-emerald-200 select-all"
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
      <div key={keyIdx} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
              {headerCells.map((h, hIdx) => (
                <th key={hIdx} className="px-2.5 py-1.5 border-r border-slate-200 last:border-r-0">
                  {renderInlineFormatting(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-emerald-50/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="px-2.5 py-1.5 text-slate-800 border-r border-slate-100 last:border-r-0 text-[11px] leading-relaxed"
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
          <div className="flex items-center gap-2 py-1.5 text-xs text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
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
      <div className="space-y-2 text-xs leading-relaxed break-words text-slate-800 selection:bg-emerald-100 selection:text-emerald-950">
        {parts.map((part, pIdx) => {
          // ── 1. Code Block ──
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
                className="my-2.5 rounded-xl overflow-hidden border border-slate-800 bg-[#0d1117] text-slate-100 shadow-xs font-mono text-[11px]"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-slate-800 select-none">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Terminal className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] truncate">
                      {language}
                    </span>
                    <span className="text-slate-500 text-[10px] hidden xs:inline">
                      ({lineCount} стр.)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleWrapCode(currentIdx)}
                      title={isWrapped ? 'Отключить перенос' : 'Включить перенос'}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        isWrapped ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <WrapText className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(code, currentIdx)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[10.5px] font-sans font-medium cursor-pointer"
                    >
                      {copiedCodeIdx === currentIdx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Скопировано</span>
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

                {/* Body */}
                <pre
                  className={`p-3 leading-relaxed text-[#e6edf3] bg-[#0d1117] font-mono scrollbar-thin select-all ${
                    isWrapped ? 'whitespace-pre-wrap break-words' : 'overflow-x-auto whitespace-pre'
                  }`}
                >
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          // ── 2. Markdown Text ──
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
                  className="font-bold text-slate-900 text-xs mt-3 mb-1 flex items-center gap-1.5 text-emerald-950"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>{renderInlineFormatting(trimmed.slice(4))}</span>
                </h4>
              );
              return;
            }
            if (trimmed.startsWith('## ')) {
              renderedElements.push(
                <h3
                  key={`h2-${lIdx}`}
                  className="font-bold text-slate-900 text-[13px] mt-3.5 mb-1.5 pb-0.5 border-b border-slate-200 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{renderInlineFormatting(trimmed.slice(3))}</span>
                </h3>
              );
              return;
            }
            if (trimmed.startsWith('# ')) {
              renderedElements.push(
                <h2
                  key={`h1-${lIdx}`}
                  className="font-bold text-slate-900 text-sm mt-3.5 mb-1.5 pb-1 border-b border-slate-300"
                >
                  {renderInlineFormatting(trimmed.slice(2))}
                </h2>
              );
              return;
            }

            // Horizontal Rule
            if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
              renderedElements.push(<hr key={`hr-${lIdx}`} className="my-2 border-slate-200" />);
              return;
            }

            // Blockquote
            if (trimmed.startsWith('> ')) {
              renderedElements.push(
                <div
                  key={`quote-${lIdx}`}
                  className="pl-2.5 py-1 my-1 border-l-2 border-emerald-500 bg-emerald-50/50 rounded-r-lg text-slate-800 text-[11px] italic leading-relaxed"
                >
                  {renderInlineFormatting(trimmed.slice(2))}
                </div>
              );
              return;
            }

            // List Bullet (- or *)
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              renderedElements.push(
                <div key={`li-${lIdx}`} className="flex items-start gap-1.5 ml-0.5 my-0.5">
                  <span className="text-emerald-600 font-bold text-xs mt-0.5 flex-shrink-0">•</span>
                  <span className="flex-1 text-slate-800 leading-relaxed">
                    {renderInlineFormatting(trimmed.slice(2))}
                  </span>
                </div>
              );
              return;
            }

            // Numbered List (1. 2. 3.)
            const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
            if (numMatch) {
              renderedElements.push(
                <div key={`num-${lIdx}`} className="flex items-start gap-1.5 ml-0.5 my-0.5">
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[9px] font-mono flex-shrink-0 mt-0.5">
                    {numMatch[1]}
                  </span>
                  <span className="flex-1 text-slate-800 leading-relaxed">
                    {renderInlineFormatting(numMatch[2])}
                  </span>
                </div>
              );
              return;
            }

            // Empty line
            if (!trimmed) {
              renderedElements.push(<div key={`sp-${lIdx}`} className="h-0.5" />);
              return;
            }

            // Paragraph line
            renderedElements.push(
              <p key={`p-${lIdx}`} className="text-slate-800 leading-relaxed my-0.5">
                {renderInlineFormatting(line)}
              </p>
            );
          });

          flushTable();

          return <div key={pIdx} className="space-y-0.5">{renderedElements}</div>;
        })}
      </div>
    );
  };

  return (
    <div
      className={`flex items-start gap-2 ${
        isUser ? 'justify-end' : 'justify-start'
      } group animate-fade-in`}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs mt-0.5">
          {message.error ? (
            <AlertCircle className="w-3.5 h-3.5 text-white" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-white" />
          )}
        </div>
      )}

      {/* Message Body */}
      <div
        className={`max-w-[92%] sm:max-w-[88%] min-w-[80px] ${
          isUser ? 'items-end' : 'items-start flex-1 min-w-0'
        }`}
      >
        {isUser ? (
          /* User Message: Clean Emerald Pill */
          <div className="relative rounded-2xl rounded-tr-xs px-3.5 py-2.5 bg-emerald-600 text-white shadow-xs">
            <div className="text-xs leading-relaxed whitespace-pre-wrap select-text font-normal text-white">
              {message.content}
            </div>
            {/* Hover Actions */}
            <div className="flex items-center justify-end gap-2 pt-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEditPrompt && (
                <button
                  type="button"
                  onClick={() => onEditPrompt(message.content)}
                  title="Редактировать запрос"
                  className="text-emerald-200 hover:text-white text-[10px] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>Изменить</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyMessage}
                title="Скопировать"
                className="text-emerald-200 hover:text-white text-[10px] inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedMsg ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <Copy className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Assistant Message Content */
          <div className="space-y-1.5 py-0.5 min-w-0">
            {/* Thinking Box */}
            {message.reasoningContent && (
              <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 overflow-hidden text-xs transition-all">
                <button
                  type="button"
                  onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-amber-900 hover:bg-amber-100/50 font-medium transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Brain className="w-3 h-3 text-amber-600 animate-pulse flex-shrink-0" />
                    <span className="font-bold text-amber-950 text-[11px] truncate">Ход рассуждений</span>
                    <span className="text-[9px] text-amber-800 bg-amber-200/70 px-1.5 py-0.1 rounded font-mono font-bold flex-shrink-0">
                      {message.reasoningContent.length} симв.
                    </span>
                  </div>
                  {isThinkingOpen ? (
                    <ChevronUp className="w-3 h-3 text-amber-700 flex-shrink-0 ml-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-amber-700 flex-shrink-0 ml-1" />
                  )}
                </button>
                {isThinkingOpen && (
                  <div className="p-2.5 text-slate-700 leading-relaxed font-mono whitespace-pre-wrap border-t border-amber-200/80 text-[10.5px] bg-white/90 max-h-52 overflow-y-auto">
                    {message.reasoningContent}
                  </div>
                )}
              </div>
            )}

            {/* Error Message Box */}
            {message.error ? (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-950">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <span>Ошибка ответа</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">{message.content}</p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer mt-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Повторить запрос</span>
                  </button>
                )}
              </div>
            ) : (
              renderFormattedContent(message.content)
            )}

            {/* Streaming Cursor */}
            {message.isStreaming && message.content && (
              <span className="inline-block w-1.5 h-3 ml-1 bg-emerald-600 animate-pulse align-middle rounded-xs" />
            )}

            {/* Footer Toolbar */}
            <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400 select-none">
              {message.model && (
                <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[8.5px] font-bold border border-slate-200">
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
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      title="Скопировать"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedMsg ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          <span className="text-[9px] text-emerald-600 font-bold">Скопировано</span>
                        </>
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                    </button>

                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        title="Повторить генерацию"
                        className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleFeedback('up')}
                      title="Полезно"
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        feedback === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ThumbsUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback('down')}
                      title="Не то"
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        feedback === 'down' ? 'text-rose-600 bg-rose-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ThumbsDown className="w-2.5 h-2.5" />
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
        <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 shadow-2xs mt-0.5">
          <User className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </div>
  );
});
