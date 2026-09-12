import React from 'react';
import {
  Package,
  FileText,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ImplementationTask, BuildPackage } from '../../types';

interface TaskSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ImplementationTask;
  packages?: BuildPackage[];
  onUpdateTask: (id: string, updates: Partial<Omit<ImplementationTask, 'id' | 'createdAt'>>) => void;
  onNavigateToPackage?: (pkgId: string) => void;
}

export const TaskSettingsModal: React.FC<TaskSettingsModalProps> = ({
  isOpen,
  onClose,
  task,
  packages = [],
  onUpdateTask,
  onNavigateToPackage,
}) => {
  const linkedPackages = packages.filter((p) => p.taskId === task.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Параметры реализации"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            variant="emerald"
            size="sm"
            onClick={onClose}
            leftIcon={<Check className="w-3.5 h-3.5 text-white" />}
          >
            Готово
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Task Number & Release Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Номер задачи
            </label>
            <Input
              value={task.taskNumber}
              onChange={(e) => onUpdateTask(task.id, { taskNumber: e.target.value })}
              placeholder="FINAPP-5638"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Номер релиза
            </label>
            <Input
              value={task.releaseNumber || ''}
              onChange={(e) => onUpdateTask(task.id, { releaseNumber: e.target.value })}
              placeholder="12-2026"
            />
          </div>
        </div>

        {/* Task Title */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Название задачи
          </label>
          <Input
            value={task.title}
            onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
            placeholder="Например: Светофор ченджи"
          />
        </div>

        {/* ── Linked Packages Row (1 Task -> N Packages) ── */}
        <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between gap-1.5 font-bold text-emerald-950 text-[11px] min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Package className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Пакеты сборки</span>
            </div>
            {linkedPackages.length > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-md font-bold text-[10px]">
                {linkedPackages.length}
              </span>
            )}
          </div>

          {/* Linked package list */}
          <div className="space-y-1">
            {linkedPackages.length === 0 ? (
              <div className="px-1 py-1 text-[10.5px] text-slate-400 italic">
                Нет привязанных пакетов. Пакеты привязываются во вкладке «Упаковка».
              </div>
            ) : (
              linkedPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => {
                    if (onNavigateToPackage) {
                      onNavigateToPackage(pkg.id);
                      onClose();
                    }
                  }}
                  title={`Открыть пакет "${pkg.name}" во вкладке Упаковка`}
                  className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 font-bold text-xs transition-all shadow-2xs group cursor-pointer"
                >
                  <span className="font-mono text-emerald-800 truncate min-w-0 flex-1 text-left">
                    {pkg.name}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-slate-500 text-[10px]">({pkg.files.length} ф.)</span>
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 text-emerald-600" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Task Summary / Description */}
        <div>
          <div className="flex items-center justify-between mb-1 gap-2">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 whitespace-nowrap">
              <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Описание / Заметка</span>
            </label>
            <span className="text-[10px] text-slate-400 whitespace-nowrap truncate">
              Краткая суть и детали
            </span>
          </div>
          <textarea
            value={task.summary}
            onChange={(e) => onUpdateTask(task.id, { summary: e.target.value })}
            placeholder="Опишите общую суть решения, архитектурные особенности или примечания для тестировщиков..."
            rows={4}
            className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs resize-y transition-all shadow-2xs"
          />
        </div>
      </div>
    </Modal>
  );
};
