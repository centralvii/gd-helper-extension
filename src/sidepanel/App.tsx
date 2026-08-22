import React, { useState } from 'react';
import { UploadCloud, Zap, Check, X } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { useGlobalFileDrop } from '../hooks/useGlobalFileDrop';
import { useAutoCollector } from '../hooks/useAutoCollector';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ImplementationTool } from '../components/implementation/ImplementationTool';
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
        archiveName,
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

    // Active Tool state
    const [activeTool, setActiveTool] = useState<ActiveTool>(() => {
        try {
            const saved = localStorage.getItem('gd-helper-active-tool');
            if (saved === 'packer' || saved === 'implementation') {
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
        notification: autoCollectNotification,
        clearNotification,
    } = useAutoCollector({
        onFileCollected: (file) => {
            handleSelectTool('packer');
            addFiles([file]);
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
            <div className="flex flex-col items-center justify-center min-h-screen text-xs gap-3"
                style={{ background: '#080d08', color: '#22c55e', fontFamily: 'monospace' }}>
                <svg className="animate-spin w-7 h-7" style={{ color: '#22c55e' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>[ ИНИЦИАЛИЗАЦИЯ GDHELPER... ]</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen relative" style={{ background: '#080d08', color: '#d4edda' }}>
            {/* Global Drag Overlay */}
            {isDraggingOver && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-fade-in"
                    style={{
                        background: 'rgba(8,13,8,0.93)',
                        border: '3px dashed rgba(34,197,94,0.6)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <UploadCloud className="w-14 h-14 animate-bounce mb-3" style={{ color: '#22c55e' }} />
                    <h2 className="text-base font-bold mb-1" style={{ color: '#d4edda', fontFamily: 'monospace' }}>
                        &gt; ОТПУСТИТЕ ФАЙЛЫ
                    </h2>
                    <p className="text-xs" style={{ color: '#6b9a6b', fontFamily: 'monospace' }}>
                        ZIP-архив или пачка .guf файлов будет импортирована
                    </p>
                </div>
            )}

            {/* Auto-Collect Toast Notification */}
            {autoCollectNotification && (
                <div
                    className="fixed top-3 right-3 z-50 max-w-xs p-3 rounded-xl shadow-2xl backdrop-blur-md flex items-start gap-2.5 animate-fade-in"
                    style={{
                        background: 'rgba(13,21,13,0.97)',
                        border: '1px solid rgba(34,197,94,0.45)',
                        boxShadow: '0 0 0 1px rgba(34,197,94,0.15), 0 8px 32px rgba(0,0,0,0.7)',
                    }}
                >
                    <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#d4edda', fontFamily: 'monospace' }}>
                            <Check className="w-3 h-3" style={{ color: '#22c55e' }} />
                            <span>FILE CAPTURED</span>
                        </div>
                        <p className="text-[11px] truncate mt-0.5" style={{ color: '#22c55e', fontFamily: 'monospace' }}>
                            {autoCollectNotification.fileName}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#6b9a6b', fontFamily: 'monospace' }}>
                            → {activePackage.name}
                        </p>
                    </div>
                    <button
                        onClick={clearNotification}
                        className="icon-btn p-0.5"
                        style={{ color: '#6b9a6b' }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Header */}
            <Header
                activeTool={activeTool}
                fileCount={files.length}
                hasReadme={Boolean(
                    readmeContent && readmeContent.trim().length > 0,
                )}
                onSelectTool={handleSelectTool}
                onOpenPresets={() => setIsPresetsOpen(true)}
                onOpenMassActions={() => setIsMassActionsOpen(true)}
                onOpenReadme={() => setIsReadmeOpen(true)}
                onClearFiles={clearFiles}
            />

            {/* Main Content Area */}
            <main className="flex-1 p-3 space-y-3.5 pb-6">
                {activeTool === 'implementation' ? (
                    <ImplementationTool />
                ) : (
                    <>
                        {/* Package Selector / Session Switcher */}
                        <PackageSelector
                            packages={packages}
                            activePackage={activePackage}
                            onSelectPackage={selectPackage}
                            onCreatePackage={createPackage}
                            onDuplicatePackage={duplicatePackage}
                            onRenamePackage={renamePackage}
                            onDeletePackage={deletePackage}
                            isAutoCollectEnabled={isAutoCollectEnabled}
                            onToggleAutoCollect={toggleAutoCollect}
                        />

                        {files.length === 0 ? (
                            <div className="py-6">
                                <FileUploader
                                    onLoadZip={loadZip}
                                    onLoadGufFiles={loadGufFiles}
                                />
                            </div>
                        ) : (
                            <>
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
                    </>
                )}
            </main>

            {/* Footer / Export bar (only for packer tool) */}
            {activeTool === 'packer' && (
                <Footer
                    fileCount={files.length}
                    validation={validation}
                    archiveName={archiveName}
                    isExporting={isExporting}
                    onSetArchiveName={setArchiveName}
                    onExportZip={exportZip}
                    onOpenValidation={() => setIsValidationOpen(true)}
                />
            )}

            {/* Modals */}
            <MassActionsModal
                isOpen={isMassActionsOpen}
                onClose={() => setIsMassActionsOpen(false)}
                variables={variables}
                variableValues={variableValues}
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
