import React, { useState } from 'react';
import { Plus, Trash2, Check, Sparkles, Star } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TemplatePreset } from '../../types';

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: TemplatePreset[];
  currentTemplate: string;
  onLoadPreset: (preset: TemplatePreset) => void;
  onSavePreset: (name: string, isPrimary?: boolean) => void;
  onDeletePreset: (id: string) => void;
  onSetPresetAsPrimary: (id: string) => void;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  presets,
  currentTemplate,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
  onSetPresetAsPrimary,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [setAsPrimary, setSetAsPrimary] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSavePreset(newPresetName.trim(), setAsPrimary);
    setNewPresetName('');
    setSetAsPrimary(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Пресеты шаблонов"
      maxWidth="md"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Закрыть
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Preset List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-colors ${
                preset.isPrimary
                  ? 'bg-amber-950/20 border-amber-800/60'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-200 text-xs truncate">
                  <span className="truncate">{preset.name}</span>
                  {preset.isPrimary && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 font-normal">
                      <Star className="w-3 h-3 fill-amber-400" />
                      Основной
                    </span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-emerald-400 truncate">
                  {preset.template}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!preset.isPrimary && (
                  <button
                    onClick={() => onSetPresetAsPrimary(preset.id)}
                    title="Сделать основным шаблоном по умолчанию"
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <Button
                  variant="secondary"
                  size="xs"
                  leftIcon={<Check className="w-3 h-3 text-emerald-400" />}
                  onClick={() => {
                    onLoadPreset(preset);
                    onClose();
                  }}
                >
                  Применить
                </Button>
                {!preset.isDefault && (
                  <button
                    onClick={() => onDeletePreset(preset.id)}
                    title="Удалить пресет"
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Save Current Template */}
        <form onSubmit={handleSave} className="pt-3 border-t border-slate-800 space-y-2.5">
          <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Сохранить текущий шаблон как пресет</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Название нового пресета"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={!newPresetName.trim()}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Сохранить
            </Button>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-slate-400 truncate max-w-[240px]">
              Текущий: {currentTemplate}
            </span>
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={setAsPrimary}
                onChange={(e) => setSetAsPrimary(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <span>Сделать основным</span>
            </label>
          </div>
        </form>
      </div>
    </Modal>
  );
};
