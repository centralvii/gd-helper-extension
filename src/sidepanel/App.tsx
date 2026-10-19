import React, { useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { UploadCloud, Zap, Bookmark, FileEdit, Hash, Tag, Archive, ListChecks, SquareCheckBig, Plus, FileArchive, Download, AlertTriangle, Package, ListPlus, Trash2, Check, ArrowRight } from 'lucide-react';
import { useAppState, getFormattedArchiveName } from '../hooks/useAppState';
import { useGlobalFileDrop } from '../hooks/useGlobalFileDrop';
import { useAutoCollector } from '../hooks/useAutoCollector';
import { useImplementationTasks } from '../hooks/useImplementationTasks';
import { Header } from '../components/layout/Header';
import { TabBar } from '../components/layout/TabBar';
import { Toast } from '../components/layout/Toast';
import { CommandPalette } from '../components/layout/CommandPalette';
import { usePaletteShortcuts } from '../hooks/usePaletteShortcuts';
import { ToastContext, useToastController } from '../hooks/useToast';
import { getErrorMessage } from '../utils/errorUtils';
import { pluralizeRu, FILE_FORMS } from '../utils/pluralize';
import { Badge } from '../components/ui/Badge';
import { Footer } from '../components/layout/Footer';
import { ImplementationTool } from '../components/implementation/ImplementationTool';
import { YouTrackTool } from '../components/youtrack/YouTrackTool';
import { ExtraContainer } from '../components/extra/ExtraContainer';
import { PackageSelector } from '../components/template/PackageSelector';
import { AutoCollectModeBar } from '../components/template/AutoCollectModeBar';
import { FileUploader } from '../components/upload/FileUploader';
import { TemplateEditor } from '../components/template/TemplateEditor';
import { FileTable } from '../components/table/FileTable';
import { MassActionsModal } from '../components/template/MassActionsModal';
import { PresetManagerModal } from '../components/template/PresetManagerModal';
import { ReadmeEditorModal } from '../components/readme/ReadmeEditorModal';
import { ValidationPanel } from '../components/validation/ValidationPanel';
import { FileEditModal } from '../components/table/FileEditModal';
import { DuplicateAutoCollectModal } from '../components/template/DuplicateAutoCollectModal';
import { isSameUrl, extractCardIdFromUrl, isGreenDataUpdatePackage } from '../utils/tabUtils';
import { AutoCollectedMeta } from '../hooks/useAutoCollector';
import { FileRow, ActiveTool, YouTrackIssue, PaletteCommand, TemplatePreset } from '../types';

const TOOL_TITLES: Record<ActiveTool, string> = {
    packer: 'Упаковка',
    implementation: 'Реализация',
    youtrack: 'YouTrack',
    extra: 'Утилиты',
};

export const App: React.FC = () => {
    const {
        packages,
        activePackage,
        createPackage,
        selectPackage,
        renamePackage,
        duplicatePackage,
        deletePackage,
        files,
        template,
        primaryTemplate,
        startNumber,
        readmeContent,
        variables,
        variableValues,
        presets,
        isLoading,
        isExporting,
        validation,
        setTemplate,
        setPrimaryTemplate,
        resetTemplate,
        setStartNumber,
        setArchiveName,
        setReadmeContent,
        addVariable,
        removeVariable,
        applyMassVariables,
        loadZip,
        loadGufFiles,
        addFiles,
        replaceFile,
        updateFileCleanName,
        updateFileDescription,
        updateFileVariable,
        reorderFiles,
        removeFile,
        clearFiles,
        restoreFiles,
        savePreset,
        deletePreset,
        restorePreset,
        setPresetAsPrimary,
        loadPreset,
        exportZip,
    } = useAppState();

    const implTasks = useImplementationTasks();

    // Active Tool state
    const [activeTool, setActiveTool] = useState<ActiveTool>(() => {
        try {
            const saved = localStorage.getItem('gd-helper-active-tool');
            if (saved === 'packer' || saved === 'implementation' || saved === 'youtrack' || saved === 'extra') {
                return saved;
            }
        } catch {
            // ignore
        }
        return 'packer';
    });

    // Позиция прокрутки каждого раздела: при возврате на вкладку список не «прыгает» наверх
    const scrollByToolRef = useRef<Partial<Record<ActiveTool, number>>>({});
    const activeToolRef = useRef(activeTool);

    const handleSelectTool = useCallback((tool: ActiveTool) => {
        const scroller = document.getElementById('root');
        if (scroller && tool !== activeToolRef.current) {
            scrollByToolRef.current[activeToolRef.current] = scroller.scrollTop;
        }
        activeToolRef.current = tool;
        setActiveTool(tool);
        try {
            localStorage.setItem('gd-helper-active-tool', tool);
        } catch {
            // ignore
        }
    }, []);

    useLayoutEffect(() => {
        const scroller = document.getElementById('root');
        if (scroller) scroller.scrollTop = scrollByToolRef.current[activeTool] ?? 0;
    }, [activeTool]);

    // ── Уведомления (тосты) ──
    const { toast, api: toastApi, pause: pauseToast, resume: resumeToast } = useToastController();

    const handleTransferYouTrackToImplementation = useCallback(
        (issue: YouTrackIssue) => {
            // Задача с таким номером уже есть — открываем её, а не создаём дубликат
            const existing = implTasks.tasks.find(
                (t) => t.taskNumber.trim().toLowerCase() === issue.id.trim().toLowerCase()
            );
            if (existing) {
                implTasks.selectTask(existing.id);
                toastApi.show({ icon: <ArrowRight />, title: 'Задача уже есть в реализации', detail: `${existing.taskNumber} · ${existing.title}` });
            } else {
                const taskId = implTasks.createTask(issue.id, issue.summary);
                if (issue.description) {
                    implTasks.updateTask(taskId, {
                        summary: issue.description,
                    });
                }
                toastApi.show({ icon: <Check />, tone: 'success', title: 'Задача создана в реализации', detail: issue.id });
            }
            handleSelectTool('implementation');
        },
        [implTasks, toastApi, handleSelectTool]
    );

    const activePackageTask = useMemo(() => {
        if (!activePackage) return null;
        return (
            implTasks.tasks.find(
                (t) => t.id === activePackage.taskId || t.packageId === activePackage.id
            ) || null
        );
    }, [activePackage, implTasks.tasks]);

    const linkedTaskPackageUrl = useMemo(() => {
        if (activePackage.releasePackageUrl) return activePackage.releasePackageUrl;
        if (!activePackageTask) return undefined;
        if (activePackageTask.releasePackageUrl) return activePackageTask.releasePackageUrl;
        const found = activePackageTask.items.find(
            (i) => (i.isUpdatePackage || isGreenDataUpdatePackage(i.description, i.linkUrl)) && i.linkUrl
        );
        return found?.linkUrl;
    }, [activePackage.releasePackageUrl, activePackageTask]);

    const autoMarkTaskItemCollected = useCallback((sourceUrl?: string) => {
        if (!sourceUrl || !activePackageTask) return;
        const cardId = extractCardIdFromUrl(sourceUrl);
        if (cardId) {
            implTasks.markItemCollectedByCardId(activePackageTask.id, cardId);
        }
    }, [activePackageTask, implTasks]);

    // Duplicate auto-collect resolution prompt
    const [duplicatePrompt, setDuplicatePrompt] = useState<{
        file: File;
        meta?: AutoCollectedMeta;
        existingFile: FileRow;
    } | null>(null);

    // Auto Collector for downloaded .guf files
    const {
        isEnabled: isAutoCollectEnabled,
        toggleEnabled: toggleAutoCollect,
        namingMode: autoCollectNamingMode,
        setNamingMode: setAutoCollectNamingMode,
        notification: autoCollectNotification,
        clearNotification,
    } = useAutoCollector({
        onFileCollected: (file, meta) => {
            // Keep user on the current tool/tab (do not force-switch to 'packer')

            // Check if active package already contains a file with the exact same sourceUrl
            if (meta?.sourceUrl) {
                const existing = activePackage.files.find(
                    (f) => f.sourceUrl && isSameUrl(f.sourceUrl, meta.sourceUrl)
                );
                if (existing) {
                    setDuplicatePrompt({
                        file,
                        meta,
                        existingFile: existing,
                    });
                    return;
                }
            }

            // Normal add with sourceUrl saved
            addFiles(
                [file],
                meta?.cleanName ? { [file.name]: meta.cleanName, '*': meta.cleanName } : undefined,
                meta ? { '*': { cleanName: meta.cleanName, sourceUrl: meta.sourceUrl } } : undefined
            );

            if (meta?.sourceUrl) {
                autoMarkTaskItemCollected(meta.sourceUrl);
            }
        },
    });

    const handleReplaceDuplicate = () => {
        if (!duplicatePrompt) return;
        const { file, meta, existingFile } = duplicatePrompt;
        replaceFile(existingFile.id, file, {
            cleanName: meta?.cleanName,
            sourceUrl: meta?.sourceUrl,
        });
        if (meta?.sourceUrl) {
            autoMarkTaskItemCollected(meta.sourceUrl);
        }
        setDuplicatePrompt(null);
    };

    const handleAppendDuplicate = () => {
        if (!duplicatePrompt) return;
        const { file, meta } = duplicatePrompt;
        addFiles(
            [file],
            meta?.cleanName ? { [file.name]: meta.cleanName, '*': meta.cleanName } : undefined,
            meta ? { '*': { cleanName: meta.cleanName, sourceUrl: meta.sourceUrl } } : undefined
        );
        if (meta?.sourceUrl) {
            autoMarkTaskItemCollected(meta.sourceUrl);
        }
        setDuplicatePrompt(null);
    };

    // Modals state
    const [isPresetsOpen, setIsPresetsOpen] = useState(false);
    const [isMassActionsOpen, setIsMassActionsOpen] = useState(false);
    const [isReadmeOpen, setIsReadmeOpen] = useState(false);
    const [isValidationOpen, setIsValidationOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<FileRow | null>(null);

    // Global Drag and Drop (active only when in packer tool)
    const { isDraggingOver } = useGlobalFileDrop({
        onDropZip: (zipFile) => {
            void handleLoadZip(zipFile);
        },
        onDropGufFiles: (droppedFiles) => {
            handleSelectTool('packer');
            if (files.length > 0) {
                addFiles(droppedFiles);
            } else {
                loadGufFiles(droppedFiles);
            }
        },
    });

    const showPackageNumberToast = useCallback((notif: { fileName: string; number: number }) => {
        toastApi.show({
            icon: <Hash />,
            title: 'Следующий номер пакета',
            detail: notif.fileName,
            meta: (
                <Badge variant="success" size="xs" className="font-mono flex-shrink-0">
                    № {notif.number}
                </Badge>
            ),
            duration: 4000,
        });
    }, [toastApi]);

    // ── Действия с обратной связью ──
    const handleLoadZip = useCallback(async (zipFile: File) => {
        handleSelectTool('packer');
        toastApi.show({ icon: <FileArchive />, title: 'Распаковка архива…', detail: zipFile.name, duration: 60000 });
        try {
            await loadZip(zipFile);
            toastApi.show({ icon: <Check />, tone: 'success', title: 'Архив загружен', detail: zipFile.name });
        } catch (err) {
            toastApi.show({
                icon: <AlertTriangle />,
                tone: 'danger',
                title: 'Не удалось открыть ZIP-архив',
                detail: getErrorMessage(err, zipFile.name),
            });
        }
    }, [handleSelectTool, loadZip, toastApi]);

    const handleExportZip = useCallback(async () => {
        try {
            await exportZip(activePackageTask);
            toastApi.show({
                icon: <Download />,
                tone: 'success',
                title: 'Архив собран',
                detail: getFormattedArchiveName(activePackage, activePackageTask),
            });
        } catch (err) {
            toastApi.show({
                icon: <AlertTriangle />,
                tone: 'danger',
                title: 'Не удалось собрать архив',
                detail: getErrorMessage(err, 'Попробуйте ещё раз'),
            });
            throw err;
        }
    }, [exportZip, activePackage, activePackageTask, toastApi]);

    const handleRemoveFile = useCallback((id: string) => {
        const index = files.findIndex((f) => f.id === id);
        if (index === -1) return;
        const row = files[index];
        const packageId = activePackage.id;
        removeFile(id);
        toastApi.show({
            icon: <Trash2 />,
            title: 'Файл удалён',
            detail: row.newName || row.originalName,
            action: { label: 'Отменить', onClick: () => restoreFiles(packageId, [row], [index]) },
        });
    }, [files, activePackage.id, removeFile, restoreFiles, toastApi]);

    const handleClearFiles = useCallback(() => {
        if (files.length === 0) return;
        const snapshot = files;
        const { id: packageId, readmeContent: prevReadme, variableValues: prevVars, archiveName: prevArchive } = activePackage;
        clearFiles();
        toastApi.show({
            icon: <Trash2 />,
            title: 'Пакет очищен',
            detail: `${snapshot.length} ${pluralizeRu(snapshot.length, FILE_FORMS)} · ${activePackage.name}`,
            action: {
                label: 'Отменить',
                onClick: () =>
                    restoreFiles(packageId, snapshot, snapshot.map((_, i) => i), {
                        readmeContent: prevReadme,
                        variableValues: prevVars,
                        archiveName: prevArchive,
                    }),
            },
        });
    }, [files, activePackage, clearFiles, restoreFiles, toastApi]);

    const handleDeletePreset = useCallback((id: string) => {
        const index = presets.findIndex((p) => p.id === id);
        if (index === -1) return;
        const preset: TemplatePreset = presets[index];
        deletePreset(id);
        toastApi.show({
            icon: <Trash2 />,
            title: 'Пресет удалён',
            detail: preset.name,
            action: { label: 'Отменить', onClick: () => restorePreset(preset, index) },
        });
    }, [presets, deletePreset, restorePreset, toastApi]);

    const headerSubtitle = useMemo(() => {
        switch (activeTool) {
            case 'packer':
                return [activePackage.name, activePackageTask?.taskNumber].filter(Boolean).join(' · ');
            case 'implementation':
                return implTasks.activeTask
                    ? [implTasks.activeTask.taskNumber, implTasks.activeTask.title].filter(Boolean).join(' · ')
                    : 'Задачи реализации';
            case 'youtrack':
                return 'Мои задачи · РЭЦ_Fin';
            case 'extra':
                return 'Генератор ID алгоритмов';
            default:
                return undefined;
        }
    }, [activeTool, activePackage.name, activePackageTask, implTasks.activeTask]);

    // ── Командная палитра (Ctrl/⌘ + K) ──
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const togglePalette = useCallback(() => setIsPaletteOpen((v) => !v), []);
    usePaletteShortcuts(togglePalette, handleSelectTool);

    const paletteGufInputRef = useRef<HTMLInputElement>(null);
    const paletteZipInputRef = useRef<HTMLInputElement>(null);

    const paletteCommands = useMemo<PaletteCommand[]>(() => {
        const cmds: PaletteCommand[] = [
            { id: 'go-packer', group: 'Перейти', title: 'Упаковка', icon: <Archive />, shortcut: 'Alt 1', run: () => handleSelectTool('packer') },
            { id: 'go-impl', group: 'Перейти', title: 'Реализация', icon: <ListChecks />, shortcut: 'Alt 2', run: () => handleSelectTool('implementation') },
            { id: 'go-yt', group: 'Перейти', title: 'YouTrack', icon: <SquareCheckBig />, shortcut: 'Alt 3', run: () => handleSelectTool('youtrack') },
            { id: 'go-extra', group: 'Перейти', title: 'Утилиты', subtitle: 'генератор ID алгоритмов', icon: <Zap />, shortcut: 'Alt 4', run: () => handleSelectTool('extra') },
            { id: 'add-guf', group: 'Действия', title: 'Добавить файлы .guf…', keywords: 'загрузить файл', icon: <Plus />, run: () => paletteGufInputRef.current?.click() },
            { id: 'load-zip', group: 'Действия', title: 'Загрузить ZIP-архив…', keywords: 'импорт архив', icon: <FileArchive />, run: () => paletteZipInputRef.current?.click() },
        ];
        if (files.length > 0 && !validation.hasErrors) {
            cmds.push({ id: 'export', group: 'Действия', title: 'Экспорт ZIP', subtitle: activePackage.name, keywords: 'скачать архив', icon: <Download />, run: () => { handleExportZip().catch(() => undefined); } });
        }
        if (validation.hasErrors) {
            cmds.push({ id: 'validation', group: 'Действия', title: 'Ошибки в именах файлов…', subtitle: `${validation.errors.length}`, keywords: 'проверка валидация', icon: <AlertTriangle />, run: () => setIsValidationOpen(true) });
        }
        cmds.push(
            { id: 'tags', group: 'Действия', title: 'Теги и шаблон…', keywords: 'переменные module type task', icon: <Tag />, run: () => { handleSelectTool('packer'); setIsMassActionsOpen(true); } },
            { id: 'presets', group: 'Действия', title: 'Пресеты шаблонов…', icon: <Bookmark />, run: () => { handleSelectTool('packer'); setIsPresetsOpen(true); } },
            { id: 'readme', group: 'Действия', title: 'Редактор README.txt…', icon: <FileEdit />, run: () => { handleSelectTool('packer'); setIsReadmeOpen(true); } },
            { id: 'new-package', group: 'Действия', title: 'Новый пакет', icon: <Package />, run: () => { createPackage(); handleSelectTool('packer'); } },
            { id: 'new-task', group: 'Действия', title: 'Новая задача реализации', icon: <ListPlus />, run: () => { implTasks.createTask(); handleSelectTool('implementation'); } },
        );
        implTasks.tasks.forEach((t) => {
            const done = t.items.filter((i) => i.isCollected).length;
            cmds.push({
                id: `task-${t.id}`,
                group: 'Задачи',
                title: `${t.taskNumber} · ${t.title}`,
                subtitle: `${done}/${t.items.length}`,
                icon: <ListChecks />,
                run: () => { implTasks.selectTask(t.id); handleSelectTool('implementation'); },
            });
        });
        packages.forEach((pkg) => {
            cmds.push({
                id: `pkg-${pkg.id}`,
                group: 'Пакеты',
                title: pkg.name,
                subtitle: `${pkg.files.length} ${pluralizeRu(pkg.files.length, FILE_FORMS)}`,
                icon: <Package />,
                run: () => { selectPackage(pkg.id); handleSelectTool('packer'); },
            });
        });
        return cmds;
    }, [files.length, validation, activePackage.name, handleExportZip, createPackage, implTasks, packages, selectPackage, handleSelectTool]);

    const handleSaveFileEdit = (
        id: string,
        cleanName: string,
        description: string,
        customVars: Record<string, string>,
    ) => {
        updateFileCleanName(id, cleanName);
        updateFileDescription(id, description);
        for (const [k, v] of Object.entries(customVars)) {
            updateFileVariable(id, k, v);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3">
                <svg className="animate-spin w-7 h-7 text-gd-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-medium text-gd-muted">Загрузка GD Helper…</span>
            </div>
        );
    }

    return (
        <ToastContext.Provider value={toastApi}>
        <div
            className="flex flex-col relative min-h-full pb-[var(--tabbar-h)]"
        >
            {/* Global Drag Overlay */}
            {isDraggingOver && (
                <div className="fixed inset-2 z-50 flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-fade-in rounded-xl border-2 border-dashed border-accent-400 bg-accent-50/90 backdrop-blur-sm">
                    <div className="w-16 h-16 mb-3 rounded-xl bg-white border border-accent-200 shadow-gd-accent flex items-center justify-center">
                        <UploadCloud className="w-8 h-8 text-accent-600 animate-bounce" />
                    </div>
                    <h2 className="text-base font-bold mb-1 text-slate-900">
                        Отпустите файлы здесь
                    </h2>
                    <p className="text-xs text-slate-500">
                        ZIP-архив или файлы .guf
                    </p>
                </div>
            )}

            {/* Уведомления: перехваченный .guf и общие тосты (результаты действий, «Отменить») */}
            <div className="fixed top-2 inset-x-3 z-[65] flex flex-col items-center gap-1.5 pointer-events-none">
                {autoCollectNotification && (
                    <Toast
                        icon={<Zap className="fill-current" />}
                        title="Файл .guf добавлен"
                        detail={autoCollectNotification.fileName}
                        meta={
                            <>
                                {autoCollectNotification.cardId && (
                                    <Badge
                                        variant="success"
                                        size="xs"
                                        className="font-mono flex-shrink-0"
                                        title={`ID карточки в GreenData: ${autoCollectNotification.cardId}`}
                                    >
                                        ID {autoCollectNotification.cardId}
                                    </Badge>
                                )}
                                {autoCollectNotification.mode && (
                                    <Badge variant="default" size="xs" className="flex-shrink-0">
                                        {autoCollectNotification.mode === 'original' ? 'исходный' : 'со страницы'}
                                    </Badge>
                                )}
                                <span
                                    className="text-[10.5px] text-gd-muted truncate ml-auto max-w-[90px]"
                                    title={`Добавлен в пакет «${activePackage.name}»`}
                                >
                                    → {activePackage.name}
                                </span>
                            </>
                        }
                        onClose={clearNotification}
                    />
                )}
                {toast && (
                    <Toast
                        key={toast.id}
                        icon={toast.icon ?? <Check />}
                        title={toast.title}
                        detail={toast.detail}
                        meta={toast.meta}
                        tone={toast.tone}
                        action={toast.action}
                        onClose={() => toastApi.dismiss(toast.id)}
                        onMouseEnter={pauseToast}
                        onMouseLeave={resumeToast}
                    />
                )}
            </div>

            {/* Header */}
            <Header
                title={TOOL_TITLES[activeTool]}
                subtitle={headerSubtitle}
                onOpenPalette={() => setIsPaletteOpen(true)}
            />

            {/* Командная палитра и её скрытые поля выбора файлов */}
            <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} commands={paletteCommands} />
            <input
                ref={paletteGufInputRef}
                type="file"
                accept=".guf"
                multiple
                hidden
                onChange={(e) => {
                    const picked = e.target.files ? Array.from(e.target.files) : [];
                    if (picked.length) {
                        handleSelectTool('packer');
                        if (files.length > 0) addFiles(picked);
                        else loadGufFiles(picked);
                    }
                    e.target.value = '';
                }}
            />
            <input
                ref={paletteZipInputRef}
                type="file"
                accept=".zip"
                hidden
                onChange={(e) => {
                    const zip = e.target.files?.[0];
                    if (zip) {
                        void handleLoadZip(zip);
                    }
                    e.target.value = '';
                }}
            />

            {/* Main Content Area */}
            <main className="flex-1 px-4 pt-1 space-y-3 pb-6">
                {/* Extra Tools View */}
                <div className={activeTool === 'extra' ? 'space-y-3 animate-screen-in' : 'hidden'}>
                    <ExtraContainer />
                </div>

                {/* Implementation Tool View */}
                <div className={activeTool === 'implementation' ? 'space-y-3 animate-screen-in' : 'hidden'}>
                    <ImplementationTool
                        packages={packages}
                        tasksState={implTasks}
                        onNavigateToPackage={(pkgId: string) => {
                            if (pkgId) selectPackage(pkgId);
                            handleSelectTool('packer');
                        }}
                        onSetStartNumber={setStartNumber}
                        onShowToast={showPackageNumberToast}
                    />
                </div>

                {/* YouTrack Tool View */}
                <div className={activeTool === 'youtrack' ? 'space-y-3 animate-screen-in' : 'hidden'}>
                    <YouTrackTool
                        isActive={activeTool === 'youtrack'}
                        onTransferToImplementation={handleTransferYouTrackToImplementation}
                    />
                </div>

                {/* Packer View */}
                <div className={activeTool === 'packer' ? 'space-y-3 animate-screen-in' : 'hidden'}>
                    {/* Группа настроек пакета: пакет + автосбор */}
                    <div className="gd-group gd-group--icons !overflow-visible">
                    <PackageSelector
                        packages={packages}
                        activePackage={activePackage}
                        tasks={implTasks.tasks}
                        onSelectPackage={selectPackage}
                        onCreatePackage={createPackage}
                        onDuplicatePackage={duplicatePackage}
                        onRenamePackage={renamePackage}
                        onDeletePackage={deletePackage}
                        onNavigateToTask={(taskId) => {
                            implTasks.selectTask(taskId);
                            handleSelectTool('implementation');
                        }}
                    />

                    {/* Автосбор: переключатель и режим имени — в той же группе */}
                    <AutoCollectModeBar
                        namingMode={autoCollectNamingMode}
                        onChangeNamingMode={setAutoCollectNamingMode}
                        isAutoCollectEnabled={isAutoCollectEnabled}
                        onToggleAutoCollect={toggleAutoCollect}
                    />
                    </div>

                    {files.length === 0 ? (
                        <FileUploader
                            onLoadZip={handleLoadZip}
                            onLoadGufFiles={loadGufFiles}
                        />
                    ) : (
                        <>
                            {/* Template Editor */}
                            <TemplateEditor
                                template={template}
                                primaryTemplate={primaryTemplate}
                                startNumber={startNumber}
                                variables={variables}
                                firstFile={files[0]}
                                initialPackageUrl={linkedTaskPackageUrl}
                                onSetTemplate={setTemplate}
                                onSetPrimaryTemplate={setPrimaryTemplate}
                                onSetStartNumber={setStartNumber}
                                onResetTemplate={resetTemplate}
                                onShowToast={showPackageNumberToast}
                                onOpenPresets={() => setIsPresetsOpen(true)}
                                presetsCount={presets.length}
                                chips={
                                    <>
                                        <button
                                            type="button"
                                            className="gd-chip"
                                            onClick={() => setIsMassActionsOpen(true)}
                                            title="Теги и шаблон имён файлов"
                                        >
                                            <Tag className="h-3.5 w-3.5 text-accent-600" />
                                            Теги
                                            <span className="font-mono text-gd-muted">{variables.length}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="gd-chip"
                                            onClick={() => setIsReadmeOpen(true)}
                                            title="Редактор README.txt"
                                        >
                                            <FileEdit className="h-3.5 w-3.5 text-accent-600" />
                                            README
                                            {readmeContent && readmeContent.trim().length > 0 && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-gd-success" aria-label="README заполнен" />
                                            )}
                                        </button>
                                    </>
                                }
                            />

                            {/* File Table */}
                            <FileTable
                                files={files}
                                validation={validation}
                                taskItems={activePackageTask?.items}
                                onReorder={reorderFiles}
                                onEditFile={(file) => setEditingFile(file)}
                                onDeleteFile={handleRemoveFile}
                                onAddFiles={addFiles}
                                onClearFiles={handleClearFiles}
                            />
                        </>
                    )}
                </div>
            </main>

            {/* Footer / Export bar (only for packer tool) */}
            {activeTool === 'packer' && (
                <Footer
                    fileCount={files.length}
                    validation={validation}
                    archiveName={getFormattedArchiveName(
                        activePackage,
                        activePackageTask
                    )}
                    isExporting={isExporting}
                    onSetArchiveName={setArchiveName}
                    onExportZip={handleExportZip}
                    onOpenValidation={() => setIsValidationOpen(true)}
                />
            )}

            {/* Нижний таб-бар */}
            <TabBar
                activeTool={activeTool}
                fileCount={files.length}
                onSelectTool={handleSelectTool}
            />

            {/* Modals */}
            <MassActionsModal
                isOpen={isMassActionsOpen}
                onClose={() => setIsMassActionsOpen(false)}
                variables={variables}
                variableValues={variableValues}
                template={template}
                onSetTemplate={setTemplate}
                linkedTask={
                    activePackage.taskId
                        ? implTasks.tasks.find((t) => t.id === activePackage.taskId)
                        : null
                }
                onApplyMassVariables={applyMassVariables}
                onAddVariable={addVariable}
                onRemoveVariable={removeVariable}
            />

            <PresetManagerModal
                isOpen={isPresetsOpen}
                onClose={() => setIsPresetsOpen(false)}
                presets={presets}
                currentTemplate={template}
                onLoadPreset={loadPreset}
                onSavePreset={savePreset}
                onDeletePreset={handleDeletePreset}
                onSetPresetAsPrimary={setPresetAsPrimary}
            />

            <ReadmeEditorModal
                isOpen={isReadmeOpen}
                onClose={() => setIsReadmeOpen(false)}
                readmeContent={readmeContent}
                files={files}
                onSaveReadme={setReadmeContent}
            />

            <ValidationPanel
                isOpen={isValidationOpen}
                onClose={() => setIsValidationOpen(false)}
                validation={validation}
            />

            <FileEditModal
                file={editingFile}
                variables={variables}
                isOpen={Boolean(editingFile)}
                onClose={() => setEditingFile(null)}
                onSave={handleSaveFileEdit}
            />

            {duplicatePrompt && (
                <DuplicateAutoCollectModal
                    isOpen={Boolean(duplicatePrompt)}
                    onClose={() => setDuplicatePrompt(null)}
                    existingFile={duplicatePrompt.existingFile}
                    newFile={duplicatePrompt.file}
                    newCleanName={duplicatePrompt.meta?.cleanName}
                    sourceUrl={duplicatePrompt.meta?.sourceUrl || duplicatePrompt.existingFile.sourceUrl || ''}
                    onReplace={handleReplaceDuplicate}
                    onAppend={handleAppendDuplicate}
                />
            )}
        </div>
        </ToastContext.Provider>
    );
};
