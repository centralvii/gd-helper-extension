import React, { useState } from 'react';
import {
    Layers,
    FileText,
    Bookmark,
    Trash2,
    Maximize2,
    Package,
    FileCheck2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

import { ActiveTool } from '../../types';

interface HeaderProps {
    activeTool: ActiveTool;
    fileCount: number;
    hasReadme: boolean;
    onSelectTool: (tool: ActiveTool) => void;
    onOpenPresets: () => void;
    onOpenMassActions: () => void;
    onOpenReadme: () => void;
    onClearFiles: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    activeTool,
    fileCount,
    hasReadme,
    onSelectTool,
    onOpenPresets,
    onOpenMassActions,
    onOpenReadme,
    onClearFiles,
}) => {
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

    const handleOpenFullscreen = () => {
        if (
            typeof chrome !== 'undefined' &&
            chrome.tabs &&
            chrome.tabs.create
        ) {
            chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
        } else {
            window.open(window.location.href, '_blank');
        }
    };

    return (
        <>
            <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-[0_12px_30px_rgba(2,6,23,0.55)]">
                <div className="flex items-center justify-between gap-3 px-3 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                            <img
                                src="/icons/icon48.png"
                                alt="GDHelper"
                                className="h-6 w-6 rounded-lg object-cover"
                            />
                        </div>

                        <div className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                            <span className="font-semibold text-slate-200">
                                GDHelper
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-emerald-300">
                                {activeTool === 'packer'
                                    ? 'Упаковка'
                                    : 'Реализация'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                        <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-900/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <button
                                type="button"
                                onClick={() => onSelectTool('packer')}
                                className={`group relative flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                                    activeTool === 'packer'
                                        ? 'bg-gradient-to-r from-emerald-500/25 via-emerald-400/15 to-cyan-400/15 text-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_10px_25px_rgba(16,185,129,0.18)]'
                                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                                }`}
                            >
                                <Package
                                    className={`h-3.5 w-3.5 ${activeTool === 'packer' ? 'text-emerald-200' : 'text-slate-400 group-hover:text-slate-200'}`}
                                />
                                <span>Упаковка</span>
                                {fileCount > 0 && (
                                    <span
                                        className={`min-w-[18px] rounded-full px-1.5 text-[9px] font-bold ${activeTool === 'packer' ? 'bg-emerald-600/90 text-white' : 'bg-slate-700 text-slate-300'}`}
                                    >
                                        {fileCount}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => onSelectTool('implementation')}
                                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                                    activeTool === 'implementation'
                                        ? 'bg-gradient-to-r from-cyan-500/25 via-sky-400/15 to-violet-400/15 text-sky-50 shadow-[0_0_0_1px_rgba(56,189,248,0.18),0_10px_25px_rgba(14,165,233,0.16)]'
                                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                                }`}
                            >
                                <FileCheck2
                                    className={`h-3.5 w-3.5 ${activeTool === 'implementation' ? 'text-sky-200' : 'text-slate-400'}`}
                                />
                                <span>Реализация</span>
                            </button>
                        </div>

                        {activeTool === 'packer' && (
                            <div className="hidden sm:flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <button
                                    onClick={onOpenPresets}
                                    title="Пресеты шаблонов"
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-emerald-300"
                                >
                                    <Bookmark className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={onOpenMassActions}
                                    title="Массовые действия"
                                    disabled={fileCount === 0}
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                >
                                    <Layers className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={onOpenReadme}
                                    title="Редактор README.txt"
                                    className="relative rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-emerald-300"
                                >
                                    <FileText className="h-4 w-4" />
                                    {hasReadme && (
                                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <button
                                onClick={handleOpenFullscreen}
                                title="Открыть во весь экран"
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-sky-300"
                            >
                                <Maximize2 className="h-4 w-4" />
                            </button>

                            {activeTool === 'packer' && fileCount > 0 && (
                                <button
                                    onClick={() => setIsClearConfirmOpen(true)}
                                    title="Очистить все файлы"
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-300"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <Modal
                isOpen={isClearConfirmOpen}
                onClose={() => setIsClearConfirmOpen(false)}
                title="Очистить список файлов?"
                maxWidth="sm"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsClearConfirmOpen(false)}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => {
                                onClearFiles();
                                setIsClearConfirmOpen(false);
                            }}
                        >
                            Очистить
                        </Button>
                    </>
                }
            >
                <p className="text-xs text-slate-300">
                    Вы уверены, что хотите удалить все загруженные файлы (
                    {fileCount} шт.) из памяти и очистить состояние?
                </p>
            </Modal>
        </>
    );
};
