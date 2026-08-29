import React, { useState } from 'react';
import { Plus, Trash2, Copy, ChevronDown, Check, FileCode, Edit2, ArrowDownUp } from 'lucide-react';
import { ImplementationTask } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface TaskSelectorProps {
  tasks: ImplementationTask[];
  activeTask: ImplementationTask | null;
  onSelectTask: (id: string) => void;
  onCreateTask: () => void;
  onDuplicateTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask?: (id: string, updates: Partial<Omit<ImplementationTask, 'id' | 'createdAt'>>) => void;
  onOpenImportExport?: (defaultTab?: 'export' | 'import') => void;
}

export const TaskSelector: React.FC<TaskSelectorProps> = ({
  tasks,
  activeTask,
  onSelectTask,
  onCreateTask,
  onDuplicateTask,
  onDeleteTask,
  onUpdateTask,
  onOpenImportExport,
}) => {
  const [isOpenList, setIsOpenList] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ImplementationTask | null>(null);
  const [taskToRename, setTaskToRename] = useState<ImplementationTask | null>(null);
  const [renameTaskNumber, setRenameTaskNumber] = useState('');
  const [renameTitle, setRenameTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenRename = (t: ImplementationTask) => {
    setTaskToRename(t);
    setRenameTaskNumber(t.taskNumber);
    setRenameTitle(t.title);
  };

  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskToRename) {
      const taskNumber = renameTaskNumber.trim() || 'GD-000';
      const title = renameTitle.trim() || 'Без названия';
      if (onUpdateTask) {
        onUpdateTask(taskToRename.id, { taskNumber, title });
      } else {
        taskToRename.taskNumber = taskNumber;
        taskToRename.title = title;
        taskToRename.updatedAt = Date.now();
      }
    }
    setTaskToRename(null);
  };

  const filteredTasks = tasks.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.taskNumber.toLowerCase().includes(query) ||
      t.title.toLowerCase().includes(query) ||
      (t.summary && t.summary.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <div className="relative flex items-center justify-between gap-1.5 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        {/* Active Task Trigger */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setIsOpenList(!isOpenList)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50/90 hover:bg-slate-100/90 text-left border border-slate-200/90 rounded-xl transition-all group shadow-2xs cursor-pointer min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold shadow-2xs">
                <FileCode className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap flex-shrink-0">
                  {activeTask?.taskNumber || 'Задача'}:
                </span>
                <span className="text-xs text-slate-900 font-bold truncate min-w-0">
                  {activeTask?.title || 'Без названия'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600 shadow-2xs whitespace-nowrap">
                {activeTask?.items.length || 0} изм.
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform flex-shrink-0 ${
                  isOpenList ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Task Dropdown Menu - Spans full card width */}
        {isOpenList && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpenList(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-fade-in flex flex-col w-full">
              {/* Search if more than 2 tasks */}
              {tasks.length > 2 && (
                <div className="p-2 border-b border-gray-100 bg-gray-50/70">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по номеру или названию..."
                    className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              )}

              {/* Header title */}
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                <span>Задачи реализации ({tasks.length})</span>
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-56 p-1.5 space-y-1">
                {filteredTasks.map((t) => {
                  const isActive = t.id === activeTask?.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        onSelectTask(t.id);
                        setIsOpenList(false);
                      }}
                      className={`group/row flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50/70 text-emerald-950 font-semibold border border-emerald-200/80 shadow-2xs'
                          : 'hover:bg-gray-50 text-gray-800 border border-transparent'
                      }`}
                    >
                      {/* Left: Indicator & Title */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isActive ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-gray-300'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-emerald-800 text-[11px] whitespace-nowrap flex-shrink-0">
                              {t.taskNumber}
                            </span>
                            <span className="text-slate-400 text-[10px] flex-shrink-0">•</span>
                            <span className="truncate text-xs text-gray-900 font-medium min-w-0">
                              {t.title}
                            </span>
                          </div>
                          <span className="block text-[10px] text-gray-400 font-normal">
                            {t.items.length} {t.items.length === 1 ? 'изменение' : 'изменений'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div
                        className="flex items-center gap-0.5 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isActive && (
                          <Check className="w-4 h-4 text-emerald-600 mr-1 flex-shrink-0" />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onDuplicateTask(t.id);
                            setIsOpenList(false);
                          }}
                          title="Дублировать задачу"
                          className="icon-btn p-1 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleOpenRename(t);
                            setIsOpenList(false);
                          }}
                          title="Редактировать номер/название"
                          className="icon-btn p-1 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setTaskToDelete(t);
                              setIsOpenList(false);
                            }}
                            title="Удалить задачу"
                            className="icon-btn icon-btn--danger p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer: Create Task & Import/Export Buttons */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/70 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onCreateTask();
                    setIsOpenList(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200/80 rounded-xl transition-all font-semibold shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Новая задача</span>
                </button>

                {onOpenImportExport && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenImportExport('export');
                      setIsOpenList(false);
                    }}
                    title="Резервное копирование, экспорт и импорт в формате JSON"
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs text-slate-700 hover:text-emerald-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all font-medium shadow-2xs cursor-pointer whitespace-nowrap flex-shrink-0"
                  >
                    <ArrowDownUp className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span>Импорт / Экспорт</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Task Actions Toolbar */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateTask}
            title="Создать новую задачу"
            leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
            className="hidden sm:inline-flex"
          >
            Создать
          </Button>

          {onOpenImportExport && (
            <button
              type="button"
              onClick={() => onOpenImportExport('export')}
              title="Резервное копирование, экспорт и импорт в формате JSON"
              className="icon-btn p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
            </button>
          )}

          {activeTask && tasks.length > 1 && (
            <button
              type="button"
              onClick={() => setTaskToDelete(activeTask)}
              title="Удалить задачу"
              className="icon-btn icon-btn--danger p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
        title="Удалить задачу реализации?"
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
          <strong className="text-gray-900">"{taskToDelete?.taskNumber}"</strong> (
          {taskToDelete?.title}) и все записанные в ней изменения ({taskToDelete?.items.length} шт.)?
        </p>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={Boolean(taskToRename)}
        onClose={() => setTaskToRename(null)}
        title="Редактировать параметры задачи"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTaskToRename(null)}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmRename}
            >
              Сохранить
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmRename} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Номер задачи (Jira / Task ID):
            </label>
            <Input
              value={renameTaskNumber}
              onChange={(e) => setRenameTaskNumber(e.target.value)}
              placeholder="GD-1234"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Название задачи:
            </label>
            <Input
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              placeholder="Доработка модуля согласования"
            />
          </div>
        </form>
      </Modal>
    </>
  );
};
