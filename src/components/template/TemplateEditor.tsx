import React, { useRef } from 'react';
import { Sparkles, Hash, RotateCcw, Eye } from 'lucide-react';
import { VariableDefinition, FileRow } from '../../types';

interface TemplateEditorProps {
  template: string;
  startNumber: number;
  variables: VariableDefinition[];
  firstFile?: FileRow;
  onSetTemplate: (template: string) => void;
  onSetStartNumber: (num: number) => void;
  onResetTemplate: () => void;
}

const BUILT_IN_TAGS = [
  { tag: '{indexPad6}', label: '000001', desc: 'Номер 6 знаков' },
  { tag: '{cleanName}', label: 'Имя', desc: 'Очищенное имя' },
  { tag: '{date}', label: 'Дата', desc: 'YYYY-MM-DD' },
  { tag: '{time}', label: 'Время', desc: 'HH-MM-SS' },
  { tag: '{index}', label: '1', desc: 'Порядковый номер' },
  { tag: '{originalName}', label: 'Исходное', desc: 'Оригинальное имя' },
];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  startNumber,
  variables,
  firstFile,
  onSetTemplate,
  onSetStartNumber,
  onResetTemplate,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

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
      {/* Header with Start Number */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Шаблон имени</span>
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
            title="Сбросить шаблон"
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
          placeholder="{indexPad6}_{cleanName}"
          className="w-full bg-slate-950/90 border border-slate-700 font-mono text-xs text-emerald-300 px-3 py-2 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      {/* Clickable Tag Chips */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
          Доступные теги
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BUILT_IN_TAGS.map(({ tag, desc }) => (
            <button
              key={tag}
              type="button"
              onClick={() => insertTag(tag)}
              title={`${tag} - ${desc}`}
              className="inline-flex items-center gap-1 bg-slate-800/90 hover:bg-emerald-950/80 hover:text-emerald-300 hover:border-emerald-700/60 border border-slate-700/70 text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded-md transition-colors shadow-sm"
            >
              <span>{tag}</span>
            </button>
          ))}

          {/* Custom Variables */}
          {variables.map((v) => (
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
