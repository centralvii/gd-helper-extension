import React, { useState, useMemo } from 'react';
import {
  Plus,
  Sparkles,
  ListOrdered,
  FileText,
  Copy,
  Check,
  Eye,
  Info,
  FolderPlus,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react';
import {
  ImplementationTask,
  ImplementationChangeItem,
  ImplementationSection,
} from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ChangeItemRow } from './ChangeItemRow';
import { AddChangeItemModal } from './AddChangeItemModal';
import { TaskExportPreviewModal } from './TaskExportPreviewModal';
import {
  getActiveTabInfo,
  formatTaskToMarkdown,
  DEFAULT_IMPLEMENTATION_SECTIONS,
} from '../../utils/tabUtils';

interface TaskEditorProps {
  task: ImplementationTask;
  onUpdateTask: (id: string, updates: Partial<Omit<ImplementationTask, 'id' | 'createdAt'>>) => void;
  onAddSection: (taskId: string, name: string) => void;
  onUpdateSection: (taskId: string, sectionId: string, updates: Partial<ImplementationSection>) => void;
  onDeleteSection: (taskId: string, sectionId: string) => void;
  onReorderSections: (taskId: string, fromIndex: number, toIndex: number) => void;
  onAddChangeItem: (taskId: string, item: Omit<ImplementationChangeItem, 'id'>) => void;
  onUpdateChangeItem: (taskId: string, itemId: string, updates: Partial<ImplementationChangeItem>) => void;
  onDeleteChangeItem: (taskId: string, itemId: string) => void;
  onReorderChangeItems: (taskId: string, fromIndex: number, toIndex: number) => void;
  onMoveChangeItem: (taskId: string, itemId: string, targetSectionId?: string, targetIndex?: number) => void;
}

