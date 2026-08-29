import React, { useState } from 'react';
import { useImplementationTasks } from '../../hooks/useImplementationTasks';
import { TaskSelector } from './TaskSelector';
import { TaskEditor } from './TaskEditor';
import { TaskImportExportModal } from './TaskImportExportModal';
import { BuildPackage } from '../../types';

interface ImplementationToolProps {
  packages?: BuildPackage[];
  tasksState?: ReturnType<typeof useImplementationTasks>;
  onNavigateToPackage?: (pkgId: string) => void;
}

export const ImplementationTool: React.FC<ImplementationToolProps> = ({
  packages = [],
  tasksState,
  onNavigateToPackage,
}) => {
  const localTasks = useImplementationTasks();
  const {
    tasks,
    activeTask,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    selectTask,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    addChangeItem,
    updateChangeItem,
    deleteChangeItem,
    reorderChangeItems,
    moveChangeItem,
    importTasks,
  } = tasksState || localTasks;

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [importExportDefaultTab, setImportExportDefaultTab] = useState<'export' | 'import'>('export');

  const handleOpenImportExport = (tab: 'export' | 'import' = 'export') => {
    setImportExportDefaultTab(tab);
    setIsImportExportOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Top Task Selector bar */}
      <TaskSelector
        tasks={tasks}
        activeTask={activeTask}
        onSelectTask={selectTask}
        onCreateTask={() => createTask()}
        onDuplicateTask={duplicateTask}
        onDeleteTask={deleteTask}
        onUpdateTask={updateTask}
        onOpenImportExport={handleOpenImportExport}
      />

      {/* Main Task Editor */}
      {activeTask && (
        <TaskEditor
          task={activeTask}
          packages={packages}
          onNavigateToPackage={onNavigateToPackage}
          onUpdateTask={updateTask}
          onAddSection={addSection}
          onUpdateSection={updateSection}
          onDeleteSection={deleteSection}
          onReorderSections={reorderSections}
          onAddChangeItem={addChangeItem}
          onUpdateChangeItem={updateChangeItem}
          onDeleteChangeItem={deleteChangeItem}
          onReorderChangeItems={reorderChangeItems}
          onMoveChangeItem={moveChangeItem}
          onOpenImportExport={handleOpenImportExport}
        />
      )}

      {/* Backup / Export / Import Modal */}
      <TaskImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        tasks={tasks}
        activeTask={activeTask}
        onImport={importTasks}
        defaultTab={importExportDefaultTab}
      />
    </div>
  );
};
