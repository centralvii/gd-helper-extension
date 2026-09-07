import React, { useState, useEffect } from 'react';
import { User, Tag, Sparkles, Check, RotateCcw, Copy, CornerDownLeft } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlgorithmHeaderSettings, ImplementationTask } from '../../types';
import {
  DEFAULT_ALGORITHM_HEADER_SETTINGS,
  formatAlgorithmHeaderComment,
} from '../../constants/algorithmHeader';

interface AlgorithmHeaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlgorithmHeaderSettings;
  onSave: (newSettings: AlgorithmHeaderSettings) => void;
  currentTask?: ImplementationTask;
}

export const AlgorithmHeaderSettingsModal: React.FC<AlgorithmHeaderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  currentTask,
}) => {
  const [author, setAuthor] = useState(settings.author);
  const [defaultRelease, setDefaultRelease] = useState(settings.defaultRelease || '');
  const [insertNewline, setInsertNewline] = useState(settings.insertNewline);
  const [copiedPreview, setCopiedPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAuthor(settings.author || DEFAULT_ALGORITHM_HEADER_SETTINGS.author);
      setDefaultRelease(settings.defaultRelease || '');
      setInsertNewline(settings.insertNewline ?? true);
      setCopiedPreview(false);
    }
  }, [isOpen, settings]);

  const previewComment = formatAlgorithmHeaderComment({
    author,
    taskNumber: currentTask?.taskNumber || 'TASK-1234',
    releaseNumber: currentTask?.releaseNumber || defaultRelease || '11-2026',
  });

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewComment + (insertNewline ? '\n' : ''));
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const handleReset = () => {
    setAuthor(DEFAULT_ALGORITHM_HEADER_SETTINGS.author);
    setDefaultRelease('');
    setInsertNewline(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      author: author.trim() || 'Кучин В.В.',
      defaultRelease: defaultRelease.trim(),
      insertNewline,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройки шапки алгоритма"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Сброс
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Отмена
            </Button>
            <Button
              variant="emerald"
              size="sm"
              onClick={handleSave}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Сохранить
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Author Field */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>Фамилия и инициалы</span>
          </label>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Кучин В.В."
            required
          />
          <span className="text-[10.5px] text-slate-400 mt-1 block">
            Укажите вашу фамилию и инициалы, которые будут автоматически подставляться во все комментарии к алгоритмам.
          </span>
        </div>

        {/* Default Release */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Номер релиза по умолчанию (опционально)</span>
          </label>
          <Input
            value={defaultRelease}
            onChange={(e) => setDefaultRelease(e.target.value)}
            placeholder="11-2026"
          />
          <span className="text-[10.5px] text-slate-400 mt-1 block">
            Используется в комментариях, если у текущей задачи реализации не заполнен номер релиза.
          </span>
        </div>

        {/* Insert Newline Toggle */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-bold text-[11.5px] text-slate-800 flex items-center gap-1.5">
              <CornerDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Перенос строки после комментария</span>
            </span>
            <span className="text-[10.5px] text-slate-500 block">
              Автоматически нажимать Enter, чтобы код алгоритма начинался со следующей строки
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={insertNewline}
              onChange={(e) => setInsertNewline(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Live Preview Box */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Предпросмотр шапки алгоритма:</span>
            </span>

            <button
              type="button"
              onClick={handleCopyPreview}
              className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              {copiedPreview ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Копировать</span>
                </>
              )}
            </button>
          </div>

          <div className="p-2 rounded-lg bg-white border border-emerald-200 text-emerald-950 font-mono text-xs select-all break-all shadow-2xs">
            {previewComment}
          </div>

          <p className="text-[10px] text-emerald-700 leading-normal">
            💡 Номер задачи (<code>{currentTask?.taskNumber || 'TASK-1234'}</code>) и номер релиза берутся автоматически из текущей карточки реализации.
          </p>
        </div>
      </form>
    </Modal>
  );
};
