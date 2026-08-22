import React, { useState, useEffect } from 'react';
import { FileText, Check, Calendar, Clock, FileCode } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FileRow, VariableDefinition } from '../../types';

interface FileEditModalProps {
  file: FileRow | null;
  variables: VariableDefinition[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, cleanName: string, description: string, variables: Record<string, string>) => void;
}

export const FileEditModal: React.FC<FileEditModalProps> = ({
  file,
  variables,
  isOpen,
  onClose,
  onSave,
}) => {
  const [cleanName, setCleanName] = useState('');
  const [description, setDescription] = useState('');
  const [customVars, setCustomVars] = useState<Record<string, string>>({});

  useEffect(() => {
    if (file) {
      setCleanName(file.cleanName);
      setDescription(file.description || '');
      setCustomVars(file.variables || {});
    }
  }, [file]);

  if (!file) return null;

  const handleSave = () => {
    onSave(file.id, cleanName, description, customVars);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Редактирование файла #${file.order}`}
      maxWidth="md"
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
      <div className="space-y-4">
        {/* Original File Info */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Исходный файл:</span>
            <span className="font-mono text-slate-200 truncate">{file.originalName}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            {file.detectedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                {file.detectedDate}
              </span>
            )}
            {file.detectedTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {file.detectedTime}
              </span>
            )}
            <span>Порядок: #{file.order}</span>
          </div>
        </div>

        {/* Clean Name Input */}
        <Input
          label="Очищенное имя (без расширения)"
          value={cleanName}
          onChange={(e) => setCleanName(e.target.value)}
          placeholder="Например: Новая форма заявки"
        />

        {/* Custom Variables */}
        {variables.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Индивидуальные переменные файла:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {variables.map((v) => (
                <div key={v.key} className="flex items-center gap-2">
                  <span className="w-24 text-[11px] font-mono text-teal-400 truncate">{`{${v.key}}`}</span>
                  <input
                    type="text"
                    value={customVars[v.key] || ''}
                    placeholder="Значение для этого файла"
                    onChange={(e) =>
                      setCustomVars((prev) => ({ ...prev, [v.key]: e.target.value }))
                    }
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description for README */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Описание для README.txt</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание назначения скрипта/файла..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>
    </Modal>
  );
};
