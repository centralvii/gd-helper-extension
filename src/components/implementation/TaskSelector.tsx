import React, { useState } from 'react';
import { Plus, Trash2, Copy, Check, Edit2, ArrowDownUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { ImplementationTask } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { pluralizeRu, CHANGE_FORMS } from '../../utils/pluralize';

interface TaskSelectorProps {
  tasks: ImplementationTask[];
  activeTask: ImplementationTask | null;
  onSelectTask: (id: string) => void;
  onCreateTask: () => void;
  onDuplicateTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask?: (id: string, updates: Partial<Omit<ImplementationTask, 'id' | 'createdAt'>>) => void;
  onOpenImportExport?: (defaultTab?: 'export' | 'import') => void;
  /** 'detail' — строка «‹ Задачи» над открытой задачей; 'list' — экран списка задач */
  view: 'detail' | 'list';
  onChangeView: (view: 'detail' | 'list') => void;
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
  view,
  onChangeView,
}) => {
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

  const handleConfirmRename = (e?: React.FormEvent) => {
    e?.preventDefault();
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

  const confirmDelete = () => {
    if (taskToDelete) {
      onDeleteTask(taskToDelete.id);
    }
    setTaskToDelete(null);
  };

  const openTask = (id: string) => {
    onSelectTask(id);
    onChangeView('detail');
  };

  const filteredTasks = tasks.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.taskNumber.toLowerCase().includes(query) ||
      t.title.toLowerCase().includes(query) ||
      (t.summary && t.summary.toLowerCase().includes(query))
    );
  });

  const collectedOf = (t: ImplementationTask) => t.items.filter((i) => i.isCollected).length;

  return (
    <>
      {view === 'detail' ? (
        /* Навигационная строка над задачей: назад к списку + действия */
        <div className="flex items-center justify-between gap-2 -mt-1">
          <button
            type="button"
            onClick={() => onChangeView('list')}
            className="inline-flex items-center gap-0.5 -ml-1.5 pl-0.5 pr-2 h-8 rounded-full text-[15px] font-medium text-gd-accent hover:bg-gd-accent-light cursor-pointer"
            title="Все задачи реализации"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            Задачи
            <span className="ml-1 text-[12px] font-semibold text-gd-muted tabular-nums">{tasks.length}</span>
          </button>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onCreateTask} title="Новая задача" className="icon-btn !bg-gd-accent-light !text-gd-accent">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>
            {activeTask && (
              <button
                type="button"
                onClick={() => handleOpenRename(activeTask)}
                title="Изменить номер и название задачи"
                className="icon-btn"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {activeTask && tasks.length > 1 && (
              <button
                type="button"
                onClick={() => setTaskToDelete(activeTask)}
                title="Удалить задачу"
                className="icon-btn icon-btn--danger"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Экран списка задач */
        <div className="space-y-4 animate-screen-back">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim() && filteredTasks[0]) {
                  e.preventDefault();
                  openTask(filteredTasks[0].id);
                } else if (e.key === 'Escape' && searchQuery) {
                  e.preventDefault();
                  setSearchQuery('');
                }
              }}
              aria-label="Поиск задач"
              placeholder="Поиск по номеру или названию"
              className="gd-field !pl-8 !bg-[rgba(118,118,128,0.12)]"
            />
          </div>

          <div>
            <div className="gd-section-title">
              <span>Задачи реализации · {tasks.length}</span>
            </div>
            <div className="gd-group gd-stagger">
              {filteredTasks.map((t) => {
                const isActive = t.id === activeTask?.id;
                const done = collectedOf(t);
                const total = t.items.length;
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => openTask(t.id)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        openTask(t.id);
                      }
                    }}
                    className="gd-row gd-row--tap group/row !py-2.5"
                  >
                    <span className="w-5 flex justify-center flex-shrink-0">
                      {isActive && <Check className="w-4 h-4 text-gd-accent" strokeWidth={2.75} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-[13px] font-semibold text-slate-900 whitespace-nowrap flex-shrink-0">
                          {t.taskNumber}
                        </span>
                        <span className="truncate text-[13.5px] text-slate-900 min-w-0">{t.title}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 w-16 rounded-full bg-gd-fill overflow-hidden flex-shrink-0">
                          <div
                            className="h-full rounded-full bg-gd-accent transition-[width] duration-500"
                            style={{ width: total ? `${Math.round((done / total) * 100)}%` : '0%' }}
                          />
                        </div>
                        <span className="text-[11.5px] text-gd-muted tabular-nums truncate">
                          {total} {pluralizeRu(total, CHANGE_FORMS)}
                          {total > 0 ? ` · собрано ${done}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => onDuplicateTask(t.id)} title="Дублировать задачу" className="icon-btn icon-btn--plain w-7 h-7">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleOpenRename(t)} title="Изменить номер и название" className="icon-btn icon-btn--plain w-7 h-7">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {tasks.length > 1 && (
                        <button type="button" onClick={() => setTaskToDelete(t)} title="Удалить задачу" className="icon-btn icon-btn--plain icon-btn--danger w-7 h-7">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredTasks.length === 0 && (
                <div className="gd-row justify-center text-[13px] text-gd-muted">Ничего не найдено</div>
              )}
            </div>
          </div>

          <div className="gd-group gd-group--icons">
            <button
              type="button"
              onClick={() => {
                onCreateTask();
                onChangeView('detail');
              }}
              className="gd-row gd-row--tap w-full text-left"
            >
              <span className="gd-row-icon gd-row-icon--accent">
                <Plus />
              </span>
              <span className="flex-1 text-[14px] font-medium text-gd-accent">Новая задача</span>
            </button>
            {onOpenImportExport && (
              <button
                type="button"
                onClick={() => onOpenImportExport('export')}
                title="Импорт и экспорт задач в JSON"
                className="gd-row gd-row--tap w-full text-left"
              >
                <span className="gd-row-icon">
                  <ArrowDownUp />
                </span>
                <span className="flex-1 text-[14px] text-slate-900">Импорт и экспорт…</span>
                <ChevronRight className="w-4 h-4 text-gd-faint" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        title="Удалить задачу реализации?"
        maxWidth="sm"
        initialFocus="sheet"
        onSubmit={confirmDelete}
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
              onClick={confirmDelete}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-700">
          Удалить задачу{' '}
          <strong className="text-slate-900">«{taskToDelete?.taskNumber}»</strong> (
          {taskToDelete?.title}) вместе со всеми пунктами ({taskToDelete?.items.length})?
        </p>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={Boolean(taskToRename)}
        onClose={() => setTaskToRename(null)}
        title="Номер и название задачи"
        maxWidth="sm"
        onSubmit={handleConfirmRename}
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
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Номер задачи:
            </label>
            <Input
              value={renameTaskNumber}
              onChange={(e) => setRenameTaskNumber(e.target.value)}
              placeholder="GD-1234"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Название задачи:
            </label>
            <Input
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              placeholder="Например: Доработка модуля согласования"
            />
          </div>
        </form>
      </Modal>
    </>
  );
};
