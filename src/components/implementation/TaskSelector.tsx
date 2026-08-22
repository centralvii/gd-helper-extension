import React, { useState } from 'react';
import { Plus, Trash2, Copy, ChevronDown, Check, FileCode } from 'lucide-react';
import { ImplementationTask } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

interface TaskSelectorProps {
  tasks: ImplementationTask[];
  activeTask: ImplementationTask | null;
  onSelectTask: (id: string) => void;
  onCreateTask: () => void;
  onDuplicateTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskSelector: React.FC<TaskSelectorProps> = ({
  tasks,
  activeTask,
  onSelectTask,
  onCreateTask,
  onDuplicateTask,
  onDeleteTask,
}) => {
  const [isOpenList, setIsOpenList] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ImplementationTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.taskNumber.toLowerCase().includes(query) ||
      t.title.toLowerCase().includes(query) ||
      t.summary.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className="flex items-center justify-between gap-2 p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* Active Task Trigger / Dropdown */}
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => setIsOpenList(!isOpenList)}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-left border border-gray-200 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="truncate">
                <span className="font-bold text-xs text-emerald-700 mr-1.5">
                  {activeTask?.taskNumber || 'Задача'}:
                </span>
                <span className="text-xs text-gray-900 font-medium truncate">
                  {activeTask?.title || 'Без названия'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge variant="default" size="sm">
                {activeTask?.items.length || 0} изм.
              </Badge>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-900 transition-transform" />
            </div>
          </button>

          {/* Task Dropdown Menu */}
          {isOpenList && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpenList(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in max-h-72 flex flex-col">
                {/* Search */}
                {tasks.length > 2 && (
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск задачи..."
                      className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* List */}
                <div className="overflow-y-auto flex-1 p-1.5 space-y-0.5">
                  {filteredTasks.map((t) => {
                    const isActive = t.id === activeTask?.id;
                    return (
                      <div
                        key={t.id}
                        className={`group/item flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <button
                          onClick={() => {
                            onSelectTask(t.id);
                            setIsOpenList(false);
                          }}
                          className="flex-1 text-left truncate min-w-0 flex items-center gap-1.5"
                        >
                          <span className="font-bold text-emerald-700 flex-shrink-0">
                            {t.taskNumber}
                          </span>
                          <span className="truncate font-medium">{t.title}</span>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[10px] text-gray-400">
                            {t.items.length} изм.
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskToDelete(t);
                            }}
                            title="Удалить задачу"
                            className="icon-btn icon-btn--danger p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover/item:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer of dropdown */}
                <div className="p-1.5 border-t border-gray-100 bg-gray-50/70">
                  <button
                    onClick={() => {
                      onCreateTask();
                      setIsOpenList(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Создать новую задачу</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Task Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateTask}
            title="Создать новую задачу"
            leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
          >
            <span className="hidden sm:inline">Создать</span>
          </Button>

          {activeTask && (
            <button
              onClick={() => onDuplicateTask(activeTask.id)}
              title="Дублировать задачу"
              className="icon-btn p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {activeTask && (
            <button
              onClick={() => setTaskToDelete(activeTask)}
              title="Удалить задачу"
              className="icon-btn icon-btn--danger p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        title="Удалить задачу?"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTaskToDelete(null)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                if (taskToDelete) {
                  onDeleteTask(taskToDelete.id);
                }
                setTaskToDelete(null);
              }}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-xs text-gray-700">
          Вы уверены, что хотите удалить задачу{' '}
          <strong className="text-gray-900">{taskToDelete?.taskNumber}</strong> (
          {taskToDelete?.title}) и все записанные в ней изменения ({taskToDelete?.items.length} шт.)?
        </p>
      </Modal>
    </>
  );
};
