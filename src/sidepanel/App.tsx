import React, { useState, useMemo, useCallback } from 'react';
import { UploadCloud, Zap, Bookmark, FileEdit, Hash, Tag } from 'lucide-react';
import { useAppState, getFormattedArchiveName } from '../hooks/useAppState';
import { useGlobalFileDrop } from '../hooks/useGlobalFileDrop';
import { useAutoCollector } from '../hooks/useAutoCollector';
import { useImplementationTasks } from '../hooks/useImplementationTasks';
import { Header } from '../components/layout/Header';
import { TabBar } from '../components/layout/TabBar';
import { Toast } from '../components/layout/Toast';
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
import { ToolRow } from '../components/ui/ToolRow';
import { FileRow, ActiveTool, YouTrackIssue } from '../types';

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
        savePreset,
        deletePreset,
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

    const handleSelectTool = (tool: ActiveTool) => {
        setActiveTool(tool);
        try {
            localStorage.setItem('gd-helper-active-tool', tool);
        } catch {
            // ignore
        }
    };

    const handleTransferYouTrackToImplementation = useCallback(
        (issue: YouTrackIssue) => {
            const taskId = implTasks.createTask(issue.id, issue.summary);
            if (issue.description) {
                implTasks.updateTask(taskId, {
                    summary: issue.description,
                });
            }
            handleSelectTool('implementation');
        },
        [implTasks]
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
            handleSelectTool('packer');
            loadZip(zipFile);
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

    const [packageNumberNotification, setPackageNumberNotification] = useState<{
        fileName: string;
        number: number;
    } | null>(null);

    const showPackageNumberToast = useCallback((notif: { fileName: string; number: number }) => {
        setPackageNumberNotification(notif);
        setTimeout(() => {
            setPackageNumberNotification((prev) => (prev?.number === notif.number ? null : prev));
        }, 4000);
    }, []);

    const headerSubtitle = useMemo(() => {
        switch (activeTool) {
            case 'packer':
                return [activePackage.name, activePackageTask?.taskNumber].filter(Boolean).join(' · ');
            case 'implementation':
                return implTasks.activeTask
                    ? [implTasks.activeTask.taskNumber, implTasks.activeTask.title].filter(Boolean).join(' · ')
                    : 'Задачи и изменения';
            case 'youtrack':
                return 'Мои задачи · РЭЦ_Fin';
            case 'extra':
                return 'Генератор ID алгоритмов';
            default:
                return undefined;
        }
    }, [activeTool, activePackage.name, activePackageTask, implTasks.activeTask]);

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
                <svg className="animate-spin w-7 h-7 text-gd-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-medium text-gd-muted">Загрузка GD Helper...</span>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col relative min-h-full pb-[var(--tabbar-h)]"
        >
            {/* Global Drag Overlay */}
            {isDraggingOver && (
                <div className="fixed inset-2 z-50 flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-fade-in rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/90 backdrop-blur-sm">
                    <div className="w-16 h-16 mb-3 rounded-xl bg-white border border-emerald-200 shadow-gd-green flex items-center justify-center">
                        <UploadCloud className="w-8 h-8 text-emerald-600 animate-bounce" />
                    </div>
                    <h2 className="text-base font-bold mb-1 text-slate-900">
                        Отпустите файлы здесь
                    </h2>
                    <p className="text-xs text-slate-500">
                        ZIP-архив или пачка .guf файлов будет импортирована
                    </p>
                </div>
            )}

            {/* Тост: перехвачен .guf */}
            {autoCollectNotification && (
                <Toast
                    icon={<Zap className="fill-current" />}
                    title="Перехвачен .guf"
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
                                title={`Добавлен в пакет: ${activePackage.name}`}
                            >
                                → {activePackage.name}
                            </span>
                        </>
                    }
                    onClose={clearNotification}
                />
            )}

            {/* Тост: спарсен следующий номер пакета */}
            {packageNumberNotification && (
                <Toast
                    icon={<Hash />}
                    title="Следующий номер пакета"
                    detail={packageNumberNotification.fileName}
                    meta={
                        <Badge variant="success" size="xs" className="font-mono flex-shrink-0">
                            № {packageNumberNotification.number}
                        </Badge>
                    }
                    onClose={() => setPackageNumberNotification(null)}
                />
            )}

            {/* Header */}
            <Header
                key={activeTool}
                title={TOOL_TITLES[activeTool]}
                subtitle={headerSubtitle}
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
                            onLoadZip={loadZip}
                            onLoadGufFiles={loadGufFiles}
                        />
                    ) : (
                        <>
                            {/* Инструменты пакета: теги, пресеты, README */}
                            <div className="gd-group gd-group--icons animate-fade-in">
                                <ToolRow
                                    icon={<Tag />}
                                    label="Теги"
                                    value={variables.length || undefined}
                                    title="Массовые действия и заполнение тегов (переменных) для файлов"
                                    onClick={() => setIsMassActionsOpen(true)}
                                />
                                <ToolRow
                                    icon={<Bookmark />}
                                    label="Пресеты шаблонов"
                                    value={presets.length || undefined}
                                    title="Пресеты шаблонов наименования"
                                    onClick={() => setIsPresetsOpen(true)}
                                />
                                <ToolRow
                                    icon={<FileEdit />}
                                    label="README.txt"
                                    value={readmeContent && readmeContent.trim().length > 0 ? 'Заполнен' : 'Пусто'}
                                    title="Редактор README.txt"
                                    onClick={() => setIsReadmeOpen(true)}
                                />
                            </div>

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
                            />

                            {/* File Table */}
                            <FileTable
                                files={files}
                                validation={validation}
                                taskItems={activePackageTask?.items}
                                onReorder={reorderFiles}
                                onEditFile={(file) => setEditingFile(file)}
                                onDeleteFile={removeFile}
                                onAddFiles={addFiles}
                                onClearFiles={clearFiles}
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
                    onExportZip={() => exportZip(activePackageTask)}
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
                onDeletePreset={deletePreset}
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
    );
};
