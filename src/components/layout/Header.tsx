import React, { useState } from 'react';
import {
    Icon28ArchiveOutline,
    Icon28ArticleOutline,
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

    return (
        <>
            <header
                className="sticky top-0 z-30"
                style={{
                    background: '#ffffff',
                    borderBottom: '1px solid #e2e8e2',
                    boxShadow: '0 1px 0 #e2e8e2, 0 2px 8px rgba(0,0,0,0.04)',
                }}
            >
                <div className="relative flex items-center justify-between gap-2 px-3 py-2 min-h-[44px]">

                    {/* ── Центрированное навигационное меню (StealthSurf / VKUI style) ── */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <div
                            className="flex items-center gap-0.5 rounded-xl p-0.5 shadow-sm"
                            style={{ background: '#f0f4f0', border: '1px solid #e2e8e2' }}
                        >
                            {/* Упаковка */}
                            <button
                                type="button"
                                onClick={() => onSelectTool('packer')}
                                className={`header-tab ${activeTool === 'packer' ? 'header-tab--active' : ''}`}
                            >
                                <Icon28ArchiveOutline width={15} height={15} />
                                <span>Упаковка</span>
                                {fileCount > 0 && (
                                    <span
                                        className="rounded-full px-1.5 text-[9px] font-bold"
                                        style={{
                                            background: activeTool === 'packer' ? '#22c55e' : '#d1fae5',
                                            color:      activeTool === 'packer' ? '#fff'    : '#16a34a',
                                        }}
                                    >
                                        {fileCount}
                                    </span>
                                )}
                            </button>

                            {/* Реализация */}
                            <button
                                type="button"
                                onClick={() => onSelectTool('implementation')}
                                className={`header-tab ${activeTool === 'implementation' ? 'header-tab--active' : ''}`}
                            >
                                <Icon28ArticleOutline width={15} height={15} />
                                <span>Реализация</span>
                            </button>
                        </div>
                    </div>

                    {/* ── Правые кнопки действий ── */}
                    <div className="ml-auto flex items-center gap-1 flex-shrink-0 z-10">
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

                                {/* Разделитель */}
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
