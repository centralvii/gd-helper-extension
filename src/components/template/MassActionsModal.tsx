import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Sparkles, Tag } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-2.5">
          <p className="text-emerald-950 text-[11px] leading-relaxed">
            Значения тегов автоматически подставляются в шаблон имени файлов (например,{' '}
            <span className="font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300">{'{type}'}</span>,{' '}
            <span className="font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300">{'{module}'}</span>,{' '}
            <span className="font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300">{'{task}'}</span>
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
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs hover:border-emerald-300 transition-colors"
              >
                {/* Left label & quick buttons */}
                <div className="sm:w-36 flex-shrink-0 flex items-center justify-between sm:block">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="font-mono text-emerald-800 font-bold text-xs">
                      {`{${v.key}}`}
                    </span>
                    {v.label && v.label !== v.key && (
                      <span className="text-[10px] text-gray-500 truncate block">
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
                      className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
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
                        ? 'Например: Core, Auth, Billing'
                        : `Значение для {${v.key}}`
                    }
                    value={currentVal}
                    onChange={(e) => handleValueChange(v.key, e.target.value)}
                    className="w-full bg-gray-50/60 focus:bg-white border border-gray-200 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs font-medium transition-colors"
                  />
                </div>

                {/* Delete custom variable (keep default system tags) */}
                {!['type', 'module', 'task'].includes(v.key) && (
                  <button
                    type="button"
                    onClick={() => onRemoveVariable(v.key)}
                    title="Удалить переменную"
                    className="icon-btn icon-btn--danger p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex-shrink-0 self-end sm:self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Variable Form */}
        <form
          onSubmit={handleAddNewVariable}
          className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-end gap-2"
        >
          <div className="flex-1">
            <Input
              label="Добавить новый тег (переменную)"
              placeholder="например: author, release, sprint"
              value={newVarKey}
              onChange={(e) => setNewVarKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={!newVarKey.trim()}
            leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
            className="self-end"
          >
            Добавить тег
          </Button>
        </form>
      </div>
    </Modal>
  );
};
