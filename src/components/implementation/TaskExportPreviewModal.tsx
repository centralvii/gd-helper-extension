import React, { useState } from 'react';
import { Check, Download, FileText, Code, FileJson } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ImplementationTask, BuildPackage } from '../../types';
import { formatTaskToMarkdown } from '../../utils/tabUtils';
import saveAs from 'file-saver';

interface TaskExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ImplementationTask | null;
  packages?: BuildPackage[];
}

export const TaskExportPreviewModal: React.FC<TaskExportPreviewModalProps> = ({
  isOpen,
  onClose,
  task,
  packages = [],
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!task) return null;

  const linkedPkgs = packages.filter((p) => p.taskId === task.id);
  const markdownText = formatTaskToMarkdown({
    ...task,
    linkedPackages: linkedPkgs.map((p) => ({ name: p.name, files: p.files })),
  });

  const jsonBackupString = JSON.stringify(
    {
      version: '1.0',
      type: 'gd_single_task_backup',
      exportedAt: Date.now(),
      task,
    },
    null,
    2
  );

  const handleCopy = (format: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleDownloadMd = () => {
    const filename = `${task.taskNumber || 'task'}_implementation.md`;
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, filename);
  };

  const handleDownloadJson = () => {
    const safeNum = (task.taskNumber || 'task').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `gd_realization_${safeNum}.json`;
    const blob = new Blob([jsonBackupString], { type: 'application/json;charset=utf-8' });
    saveAs(blob, filename);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Экспорт и копирование описания реализации"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownloadMd}
            >
              Скачать .md
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileJson className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={handleDownloadJson}
            >
              Скачать .json
            </Button>
          </div>
          <Button variant="emerald" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5 text-xs">
        {/* Quick action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => handleCopy('md', markdownText)}
            className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl transition-all font-semibold text-xs shadow-2xs cursor-pointer"
          >
            {copiedFormat === 'md' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Code className="w-4 h-4 text-emerald-600" />
                <span>Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              const plainText = markdownText
                .replace(/^##+\s*/gm, '')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
              handleCopy('plain', plainText);
            }}
            className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl transition-all font-semibold text-xs shadow-2xs cursor-pointer"
          >
            {copiedFormat === 'plain' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Чистый текст</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleCopy('json', jsonBackupString)}
            className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 rounded-xl transition-all font-semibold text-xs shadow-2xs cursor-pointer"
          >
            {copiedFormat === 'json' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <FileJson className="w-4 h-4 text-emerald-600" />
                <span>JSON бэкап</span>
              </>
            )}
          </button>
        </div>

        {/* Content Viewer */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-700 text-[11px]">
              Предпросмотр сформированного описания:
            </span>
            <span className="text-[10px] text-slate-400">
              {markdownText.split('\n').length} строк • {markdownText.length} символов
            </span>
          </div>

          <pre className="p-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl text-slate-900 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto select-all shadow-2xs">
            {markdownText || '(Описание пока пусто)'}
          </pre>
        </div>
      </div>
    </Modal>
  );
};
