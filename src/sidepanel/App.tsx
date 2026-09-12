import React, { useState } from 'react';
import { UploadCloud, Zap, Check, X, SlidersHorizontal, Bookmark, FileEdit, Trash2 } from 'lucide-react';
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
import { FileUploader } from '../components/upload/FileUploader';
import { TemplateEditor } from '../components/template/TemplateEditor';
import { FileTable } from '../components/table/FileTable';
import { MassActionsModal } from '../components/template/MassActionsModal';
import { PresetManagerModal } from '../components/template/PresetManagerModal';
import { ReadmeEditorModal } from '../components/readme/ReadmeEditorModal';
import { ValidationPanel } from '../components/validation/ValidationPanel';
import { FileEditModal } from '../components/table/FileEditModal';
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
            handleSelectTool('packer');
            addFiles(
                [file],
                meta?.cleanName ? { [file.name]: meta.cleanName, '*': meta.cleanName } : undefined
            );
        },
    });

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

            {/* Auto-Collect Toast */}
            {autoCollectNotification && (
                <div
                    className="fixed top-3 right-3 z-50 max-w-xs p-3 rounded-xl shadow-xl flex items-start gap-2.5 animate-fade-in"
                    style={{
                        background: '#ffffff',
                        border: '1.5px solid #22c55e',
                        boxShadow: '0 4px 20px rgba(34,197,94,0.15)',
                    }}
                >
                    <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#111827' }}>
                            <Check className="w-3 h-3" style={{ color: '#22c55e' }} />
                            <span>Файл перехвачен</span>
                            {autoCollectNotification.mode && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100/90 text-emerald-800 border border-emerald-300/80">
                                    {autoCollectNotification.mode === 'original' ? 'обычное имя' : 'из алгоритма'}
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] truncate mt-0.5 font-medium" style={{ color: '#16a34a' }}>
                            {autoCollectNotification.fileName}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>
                            → {activePackage.name}
                        </p>
                    </div>
                    <button onClick={clearNotification} className="icon-btn p-0.5">
                        <X className="w-3.5 h-3.5" />
                    </button>
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
                        namingMode={autoCollectNamingMode}
                        onChangeNamingMode={setAutoCollectNamingMode}
                    />

                    {files.length === 0 ? (
                        <FileUploader
                            onLoadZip={loadZip}
                            onLoadGufFiles={loadGufFiles}
                        />
                    ) : (
                        <>
                            {/* Package Tools Bar - Displayed in a separate block when at least one file is loaded */}
                            <div className="flex items-center justify-between gap-1.5 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs animate-fade-in">
                                <div className="flex items-center gap-1.5 pl-1.5 text-xs font-bold text-slate-800 min-w-0">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    <span className="truncate">Инструменты</span>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setIsMassActionsOpen(true)}
                                        title="Массовые действия и заполнение тегов (переменных) для файлов"
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-semibold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                                    >
                                        <SlidersHorizontal className="w-3 h-3 text-emerald-600" />
                                        <span>Теги</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsPresetsOpen(true)}
                                        title="Пресеты шаблонов наименования"
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-semibold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                                    >
                                        <Bookmark className="w-3 h-3 text-emerald-600" />
                                        <span>Пресеты</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsReadmeOpen(true)}
                                        title="Редактор README.txt"
                                        className="relative inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-semibold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                                    >
                                        <FileEdit className="w-3 h-3 text-emerald-600" />
                                        <span>README</span>
                                        {Boolean(readmeContent && readmeContent.trim().length > 0) && (
                                            <span
                                                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                                style={{ boxShadow: '0 0 4px rgba(34,197,94,0.7)' }}
                                            />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={clearFiles}
                                        title="Очистить все файлы в активном пакете"
                                        className="icon-btn icon-btn--danger p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-0.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

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
                        activePackage.taskId
                            ? implTasks.tasks.find((t) => t.id === activePackage.taskId)
                            : null
                    )}
                    isExporting={isExporting}
                    onSetArchiveName={setArchiveName}
                    onExportZip={() =>
                        exportZip(
                            activePackage.taskId
                                ? implTasks.tasks.find((t) => t.id === activePackage.taskId)
                                : null
                        )
                    }
                    onOpenValidation={() => setIsValidationOpen(true)}
                />
            )}

            {/* Modals */}
            <MassActionsModal
                isOpen={isMassActionsOpen}
                onClose={() => setIsMassActionsOpen(false)}
                variables={variables}
                variableValues={variableValues}
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
        </div>
    );
};
