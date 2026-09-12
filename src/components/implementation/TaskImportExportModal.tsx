import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Copy,
  Check,
  FileJson,
  FileCode,
  AlertCircle,
  Sparkles,
  Archive,
  FolderPlus,
  ArrowDownToLine,
} from 'lucide-react';
import { Modal, Button, SegmentedControl, Textarea } from '../ui';
import { ImplementationTask } from '../../types';
import { parseTasksFromImport } from '../../hooks/useImplementationTasks';
import saveAs from 'file-saver';

interface TaskImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: ImplementationTask[];
  activeTask: ImplementationTask | null;
  onImport: (
    importedTasks: ImplementationTask[],
    mode: 'merge' | 'replace' | 'update_active',
    targetTaskId?: string
  ) => { success: boolean; count: number; error?: string };
  defaultTab?: 'export' | 'import';
}

export const TaskImportExportModal: React.FC<TaskImportExportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  activeTask,
  onImport,
  defaultTab = 'export',
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(defaultTab);

  // ── Export State ──
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [copiedExport, setCopiedExport] = useState(false);

  // ── Import State ──
  const [importJsonText, setImportJsonText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace' | 'update_active'>('merge');
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse live JSON text in Import tab
  const parsedImport = importJsonText.trim()
    ? parseTasksFromImport(importJsonText)
    : null;

  // Prepare Export JSON string
  const getExportJSON = () => {
    if (exportScope === 'current' && activeTask) {
      const payload = {
        version: '1.0',
        type: 'gd_single_task_backup',
        exportedAt: Date.now(),
        exportDate: new Date().toISOString(),
        task: activeTask,
      };
      return JSON.stringify(payload, null, 2);
    } else {
      const payload = {
        version: '1.0',
        type: 'gd_implementation_backup',
        exportedAt: Date.now(),
        exportDate: new Date().toISOString(),
        totalTasks: tasks.length,
        tasks: tasks,
      };
      return JSON.stringify(payload, null, 2);
    }
  };

  const exportJSONString = getExportJSON();

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportJSONString);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleDownloadExport = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    let filename = `gd_tasks_backup_${dateStr}.json`;
    if (exportScope === 'current' && activeTask) {
      const safeNum = (activeTask.taskNumber || 'task').replace(/[^a-zA-Z0-9_-]/g, '_');
      filename = `gd_realization_${safeNum}_${dateStr}.json`;
    }

    const blob = new Blob([exportJSONString], { type: 'application/json;charset=utf-8' });
    saveAs(blob, filename);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
        setImportStatus(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteImport = () => {
    if (!parsedImport || !parsedImport.valid || parsedImport.tasks.length === 0) {
      setImportStatus({
        type: 'error',
        message: parsedImport?.error || 'Не удалось распознать задачи в JSON',
      });
      return;
    }

    const result = onImport(parsedImport.tasks, importMode, activeTask?.id);
    if (result.success) {
      setImportStatus({
        type: 'success',
        message: `Успешно импортировано задач: ${result.count}!`,
      });
      setTimeout(() => {
        onClose();
        setImportJsonText('');
        setImportStatus(null);
      }, 1200);
    } else {
      setImportStatus({
        type: 'error',
        message: result.error || 'Произошла ошибка при импорте',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Резервное копирование, Экспорт и Импорт реализации"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-400">
            Формат данных: JSON (совместим с резервными копиями GD Helper)
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Navigation Tabs */}
        <div className="w-full">
          <SegmentedControl<'export' | 'import'>
            value={activeTab}
            onChange={setActiveTab}
            size="md"
            className="w-full flex"
            options={[
              {
                value: 'export',
                label: 'Экспорт / Сохранить в файл',
                icon: <Download className="w-4 h-4 text-emerald-600" />,
              },
              {
                value: 'import',
                label: 'Импорт / Загрузить обратно',
                icon: <Upload className="w-4 h-4 text-emerald-600" />,
              },
            ]}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 1: EXPORT ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'export' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Scope Selection */}
            <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Что экспортировать:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportScope('current')}
                  disabled={!activeTask}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    exportScope === 'current'
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                  } ${!activeTask ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FileCode className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs truncate">
                      {activeTask?.taskNumber || 'Текущая задача'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {activeTask?.title || 'Без названия'} • {activeTask?.items.length || 0} пунктов
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    exportScope === 'all'
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                  }`}
                >
                  <Archive className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs">Все задачи ({tasks.length})</div>
                    <div className="text-[10px] text-slate-500">
                      Полный бэкап всех задач реализации
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                variant="emerald"
                size="md"
                onClick={handleDownloadExport}
                leftIcon={<ArrowDownToLine className="w-4 h-4" />}
                className="justify-center"
              >
                Скачать .json файл
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyExport}
                leftIcon={copiedExport ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                className="justify-center"
              >
                {copiedExport ? 'Скопировано в буфер!' : 'Скопировать JSON'}
              </Button>
            </div>

            {/* JSON Code Viewer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5 text-emerald-600" />
                  Предпросмотр JSON структуры:
                </span>
                <span>{exportJSONString.split('\n').length} строк</span>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 border border-slate-800 rounded-2xl font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto select-all">
                {exportJSONString}
              </pre>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 2: IMPORT ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'import' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* File Upload Zone */}
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center hover:border-emerald-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
                id="task-json-file-input"
              />
              <FileJson className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
              <div className="font-bold text-slate-800 text-xs mb-1">
                Выберите файл .json или перетащите его сюда
              </div>
              <label
                htmlFor="task-json-file-input"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer mt-1"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Выбрать файл с диска</span>
              </label>
            </div>

            {/* Direct Paste Textarea */}
            <Textarea
              label="Или вставьте JSON текст напрямую:"
              value={importJsonText}
              onChange={(e) => {
                setImportJsonText(e.target.value);
                setImportStatus(null);
              }}
              placeholder='Вставьте JSON резервной копии (например: { "tasks": [...] } или { "taskNumber": "TASK-101", ... })'
              rows={4}
              showClear
              onClear={() => {
                setImportJsonText('');
                setImportStatus(null);
              }}
              className="font-mono text-[11px]"
            />

            {/* Validation & Preview Box */}
            {parsedImport && (
              <div className="space-y-2.5">
                {parsedImport.valid ? (
                  <div className="p-3 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl space-y-2 animate-slide-down shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-emerald-950">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Файл корректен! Найдено задач: {parsedImport.tasks.length}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10.5px] font-bold">
                        {parsedImport.tasks.reduce((sum, t) => sum + t.items.length, 0)} пунктов изменений
                      </span>
                    </div>

                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {parsedImport.tasks.map((t, idx) => (
                        <div
                          key={t.id || idx}
                          className="flex items-center justify-between gap-2 p-1.5 bg-white/80 border border-emerald-100 rounded-xl text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="font-bold text-emerald-900 flex-shrink-0">
                              {t.taskNumber}:
                            </span>
                            <span className="truncate text-slate-800 font-medium">
                              {t.title}
                            </span>
                          </div>
                          <span className="text-slate-500 text-[10px] flex-shrink-0">
                            {t.items.length} изм. • {t.sections?.length || 0} разд.
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-900 animate-slide-down">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">Ошибка в структуре данных</div>
                      <div className="text-[11px] text-rose-700">{parsedImport.error}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import Mode Radio Options (Visible when valid) */}
            {parsedImport?.valid && (
              <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Режим импорта:
                </label>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="import-mode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-xs">
                        ➕ Добавить к существующим задачам (Merge)
                      </div>
                      <div className="text-[10.5px] text-slate-500">
                        Текущие задачи сохранятся, новые задачи будут добавлены в список
                      </div>
                    </div>
                  </label>

                  {parsedImport.tasks.length === 1 && activeTask && (
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all">
                      <input
                        type="radio"
                        name="import-mode"
                        value="update_active"
                        checked={importMode === 'update_active'}
                        onChange={() => setImportMode('update_active')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-xs">
                          ✏️ Обновить текущую открытую задачу ({activeTask.taskNumber})
                        </div>
                        <div className="text-[10.5px] text-slate-500">
                          Заменит разделы и пункты только в текущей открытой задаче
                        </div>
                      </div>
                    </label>
                  )}

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-rose-300 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="import-mode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-rose-950 text-xs">
                        🔄 Заменить все задачи (Полное восстановление)
                      </div>
                      <div className="text-[10.5px] text-rose-700">
                        Внимание: текущий список задач будет полностью перезаписан
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Status Message */}
            {importStatus && (
              <div
                className={`p-3 rounded-2xl flex items-center gap-2 font-bold text-xs animate-fade-in ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                    : 'bg-rose-100 text-rose-950 border border-rose-300'
                }`}
              >
                {importStatus.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}

            {/* Execute Import Button */}
            <Button
              variant="emerald"
              size="md"
              disabled={!parsedImport?.valid}
              onClick={handleExecuteImport}
              leftIcon={<Upload className="w-4 h-4" />}
              className="w-full justify-center"
            >
              Импортировать {parsedImport?.valid ? `(${parsedImport.tasks.length} зад.)` : ''}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
