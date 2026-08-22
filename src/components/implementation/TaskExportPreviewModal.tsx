import React, { useState } from 'react';
import { Check, Download, FileText, Code } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ImplementationTask } from '../../types';
import { formatTaskToMarkdown } from '../../utils/tabUtils';
import saveAs from 'file-saver';

interface TaskExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ImplementationTask | null;
}

export const TaskExportPreviewModal: React.FC<TaskExportPreviewModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!task) return null;

  const markdownText = formatTaskToMarkdown(task);

  const handleCopy = (format: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleDownload = () => {
    const filename = `${task.taskNumber || 'task'}_implementation.md`;
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, filename);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Экспорт и копирование описания реализации"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownload}
          >
            Скачать .md файл
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5 text-xs">
        {/* Quick action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => handleCopy('md', markdownText)}
            className="flex items-center justify-center gap-2 p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all font-medium text-xs shadow-sm"
          >
            {copiedFormat === 'md' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Скопировано в буфер!</span>
              </>
            ) : (
              <>
                <Code className="w-4 h-4 text-emerald-400" />
                <span>Копировать как Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              // Strip markdown formatting for plain text
              const plainText = markdownText
                .replace(/^##+\s*/gm, '')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
              handleCopy('plain', plainText);
            }}
            className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl transition-all font-medium text-xs shadow-sm"
          >
            {copiedFormat === 'plain' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Скопировано как текст!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-slate-300" />
                <span>Копировать чистый текст</span>
              </>
            )}
          </button>
        </div>

        {/* Content Viewer */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-300 text-[11px]">
              Предпросмотр сформированного описания:
            </span>
            <span className="text-[10px] text-slate-500">
              {markdownText.split('\n').length} строк • {markdownText.length} символов
            </span>
          </div>

          <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto select-all">
            {markdownText || '(Описание пока пусто)'}
          </pre>
        </div>
      </div>
    </Modal>
  );
};
