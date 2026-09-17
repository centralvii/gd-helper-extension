import React, { useState, useMemo, useCallback } from 'react';
import { UploadCloud, Zap, X, SlidersHorizontal, Bookmark, FileEdit, Trash2 } from 'lucide-react';
import { useAppState, getFormattedArchiveName } from '../hooks/useAppState';
import { useGlobalFileDrop } from '../hooks/useGlobalFileDrop';
import { useAutoCollector } from '../hooks/useAutoCollector';
import { useImplementationTasks } from '../hooks/useImplementationTasks';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ImplementationTool } from '../components/implementation/ImplementationTool';
import { ExtraContainer } from '../components/extra/ExtraContainer';
import { AiChatContainer } from '../components/ai/AiChatContainer';
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
import { isSameUrl, extractCardIdFromUrl } from '../utils/tabUtils';
import { AutoCollectedMeta } from '../hooks/useAutoCollector';
import { Toolbar } from '../components/ui/Toolbar';
import { FileRow, ActiveTool } from '../types';

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
            if (saved === 'packer' || saved === 'implementation' || saved === 'extra' || saved === 'ai') {
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

    const activePackageTask = useMemo(() => {
        if (!activePackage) return null;
        return (
            implTasks.tasks.find(
                (t) => t.id === activePackage.taskId || t.packageId === activePackage.id
            ) || null
        );
    }, [activePackage, implTasks.tasks]);

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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3"
                style={{ background: '#f0f4f0' }}>
                <svg className="animate-spin w-7 h-7" style={{ color: '#22c55e' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: '#6b7280' }}>Загрузка GDHelper...</span>
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col relative ${
                activeTool === 'ai' ? 'h-screen overflow-hidden' : 'min-h-screen'
            }`}
            style={{ background: '#f0f4f0', color: '#111827' }}
        >
            {/* Global Drag Overlay */}
            {isDraggingOver && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-fade-in"
                    style={{
                        background: 'rgba(240,244,240,0.95)',
                        border: '3px dashed #22c55e',
                    }}
                >
                    <UploadCloud className="w-14 h-14 animate-bounce mb-3" style={{ color: '#22c55e' }} />
                    <h2 className="text-base font-bold mb-1" style={{ color: '#111827' }}>
                        Отпустите файлы здесь
                    </h2>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                        ZIP-архив или пачка .guf файлов будет импортирована
                    </p>
                </div>
            )}

            {/* Auto-Collect Top Toast Notification */}
            {autoCollectNotification && (
                <div className="fixed top-2 left-2 right-2 z-50 flex justify-center pointer-events-none animate-toast-in">
                    <div className="pointer-events-auto w-full max-w-sm bg-white/95 backdrop-blur-md rounded-xl border border-emerald-300/90 shadow-gd-green px-2.5 py-2 flex items-center gap-2 select-none">
                        {/* Icon badge */}
                        <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <Zap className="w-3.5 h-3.5 text-white animate-icon-pop fill-current" />
                        </div>

                        {/* Text info */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[11px] font-bold text-slate-800 flex-shrink-0">
                                    Перехвачен .guf
                                </span>

                                {autoCollectNotification.cardId && (
                                    <span
                                        className="inline-flex items-center font-mono text-[9px] font-bold bg-emerald-100/90 text-emerald-800 px-1 py-0.2 rounded border border-emerald-200/90 flex-shrink-0"
                                        title={`ID карточки в GreenData: ${autoCollectNotification.cardId}`}
                                    >
                                        ID: {autoCollectNotification.cardId}
                                    </span>
                                )}

                                {autoCollectNotification.mode && (
                                    <span className="text-[8.5px] font-semibold px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/90 flex-shrink-0">
                                        {autoCollectNotification.mode === 'original' ? 'исходный' : 'со страницы'}
                                    </span>
                                )}

                                <span
                                    className="text-[9px] text-slate-400 font-medium truncate ml-auto flex-shrink-0 max-w-[100px]"
                                    title={`Добавлен в пакет: ${activePackage.name}`}
                                >
                                    → {activePackage.name}
                                </span>
                            </div>

                            <p
                                className="text-[10.5px] font-mono font-bold text-emerald-900 truncate leading-tight"
                                title={autoCollectNotification.fileName}
                            >
                                {autoCollectNotification.fileName}
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={clearNotification}
                            className="w-5 h-5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                            title="Закрыть уведомление"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <Header
                activeTool={activeTool}
                fileCount={files.length}
                onSelectTool={handleSelectTool}
            />

            {/* Main Content Area */}
            <main
                className={
                    activeTool === 'ai'
                        ? 'flex-1 overflow-hidden flex flex-col min-h-0 p-0'
                        : 'flex-1 p-3 space-y-3 pb-6'
                }
            >
                {/* AI Chat View (preserved in DOM so streaming / scroll / inputs never get lost) */}
                <div className={activeTool === 'ai' ? 'flex-1 overflow-hidden flex flex-col min-h-0 h-full' : 'hidden'}>
                    <AiChatContainer />
                </div>

                {/* Extra Tools View */}
                <div className={activeTool === 'extra' ? 'space-y-3' : 'hidden'}>
                    <ExtraContainer />
                </div>

                {/* Implementation Tool View */}
                <div className={activeTool === 'implementation' ? 'space-y-3' : 'hidden'}>
                    <ImplementationTool
                        packages={packages}
                        tasksState={implTasks}
                        onNavigateToPackage={(pkgId: string) => {
                            if (pkgId) selectPackage(pkgId);
                            handleSelectTool('packer');
                        }}
                    />
                </div>

                {/* Packer View */}
                <div className={activeTool === 'packer' ? 'space-y-3' : 'hidden'}>
                    {/* Package Selector / Session Switcher */}
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
                        isAutoCollectEnabled={isAutoCollectEnabled}
                        onToggleAutoCollect={toggleAutoCollect}
                    />

                    {/* Auto-Collect Naming Mode Bar - Separate card below PackageSelector */}
                    <AutoCollectModeBar
                        namingMode={autoCollectNamingMode}
                        onChangeNamingMode={setAutoCollectNamingMode}
                        isAutoCollectEnabled={isAutoCollectEnabled}
                        onToggleAutoCollect={toggleAutoCollect}
                    />

                    {files.length === 0 ? (
                        <FileUploader
                            onLoadZip={loadZip}
                            onLoadGufFiles={loadGufFiles}
                        />
                    ) : (
                        <>
                            {/* Package Tools Bar - Displayed in a separate block when at least one file is loaded */}
                            <Toolbar className="animate-fade-in">
                                <Toolbar.Title
                                    icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                                    title={<span className="hidden sm:inline">Инструменты</span>}
                                    titleAttr="Инструменты"
                                />

                                <Toolbar.Actions>
                                    <Toolbar.Button
                                        icon={<SlidersHorizontal className="w-3 h-3 text-emerald-600" />}
                                        onClick={() => setIsMassActionsOpen(true)}
                                        title="Массовые действия и заполнение тегов (переменных) для файлов"
                                    >
                                        Теги
                                    </Toolbar.Button>

                                    <Toolbar.Button
                                        icon={<Bookmark className="w-3 h-3 text-emerald-600" />}
                                        onClick={() => setIsPresetsOpen(true)}
                                        title="Пресеты шаблонов наименования"
                                    >
                                        Пресеты
                                    </Toolbar.Button>

                                    <Toolbar.Button
                                        icon={<FileEdit className="w-3 h-3 text-emerald-600" />}
                                        onClick={() => setIsReadmeOpen(true)}
                                        title="Редактор README.txt"
                                        dot={Boolean(readmeContent && readmeContent.trim().length > 0)}
                                    >
                                        README
                                    </Toolbar.Button>

                                    <Toolbar.IconButton
                                        variant="danger"
                                        onClick={clearFiles}
                                        title="Очистить все файлы в активном пакете"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Toolbar.IconButton>
                                </Toolbar.Actions>
                            </Toolbar>

                            {/* Template Editor */}
                            <TemplateEditor
                                template={template}
                                primaryTemplate={primaryTemplate}
                                startNumber={startNumber}
                                variables={variables}
                                firstFile={files[0]}
                                onSetTemplate={setTemplate}
                                onSetPrimaryTemplate={setPrimaryTemplate}
                                onSetStartNumber={setStartNumber}
                                onResetTemplate={resetTemplate}
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
