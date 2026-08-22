import React, { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { VariableDefinition } from '../../types';

interface MassActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: VariableDefinition[];
  variableValues: Record<string, string>;
  onApplyMassVariables: (values: Record<string, string>) => void;
  onAddVariable: (key: string, label?: string) => void;
  onRemoveVariable: (key: string) => void;
}

export const MassActionsModal: React.FC<MassActionsModalProps> = ({
  isOpen,
  onClose,
  variables,
  variableValues,
  onApplyMassVariables,
  onAddVariable,
  onRemoveVariable,
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>(variableValues);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarLabel, setNewVarLabel] = useState('');

  const handleValueChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddNewVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarKey.trim()) return;
    onAddVariable(newVarKey, newVarLabel || newVarKey);
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
      title="Массовые значения переменных"
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
            Применить ко всем
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-600 text-xs">
          Значения переменных подставляются в шаблон вместо соответствующих тегов (например, <code className="text-emerald-700 font-mono font-bold">{'{module}'}</code>) для всех файлов.
        </p>

        {/* List of current variables */}
        <div className="space-y-2.5">
          {variables.map((v) => (
            <div
              key={v.key}
              className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200"
            >
              <div className="w-28 flex-shrink-0">
                <span className="font-mono text-emerald-700 font-bold text-xs">{`{${v.key}}`}</span>
                {v.label && v.label !== v.key && (
                  <span className="text-[10px] text-gray-500 block truncate">{v.label}</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={`Значение для {${v.key}}`}
                  value={formValues[v.key] ?? variableValues[v.key] ?? ''}
                  onChange={(e) => handleValueChange(v.key, e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveVariable(v.key)}
                title="Удалить переменную"
                className="icon-btn icon-btn--danger p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Variable Form */}
        <form
          onSubmit={handleAddNewVariable}
          className="pt-3 border-t border-gray-100 flex items-end gap-2"
        >
          <div className="flex-1">
            <Input
              label="Новая переменная (тег)"
              placeholder="например, author"
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
          >
            Добавить
          </Button>
        </form>
      </div>
    </Modal>
  );
};
