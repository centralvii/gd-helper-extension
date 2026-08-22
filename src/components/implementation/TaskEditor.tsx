import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  ListOrdered,
  FileText,
  Copy,
  Check,
  Eye,
  Info,
} from 'lucide-react';
import { ImplementationTask, ImplementationChangeItem } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ChangeItemRow } from './ChangeItemRow';
import { AddChangeItemModal } from './AddChangeItemModal';
import { TaskExportPreviewModal } from './TaskExportPreviewModal';
import { getActiveTabInfo, formatTaskToMarkdown } from '../../utils/tabUtils';

interface TaskEditorProps {
  task: ImplementationTask;
  onUpdateTask: (id: string, updates: Partial<Omit<ImplementationTask, 'id' | 'createdAt'>>) => void;
  onAddChangeItem: (taskId: string, item: Omit<ImplementationChangeItem, 'id'>) => void;
  onUpdateChangeItem: (taskId: string, itemId: string, updates: Partial<ImplementationChangeItem>) => void;
  onDeleteChangeItem: (taskId: string, itemId: string) => void;
  onReorderChangeItems: (taskId: string, fromIndex: number, toIndex: number) => void;
}

export const TaskEditor: React.FC<TaskEditorProps> = ({
  task,
  onUpdateTask,
  onAddChangeItem,
  onUpdateChangeItem,
  onDeleteChangeItem,
  onReorderChangeItems,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ImplementationChangeItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);
  const [isTabFetching, setIsTabFetching] = useState(false);

  const handleOpenAddWithTab = async () => {
    setIsTabFetching(true);
    try {
      const tabInfo = await getActiveTabInfo();
      if (tabInfo) {
        setEditingItem({
          id: '',
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

  const handleSaveItem = (itemData: Omit<ImplementationChangeItem, 'id'>) => {
    if (editingItem && editingItem.id) {
      onUpdateChangeItem(task.id, editingItem.id, itemData);
    } else {
      onAddChangeItem(task.id, itemData);
    }
    setEditingItem(null);
  };

  const handleQuickCopyMarkdown = () => {
    const md = formatTaskToMarkdown(task);
    navigator.clipboard.writeText(md);
    setQuickCopied(true);
    setTimeout(() => setQuickCopied(false), 2000);
  };

  return (
    <div className="space-y-3.5">
      {/* Task Metadata Card */}
      <div className="p-3 bg-white border border-gray-200 rounded-2xl space-y-3 shadow-sm">
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
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Общее описание реализации / Заметка</span>
            </label>
            <span className="text-[10px] text-gray-400">Краткая суть и детали</span>
          </div>
          <textarea
            value={task.summary}
            onChange={(e) => onUpdateTask(task.id, { summary: e.target.value })}
            placeholder="Опишите общую суть решения, архитектурные особенности или примечания для тестировщиков..."
            rows={3}
            className="w-full px-3 py-2 bg-white border border-gray-200 focus:border-emerald-500 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs resize-y transition-colors"
          />
        </div>
      </div>

      {/* Changes Section */}
      <div className="p-3 bg-white border border-gray-200 rounded-2xl space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-xs text-gray-900">Внесенные изменения</h3>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              {task.items.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenAddWithTab}
              disabled={isTabFetching}
              title="Добавить пункт и автоматически подставить ссылку на открытую вкладку"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
            >
              <span className="hidden sm:inline">С текущей вкладки</span>
              <span className="sm:hidden">С вкладки</span>
            </Button>

            <Button
              variant="emerald"
              size="sm"
              onClick={() => {
                setEditingItem(null);
                setIsAddModalOpen(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Добавить
            </Button>
          </div>
        </div>

        {/* Change Items List */}
        {task.items.length === 0 ? (
          <div className="py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-800 mb-1">
              Список изменений пуст
            </p>
            <p className="text-[11px] text-gray-500 mb-3 max-w-sm mx-auto">
              Зафиксируйте, что конкретно было изменено, и прикрепите ссылки на алгоритмы, экранные формы или модули.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="emerald"
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Добавить первое изменение
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenAddWithTab}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
              >
                Вставить ссылку вкладки
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {task.items.map((item, idx) => (
              <ChangeItemRow
                key={item.id}
                item={item}
                index={idx}
                totalCount={task.items.length}
                onEdit={(target) => {
                  setEditingItem(target);
                  setIsAddModalOpen(true);
                }}
                onDelete={(id) => onDeleteChangeItem(task.id, id)}
                onMoveUp={() => onReorderChangeItems(task.id, idx, idx - 1)}
                onMoveDown={() => onReorderChangeItems(task.id, idx, idx + 1)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsPreviewModalOpen(true)}
          leftIcon={<Eye className="w-3.5 h-3.5 text-sky-600" />}
        >
          Предпросмотр и экспорт
        </Button>

        <Button
          variant="emerald"
          size="sm"
          onClick={handleQuickCopyMarkdown}
          leftIcon={quickCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        >
          {quickCopied ? 'Скопировано в Markdown!' : 'Копировать Markdown'}
        </Button>
      </div>

      {/* Modals */}
      <AddChangeItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onAdd={handleSaveItem}
        initialItem={editingItem}
      />

      <TaskExportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        task={task}
      />
    </div>
  );
};
