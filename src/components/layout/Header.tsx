import React, { useState } from 'react';
import {
    Archive,
    FileText,
    Zap,
    Trash2,
    Maximize2,
    Bookmark,
    FileEdit,
    Bot,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ActiveTool } from '../../types';

interface HeaderProps {
    activeTool: ActiveTool;
    fileCount: number;
    hasReadme: boolean;
    onSelectTool: (tool: ActiveTool) => void;
    onOpenPresets: () => void;
    onOpenMassActions?: () => void;
    onOpenReadme: () => void;
    onClearFiles: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    activeTool,
    fileCount,
    hasReadme,
    onSelectTool,
    onOpenPresets,
    onOpenReadme,
    onClearFiles,
}) => {
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

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
        <>
            <header
                className="sticky top-0 z-30 bg-white"
                style={{
                    borderBottom: '1px solid #e2e8e2',
                    boxShadow: '0 1px 0 #e2e8e2, 0 2px 6px rgba(0,0,0,0.04)',
                }}
            >
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 min-h-[44px]">
                    {/* ── Left: Navigation tabs ── */}
                    <div
                        className="flex items-center gap-0.5 rounded-xl p-0.5 shadow-xs flex-shrink-0"
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

                    {/* ── Right: Action buttons ── */}
                    <div className="flex items-center justify-end gap-1 flex-shrink-0">
                        {activeTool === 'packer' && (
                            <>
                                <button
                                    onClick={onOpenPresets}
                                    title="Пресеты шаблонов"
                                    className="icon-btn"
                                >
                                    <Bookmark className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={onOpenReadme}
                                    title="Редактор README.txt"
                                    className="icon-btn relative"
                                >
                                    <FileEdit className="w-4 h-4" />
                                    {hasReadme && (
                                        <span
                                            className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                                            style={{ background: '#22c55e', boxShadow: '0 0 4px rgba(34,197,94,0.7)' }}
                                        />
                                    )}
                                </button>

                                {/* Divider */}
                                <div className="w-px h-4 mx-0.5" style={{ background: '#e2e8e2' }} />
                            </>
                        )}

                        <button
                            onClick={handleOpenFullscreen}
                            title="Открыть во весь экран"
                            className="icon-btn"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>

                        {activeTool === 'packer' && fileCount > 0 && (
                            <button
                                onClick={() => setIsClearConfirmOpen(true)}
                                title="Очистить все файлы"
                                className="icon-btn icon-btn--danger"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
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
                        <Button variant="secondary" size="sm" onClick={() => setIsClearConfirmOpen(false)}>
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
                <p className="text-xs text-gray-600">
                    Вы уверены, что хотите удалить все загруженные файлы ({fileCount} шт.) из памяти?
                </p>
            </Modal>
        </>
    );
};
