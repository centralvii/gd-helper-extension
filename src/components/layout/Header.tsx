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
        <header
            className="sticky top-0 z-30 bg-white"
            style={{
                borderBottom: '1px solid #e2e8e2',
                boxShadow: '0 1px 0 #e2e8e2, 0 2px 6px rgba(0,0,0,0.04)',
            }}
        >
            <div className="grid grid-cols-[36px_1fr_36px] items-center px-3 py-1.5 min-h-[44px]">
                {/* Left empty spacer for symmetry */}
                <div />

                {/* ── Center: Navigation tabs ── */}
                <div className="flex items-center justify-center">
                    <div
                        className="flex items-center gap-0.5 rounded-xl p-0.5 shadow-xs"
                        style={{ background: '#f0f4f0', border: '1px solid #e2e8e2' }}
                    >
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
                                        className="rounded-full px-1.5 text-[9px] font-bold leading-none py-0.5 flex-shrink-0"
                                        style={{
                                            background: activeTool === 'packer' ? '#22c55e' : '#d1fae5',
                                            color:      activeTool === 'packer' ? '#fff'    : '#16a34a',
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
                        className="icon-btn"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
};
