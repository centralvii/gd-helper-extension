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
} from 'lucide-react';
import { AiChatMessage } from '../../types';

interface AiMessageItemProps {
  message: AiChatMessage;
  onRetry?: () => void;
}

export const AiMessageItem: React.FC<AiMessageItemProps> = React.memo(({ message, onRetry }) => {
  const isUser = message.role === 'user';
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);

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

  // Helper to parse content into text, code blocks, and markdown
  const renderFormattedContent = (content: string) => {
    if (!content) {
      if (message.isStreaming) {
        return (
          <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium animate-pulse text-emerald-800 text-[11.5px]">Печатает ответ...</span>
          </div>
        );
      }
      return null;
    }

    // Split by code fences ```lang ... ```
    const parts = content.split(/(```[\s\S]*?```)/g);
    let codeBlockCounter = 0;

    return (
      <div className="space-y-3 text-[13px] leading-[1.68] break-words text-gray-900 selection:bg-emerald-100 selection:text-emerald-950 font-normal">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const currentIdx = codeBlockCounter++;
            const lines = part.slice(3, -3).split('\n');
            const language = lines[0].trim() || 'code';
            const code = (lines[0].trim() ? lines.slice(1) : lines).join('\n');

            return (
              <div
                key={index}
                className="my-3 rounded-xl overflow-hidden border border-gray-800 bg-[#12161f] text-gray-100 shadow-md font-mono text-[11.5px]"
              >
                {/* Modern macOS / Claude-style Code Header */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-[#1a202c] border-b border-gray-800/80 select-none">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90" />
                    </div>
                    <span className="text-[10.5px] text-gray-400 font-mono font-semibold ml-1.5 flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 lowercase">{language}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(code, currentIdx)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-all text-[10.5px] font-sans font-medium"
                  >
                    {copiedCodeIdx === currentIdx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Копировать</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code body */}
                <pre className="p-3.5 overflow-x-auto select-all leading-relaxed text-[#e2e8f0] bg-[#12161f]">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          // Format regular text (headers, blockquotes, lists, tables)
          const textLines = part.split('\n');
          return (
            <div key={index} className="space-y-1.5">
              {textLines.map((line, lIdx) => {
                const trimmed = line.trim();

                // Headers
                if (trimmed.startsWith('### ')) {
                  return (
                    <h4
                      key={lIdx}
                      className="font-bold text-gray-900 text-[13.5px] mt-3 mb-1 flex items-center gap-1.5 text-emerald-950"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {renderInlineFormatting(trimmed.slice(4))}
                    </h4>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h3
                      key={lIdx}
                      className="font-bold text-gray-900 text-[14.5px] mt-3.5 mb-1.5 pb-1 border-b border-gray-100"
                    >
                      {renderInlineFormatting(trimmed.slice(3))}
                    </h3>
                  );
                }
                if (trimmed.startsWith('# ')) {
                  return (
                    <h2
                      key={lIdx}
                      className="font-bold text-gray-900 text-base mt-4 mb-2 pb-1.5 border-b border-gray-200"
                    >
                      {renderInlineFormatting(trimmed.slice(2))}
                    </h2>
                  );
                }

                // Blockquote
                if (trimmed.startsWith('> ')) {
                  return (
                    <div
                      key={lIdx}
                      className="pl-3 py-1 my-1 border-l-2 border-emerald-500 bg-emerald-50/50 rounded-r-lg text-gray-700 italic text-xs leading-relaxed"
                    >
                      {renderInlineFormatting(trimmed.slice(2))}
                    </div>
                  );
                }

                // Bullet points
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 ml-1">
                      <span className="text-emerald-600 font-bold text-xs mt-1">•</span>
                      <span className="flex-1 text-gray-800 leading-relaxed">
                        {renderInlineFormatting(trimmed.slice(2))}
                      </span>
                    </div>
                  );
                }

                // Numbered list
                const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
                if (numMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 ml-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex-shrink-0 mt-1">
                        {numMatch[1]}
                      </span>
                      <span className="flex-1 text-gray-800 leading-relaxed">
                        {renderInlineFormatting(numMatch[2])}
                      </span>
                    </div>
                  );
                }

                // Empty line
                if (!trimmed) {
                  return <div key={lIdx} className="h-1.5" />;
                }

                // Normal line
                return (
                  <p key={lIdx} className="text-gray-800 leading-relaxed">
                    {renderInlineFormatting(line)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Helper for inline markdown: `code`, **bold**, *italic*
  const renderInlineFormatting = (text: string) => {
    const codeParts = text.split(/(`[^`]+`)/g);

    return codeParts.map((cp, idx) => {
      if (cp.startsWith('`') && cp.endsWith('`') && cp.length > 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-emerald-50 text-emerald-900 font-mono text-[11px] border border-emerald-200/90 font-semibold shadow-2xs"
          >
            {cp.slice(1, -1)}
          </code>
        );
      }

      const boldParts = cp.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bp, bIdx) => {
        if (bp.startsWith('**') && bp.endsWith('**') && bp.length > 4) {
          return (
            <strong key={bIdx} className="font-bold text-gray-950">
              {bp.slice(2, -2)}
            </strong>
          );
        }
        return bp;
      });
    });
  };

  return (
    <div
      className={`flex items-start gap-2.5 sm:gap-3.5 ${
        isUser ? 'justify-end' : 'justify-start'
      } group animate-fade-in`}
    >
      {/* Assistant Avatar (Claude Anthropic Style Sparkle) */}
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
        className={`max-w-[88%] sm:max-w-[84%] min-w-[120px] ${
          isUser ? 'items-end' : 'items-start flex-1'
        }`}
      >
        {isUser ? (
          /* User Message: Clean Claude warm pill card */
          <div className="relative rounded-2xl px-4 py-3 bg-[#f5f4ef] text-gray-900 border border-[#e8e6df] shadow-2xs hover:border-gray-300 transition-colors">
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap select-text font-medium text-gray-900">
              {message.content}
            </div>
            {/* User Copy action on hover */}
            <div className="flex items-center justify-end pt-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleCopyMessage}
                title="Скопировать"
                className="text-gray-400 hover:text-gray-700 text-[10px] inline-flex items-center gap-1"
              >
                {copiedMsg ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Assistant Message: Claude spacious uncluttered flow */
          <div className="space-y-2 py-0.5">
            {/* Reasoning / Thinking Process Block (Claude 3.7 / DeepSeek R1 Style) */}
            {message.reasoningContent && (
              <div className="rounded-xl bg-[#faf8f4] border border-[#ebe6dc] overflow-hidden text-[11.5px] transition-all">
                <button
                  type="button"
                  onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-[#786c5e] hover:text-[#52493e] font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span className="font-semibold text-gray-800">Ход размышлений (Thinking)</span>
                    <span className="text-[10px] text-gray-500 bg-gray-200/60 px-1.5 py-0.2 rounded-full font-mono">
                      {message.reasoningContent.length} симв.
                    </span>
                  </div>
                  {isThinkingOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </button>
                {isThinkingOpen && (
                  <div className="p-3 text-gray-700 leading-relaxed font-mono whitespace-pre-wrap border-t border-[#ebe6dc] text-[11px] bg-white/70 max-h-60 overflow-y-auto">
                    {message.reasoningContent}
                  </div>
                )}
              </div>
            )}

            {/* Error Message Box */}
            {message.error ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <p className="font-semibold">Произошла ошибка при ответе модели.</p>
                <p className="text-[11px] text-rose-600 mt-1">{message.content}</p>
              </div>
            ) : (
              renderFormattedContent(message.content)
            )}

            {/* Streaming Cursor */}
            {message.isStreaming && message.content && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-600 animate-pulse align-middle rounded-xs" />
            )}

            {/* Claude-style Message Bottom Action Bar */}
            <div className="flex items-center gap-2 pt-1 text-[10.5px] text-gray-400 select-none">
              {message.model && (
                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono text-[9px] font-medium border border-gray-200/80">
                  {message.model}
                </span>
              )}
              <span>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>

              <div className="flex items-center gap-1 ml-auto opacity-80 group-hover:opacity-100 transition-opacity">
                {message.error && onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1 text-rose-700 hover:text-rose-800 font-semibold px-2 py-0.5 rounded-md bg-rose-100/80 border border-rose-200 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Повторить</span>
                  </button>
                )}

                {message.content && !message.error && (
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    title="Скопировать весь ответ"
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors inline-flex items-center gap-1"
                  >
                    {copiedMsg ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] text-emerald-600 font-semibold">Скопировано</span>
                      </>
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-gray-700 to-gray-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
});
