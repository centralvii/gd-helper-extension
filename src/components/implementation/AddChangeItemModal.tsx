import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Sparkles, Check, ExternalLink } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { getActiveTabInfo, formatChangeItemMarkdown } from '../../utils/tabUtils';
import { ImplementationChangeItem } from '../../types';

interface AddChangeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ImplementationChangeItem, 'id'>) => void;
  initialItem?: ImplementationChangeItem | null;
}

export const AddChangeItemModal: React.FC<AddChangeItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialItem,
}) => {
  const [description, setDescription] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [tabLoadedMessage, setTabLoadedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setDescription(initialItem.description);
        setLinkTitle(initialItem.linkTitle || '');
        setLinkUrl(initialItem.linkUrl || '');
      } else {
        setDescription('');
        setLinkTitle('');
        setLinkUrl('');
      }
      setTabLoadedMessage(null);
    }
  }, [isOpen, initialItem]);

  const handleFetchActiveTab = async () => {
    setIsLoadingTab(true);
    setTabLoadedMessage(null);
    try {
      const tabInfo = await getActiveTabInfo();
      if (tabInfo) {
        setLinkUrl(tabInfo.url);
        // If linkTitle is empty, fill it with clean tab title
        if (!linkTitle.trim()) {
          setLinkTitle(tabInfo.cleanTitle || tabInfo.title);
        }
        setTabLoadedMessage(`Получена вкладка: ${tabInfo.cleanTitle || tabInfo.title}`);
      } else {
        setTabLoadedMessage('Не удалось определить открытую вкладку');
      }
    } catch (err) {
      console.warn('Error fetching tab info:', err);
      setTabLoadedMessage('Ошибка получения данных вкладки');
    } finally {
      setIsLoadingTab(false);
      setTimeout(() => setTabLoadedMessage(null), 4000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onAdd({
      description: description.trim(),
      linkTitle: linkTitle.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
    });
    onClose();
  };

  const previewText = formatChangeItemMarkdown(
    description || 'Описание изменения...',
    linkTitle || (linkUrl ? 'Ссылка' : ''),
    linkUrl
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialItem ? 'Редактировать пункт изменения' : 'Добавить пункт изменения'}
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!description.trim()}
            onClick={handleSubmit}
            leftIcon={initialItem ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          >
            {initialItem ? 'Сохранить' : 'Добавить'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Description textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-200">
              Описание изменения <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] text-slate-400">Что было изменено/доработано</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Например: Изменен алгоритм, добавили цикл по участникам проверки, проверяем статус согласования..."
            rows={3}
            autoFocus
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs resize-y"
          />
        </div>

        {/* Browser tab insertion bar */}
        <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ссылка на объект / сущность (опционально)</span>
            </div>
            <button
              type="button"
              onClick={handleFetchActiveTab}
              disabled={isLoadingTab}
              title="Получить заголовок и адрес текущей открытой вкладки Chrome"
              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {isLoadingTab ? 'Считывание...' : 'Вставить из активной вкладки'}
            </button>
          </div>

          {tabLoadedMessage && (
            <div className="text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/50 flex items-center gap-1 truncate animate-fade-in">
              <Check className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{tabLoadedMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Название ссылки в тексте:
              </label>
              <Input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Алгоритм. Обработка данных"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                URL адрес страницы:
              </label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                rightElement={
                  linkUrl ? (
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-emerald-400 p-1"
                      title="Открыть ссылку в новой вкладке"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {description.trim() && (
          <div>
            <span className="block text-[11px] font-medium text-slate-400 mb-1">
              Предпросмотр строки:
            </span>
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 font-mono text-[11px] break-all select-all">
              {previewText}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
