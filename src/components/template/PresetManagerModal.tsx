import React, { useState } from 'react';
import { Plus, Trash2, Check, Sparkles, Star } from 'lucide-react';
import { Modal, Button, Input, IconButton } from '../ui';
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
              className={`flex items-center justify-between gap-3 p-2.5 rounded-2xl border transition-colors shadow-2xs ${
                preset.isPrimary
                  ? 'bg-amber-50/80 border-amber-300'
                  : 'bg-white border-slate-200/90 hover:border-emerald-300'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs truncate">
                  <span className="truncate">{preset.name}</span>
                  {preset.isPrimary && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-semibold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Основной
                    </span>
                  )}
                </div>
                <div className="font-mono text-[11px] font-bold text-emerald-700 truncate">
                  {preset.template}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!preset.isPrimary && (
                  <IconButton
                    size="xs"
                    variant="ghost"
                    onClick={() => onSetPresetAsPrimary(preset.id)}
                    title="Сделать основным шаблоном по умолчанию"
                    icon={<Star className="w-3.5 h-3.5 text-slate-400 hover:text-amber-600" />}
                  />
                )}
                <Button
                  variant="secondary"
                  size="xs"
                  leftIcon={<Check className="w-3 h-3 text-emerald-600" />}
                  onClick={() => {
                    onLoadPreset(preset);
                    onClose();
                  }}
                >
                  Применить
                </Button>
                {!preset.isDefault && (
                  <IconButton
                    size="xs"
                    variant="danger"
                    onClick={() => onDeletePreset(preset.id)}
                    title="Удалить пресет"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Save Current Template */}
        <form onSubmit={handleSave} className="pt-3 border-t border-gray-100 space-y-2.5">
          <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
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
            <span className="font-mono text-gray-500 truncate max-w-[240px]">
              Текущий: {currentTemplate}
            </span>
            <label className="flex items-center gap-1.5 text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={setAsPrimary}
                onChange={(e) => setSetAsPrimary(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Сделать основным</span>
            </label>
          </div>
        </form>
      </div>
    </Modal>
  );
};