export const TaskEditor: React.FC<TaskEditorProps> = ({
  task,
  onUpdateTask,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onReorderSections,
  onAddChangeItem,
  onUpdateChangeItem,
  onDeleteChangeItem,
  onReorderChangeItems,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ImplementationChangeItem | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | undefined>(undefined);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);
  const [isTabFetching, setIsTabFetching] = useState(false);

  // Section Create/Edit Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ImplementationSection | null>(null);
  const [sectionNameInput, setSectionNameInput] = useState('');

  // Delete Section Confirm Modal State
  const [sectionToDelete, setSectionToDelete] = useState<ImplementationSection | null>(null);

  const sections = useMemo(() => {
    const raw = task.sections && task.sections.length > 0
      ? task.sections
      : DEFAULT_IMPLEMENTATION_SECTIONS;
    return [...raw].sort((a, b) => a.order - b.order);
  }, [task.sections]);

  // Group items by section
  const { groupedItems, unsectionedItems } = useMemo(() => {
    const map = new Map<string, ImplementationChangeItem[]>();
    const unsectioned: ImplementationChangeItem[] = [];

    const sectionIds = new Set(sections.map((s) => s.id));

    task.items.forEach((item) => {
      if (item.sectionId && sectionIds.has(item.sectionId)) {
        const list = map.get(item.sectionId) || [];
        list.push(item);
        map.set(item.sectionId, list);
      } else {
        unsectioned.push(item);
      }
    });

    return { groupedItems: map, unsectionedItems: unsectioned };
  }, [sections, task.items]);

  const handleOpenAddWithTab = async (presetSectionId?: string) => {
    setIsTabFetching(true);
    try {
      const tabInfo = await getActiveTabInfo();
      let detectedSecId = presetSectionId;

      if (tabInfo?.detectedSectionName && !presetSectionId) {
        const matched = sections.find(
          (s) => s.name.toLowerCase() === tabInfo.detectedSectionName!.toLowerCase()
        );
        if (matched) {
          detectedSecId = matched.id;
        } else {
          // If section does not exist yet, add it
          onAddSection(task.id, tabInfo.detectedSectionName);
        }
      }

      setTargetSectionId(detectedSecId || sections[0]?.id);

      if (tabInfo) {
        setEditingItem({
          id: '',
          sectionId: detectedSecId || sections[0]?.id,
          description: '',
          linkTitle: tabInfo.cleanTitle || tabInfo.title,
          linkUrl: tabInfo.url,
        });
      } else {
        setEditingItem(null);
      }
    } catch {
      setEditingItem(null);
    } finally {
      setIsTabFetching(false);
      setIsAddModalOpen(true);
    }
  };

  const handleOpenAddNew = (presetSectionId?: string) => {
    setEditingItem(null);
    setTargetSectionId(presetSectionId || sections[0]?.id);
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (itemData: Omit<ImplementationChangeItem, 'id'>) => {
    if (editingItem && editingItem.id) {
      onUpdateChangeItem(task.id, editingItem.id, itemData);
    } else {
      onAddChangeItem(task.id, {
        ...itemData,
        sectionId: itemData.sectionId || targetSectionId,
      });
    }
    setEditingItem(null);
  };

  // Section Modal Handlers
  const handleOpenCreateSection = () => {
    setEditingSection(null);
    setSectionNameInput('');
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (sec: ImplementationSection) => {
    setEditingSection(sec);
    setSectionNameInput(sec.name);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionNameInput.trim()) return;

    if (editingSection) {
      onUpdateSection(task.id, editingSection.id, { name: sectionNameInput.trim() });
    } else {
      onAddSection(task.id, sectionNameInput.trim());
    }

    setIsSectionModalOpen(false);
    setEditingSection(null);
    setSectionNameInput('');
  };

  const handleQuickCopyMarkdown = () => {
    const md = formatTaskToMarkdown(task);
    navigator.clipboard.writeText(md);
    setQuickCopied(true);
    setTimeout(() => setQuickCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Task Metadata Card */}
      <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Номер / Код задачи
            </label>
            <Input
              value={task.taskNumber}
              onChange={(e) => onUpdateTask(task.id, { taskNumber: e.target.value })}
              placeholder="TASK-1234"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Название задачи
            </label>
            <Input
              value={task.title}
              onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
              placeholder="Например: Доработка алгоритма проверки участников"
            />
          </div>
        </div>

        {/* Task Summary / Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
              <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Общее описание реализации / Заметка</span>
            </label>
            <span className="text-[10px] text-gray-400">Краткая суть и детали</span>
          </div>
          <textarea
            value={task.summary}
            onChange={(e) => onUpdateTask(task.id, { summary: e.target.value })}
            placeholder="Опишите общую суть решения, архитектурные особенности или примечания для тестировщиков..."
            rows={3}
            className="w-full px-3 py-2 bg-white border border-gray-200 focus:border-emerald-500 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs resize-y transition-colors"
          />
        </div>
      </div>

      {/* Changes Section Container */}
      <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-3 shadow-sm">
        {/* Main Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <ListOrdered className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <h3 className="font-bold text-xs text-gray-900 truncate">Внесённые изменения</h3>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex-shrink-0">
              {task.items.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleOpenCreateSection}
              title="Создать новый раздел (категорию)"
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[11px] font-semibold transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Раздел</span>
            </button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenAddWithTab()}
              disabled={isTabFetching}
              title="Добавить пункт и автоматически подставить ссылку на открытую вкладку"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
            >
              С вкладки
            </Button>

            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleOpenAddNew()}
              leftIcon={<Plus className="w-3.5 h-3.5 flex-shrink-0" />}
            >
              Добавить
            </Button>
          </div>
        </div>

        {/* Changes List / Sections */}
        {task.items.length === 0 && sections.length === 0 ? (
          <div className="py-6 px-3 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Info className="w-7 h-7 text-gray-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-gray-800 mb-1">
              Список изменений пуст
            </p>
            <p className="text-[11px] text-gray-500 mb-3 max-w-xs mx-auto leading-relaxed">
              Зафиксируйте, что конкретно было изменено, и прикрепите ссылки на алгоритмы, экранные формы или модули.
            </p>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-2 max-w-xs mx-auto">
              <Button
                variant="emerald"
                size="sm"
                onClick={() => handleOpenAddNew()}
                leftIcon={<Plus className="w-3.5 h-3.5 flex-shrink-0" />}
                className="flex-1 justify-center whitespace-nowrap"
              >
                Добавить пункт
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenAddWithTab()}
                disabled={isTabFetching}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                className="flex-1 justify-center whitespace-nowrap"
              >
                С открытой вкладки
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Render each section */}
            {sections.map((sec, secIdx) => {
              const items = groupedItems.get(sec.id) || [];
              return (
                <div
                  key={sec.id}
                  className="rounded-xl border border-gray-200/90 bg-white shadow-sm overflow-hidden transition-all"
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between gap-1.5 px-3 py-2 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-bold text-xs text-gray-900 truncate">
                        {sec.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex-shrink-0">
                        {items.length}
                      </span>
                    </div>

                    {/* Section Controls */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onReorderSections(task.id, secIdx, secIdx - 1)}
                        disabled={secIdx === 0}
                        title="Поднять раздел выше"
                        className="icon-btn p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-20 disabled:hover:bg-transparent"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onReorderSections(task.id, secIdx, secIdx + 1)}
                        disabled={secIdx === sections.length - 1}
                        title="Опустить раздел ниже"
                        className="icon-btn p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-20 disabled:hover:bg-transparent"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAddNew(sec.id)}
                        title={`Добавить пункт в раздел "${sec.name}"`}
                        className="icon-btn p-1 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditSection(sec)}
                        title="Переименовать раздел"
                        className="icon-btn p-1 text-gray-400 hover:text-sky-700 hover:bg-sky-50 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSectionToDelete(sec)}
                        title="Удалить раздел"
                        className="icon-btn icon-btn--danger p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Section Content */}
                  <div className="p-2 space-y-2">
                    {items.length === 0 ? (
                      <div className="py-3 px-2 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/40 flex items-center justify-center gap-2">
                        <span className="text-[11px] text-gray-400">
                          В разделе пока нет пунктов
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenAddNew(sec.id)}
                          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          + Добавить
                        </button>
                      </div>
                    ) : (
                      items.map((item, itemIdx) => {
                        const globalIdx = task.items.findIndex((i) => i.id === item.id);
                        return (
                          <ChangeItemRow
                            key={item.id}
                            item={item}
                            index={itemIdx}
                            totalCount={items.length}
                            onEdit={(target) => {
                              setEditingItem(target);
                              setIsAddModalOpen(true);
                            }}
                            onDelete={(id) => onDeleteChangeItem(task.id, id)}
                            onMoveUp={() => {
                              if (itemIdx > 0) {
                                const prevItem = items[itemIdx - 1];
                                const prevGlobalIdx = task.items.findIndex((i) => i.id === prevItem.id);
                                if (globalIdx !== -1 && prevGlobalIdx !== -1) {
                                  onReorderChangeItems(task.id, globalIdx, prevGlobalIdx);
                                }
                              }
                            }}
                            onMoveDown={() => {
                              if (itemIdx < items.length - 1) {
                                const nextItem = items[itemIdx + 1];
                                const nextGlobalIdx = task.items.findIndex((i) => i.id === nextItem.id);
                                if (globalIdx !== -1 && nextGlobalIdx !== -1) {
                                  onReorderChangeItems(task.id, globalIdx, nextGlobalIdx);
                                }
                              }
                            }}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}

            {/* Unsectioned items if any */}
            {unsectionedItems.length > 0 && (
              <div className="rounded-xl border border-gray-200/90 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-xs text-gray-600 truncate">
                      Без раздела
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 text-[10px] font-bold">
                      {unsectionedItems.length}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-2">
                  {unsectionedItems.map((item, itemIdx) => {
                    const globalIdx = task.items.findIndex((i) => i.id === item.id);
                    return (
                      <ChangeItemRow
                        key={item.id}
                        item={item}
                        index={itemIdx}
                        totalCount={unsectionedItems.length}
                        onEdit={(target) => {
                          setEditingItem(target);
                          setIsAddModalOpen(true);
                        }}
                        onDelete={(id) => onDeleteChangeItem(task.id, id)}
                        onMoveUp={() => {
                          if (itemIdx > 0) {
                            const prevItem = unsectionedItems[itemIdx - 1];
                            const prevGlobalIdx = task.items.findIndex((i) => i.id === prevItem.id);
                            if (globalIdx !== -1 && prevGlobalIdx !== -1) {
                              onReorderChangeItems(task.id, globalIdx, prevGlobalIdx);
                            }
                          }
                        }}
                        onMoveDown={() => {
                          if (itemIdx < unsectionedItems.length - 1) {
                            const nextItem = unsectionedItems[itemIdx + 1];
                            const nextGlobalIdx = task.items.findIndex((i) => i.id === nextItem.id);
                            if (globalIdx !== -1 && nextGlobalIdx !== -1) {
                              onReorderChangeItems(task.id, globalIdx, nextGlobalIdx);
                            }
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsPreviewModalOpen(true)}
          leftIcon={<Eye className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />}
          className="flex-1 min-w-0 justify-center"
        >
          <span className="truncate">Экспорт / Просмотр</span>
        </Button>

        <Button
          variant="emerald"
          size="sm"
          onClick={handleQuickCopyMarkdown}
          leftIcon={quickCopied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
          className="flex-1 min-w-0 justify-center"
        >
          <span className="truncate">{quickCopied ? 'Скопировано!' : 'Копировать MD'}</span>
        </Button>
      </div>

      {/* Add / Edit Change Item Modal */}
      <AddChangeItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onAdd={handleSaveItem}
        initialItem={editingItem}
        sections={sections}
        defaultSectionId={targetSectionId}
        onAddSection={(name) => onAddSection(task.id, name)}
      />

      {/* Task Markdown Preview Modal */}
      <TaskExportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        task={task}
      />

      {/* Section Create / Edit Modal */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title={editingSection ? 'Переименовать раздел' : 'Создать новый раздел'}
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSectionModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="emerald"
              size="sm"
              disabled={!sectionNameInput.trim()}
              onClick={handleSaveSection}
              leftIcon={editingSection ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            >
              {editingSection ? 'Сохранить' : 'Создать'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveSection} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Название раздела <span className="text-rose-500">*</span>
            </label>
            <Input
              value={sectionNameInput}
              onChange={(e) => setSectionNameInput(e.target.value)}
              placeholder="Например: Алгоритмы, Визуалы, Типы объекта..."
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-gray-400 block w-full">
              Быстрые варианты:
            </span>
            {['Типы объекта', 'Алгоритмы', 'Визуалы', 'Бизнес-процессы', 'Печатные формы'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSectionNameInput(opt)}
                className="px-2 py-0.5 rounded bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-[10px] font-medium text-gray-600 transition-colors border border-gray-200"
              >
                {opt}
              </button>
            ))}
          </div>
        </form>
      </Modal>

      {/* Delete Section Confirm Modal */}
      <Modal
        isOpen={Boolean(sectionToDelete)}
        onClose={() => setSectionToDelete(null)}
        title="Удалить раздел?"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSectionToDelete(null)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                if (sectionToDelete) {
                  onDeleteSection(task.id, sectionToDelete.id);
                  setSectionToDelete(null);
                }
              }}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-xs text-gray-700">
          Вы уверены, что хотите удалить раздел{' '}
          <strong className="text-gray-900">"{sectionToDelete?.name}"</strong>?
          Пункты из этого раздела не удалятся, а переместятся в список «Без раздела».
        </p>
      </Modal>
    </div>
  );
};
