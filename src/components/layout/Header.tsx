import React from 'react';
import {
    Archive,
    FileText,
    Zap,
    Maximize2,
    Bot,
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
            title: 'Инструмент реализации',
        },
        {
            id: 'extra',
            icon: <Zap className="w-3.5 h-3.5" />,
            title: 'Экстра инструменты',
        },
        {
            id: 'ai',
            icon: <Bot className="w-3.5 h-3.5" />,
            title: 'ИИ Ассистент GreenData',
        },
    ];

    return (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="grid grid-cols-[36px_1fr_36px] items-center px-2.5 py-1.5 min-h-[44px]">
                {/* Left empty spacer for symmetry */}
                <div />

                {/* ── Center: Navigation tabs ── */}
                <div className="flex items-center justify-center">
                    <div className="flex items-center gap-0.5 rounded-xl p-0.5 bg-slate-100/90 border border-slate-200/80 shadow-2xs">
                        {navTabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onSelectTool(tab.id)}
                                title={tab.title}
                                className={`header-tab ${activeTool === tab.id ? 'header-tab--active' : ''} ${!tab.label ? 'px-2' : ''}`}
                            >
                                {tab.icon}
                                {tab.label && <span className="hidden xs:inline">{tab.label}</span>}
                                {tab.id === 'packer' && fileCount > 0 && (
                                    <span
                                        className="rounded-full px-1.5 text-[9px] font-bold leading-none py-0.5 flex-shrink-0 transition-all shadow-2xs"
                                        style={{
                                            background: activeTool === 'packer' ? '#059669' : '#dcfce7',
                                            color:      activeTool === 'packer' ? '#ffffff' : '#047857',
                                            boxShadow:  activeTool === 'packer' ? '0 0 6px rgba(5,150,105,0.4)' : undefined,
                                        }}
                                    >
                                        {fileCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Right: Fullscreen Action ── */}
                <div className="flex items-center justify-end">
                    <button
                        onClick={handleOpenFullscreen}
                        title="Открыть во весь экран"
                        className="icon-btn hover:text-slate-900"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
};
