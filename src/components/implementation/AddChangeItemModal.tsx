import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Sparkles, Check, ExternalLink, Layers, FolderPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { getActiveTabInfo, formatChangeItemMarkdown, matchSectionForType } from '../../utils/tabUtils';
import { ImplementationChangeItem, ImplementationSection } from '../../types';

interface AddChangeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ImplementationChangeItem, 'id'>) => void;
  initialItem?: ImplementationChangeItem | null;
  sections?: ImplementationSection[];
  defaultSectionId?: string;
  onAddSection?: (name: string) => void;
}

export const AddChangeItemModal: React.FC<AddChangeItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialItem,
  sections = [],
  defaultSectionId,
  onAddSection,
}) => {
  const [description, setDescription] = useState('');
  const [sectionId, setSectionId] = useState<string>('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [tabLoadedMessage, setTabLoadedMessage] = useState<string | null>(null);
  const [detectedBadge, setDetectedBadge] = useState<{ sectionName: string; rawType?: string; reason?: string } | null>(null);

  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setDescription(initialItem.description);
        setSectionId(initialItem.sectionId || '');
        setLinkTitle(initialItem.linkTitle || '');
        setLinkUrl(initialItem.linkUrl || '');
      } else {
        setDescription('');
        setSectionId(defaultSectionId || (sections[0]?.id ?? ''));
        setLinkTitle('');
        setLinkUrl('');
      }
      setTabLoadedMessage(null);
      setDetectedBadge(null);
      setIsCreatingNewSection(false);
      setNewSectionName('');
    }
  }, [isOpen, initialItem, defaultSectionId, sections]);

  const handleFetchActiveTab = async () => {
    setIsLoadingTab(true);
    setTabLoadedMessage(null);
    try {
      const tabInfo = await getActiveTabInfo();
      if (tabInfo) {
        setLinkUrl(tabInfo.url);
        // If description is empty, prefill with clean tab title
        if (!description.trim()) {
          setDescription(tabInfo.cleanTitle || tabInfo.title);
        }
        // If linkTitle is empty, fill it with clean tab title
        if (!linkTitle.trim()) {
          setLinkTitle(tabInfo.cleanTitle || tabInfo.title);
        }

        // Intelligently match against user's created sections
        const matched = matchSectionForType(
          {
            detectedRawType: tabInfo.detectedRawType,
            detectedSectionName: tabInfo.detectedSectionName,
            title: tabInfo.cleanTitle,
            url: tabInfo.url,
          },
          sections
        );

        if (matched) {
          setSectionId(matched.section.id);
          setDetectedBadge({
            sectionName: matched.section.name,
            rawType: tabInfo.detectedRawType || tabInfo.detectedSectionName,
            reason: matched.reason,
          });
        } else if (tabInfo.detectedSectionName) {
          // If no section matched yet, fallback or optionally create canonical
          setDetectedBadge({
            sectionName: tabInfo.detectedSectionName,
            rawType: tabInfo.detectedRawType,
          });
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

  const handleCreateSectionSubmit = () => {
    if (newSectionName.trim() && onAddSection) {
      onAddSection(newSectionName.trim());
      setNewSectionName('');
      setIsCreatingNewSection(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onAdd({
      sectionId: sectionId || undefined,
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
            variant="emerald"
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
        {/* Section Picker */}
        <div className="space-y-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between">
            <label className="font-bold text-gray-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Раздел (категория)</span>
            </label>
            {detectedBadge && (
              <span
                title={detectedBadge.reason || undefined}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100/90 text-emerald-900 text-[10.5px] font-bold border border-emerald-300/80 animate-fade-in shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-emerald-700" />
                <span>
                  {detectedBadge.rawType ? `${detectedBadge.rawType} ➔ ` : ''}
                  {detectedBadge.sectionName}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sectionId}
              onChange={(e) => {
                if (e.target.value === '__create_new__') {
                  setIsCreatingNewSection(true);
                } else {
                  setSectionId(e.target.value);
                  setIsCreatingNewSection(false);
                }
              }}
              className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 focus:border-emerald-500 rounded-lg text-gray-900 focus:outline-none text-xs"
            >
              <option value="">Без раздела</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
              <option value="__create_new__">+ Создать новый раздел...</option>
            </select>
          </div>

          {/* Quick Create Section inline */}
          {isCreatingNewSection && (
            <div className="flex items-center gap-1.5 pt-1.5 animate-slide-down">
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Название нового раздела (напр. Отчёты)"
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="emerald"
                size="sm"
                onClick={handleCreateSectionSubmit}
                disabled={!newSectionName.trim()}
                leftIcon={<FolderPlus className="w-3.5 h-3.5" />}
              >
                Создать
              </Button>
            </div>
          )}
        </div>

        {/* Description textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-gray-800">
              Описание изменения <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] text-gray-400">Что было изменено/доработано</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Например: Изменен алгоритм ЖЦ до сохранения НПП контракты, добавлена проверка типа ЗИ..."
            rows={3}
            autoFocus
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs resize-y"
          />
        </div>

        {/* Browser tab insertion bar */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-gray-700 font-semibold min-w-0">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Ссылка на объект (опционально)</span>
            </div>
            <button
              type="button"
              onClick={handleFetchActiveTab}
              disabled={isLoadingTab}
              title="Получить заголовок, тип объекта и адрес текущей открытой вкладки Chrome"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors flex-shrink-0"
            >
              <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              {isLoadingTab ? 'Считывание...' : 'С активной вкладки'}
            </button>
          </div>

          {tabLoadedMessage && (
            <div className="text-[11px] text-emerald-800 bg-emerald-100/70 px-2 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 truncate animate-fade-in">
              <Check className="w-3 h-3 flex-shrink-0 text-emerald-600" />
              <span className="truncate">{tabLoadedMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">
                Название ссылки в тексте:
              </label>
              <Input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Алгоритм. Обработка данных"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">
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
                      className="text-gray-400 hover:text-emerald-600 p-1"
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
            <span className="block text-[11px] font-medium text-gray-500 mb-1">
              Предпросмотр строки:
            </span>
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-mono text-[11px] break-all select-all">
              {previewText}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
