import React, { useState } from 'react';
import { FileText, Eye, Check } from 'lucide-react';
import { Modal, Button, SegmentedControl, Textarea } from '../ui';
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
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <SegmentedControl<'edit' | 'preview'>
            value={activeTab}
            onChange={setActiveTab}
            options={[
              {
                value: 'edit',
                label: 'Редактирование',
                icon: <FileText className="w-3.5 h-3.5" />,
              },
              {
                value: 'preview',
                label: 'Предпросмотр README.txt',
                icon: <Eye className="w-3.5 h-3.5" />,
              },
            ]}
          />
        </div>

        {activeTab === 'edit' ? (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500">
              Введите общий текст примечаний к релизу / обновлению. Описания отдельных файлов добавятся автоматически перед вашим текстом.
            </p>
            <Textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Например: Обновление конфигурации и сценариев GreenData..."
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500">
              Так будет выглядеть итоговый файл <code className="text-emerald-700 font-bold font-mono">README.txt</code> внутри ZIP архива:
            </p>
            <pre className="w-full max-h-64 overflow-y-auto bg-slate-50/80 border border-slate-200 rounded-xl p-3 font-mono text-[11px] text-slate-800 whitespace-pre-wrap select-all shadow-2xs">
              {previewOutput || '(Файл README.txt пуст)'}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};
