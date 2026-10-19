import React, { useCallback, useEffect, useState } from 'react';
import { RotateCcw, Trash2, Upload } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { pluralizeRu, CHANGE_FORMS } from '../../utils/pluralize';
import { useImplementationTasks } from '../../hooks/useImplementationTasks';
import { TaskSelector } from './TaskSelector';
import { TaskEditor } from './TaskEditor';
import { TaskImportExportModal } from './TaskImportExportModal';
import { BuildPackage, ImplementationTask } from '../../types';

interface ImplementationToolProps {
  packages?: BuildPackage[];
  tasksState: ReturnType<typeof useImplementationTasks>;
  onNavigateToPackage?: (pkgId: string) => void;
  onSetStartNumber?: (num: number) => void;
  onShowToast?: (notification: { fileName: string; number: number }) => void;
}

export const ImplementationTool: React.FC<ImplementationToolProps> = ({
  packages = [],
  tasksState,
  onNavigateToPackage,
  onSetStartNumber,
  onShowToast,
}) => {
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
    toggleChangeItemCollected,
    setAllChangeItemsCollected,
    reorderChangeItems,
    moveChangeItem,
    importTasks,
    restoreTask,
    restoreChangeItem,
    replaceAllTasks,
    markItemsCollectedByIds,
  } = tasksState;

  const toast = useToast();

  // Удаление задачи — с возможностью отменить из уведомления
  const handleDeleteTask = useCallback(
    (id: string) => {
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) return;
      const snapshot = tasks[index];
      deleteTask(id);
      toast.show({
        icon: <Trash2 />,
        title: 'Задача удалена',
        detail: `${snapshot.taskNumber} · ${snapshot.title}`,
        action: { label: 'Отменить', onClick: () => restoreTask(snapshot, index) },
      });
    },
    [tasks, deleteTask, restoreTask, toast]
  );

  // Удаление пункта изменения — тоже с отменой
  const handleDeleteChangeItem = useCallback(
    (taskId: string, itemId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      const index = task ? task.items.findIndex((i) => i.id === itemId) : -1;
      if (!task || index === -1) return;
      const item = task.items[index];
      deleteChangeItem(taskId, itemId);
      toast.show({
        icon: <Trash2 />,
        title: 'Пункт удалён',
        detail: item.description,
        action: { label: 'Отменить', onClick: () => restoreChangeItem(taskId, item, index) },
      });
    },
    [tasks, deleteChangeItem, restoreChangeItem, toast]
  );

  // Сброс отметок «собрано» — с возможностью вернуть их
  const handleSetAllCollected = useCallback(
    (taskId: string, isCollected: boolean) => {
      const task = tasks.find((t) => t.id === taskId);
      const collectedIds = task ? task.items.filter((i) => i.isCollected).map((i) => i.id) : [];
      setAllChangeItemsCollected(taskId, isCollected);
      if (!isCollected && collectedIds.length > 0) {
        toast.show({
          icon: <RotateCcw />,
          title: 'Отметки сброшены',
          detail: `${collectedIds.length} ${pluralizeRu(collectedIds.length, CHANGE_FORMS)}`,
          action: { label: 'Отменить', onClick: () => markItemsCollectedByIds(taskId, collectedIds) },
        });
      }
    },
    [tasks, setAllChangeItemsCollected, markItemsCollectedByIds, toast]
  );

  // Импорт меняет задачи — можно откатить к состоянию до импорта
  const handleImport = useCallback(
    (
      importedTasks: ImplementationTask[],
      mode: 'merge' | 'replace' | 'update_active',
      targetTaskId?: string
    ) => {
      const snapshot = tasks;
      const prevActiveId = activeTask?.id;
      const result = importTasks(importedTasks, mode, targetTaskId);
      if (result.success) {
        toast.show({
          icon: <Upload />,
          tone: 'success',
          title: `Импортировано задач: ${result.count}`,
          action: { label: 'Отменить', onClick: () => replaceAllTasks(snapshot, prevActiveId) },
        });
      }
      return result;
    },
    [tasks, activeTask?.id, importTasks, replaceAllTasks, toast]
  );

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  // Навигация iOS: список задач ↔ открытая задача
  const [view, setView] = useState<'detail' | 'list'>('detail');

  // Смена активной задачи (выбор, создание, перенос из YouTrack) открывает её экран
  const activeTaskId = activeTask?.id;
  useEffect(() => {
    setView('detail');
  }, [activeTaskId]);
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
        onDeleteTask={handleDeleteTask}
        onUpdateTask={updateTask}
        onOpenImportExport={handleOpenImportExport}
        view={view}
        onChangeView={setView}
      />

      {/* Main Task Editor */}
      {activeTask && view === 'detail' && (
        <div className="space-y-3 animate-screen-in">
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
          onDeleteChangeItem={handleDeleteChangeItem}
          onToggleChangeItemCollected={toggleChangeItemCollected}
          onSetAllChangeItemsCollected={handleSetAllCollected}
          onReorderChangeItems={reorderChangeItems}
          onMoveChangeItem={moveChangeItem}
          onOpenImportExport={handleOpenImportExport}
          onSetStartNumber={onSetStartNumber}
          onShowToast={onShowToast}
        />
        </div>
      )}

      {/* Backup / Export / Import Modal */}
      <TaskImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        tasks={tasks}
        activeTask={activeTask}
        onImport={handleImport}
        defaultTab={importExportDefaultTab}
      />
    </div>
  );
};
