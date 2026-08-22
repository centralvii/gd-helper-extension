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
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'edit'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Редактирование
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'preview'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Предпросмотр README.txt
          </button>
        </div>

        {activeTab === 'edit' ? (
          <div className="space-y-2">
            <p className="text-[11px] text-gray-500">
              Введите общий текст примечаний к релизу / обновлению. Описания отдельных файлов добавятся автоматически перед вашим текстом.
            </p>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Например: Обновление конфигурации и сценариев GreenData..."
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-900 placeholder:text-gray-400 font-sans focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-gray-500">
              Так будет выглядеть итоговый файл <code className="text-emerald-700 font-bold font-mono">README.txt</code> внутри ZIP архива:
            </p>
            <pre className="w-full max-h-64 overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-[11px] text-gray-800 whitespace-pre-wrap select-all">
              {previewOutput || '(Файл README.txt пуст)'}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};
