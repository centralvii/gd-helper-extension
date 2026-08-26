import React, { useState } from 'react';
import {
  Bot,
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

  // Helper to parse content into text, tables, and code blocks
  const renderFormattedContent = (content: string) => {
    if (!content) {
      if (message.isStreaming) {
        return (
          <div className="flex items-center gap-2 py-1.5 text-xs text-gray-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-medium animate-pulse">Генерация ответа...</span>
          </div>
        );
      }
      return null;
    }

    // Split by code fences ```lang ... ```
    const parts = content.split(/(```[\s\S]*?```)/g);
    let codeBlockCounter = 0;

    return (
      <div className="space-y-2.5 text-[12.5px] leading-relaxed break-words text-gray-800">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const currentIdx = codeBlockCounter++;
            const lines = part.slice(3, -3).split('\n');
            const language = lines[0].trim() || 'code';
            const code = (lines[0].trim() ? lines.slice(1) : lines).join('\n');

            return (
              <div
                key={index}
                className="my-3 rounded-2xl overflow-hidden border border-gray-800/80 bg-[#0e131b] text-gray-100 shadow-lg font-mono text-[11px]"
              >
                {/* Modern macOS-style Header */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-[#161d28] border-b border-gray-800/70 select-none">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80" />
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono font-semibold ml-1.5 flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400/90 lowercase">{language}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(code, currentIdx)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-800/60 hover:bg-gray-700/80 text-gray-300 hover:text-white transition-all text-[10px] font-sans font-medium"
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
                <pre className="p-3.5 overflow-x-auto select-all leading-relaxed text-gray-200 bg-[#0e131b]">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          // Format regular text (tables, headers, bold, lists, blockquotes)
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
                      className="font-bold text-gray-900 text-[13px] mt-3 mb-1 flex items-center gap-1.5 text-emerald-900"
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
                      className="font-bold text-gray-900 text-sm mt-3.5 mb-1.5 pb-1 border-b border-gray-100"
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

                // Blockquote: > text
                if (trimmed.startsWith('> ')) {
                  return (
                    <div
                      key={lIdx}
                      className="pl-3 py-1 my-1 border-l-2 border-emerald-500 bg-emerald-50/40 rounded-r-lg text-gray-700 italic text-xs"
                    >
                      {renderInlineFormatting(trimmed.slice(2))}
                    </div>
                  );
                }

                // Bullet items: - or *
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 ml-1">
                      <span className="text-emerald-500 font-bold text-xs mt-0.5">•</span>
                      <span className="flex-1 text-gray-800 leading-normal">
                        {renderInlineFormatting(trimmed.slice(2))}
                      </span>
                    </div>
                  );
                }

                // Numbered list: 1. 2. etc
                const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
                if (numMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 ml-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {numMatch[1]}
                      </span>
                      <span className="flex-1 text-gray-800 leading-normal">
                        {renderInlineFormatting(numMatch[2])}
                      </span>
                    </div>
                  );
                }

                // Empty line
                if (!trimmed) {
                  return <div key={lIdx} className="h-1" />;
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
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono text-[11px] border border-emerald-200/80 font-semibold shadow-2xs"
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
      className={`flex items-start gap-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } group animate-fade-in`}
    >
      {/* Modern Avatar */}
      <div
        className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 text-xs transition-transform group-hover:scale-105 ${
          isUser
            ? 'bg-gradient-to-tr from-gray-800 via-gray-900 to-slate-800 text-white shadow-md shadow-gray-900/10'
            : message.error
            ? 'bg-gradient-to-tr from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20'
            : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : message.error ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Card Container */}
      <div
        className={`max-w-[88%] sm:max-w-[82%] min-w-[140px] space-y-1.5 ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`relative rounded-2xl p-4 transition-shadow ${
            isUser
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-tr-xs shadow-md shadow-emerald-600/10'
              : message.error
              ? 'bg-rose-50/90 border border-rose-200 rounded-tl-xs shadow-sm'
              : 'bg-white border border-gray-200/90 rounded-tl-xs shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          }`}
        >
          {/* Reasoning / Thinking Block (DeepSeek R1 style) */}
          {!isUser && message.reasoningContent && (
            <div className="mb-3 rounded-xl bg-gradient-to-r from-purple-50/70 to-indigo-50/70 border border-purple-200/70 overflow-hidden text-[11px] transition-all">
              <button
                type="button"
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-purple-900 hover:text-purple-950 font-medium transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                  <span className="font-semibold text-purple-950">Размышления модели</span>
                  <span className="text-[10px] text-purple-600 bg-purple-100/80 px-1.5 py-0.2 rounded-full font-mono">
                    {message.reasoningContent.length} симв.
                  </span>
                </div>
                {isThinkingOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-purple-600" />
                )}
              </button>
              {isThinkingOpen && (
                <div className="p-3 text-purple-950/80 leading-relaxed font-mono whitespace-pre-wrap border-t border-purple-200/60 text-[10.5px] bg-white/80 max-h-60 overflow-y-auto">
                  {message.reasoningContent}
                </div>
              )}
            </div>
          )}

          {/* Message Body */}
          {isUser ? (
            <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap select-text font-normal text-white">
              {message.content}
            </div>
          ) : (
            renderFormattedContent(message.content)
          )}

          {/* Streaming blinking cursor */}
          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-600 animate-pulse align-middle rounded-xs" />
          )}

          {/* Footer Action Bar */}
          <div
            className={`flex items-center gap-2 pt-2 mt-2 border-t ${
              isUser ? 'border-emerald-400/30 text-emerald-100' : 'border-gray-100 text-gray-400'
            } text-[10px] justify-between select-none`}
          >
            <div className="flex items-center gap-1.5">
              {!isUser && message.model && (
                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono text-[9px] font-medium border border-gray-200">
                  {message.model}
                </span>
              )}
              <span>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="flex items-center gap-1">
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

              {message.content && (
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  title="Скопировать сообщение целиком"
                  className={`p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 ${
                    isUser
                      ? 'hover:bg-emerald-700/80 hover:text-white'
                      : 'hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {copiedMsg ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-500 font-semibold">Скопировано</span>
                    </>
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
