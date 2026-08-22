import React, { useRef } from 'react';
import { Sparkles, Hash, RotateCcw, Eye, Star } from 'lucide-react';
import { VariableDefinition, FileRow } from '../../types';

interface TemplateEditorProps {
  template: string;
  primaryTemplate: string;
  startNumber: number;
  variables: VariableDefinition[];
  firstFile?: FileRow;
  onSetTemplate: (template: string) => void;
  onSetPrimaryTemplate: (template: string) => void;
  onSetStartNumber: (num: number) => void;
  onResetTemplate: () => void;
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

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  primaryTemplate,
  startNumber,
  variables,
  firstFile,
  onSetTemplate,
  onSetPrimaryTemplate,
  onSetStartNumber,
  onResetTemplate,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPrimary = template.trim() === primaryTemplate.trim();

  const insertTag = (tag: string) => {
    if (!inputRef.current) {
      onSetTemplate(template + tag);
      return;
    }

    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    const nextVal = template.substring(0, start) + tag + template.substring(end);
    onSetTemplate(nextVal);

    // Set cursor right after inserted tag
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(start + tag.length, start + tag.length);
      }
    }, 10);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 space-y-3">
      {/* Header with Start Number & Primary Template button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Шаблон имени</span>
          {isPrimary ? (
            <span
              title="Этот шаблон выбран основным и применяется всегда по умолчанию"
              className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded-full ml-1"
            >
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              Основной
            </span>
          ) : (
            <button
              onClick={() => onSetPrimaryTemplate(template)}
              title="Сделать текущий шаблон основным по умолчанию"
              className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 border border-slate-700/60 px-1.5 py-0.2 rounded-full ml-1 transition-colors"
            >
              <Star className="w-2.5 h-2.5" />
              Сделать основным
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-slate-400 flex items-center gap-1">
            <Hash className="w-3 h-3 text-slate-500" />
            <span>Старт:</span>
          </label>
          <input
            type="number"
            min={1}
            value={startNumber}
            onChange={(e) => onSetStartNumber(parseInt(e.target.value, 10) || 1)}
            className="w-14 bg-slate-950 border border-slate-700/80 rounded-md px-2 py-0.5 text-xs text-slate-100 text-center focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={onResetTemplate}
            title="Сбросить к основному шаблону"
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Template Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={template}
          onChange={(e) => onSetTemplate(e.target.value)}
          placeholder="{indexPad6}_{type}_{module}_{task}_{cleanName}"
          className="w-full bg-slate-950/90 border border-slate-700 font-mono text-xs text-emerald-300 px-3 py-2 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      {/* Clickable Tag Chips */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
          Быстрая вставка тегов
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BUILT_IN_TAGS.map(({ tag, desc }) => (
            <button
              key={tag}
              type="button"
              onClick={() => insertTag(tag)}
              title={`${tag} — ${desc}`}
              className="inline-flex items-center gap-1 bg-slate-800/90 hover:bg-emerald-950/80 hover:text-emerald-300 hover:border-emerald-700/60 border border-slate-700/70 text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded-md transition-colors shadow-sm"
            >
              <span>{tag}</span>
            </button>
          ))}

          {/* Additional Custom Variables */}
          {variables
            .filter((v) => !['type', 'module', 'task'].includes(v.key))
            .map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertTag(`{${v.key}}`)}
                title={`Пользовательская переменная: {${v.key}}`}
                className="inline-flex items-center gap-1 bg-teal-950/50 hover:bg-teal-900/80 border border-teal-800/60 text-teal-300 text-[11px] font-mono px-2 py-0.5 rounded-md transition-colors"
              >
                <span>{`{${v.key}}`}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Live Preview of 1st File */}
      {firstFile && (
        <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[11px]">
          <Eye className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-slate-400">Пример (файл 1): </span>
            <span className="font-mono text-emerald-400 truncate block">
              {firstFile.newName || '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
