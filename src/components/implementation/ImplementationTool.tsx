import React from 'react';
import { useImplementationTasks } from '../../hooks/useImplementationTasks';
import { TaskSelector } from './TaskSelector';
import { TaskEditor } from './TaskEditor';

export const ImplementationTool: React.FC = () => {
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
  } = useImplementationTasks();

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
      />

      {/* Main Task Editor */}
      {activeTask && (
        <TaskEditor
          task={activeTask}
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
        />
      )}
    </div>
  );
};
