import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Sparkles, Tag } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { VariableDefinition } from '../../types';

interface MassActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: VariableDefinition[];
  variableValues: Record<string, string>;
  linkedTask?: { taskNumber: string } | null;
  onApplyMassVariables: (values: Record<string, string>) => void;
  onAddVariable: (key: string, label?: string) => void;
  onRemoveVariable: (key: string) => void;
}

export const MassActionsModal: React.FC<MassActionsModalProps> = ({
  isOpen,
  onClose,
  variables,
  variableValues,
  linkedTask,
  onApplyMassVariables,
  onAddVariable,
  onRemoveVariable,
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>(variableValues);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarLabel, setNewVarLabel] = useState('');

  // Sync values when modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormValues(variableValues);
    }
  }, [isOpen, variableValues]);

  const handleValueChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddNewVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarKey.trim()) return;
    const cleanKey = newVarKey.trim().replace(/[^a-zA-Z0-9_]/g, '');
    onAddVariable(cleanKey, newVarLabel.trim() || cleanKey);
    setNewVarKey('');
    setNewVarLabel('');
  };

  const handleSaveAndApply = () => {
    onApplyMassVariables(formValues);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Массовые действия и значения тегов"
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
            onClick={handleSaveAndApply}
          >
            Применить ко всем файлам
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-3 shadow-2xs">
          <p className="text-emerald-950 text-[11px] leading-relaxed font-medium">
            Значения тегов автоматически подставляются в шаблон имени файлов (например,{' '}
            <span className="font-mono font-bold text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-300">{'{type}'}</span>,{' '}
            <span className="font-mono font-bold text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-300">{'{module}'}</span>,{' '}
            <span className="font-mono font-bold text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-300">{'{task}'}</span>
            ) для всех файлов активного пакета.
          </p>
        </div>

        {/* List of current variables / tags */}
        <div className="space-y-2">
          {variables.map((v) => {
            const currentVal = formValues[v.key] ?? variableValues[v.key] ?? '';
            const isType = v.key === 'type';
            const isTask = v.key === 'task';
            const isModule = v.key === 'module';

            return (
              <div
                key={v.key}
                className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all"
              >
                {/* Left label & quick buttons */}
                <div className="sm:w-36 flex-shrink-0 flex items-center justify-between sm:block">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="font-mono text-emerald-800 font-bold text-xs">
                      {`{${v.key}}`}
                    </span>
                    {v.label && v.label !== v.key && (
                      <span className="text-[10px] text-slate-500 truncate block">
                        ({v.label})
                      </span>
                    )}
                  </div>

                  {/* Fast prefill for {task} */}
                  {isTask && linkedTask && currentVal !== linkedTask.taskNumber && (
                    <button
                      type="button"
                      onClick={() => handleValueChange('task', linkedTask.taskNumber)}
                      title={`Вставить номер связанной задачи ${linkedTask.taskNumber}`}
                      className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 hover:bg-emerald-200 transition-all shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-700" />
                      <span>+{linkedTask.taskNumber}</span>
                    </button>
                  )}
                </div>

                {/* Input field */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={
                      isType
                        ? 'Например: algo, form, struct...'
                        : isTask
                        ? 'Например: FINAPP-5638'
                        : isModule
                        ? 'Например: CORE, FIN, CRM'
                        : `Значение для {${v.key}}...`
                    }
                    value={currentVal}
                    onChange={(e) => handleValueChange(v.key, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>

                {/* Delete custom variable button */}
                {!['type', 'module', 'task'].includes(v.key) && (
                  <button
                    type="button"
                    onClick={() => onRemoveVariable(v.key)}
                    title={`Удалить тег {${v.key}}`}
                    className="icon-btn icon-btn--danger p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl flex-shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add custom tag section */}
        <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-2.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            + Добавить свой тег (переменную):
          </span>
          <form onSubmit={handleAddNewVariable} className="flex gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Имя тега (напр. version)"
                value={newVarKey}
                onChange={(e) => setNewVarKey(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500 shadow-2xs"
              />
              <input
                type="text"
                placeholder="Описание (необязательно)"
                value={newVarLabel}
                onChange={(e) => setNewVarLabel(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={!newVarKey.trim()}
              leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Добавить
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
