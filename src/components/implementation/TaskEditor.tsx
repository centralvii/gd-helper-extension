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
  Package,
  ExternalLink,
  FilePlus,
} from 'lucide-react';
import {
  ImplementationTask,
  ImplementationChangeItem,
  ImplementationSection,
  BuildPackage,
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
  packages?: BuildPackage[];
  onNavigateToPackage?: (pkgId: string) => void;
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
  packages = [],
  onNavigateToPackage,
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
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Section Create/Edit Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ImplementationSection | null>(null);
  const [sectionNameInput, setSectionNameInput] = useState('');

  // Delete Section Confirm Modal State
  const [sectionToDelete, setSectionToDelete] = useState<ImplementationSection | null>(null);

  const linkedPackages = useMemo(() => {
    return packages.filter((p) => p.taskId === task.id || p.id === task.packageId);
  }, [task.id, task.packageId, packages]);

  const sections = useMemo(() => {
    const raw =
      task.sections && task.sections.length > 0
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
  }, [task.items, sections]);

  const handleEditItem = (item: ImplementationChangeItem) => {
    setEditingItem(item);
    setTargetSectionId(item.sectionId);
    setIsAddModalOpen(true);
  };

  const handleMoveUpItem = (item: ImplementationChangeItem) => {
    const idx = task.items.findIndex((i) => i.id === item.id);
    if (idx > 0) {
      onReorderChangeItems(task.id, idx, idx - 1);
    }
  };

  const handleMoveDownItem = (item: ImplementationChangeItem) => {
    const idx = task.items.findIndex((i) => i.id === item.id);
    if (idx !== -1 && idx < task.items.length - 1) {
      onReorderChangeItems(task.id, idx, idx + 1);
    }
  };

  const handleOpenAddWithTab = async (sectionId?: string) => {
    setIsTabFetching(true);
    try {
      const tabInfo = await getActiveTabInfo();
      if (tabInfo) {
        let secId = sectionId;
        if (!secId && tabInfo.detectedSectionName) {
          const matched = sections.find(
            (s) =>
              s.name.toLowerCase() === tabInfo.detectedSectionName?.toLowerCase() ||
              s.name.toLowerCase().includes(tabInfo.detectedSectionName?.toLowerCase() || '')
          );
          if (matched) secId = matched.id;
        }

        setTargetSectionId(secId || sections[0]?.id);
        setEditingItem({
          id: '',
          sectionId: secId || sections[0]?.id,
          description: tabInfo.cleanTitle,
          linkTitle: tabInfo.cleanTitle,
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

  // Import files from all linked packages
  const handleImportFilesFromPackages = () => {
    if (linkedPackages.length === 0) return;

    const targetSec =
      sections.find((s) => s.name.toLowerCase().includes('алгоритм')) || sections[0];
    const targetSecId = targetSec ? targetSec.id : undefined;

    let addedCount = 0;
    linkedPackages.forEach((pkg) => {
      pkg.files.forEach((file) => {
        const desc = file.newName || file.cleanName || file.originalName;
        const alreadyExists = task.items.some((it) => it.description.trim() === desc.trim());
        if (!alreadyExists) {
          onAddChangeItem(task.id, {
            description: desc,
            sectionId: targetSecId,
          });
          addedCount++;
        }
      });
    });

    if (addedCount > 0) {
      setImportNotification(
        `Добавлено ${addedCount} файлов из пакетов в раздел «${targetSec?.name || 'Изменения'}»`
      );
      setTimeout(() => setImportNotification(null), 3500);
    }
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
    const md = formatTaskToMarkdown({
      ...task,
      linkedPackages: linkedPackages.map((p) => ({ name: p.name, files: p.files })),
    });
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

        {/* ── Linked Packages Compact Row (1 Task -> N Packages) ── */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 bg-emerald-50/50 border border-emerald-200/70 rounded-xl text-xs">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="font-semibold text-emerald-950 text-[11px] flex items-center gap-1 flex-shrink-0">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>Пакеты сборки:</span>
            </span>

            {linkedPackages.length === 0 ? (
              <span className="text-[10.5px] text-gray-400">Нет привязанных пакетов</span>
            ) : (
              linkedPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => onNavigateToPackage && onNavigateToPackage(pkg.id)}
                  title={`Открыть пакет "${pkg.name}" во вкладке Упаковка`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-medium text-[10.5px] hover:bg-emerald-100/70 transition-colors shadow-2xs group"
                >
                  <span className="font-mono font-bold text-emerald-700">{pkg.name}</span>
                  <span className="text-gray-400 text-[10px]">({pkg.files.length} ф.)</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {linkedPackages.some((p) => p.files.length > 0) && (
              <button
                type="button"
                onClick={handleImportFilesFromPackages}
                title="Добавить файлы из всех привязанных пакетов в список изменений"
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold text-[10px] transition-colors shadow-2xs"
              >
                <FilePlus className="w-3 h-3 text-emerald-600" />
                <span>Импорт файлов</span>
              </button>
            )}

            {onNavigateToPackage && (
              <button
                type="button"
                onClick={() => onNavigateToPackage('')}
                title="Перейти в упаковку для управления пакетами"
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[10px] transition-colors shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>В упаковку</span>
              </button>
            )}
          </div>
        </div>

        {/* Import Toast Notification */}
        {importNotification && (
          <div className="p-2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{importNotification}</span>
          </div>
        )}

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
                        onClick={() => handleOpenEditSection(sec)}
                        title="Переименовать раздел"
                        className="icon-btn p-1 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded"
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

                      <button
                        type="button"
                        onClick={() => handleOpenAddNew(sec.id)}
                        title={`Добавить пункт в раздел "${sec.name}"`}
                        className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Пункт</span>
                      </button>
                    </div>
                  </div>

                  {/* Section Items */}
                  <div className="p-2 space-y-1.5">
                    {items.length === 0 ? (
                      <div className="py-2.5 px-3 text-center text-gray-400 text-[11px] bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                        В этом разделе пока нет изменений.{' '}
                        <button
                          type="button"
                          onClick={() => handleOpenAddNew(sec.id)}
                          className="text-emerald-600 hover:underline font-semibold"
                        >
                          + Добавить
                        </button>
                      </div>
                    ) : (
                      items.map((item, idx) => (
                        <ChangeItemRow
                          key={item.id}
                          item={item}
                          index={idx}
                          totalCount={items.length}
                          onEdit={handleEditItem}
                          onDelete={(id) => onDeleteChangeItem(task.id, id)}
                          onMoveUp={() => handleMoveUpItem(item)}
                          onMoveDown={() => handleMoveDownItem(item)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}

            {/* Unsectioned Items */}
            {unsectionedItems.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-700">Прочее / Без раздела</span>
                    <span className="px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 text-[10px] font-bold">
                      {unsectionedItems.length}
                    </span>
                  </div>
                </div>

                <div className="p-2 space-y-1.5">
                  {unsectionedItems.map((item, idx) => (
                    <ChangeItemRow
                      key={item.id}
                      item={item}
                      index={idx}
                      totalCount={unsectionedItems.length}
                      onEdit={handleEditItem}
                      onDelete={(id) => onDeleteChangeItem(task.id, id)}
                      onMoveUp={() => handleMoveUpItem(item)}
                      onMoveDown={() => handleMoveDownItem(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Task Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
          <div className="text-[11px] text-gray-500">
            Всего: <strong className="text-gray-900">{task.items.length}</strong> изменений
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleQuickCopyMarkdown}
              leftIcon={quickCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {quickCopied ? 'Скопировано!' : 'Копировать всё'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPreviewModalOpen(true)}
              leftIcon={<Eye className="w-3.5 h-3.5" />}
            >
              Экспорт / Просмотр
            </Button>
          </div>
        </div>
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
        packages={packages}
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
