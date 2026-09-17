import React, { useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  Star,
  Wand2,
} from 'lucide-react';
import { FileRow, VariableDefinition } from '../../types';

interface TemplateEditorProps {
  template: string;
  primaryTemplate: string;
  startNumber: number;
  variables?: VariableDefinition[];
  firstFile?: FileRow;
  onSetTemplate: (template: string) => void;
  onSetPrimaryTemplate: (template: string) => void;
  onSetStartNumber: (num: number) => void;
  onResetTemplate: () => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  primaryTemplate,
  startNumber,
  onSetTemplate,
  onSetPrimaryTemplate,
  onSetStartNumber,
  onResetTemplate,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPrimary = template === primaryTemplate;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all">
      {/* Header bar */}
      <div className="border-b border-slate-100 bg-slate-50/70 px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 min-w-0 flex-1 mr-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shadow-2xs flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="whitespace-nowrap flex-shrink-0">Шаблон имени</span>

            {isPrimary ? (
              <span
                title="Этот шаблон выбран основным и применяется всегда по умолчанию"
                className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 shadow-2xs whitespace-nowrap flex-shrink-0"
              >
                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500 flex-shrink-0" />
                <span className="hidden sm:inline">Основной</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSetPrimaryTemplate(template)}
                title="Сделать текущий шаблон основным по умолчанию"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 transition-all hover:border-amber-400 hover:text-amber-700 shadow-2xs cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <Star className="h-2.5 w-2.5 text-slate-400 hover:text-amber-500 flex-shrink-0" />
                <span className="hidden sm:inline">Сделать основным</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-1.5 py-0.5 shadow-2xs flex-shrink-0">
            <span className="text-[11px] font-bold text-slate-400 select-none" title="Стартовый номер">
              №
            </span>
            <input
              type="number"
              min={1}
              value={startNumber}
              onChange={(e) =>
                onSetStartNumber(parseInt(e.target.value, 10) || 1)
              }
              title="Стартовый номер"
              className="w-11 rounded-lg border border-slate-200 bg-slate-50 px-1 py-0.5 text-center text-xs font-bold text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={onResetTemplate}
              title="Сбросить к основному шаблону"
              className="rounded-lg p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer flex-shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-2.5">
        {/* Main Template Input */}
        <div className="relative">
          <Wand2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-600" />
          <input
            ref={inputRef}
            type="text"
            value={template}
            onChange={(e) => onSetTemplate(e.target.value)}
            placeholder="{indexPad6}_{type}_{module}_{task}_{cleanName}"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2 font-mono text-xs font-bold text-emerald-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
};
