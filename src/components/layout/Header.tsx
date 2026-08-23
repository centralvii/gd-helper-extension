import React, { useState } from 'react';
import {
    Icon28ArchiveOutline,
    Icon28ArticleOutline,
    Icon28FlashOutline,
    Icon28DeleteOutline,
    Icon28FullscreenOutline,
    Icon20BookmarkOutline,
    Icon20ListBulletOutline,
    Icon20DocumentOutline,
} from '@vkontakte/icons';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
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
            icon: <Icon28ArchiveOutline width={15} height={15} />,
            title: 'Упаковка GUF файлов',
        },
        {
            id: 'implementation',
            label: 'Реализация',
            icon: <Icon28ArticleOutline width={15} height={15} />,
            title: 'Инструмент реализации',
        },
        {
            id: 'extra',
            // no label — only icon
            icon: <Icon28FlashOutline width={15} height={15} />,
            title: 'Экстра инструменты',
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
                {/* Single-row layout: [left-placeholder] [center nav] [right actions] */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-2.5 py-1.5 min-h-[42px]">

                    {/* ── Left col: invisible placeholder that matches right actions width ── */}
                    {/* We use the right column to size itself and this col mirrors it */}
                    <div aria-hidden className="flex items-center justify-start">
                        {/* Placeholder — same buttons as right, but invisible, to balance the grid */}
                        <span className="h-[30px] opacity-0 pointer-events-none flex gap-1">
                            <span className="w-7 h-7" />
                            {activeTool === 'packer' && (
                                <>
                                    <span className="w-7 h-7 hidden sm:inline-block" />
                                    <span className="w-7 h-7 hidden sm:inline-block" />
                                    <span className="w-7 h-7 hidden sm:inline-block" />
                                    <span className="w-px hidden sm:inline-block" />
                                </>
                            )}
                            {activeTool === 'packer' && fileCount > 0 && (
                                <span className="w-7 h-7" />
                            )}
                        </span>
                    </div>

                    {/* ── Center: Navigation tabs ── */}
                    <div
                        className="flex items-center gap-0.5 rounded-xl p-0.5 shadow-sm"
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
                    <div className="flex items-center justify-end gap-0.5 flex-shrink-0">
                        {activeTool === 'packer' && (
                            <>
                                <button
                                    onClick={onOpenPresets}
                                    title="Пресеты шаблонов"
                                    className="icon-btn hidden sm:inline-flex"
                                >
                                    <Icon20BookmarkOutline width={17} height={17} />
                                </button>

                                <button
                                    onClick={onOpenMassActions}
                                    title="Массовые действия"
                                    disabled={fileCount === 0}
                                    className="icon-btn hidden sm:inline-flex disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Icon20ListBulletOutline width={17} height={17} />
                                </button>

                                <button
                                    onClick={onOpenReadme}
                                    title="Редактор README.txt"
                                    className="icon-btn relative hidden sm:inline-flex"
                                >
                                    <Icon20DocumentOutline width={17} height={17} />
                                    {hasReadme && (
                                        <span
                                            className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                                            style={{ background: '#22c55e', boxShadow: '0 0 4px rgba(34,197,94,0.7)' }}
                                        />
                                    )}
                                </button>

                                {/* Divider */}
                                <div className="hidden sm:block w-px h-4 mx-0.5" style={{ background: '#e2e8e2' }} />
                            </>
                        )}

                        <button
                            onClick={handleOpenFullscreen}
                            title="Открыть во весь экран"
                            className="icon-btn"
                        >
                            <Icon28FullscreenOutline width={17} height={17} />
                        </button>

                        {activeTool === 'packer' && fileCount > 0 && (
                            <button
                                onClick={() => setIsClearConfirmOpen(true)}
                                title="Очистить все файлы"
                                className="icon-btn icon-btn--danger"
                            >
                                <Icon28DeleteOutline width={17} height={17} />
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
                            leftIcon={<Icon28DeleteOutline width={14} height={14} />}
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
