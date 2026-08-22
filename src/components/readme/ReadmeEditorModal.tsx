import React, { useState } from 'react';
import { FileText, Eye, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FileRow } from '../../types';
import { buildReadmeContent } from '../../core/zipHandler';

interface ReadmeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  readmeContent: string;
  files: FileRow[];
  onSaveReadme: (text: string) => void;
}

export const ReadmeEditorModal: React.FC<ReadmeEditorModalProps> = ({
  isOpen,
  onClose,
  readmeContent,
  files,
  onSaveReadme,
}) => {
  const [text, setText] = useState(readmeContent);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const previewOutput = buildReadmeContent(files, text);

  const handleSave = () => {
    onSaveReadme(text);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Редактор README.txt"
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="emerald"
            size="sm"
            leftIcon={<Check className="w-3.5 h-3.5" />}
            onClick={handleSave}
          >
            Сохранить
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'edit'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Редактирование
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'preview'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Предпросмотр README.txt
          </button>
        </div>

        {activeTab === 'edit' ? (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400">
              Введите общий текст примечаний к релизу / обновлению. Описания отдельных файлов добавятся автоматически перед вашим текстом.
            </p>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Например: Обновление конфигурации и сценариев GreenData..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 font-sans focus:border-emerald-500 focus:outline-none"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400">
              Так будет выглядеть итоговый файл <code className="text-emerald-400">README.txt</code> внутри ZIP архива:
            </p>
            <pre className="w-full max-h-64 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
              {previewOutput || '(Файл README.txt пуст)'}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};
