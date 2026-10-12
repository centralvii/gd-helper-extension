import React from 'react';
import {
    Archive,
    FileText,
    Zap,
    Maximize2,
    Bot,
    CheckSquare,
} from 'lucide-react';
import { ActiveTool } from '../../types';

interface HeaderProps {
    activeTool: ActiveTool;
    fileCount: number;
    onSelectTool: (tool: ActiveTool) => void;
}

export const Header: React.FC<HeaderProps> = ({
    activeTool,
    fileCount,
    onSelectTool,
}) => {
    const handleOpenFullscreen = () => {
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
            chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
        } else {
            window.open(window.location.href, '_blank');
        }
    };

    const navTabs: { id: ActiveTool; label?: string; icon: React.ReactNode; title: string }[] = [
        {
            id: 'packer',
            label: 'Упаковка',
            icon: <Archive className="w-3.5 h-3.5" />,
            title: 'Упаковка GUF файлов',
        },
        {
            id: 'implementation',
            label: 'Реализация',
            icon: <FileText className="w-3.5 h-3.5" />,
            title: 'Инструмент описания реализации',
        },
        {
            id: 'youtrack',
            label: 'YouTrack',
            icon: <CheckSquare className="w-3.5 h-3.5" />,
            title: 'Задачи YouTrack (РЭЦ_Fin)',
        },
        {
            id: 'extra',
            icon: <Zap className="w-3.5 h-3.5" />,
            title: 'Экстра инструменты (ID алгоритмов, стили)',
        },
        {
            id: 'ai',
            icon: <Bot className="w-3.5 h-3.5" />,
            title: 'ИИ Ассистент GreenData',
        },
    ];

    return (
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            {/* Фирменная акцентная линия GreenData */}
            <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
            <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 min-h-[44px]">
                {/* ── Navigation tabs pill ── */}
                <div className="flex items-center gap-0.5 min-w-0 rounded-xl p-0.5 bg-slate-100/90 border border-slate-200 shadow-2xs">
                    {navTabs.map((tab) => {
                        const isActive = activeTool === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onSelectTool(tab.id)}
                                title={tab.title}
                                className={`header-tab ${isActive ? 'header-tab--active' : ''} ${
                                    !tab.label ? 'header-tab--icon-only' : ''
                                }`}
                            >
                                {tab.icon}
                                {/* На узкой панели подпись видна только у активной вкладки */}
                                {tab.label && (
                                    <span className={isActive ? '' : 'hidden xs:inline'}>{tab.label}</span>
                                )}
                                {tab.id === 'packer' && fileCount > 0 && (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none tabular-nums flex-shrink-0 transition-all ${
                                            isActive
                                                ? 'bg-emerald-600 text-white shadow-[0_0_6px_rgba(5,150,105,0.4)]'
                                                : 'bg-emerald-100 text-emerald-700'
                                        }`}
                                    >
                                        {fileCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Right: Fullscreen Action ── */}
                <button
                    type="button"
                    onClick={handleOpenFullscreen}
                    title="Открыть во весь экран (в новой вкладке)"
                    className="icon-btn vk-icon-pop"
                >
                    <Maximize2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </header>
    );
};
