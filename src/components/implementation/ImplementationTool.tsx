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
    addChangeItem,
    updateChangeItem,
    deleteChangeItem,
    reorderChangeItems,
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
      />

      {/* Main Task Editor */}
      {activeTask && (
        <TaskEditor
          task={activeTask}
          onUpdateTask={updateTask}
          onAddChangeItem={addChangeItem}
          onUpdateChangeItem={updateChangeItem}
          onDeleteChangeItem={deleteChangeItem}
          onReorderChangeItems={reorderChangeItems}
        />
      )}
    </div>
  );
};
