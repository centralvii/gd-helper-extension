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
            <header className="sticky top-0 z-30"
                style={{
                    background: 'rgba(8,13,8,0.92)',
                    borderBottom: '1px solid rgba(34,197,94,0.14)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 1px 0 rgba(34,197,94,0.06), 0 4px 24px rgba(0,0,0,0.5)',
                }}
            >
                <div className="flex items-center justify-between gap-2 px-3 py-2">

                    {/* ── Left: Logo + title ── */}
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)',
                                boxShadow: '0 0 0 1px rgba(34,197,94,0.3), 0 2px 12px rgba(34,197,94,0.2)',
                            }}
                        >
                            <img src="/icons/icon48.png" alt="GD" className="h-5 w-5 rounded object-cover" />
                        </div>
                        <div className="hidden sm:block">
                            <div
                                className="text-xs font-bold leading-none"
                                style={{ color: '#22c55e', fontFamily: 'monospace', letterSpacing: '0.06em' }}
                            >
                                GD<span style={{ color: '#d4edda' }}>Helper</span>
                            </div>
                            <div className="console-label mt-0.5">
                                GreenData · v1.0
                            </div>
                        </div>
                    </div>

                    {/* ── Center: Tool tabs ── */}
                    <div
                        className="flex items-center gap-0.5 rounded-lg p-0.5"
                        style={{ background: 'rgba(17,26,17,0.9)', border: '1px solid rgba(34,197,94,0.12)' }}
                    >
                        <button
                            type="button"
                            onClick={() => onSelectTool('packer')}
                            className={`header-tab ${activeTool === 'packer' ? 'header-tab--active' : ''}`}
                        >
                            <Icon28ArchiveOutline width={14} height={14} />
                            <span>&gt; УПАКОВКА</span>
                            {fileCount > 0 && (
                                <span
                                    className="rounded-full px-1.5 text-[9px] font-bold"
                                    style={{
                                        background: activeTool === 'packer'
                                            ? 'rgba(34,197,94,0.25)'
                                            : 'rgba(34,197,94,0.1)',
                                        color: activeTool === 'packer' ? '#22c55e' : '#6b9a6b',
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {fileCount}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => onSelectTool('implementation')}
                            className={`header-tab ${activeTool === 'implementation' ? 'header-tab--active' : ''}`}
                        >
                            <Icon28ArticleOutline width={14} height={14} />
                            <span>&gt; РЕАЛИЗАЦИЯ</span>
                        </button>
                    </div>

                    {/* ── Right: Action buttons ── */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {activeTool === 'packer' && (
                            <>
                                <button
                                    onClick={onOpenPresets}
                                    title="Пресеты шаблонов"
                                    className="icon-btn hidden sm:inline-flex"
                                >
                                    <Icon20BookmarkOutline width={16} height={16} />
                                </button>

                                <button
                                    onClick={onOpenMassActions}
                                    title="Массовые действия"
                                    disabled={fileCount === 0}
                                    className="icon-btn hidden sm:inline-flex disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Icon20ListBulletOutline width={16} height={16} />
                                </button>

                                <button
                                    onClick={onOpenReadme}
                                    title="Редактор README.txt"
                                    className="icon-btn relative hidden sm:inline-flex"
                                >
                                    <Icon20DocumentOutline width={16} height={16} />
                                    {hasReadme && (
                                        <span
                                            className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                                            style={{
                                                background: '#22c55e',
                                                boxShadow: '0 0 4px rgba(34,197,94,0.8)',
                                            }}
                                        />
                                    )}
                                </button>

                                {/* Divider */}
                                <div
                                    className="hidden sm:block w-px h-4 mx-0.5"
                                    style={{ background: 'rgba(34,197,94,0.12)' }}
                                />
                            </>
                        )}

                        <button
                            onClick={handleOpenFullscreen}
                            title="Открыть во весь экран"
                            className="icon-btn"
                        >
                            <Icon28FullscreenOutline width={16} height={16} />
                        </button>

                        {activeTool === 'packer' && fileCount > 0 && (
                            <button
                                onClick={() => setIsClearConfirmOpen(true)}
                                title="Очистить все файлы"
                                className="icon-btn icon-btn--danger"
                            >
                                <Icon28DeleteOutline width={16} height={16} />
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
                <p className="text-xs" style={{ color: '#d4edda' }}>
                    Вы уверены, что хотите удалить все загруженные файлы ({fileCount} шт.) из памяти и очистить состояние?
                </p>
            </Modal>
        </>
    );
};
