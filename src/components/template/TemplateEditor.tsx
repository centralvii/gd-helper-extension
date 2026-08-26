import React, { useRef, useMemo } from 'react';
import {
  Sparkles,
  Hash,
  RotateCcw,
  Eye,
  Star,
  Wand2,
  Sliders,
} from 'lucide-react';
import { VariableDefinition, FileRow, ImplementationTask } from '../../types';

interface TemplateEditorProps {
  template: string;
  primaryTemplate: string;
  startNumber: number;
  variables: VariableDefinition[];
  variableValues?: Record<string, string>;
  firstFile?: FileRow;
  linkedTask?: ImplementationTask | null;
  onSetTemplate: (template: string) => void;
  onSetPrimaryTemplate: (template: string) => void;
  onSetStartNumber: (num: number) => void;
  onResetTemplate: () => void;
  onUpdateVariableValue?: (key: string, value: string) => void;
  onOpenMassActions?: () => void;
}

const BUILT_IN_TAGS = [
  { tag: '{indexPad6}', desc: '000001 (номер 6 знаков)' },
  { tag: '{cleanName}', desc: 'Очищенное имя' },
  { tag: '{type}', desc: 'Тип (ДО/ПОСЛЕ)' },
  { tag: '{module}', desc: 'Модуль' },
  { tag: '{task}', desc: 'Задача (GD-...)' },
  { tag: '{date}', desc: 'YYYY-MM-DD' },
  { tag: '{time}', desc: 'HH-MM-SS' },
  { tag: '{index}', desc: '1 (без нулей)' },
  { tag: '{originalName}', desc: 'Исходное имя' },
];

const FIXED_SYSTEM_TAGS = new Set([
  'index',
  'indexPad6',
  'originalName',
  'extension',
  'date',
  'time',
  'cleanName',
]);

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  primaryTemplate,
  startNumber,
  variables,
  variableValues = {},
  firstFile,
  linkedTask,
  onSetTemplate,
  onSetPrimaryTemplate,
  onSetStartNumber,
  onResetTemplate,
  onUpdateVariableValue,
  onOpenMassActions,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPrimary = template.trim() === primaryTemplate.trim();

  // Find all variable/custom tags present in the current template
  const usedVarKeys = useMemo(() => {
    const matches = template.match(/\{([a-zA-Z0-9_-]+)\}/g) || [];
    const keys: string[] = [];
    matches.forEach((m) => {
      const key = m.slice(1, -1);
      if (!FIXED_SYSTEM_TAGS.has(key) && !keys.includes(key)) {
        keys.push(key);
      }
    });
    return keys;
  }, [template]);

  const insertTag = (tag: string) => {
    if (!inputRef.current) {
      onSetTemplate(template + tag);
      return;
    }

    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    const nextVal =
      template.substring(0, start) + tag + template.substring(end);
    onSetTemplate(nextVal);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(
          start + tag.length,
          start + tag.length
        );
      }
    }, 10);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/70 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span>Шаблон имени</span>

            {isPrimary ? (
              <span
                title="Этот шаблон выбран основным и применяется всегда по умолчанию"
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
              >
                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                Основной
              </span>
            ) : (
              <button
                onClick={() => onSetPrimaryTemplate(template)}
                title="Сделать текущий шаблон основным по умолчанию"
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600 transition-colors hover:border-amber-400 hover:text-amber-700"
              >
                <Star className="h-2.5 w-2.5" />
                Сделать основным
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 shadow-sm">
            <label className="flex items-center gap-1 text-[11px] text-gray-500">
              <Hash className="h-3 w-3 text-gray-400" />
              <span>Старт</span>
            </label>
            <input
              type="number"
              min={1}
              value={startNumber}
              onChange={(e) =>
                onSetStartNumber(parseInt(e.target.value, 10) || 1)
              }
              className="w-12 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-center text-xs font-semibold text-gray-900 outline-none transition-colors focus:border-emerald-500 focus:bg-white"
            />
            <button
              onClick={onResetTemplate}
              title="Сбросить к основному шаблону"
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3">
        {/* Main Template Input */}
        <div className="relative">
          <Wand2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-600" />
          <input
            ref={inputRef}
            type="text"
            value={template}
            onChange={(e) => onSetTemplate(e.target.value)}
            placeholder="{indexPad6}_{type}_{module}_{task}_{cleanName}"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-3 py-2 font-mono text-xs font-semibold text-emerald-700 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Clickable Tag Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            <span>Быстрая вставка тегов</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {BUILT_IN_TAGS.map(({ tag, desc }) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertTag(tag)}
                title={`${tag} — ${desc}`}
                className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-[11px] font-medium text-gray-700 transition-all duration-150 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {tag}
              </button>
            ))}

            {variables
              .filter((v) => !['type', 'module', 'task'].includes(v.key))
              .map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertTag(`{${v.key}}`)}
                  title={`Пользовательская переменная: {${v.key}}`}
                  className="rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1 font-mono text-[11px] font-medium text-cyan-800 transition-all duration-150 hover:border-cyan-400 hover:bg-cyan-100"
                >
                  {`{${v.key}}`}
                </button>
              ))}
          </div>
        </div>

        {/* ── Dynamic Tag Values for Active Template ── */}
        {usedVarKeys.length > 0 && onUpdateVariableValue && (
          <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/40 via-teal-50/20 to-emerald-50/40 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-950">
                <Sliders className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Значения тегов для файлов:</span>
              </div>
              {onOpenMassActions && (
                <button
                  type="button"
                  onClick={onOpenMassActions}
                  className="text-[10px] text-emerald-700 hover:text-emerald-800 hover:underline font-semibold"
                >
                  Все переменные...
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {usedVarKeys.map((key) => {
                const val = variableValues[key] || '';
                const isType = key === 'type';
                const isTask = key === 'task';
                const isModule = key === 'module';

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-emerald-800">{`{${key}}`}</span>
                      {isType && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateVariableValue('type', 'ДО')}
                            className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border transition-colors ${
                              val === 'ДО'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            ДО
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateVariableValue('type', 'ПОСЛЕ')}
                            className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border transition-colors ${
                              val === 'ПОСЛЕ'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            ПОСЛЕ
                          </button>
                        </div>
                      )}
                      {isTask && linkedTask && val !== linkedTask.taskNumber && (
                        <button
                          type="button"
                          onClick={() => onUpdateVariableValue('task', linkedTask.taskNumber)}
                          title={`Подставить код привязанной задачи: ${linkedTask.taskNumber}`}
                          className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-colors"
                        >
                          +{linkedTask.taskNumber}
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={val}
                      onChange={(e) => onUpdateVariableValue(key, e.target.value)}
                      placeholder={
                        isType
                          ? 'ДО / ПОСЛЕ'
                          : isTask
                          ? 'TASK-123'
                          : isModule
                          ? 'Напр. Core'
                          : `Значение {${key}}`
                      }
                      className="w-full px-2.5 py-1 bg-white border border-emerald-200 focus:border-emerald-500 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-emerald-500 transition-colors shadow-2xs font-medium"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Preview of 1st File */}
        {firstFile && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
            <div className="flex items-start gap-2 text-[11px]">
              <Eye className="mt-0.5 h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-gray-600">Пример (файл 1): </span>
                <span className="block truncate font-mono font-bold text-emerald-700">
                  {firstFile.newName || '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
