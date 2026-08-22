import React, { useRef } from 'react';
import { Sparkles, Hash, RotateCcw, Eye, Star, Wand2 } from 'lucide-react';
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
        const nextVal =
            template.substring(0, start) + tag + template.substring(end);
        onSetTemplate(nextVal);

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(
                    start + tag.length,
                    start + tag.length,
                );
            }
        }, 10);
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.7)] ring-1 ring-inset ring-white/5">
            <div className="border-b border-white/10 bg-slate-950/50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
                            <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <span>Шаблон имени</span>

                        {isPrimary ? (
                            <span
                                title="Этот шаблон выбран основным и применяется всегда по умолчанию"
                                className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-200"
                            >
                                <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />
                                Основной
                            </span>
                        ) : (
                            <button
                                onClick={() => onSetPrimaryTemplate(template)}
                                title="Сделать текущий шаблон основным по умолчанию"
                                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 transition-colors hover:border-amber-500/40 hover:text-amber-200"
                            >
                                <Star className="h-2.5 w-2.5" />
                                Сделать основным
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/70 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <label className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Hash className="h-3 w-3 text-slate-500" />
                            <span>Старт</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={startNumber}
                            onChange={(e) =>
                                onSetStartNumber(
                                    parseInt(e.target.value, 10) || 1,
                                )
                            }
                            className="w-14 rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 text-center text-xs text-slate-100 outline-none transition-colors focus:border-emerald-500"
                        />
                        <button
                            onClick={onResetTemplate}
                            title="Сбросить к основному шаблону"
                            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-3">
                <div className="relative">
                    <Wand2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-300" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={template}
                        onChange={(e) => onSetTemplate(e.target.value)}
                        placeholder="{indexPad6}_{type}_{module}_{task}_{cleanName}"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-9 pr-3 py-2.5 font-mono text-xs text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-colors placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <span>Быстрая вставка тегов</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {BUILT_IN_TAGS.map(({ tag, desc }) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => insertTag(tag)}
                                title={`${tag} — ${desc}`}
                                className="rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 font-mono text-[11px] text-slate-200 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-200"
                            >
                                {tag}
                            </button>
                        ))}

                        {variables
                            .filter(
                                (v) =>
                                    !['type', 'module', 'task'].includes(v.key),
                            )
                            .map((v) => (
                                <button
                                    key={v.key}
                                    type="button"
                                    onClick={() => insertTag(`{${v.key}}`)}
                                    title={`Пользовательская переменная: {${v.key}}`}
                                    className="rounded-lg border border-cyan-800/50 bg-cyan-950/40 px-2 py-1 font-mono text-[11px] text-cyan-200 transition-all duration-200 hover:border-cyan-500/60 hover:bg-cyan-500/10"
                                >
                                    {`{${v.key}}`}
                                </button>
                            ))}
                    </div>
                </div>

                {firstFile && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                        <div className="flex items-start gap-2 text-[11px]">
                            <Eye className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
                            <div className="min-w-0 flex-1">
                                <span className="text-slate-400">
                                    Пример (файл 1):{' '}
                                </span>
                                <span className="block truncate font-mono text-emerald-300">
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
