import React, { useState } from 'react';
import { Bot, User, Copy, Check, ChevronDown, ChevronUp, Brain, AlertCircle } from 'lucide-react';
import { AiChatMessage } from '../../types';

interface AiMessageItemProps {
  message: AiChatMessage;
  onRetry?: () => void;
}

export const AiMessageItem: React.FC<AiMessageItemProps> = ({ message, onRetry }) => {
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

  // Helper to parse content into text and code blocks
  const renderFormattedContent = (content: string) => {
    if (!content) {
      if (message.isStreaming) {
        return (
          <div className="flex items-center gap-1 py-1 text-xs text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ИИ формулирует ответ...</span>
          </div>
        );
      }
      return null;
    }

    // Split by code fences ```lang ... ```
    const parts = content.split(/(```[\s\S]*?```)/g);
    let codeBlockCounter = 0;

    return (
      <div className="space-y-2 text-xs leading-relaxed break-words">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const currentIdx = codeBlockCounter++;
            const lines = part.slice(3, -3).split('\n');
            const language = lines[0].trim() || 'code';
            const code = (lines[0].trim() ? lines.slice(1) : lines).join('\n');

            return (
              <div
                key={index}
                className="my-2 rounded-xl overflow-hidden border border-gray-800 bg-[#1e232a] text-gray-100 shadow-md font-mono text-[11px]"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#14181d] border-b border-gray-800 text-[10px] text-gray-400">
                  <span className="font-semibold text-emerald-400 lowercase">{language}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(code, currentIdx)}
                    className="inline-flex items-center gap-1 text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {copiedCodeIdx === currentIdx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Скопировано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Копировать код</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto select-all leading-5 text-gray-200">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          // Format regular text (headers, bold, lists, inline code)
          const textLines = part.split('\n');
          return (
            <div key={index} className="space-y-1">
              {textLines.map((line, lIdx) => {
                const trimmed = line.trim();

                // Headers
                if (trimmed.startsWith('### ')) {
                  return (
                    <h4 key={lIdx} className="font-bold text-gray-900 text-xs mt-2 mb-1">
                      {renderInlineFormatting(trimmed.slice(4))}
                    </h4>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h3 key={lIdx} className="font-bold text-gray-900 text-[13px] mt-2 mb-1">
                      {renderInlineFormatting(trimmed.slice(3))}
                    </h3>
                  );
                }
                if (trimmed.startsWith('# ')) {
                  return (
                    <h2 key={lIdx} className="font-bold text-gray-900 text-sm mt-2 mb-1">
                      {renderInlineFormatting(trimmed.slice(2))}
                    </h2>
                  );
                }

                // Bullet items
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-1.5 ml-1">
                      <span className="text-emerald-600 font-bold text-xs mt-0.5">•</span>
                      <span className="flex-1">{renderInlineFormatting(trimmed.slice(2))}</span>
                    </div>
                  );
                }

                // Numbered list: 1. 2. etc
                const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
                if (numMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-1.5 ml-1">
                      <span className="text-emerald-700 font-bold text-[11px] min-w-[14px]">
                        {numMatch[1]}.
                      </span>
                      <span className="flex-1">{renderInlineFormatting(numMatch[2])}</span>
                    </div>
                  );
                }

                // Empty line
                if (!trimmed) {
                  return <div key={lIdx} className="h-1" />;
                }

                // Normal line
                return (
                  <p key={lIdx} className="text-gray-800">
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
    // Split by `inline code`
    const codeParts = text.split(/(`[^`]+`)/g);

    return codeParts.map((cp, idx) => {
      if (cp.startsWith('`') && cp.endsWith('`') && cp.length > 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[11px] border border-emerald-200 font-semibold"
          >
            {cp.slice(1, -1)}
          </code>
        );
      }

      // Bold: **text**
      const boldParts = cp.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bp, bIdx) => {
        if (bp.startsWith('**') && bp.endsWith('**') && bp.length > 4) {
          return (
            <strong key={bIdx} className="font-bold text-gray-900">
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
      className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} group animate-fade-in`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs shadow-xs ${
          isUser
            ? 'bg-gradient-to-tr from-gray-800 to-gray-700 text-white'
            : message.error
            ? 'bg-rose-100 text-rose-600 border border-rose-200'
            : 'bg-emerald-600 text-white shadow-emerald-200/50'
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : message.error ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Card */}
      <div className={`max-w-[88%] min-w-[120px] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl p-3 shadow-xs ${
            isUser
              ? 'bg-emerald-600 text-white rounded-tr-xs'
              : message.error
              ? 'bg-rose-50/80 border border-rose-200 rounded-tl-xs'
              : 'bg-white border border-gray-200 rounded-tl-xs'
          }`}
        >
          {/* Reasoning / Thinking Block (DeepSeek R1 / Reasoning models) */}
          {!isUser && message.reasoningContent && (
            <div className="mb-2 rounded-xl bg-gray-50 border border-gray-200/80 overflow-hidden text-[11px]">
              <button
                type="button"
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-gray-500 hover:text-gray-800 bg-gray-100/50 font-medium transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-600" />
                  <span>Размышления модели</span>
                </div>
                {isThinkingOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              {isThinkingOpen && (
                <div className="p-2.5 text-gray-600 leading-relaxed font-mono whitespace-pre-wrap border-t border-gray-200 text-[10px] bg-white">
                  {message.reasoningContent}
                </div>
              )}
            </div>
          )}

          {/* Body */}
          {isUser ? (
            <div className="text-xs leading-relaxed whitespace-pre-wrap select-text font-normal">
              {message.content}
            </div>
          ) : (
            renderFormattedContent(message.content)
          )}

          {/* Streaming blinking cursor */}
          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-3 ml-1 bg-emerald-600 animate-pulse align-middle" />
          )}

          {/* Hover Action Bar */}
          <div
            className={`flex items-center gap-1 pt-1.5 mt-1 border-t ${
              isUser ? 'border-emerald-500/40 text-emerald-100' : 'border-gray-100 text-gray-400'
            } text-[10px] justify-between`}
          >
            <div className="flex items-center gap-1">
              {!isUser && message.model && (
                <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-mono text-[9px] border border-gray-200">
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
                  className="text-rose-600 hover:text-rose-700 font-semibold px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 transition-colors"
                >
                  Повторить запрос
                </button>
              )}

              {message.content && (
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  title="Скопировать сообщение"
                  className={`p-1 rounded transition-colors ${
                    isUser
                      ? 'hover:bg-emerald-700 hover:text-white'
                      : 'hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {copiedMsg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
