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
      <div className="flex items-center justify-between gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-xl">
        {/* Active Task Trigger / Dropdown */}
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => setIsOpenList(!isOpenList)}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-left border border-slate-700/80 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="truncate">
                <span className="font-bold text-xs text-emerald-300 mr-1.5">
                  {activeTask?.taskNumber || 'Задача'}:
                </span>
                <span className="text-xs text-slate-200 truncate">
                  {activeTask?.title || 'Без названия'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant="default" size="sm">
                {activeTask?.items.length || 0} изм.
              </Badge>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform" />
            </div>
          </button>

          {/* Task Dropdown Menu */}
          {isOpenList && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpenList(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-72 flex flex-col">
                {/* Search */}
                {tasks.length > 2 && (
                  <div className="p-2 border-b border-slate-800">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск задачи..."
                      className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* List */}
                <div className="overflow-y-auto flex-1 p-1 space-y-0.5">
                  {filteredTasks.map((t) => {
                    const isActive = t.id === activeTask?.id;
                    return (
                      <div
                        key={t.id}
                        className={`group/item flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <button
                          onClick={() => {
                            onSelectTask(t.id);
                            setIsOpenList(false);
                          }}
                          className="flex-1 text-left truncate min-w-0 flex items-center gap-1.5"
                        >
                          <span className="font-semibold text-emerald-400 flex-shrink-0">
                            {t.taskNumber}
                          </span>
                          <span className="truncate">{t.title}</span>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[10px] text-slate-500">
                            {t.items.length} изм.
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskToDelete(t);
                            }}
                            title="Удалить задачу"
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700/80 rounded transition-colors opacity-0 group-hover/item:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer of dropdown */}
                <div className="p-1.5 border-t border-slate-800 bg-slate-950/60">
                  <button
                    onClick={() => {
                      onCreateTask();
                      setIsOpenList(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 rounded-md transition-colors font-medium"
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
            leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-400" />}
          >
            <span className="hidden sm:inline">Создать</span>
          </Button>

          {activeTask && (
            <button
              onClick={() => onDuplicateTask(activeTask.id)}
              title="Дублировать задачу"
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {activeTask && (
            <button
              onClick={() => setTaskToDelete(activeTask)}
              title="Удалить задачу"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
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
        <p className="text-xs text-slate-300">
          Вы уверены, что хотите удалить задачу{' '}
          <strong className="text-slate-100">{taskToDelete?.taskNumber}</strong> (
          {taskToDelete?.title}) и все записанные в ней изменения ({taskToDelete?.items.length} шт.)?
        </p>
      </Modal>
    </>
  );
};
