import React, { useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { useGlobalFileDrop } from '../hooks/useGlobalFileDrop';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ToolSelector } from '../components/layout/ToolSelector';
import { ImplementationTool } from '../components/implementation/ImplementationTool';
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
    customVars: Record<string, string>
  ) => {
    updateFileCleanName(id, cleanName);
    updateFileDescription(id, description);
    for (const [k, v] of Object.entries(customVars)) {
      updateFileVariable(id, k, v);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs">Загрузка данных GDHelper...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 relative">
      {/* Global Drag Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-emerald-950/90 border-4 border-dashed border-emerald-400 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in pointer-events-none">
          <UploadCloud className="w-16 h-16 text-emerald-300 animate-bounce mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Отпустите файлы здесь</h2>
          <p className="text-xs text-emerald-200">
            ZIP-архив или пачка .guf файлов будет моментально импортирована
          </p>
        </div>
      )}

      {/* Header */}
      <Header
        activeTool={activeTool}
        fileCount={files.length}
        hasReadme={Boolean(readmeContent && readmeContent.trim().length > 0)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenMassActions={() => setIsMassActionsOpen(true)}
        onOpenReadme={() => setIsReadmeOpen(true)}
        onClearFiles={clearFiles}
      />

      {/* Tool Selector Bar */}
      <ToolSelector
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        fileCount={files.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 space-y-3.5 pb-6">
        {activeTool === 'implementation' ? (
          <ImplementationTool />
        ) : files.length === 0 ? (
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
