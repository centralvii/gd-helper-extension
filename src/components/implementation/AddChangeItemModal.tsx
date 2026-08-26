import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Sparkles, Check, ExternalLink, Layers, FolderPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { getActiveTabInfo, matchSectionForType } from '../../utils/tabUtils';
import { ImplementationChangeItem, ImplementationSection } from '../../types';

interface AddChangeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ImplementationChangeItem, 'id'>) => void;
  initialItem?: ImplementationChangeItem | null;
  sections?: ImplementationSection[];
  defaultSectionId?: string;
  onAddSection?: (name: string) => ImplementationSection | null | void;
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
  const [isBadgeExpanded, setIsBadgeExpanded] = useState(false);
  const [unmatchedDetectedType, setUnmatchedDetectedType] = useState<string | null>(null);

  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setDescription(initialItem.description);
        setSectionId(initialItem.sectionId || '');
        setLinkTitle(initialItem.linkTitle || '');
        setLinkUrl(initialItem.linkUrl || '');
        if (initialItem.sectionId) {
          const foundSec = sections.find((s) => s.id === initialItem.sectionId);
          if (foundSec) {
            setDetectedBadge({
              sectionName: foundSec.name,
              rawType: initialItem.description,
            });
          }
        }
      } else {
        setDescription('');
        setSectionId(defaultSectionId || (sections[0]?.id ?? ''));
        setLinkTitle('');
        setLinkUrl('');
        setDetectedBadge(null);
      }
      setUnmatchedDetectedType(null);
      setTabLoadedMessage(null);
      setIsCreatingNewSection(false);
      setNewSectionName('');
    }
  }, [isOpen, initialItem, defaultSectionId, sections]);

  const handleFetchActiveTab = async () => {
    setIsLoadingTab(true);
    setTabLoadedMessage(null);
    setUnmatchedDetectedType(null);
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
            breadcrumb: tabInfo.breadcrumb,
            activeTab: tabInfo.activeTabName,
          },
          sections
        );

        if (matched) {
          setSectionId(matched.section.id);
          setUnmatchedDetectedType(null);
          setDetectedBadge({
            sectionName: matched.section.name,
            rawType: tabInfo.detectedRawType || tabInfo.detectedSectionName,
            reason: matched.reason,
          });
        } else if (tabInfo.detectedRawType) {
          // If a type was found on the page but NO section matches it in current task
          setUnmatchedDetectedType(tabInfo.detectedRawType);
          setDetectedBadge({
            sectionName: 'Раздел не создан',
            rawType: tabInfo.detectedRawType,
          });
        } else if (tabInfo.detectedSectionName) {
          setUnmatchedDetectedType(tabInfo.detectedSectionName);
          setDetectedBadge({
            sectionName: tabInfo.detectedSectionName,
            rawType: tabInfo.detectedSectionName,
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

  const handleQuickCreateSection = (nameToCreate: string) => {
    if (!nameToCreate.trim() || !onAddSection) return;
    const created = onAddSection(nameToCreate.trim()) as ImplementationSection | null | undefined;
    if (created && created.id) {
      setSectionId(created.id);
    }
    setUnmatchedDetectedType(null);
    setDetectedBadge({
      sectionName: nameToCreate.trim(),
      rawType: nameToCreate.trim(),
      reason: 'Создан новый раздел',
    });
  };

  const handleCreateSectionSubmit = () => {
    if (newSectionName.trim() && onAddSection) {
      const created = onAddSection(newSectionName.trim()) as ImplementationSection | null | undefined;
      if (created && created.id) {
        setSectionId(created.id);
      }
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
        <div className="space-y-2 p-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Раздел (категория)</span>
            </label>

            {detectedBadge && !isBadgeExpanded && (
              <button
                type="button"
                onClick={() => setIsBadgeExpanded(true)}
                title="Нажмите, чтобы развернуть подробности сопоставления"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-100/90 hover:bg-emerald-200/90 text-emerald-950 text-[10.5px] font-bold border border-emerald-300/80 transition-all shadow-2xs max-w-[240px] cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-emerald-700 flex-shrink-0" />
                <span className="truncate">
                  {detectedBadge.rawType ? `${detectedBadge.rawType} ➔ ` : ''}
                  {detectedBadge.sectionName}
                </span>
                <ChevronDown className="w-3 h-3 text-emerald-700 flex-shrink-0 ml-0.5" />
              </button>
            )}
          </div>

          {/* Expanded Detected Badge Card */}
          {detectedBadge && isBadgeExpanded && (
            <div className="p-2.5 rounded-xl bg-emerald-100/90 border border-emerald-300/90 text-emerald-950 text-[11px] space-y-1 animate-slide-down shadow-2xs">
              <div className="flex items-center justify-between gap-2 font-bold border-b border-emerald-200/80 pb-1">
                <span className="flex items-center gap-1.5 text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                  Авто-определение раздела
                </span>
                <button
                  type="button"
                  onClick={() => setIsBadgeExpanded(false)}
                  className="text-[10px] text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-0.5 cursor-pointer bg-white/70 hover:bg-white px-1.5 py-0.5 rounded-md border border-emerald-300/60 transition-colors"
                >
                  <span>Свернуть</span>
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>

              {detectedBadge.rawType && (
                <div className="text-[10.5px] text-emerald-900 break-words leading-relaxed">
                  <span className="font-semibold text-emerald-800">Объект на странице: </span>
                  <span className="font-bold">{detectedBadge.rawType}</span>
                </div>
              )}

              <div className="text-[10.5px] text-emerald-950 font-bold break-words leading-relaxed">
                <span className="font-semibold text-emerald-800">Выбран раздел: </span>
                «{detectedBadge.sectionName}»
              </div>

              {detectedBadge.reason && (
                <div className="text-[10px] text-emerald-700 font-medium italic break-words pt-0.5">
                  {detectedBadge.reason}
                </div>
              )}
            </div>
          )}

          {/* Quick Offer to Create Section if not present */}
          {unmatchedDetectedType && !sections.some((s) => s.id === sectionId && s.name.toLowerCase() === unmatchedDetectedType.toLowerCase()) && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 animate-slide-down shadow-2xs">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Определен тип: «{unmatchedDetectedType}»</span>
                </div>
                <div className="text-[10px] text-amber-700 truncate">
                  Такого раздела нет в задаче. Создать его?
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickCreateSection(unmatchedDetectedType)}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-xs flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                + Создать раздел
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={sectionId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__create_new__') {
                  setIsCreatingNewSection(true);
                } else if (val.startsWith('__create_detected__:')) {
                  const toCreate = val.replace('__create_detected__:', '');
                  handleQuickCreateSection(toCreate);
                } else {
                  setSectionId(val);
                  setIsCreatingNewSection(false);
                }
              }}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-slate-900 focus:outline-none text-xs shadow-2xs"
            >
              <option value="">Без раздела</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
              {unmatchedDetectedType && !sections.some((s) => s.name.toLowerCase() === unmatchedDetectedType.toLowerCase()) && (
                <option value={`__create_detected__:${unmatchedDetectedType}`}>
                  + Создать раздел «{unmatchedDetectedType}»
                </option>
              )}
              <option value="__create_new__">+ Создать свой раздел...</option>
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
            <label className="font-bold text-slate-800">
              Описание изменения <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] text-slate-400">Что было изменено/доработано</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Например: Изменен алгоритм ЖЦ до сохранения НПП контракты, добавлена проверка типа ЗИ..."
            rows={3}
            autoFocus
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs resize-y shadow-2xs"
          />
        </div>

        {/* Browser tab insertion bar */}
        <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold min-w-0">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate text-xs font-bold">Ссылка на объект (опционально)</span>
            </div>
            <button
              type="button"
              onClick={handleFetchActiveTab}
              disabled={isLoadingTab}
              title="Получить заголовок, тип объекта и адрес текущей открытой вкладки Chrome"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 rounded-xl text-[11px] font-bold transition-all flex-shrink-0 shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              {isLoadingTab ? 'Считывание...' : 'С активной вкладки'}
            </button>
          </div>

          {tabLoadedMessage && (
            <div className="text-[11px] text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-300 flex items-center gap-1 truncate animate-fade-in font-medium">
              <Check className="w-3 h-3 flex-shrink-0 text-emerald-600" />
              <span className="truncate">{tabLoadedMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            <div>
              <Input
                label="Заголовок ссылки (название объекта)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Например: ЖЦ до сохранения НПП контракты"
              />
            </div>

            <div>
              <Input
                label="URL страницы GreenData / Jira"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://app.greendata.ru/#/app/objects/..."
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {description.trim() && (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Предпросмотр записи:
            </div>
            <div className="text-xs text-slate-800 break-words font-medium">
              <span>{description}</span>
              {linkUrl && (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 inline-flex items-center gap-0.5 text-emerald-700 hover:text-emerald-800 underline font-semibold"
                >
                  [{linkTitle || 'Ссылка'}]
                  <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
