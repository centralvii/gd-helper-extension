import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import {
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  CheckCheck,
  Copy,
  Check,
  Layers,
  Maximize2,
  Clock,
  Link as LinkIcon,
  Info,
  ArrowDownUp,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImplementationTask, ImplementationChangeItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatTaskToMarkdown, DEFAULT_IMPLEMENTATION_SECTIONS, extractCardIdFromUrl } from '../../utils/tabUtils';
import { CELEBRATION_COLORS } from '../../constants/theme';

interface TaskChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ImplementationTask;
  onToggleItemCollected: (taskId: string, itemId: string) => void;
  onSetAllCollected: (taskId: string, isCollected: boolean) => void;
  linkedPackages?: { name: string; files?: { newName?: string; originalName: string; order: number; cardId?: string; sourceUrl?: string }[] }[];
}

export const TaskChecklistModal: React.FC<TaskChecklistModalProps> = ({
  isOpen,
  onClose,
  task,
  onToggleItemCollected,
  onSetAllCollected,
  linkedPackages = [],
}) => {
  const { copy, isCopied } = useCopyToClipboard();
  const copiedMd = isCopied();
  const prevCollectedCountRef = useRef(0);

  const linkedFilesByCardId = useMemo(() => {
    const map = new Map<string, { order: number; newName?: string; originalName: string; cardId?: string }>();
    linkedPackages.forEach((pkg) => {
      pkg.files?.forEach((f) => {
        const cId = f.cardId || extractCardIdFromUrl(f.sourceUrl);
        if (cId) {
          map.set(cId, {
            order: f.order,
            newName: f.newName,
            originalName: f.originalName,
            cardId: cId,
          });
        }
      });
    });
    return map;
  }, [linkedPackages]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'uncollected' | 'collected'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'uncollected_first'>('default');

  const totalCount = task.items.length;
  const collectedCount = useMemo(
    () => task.items.filter((i) => i.isCollected).length,
    [task.items]
  );
  const uncollectedCount = totalCount - collectedCount;
  const isAllCollected = totalCount > 0 && collectedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  // Items whose GUFs are already in the linked package, but not collected yet
  const uncollectedInPackageItems = useMemo(() => {
    return task.items.filter((item) => {
      if (item.isCollected) return false;
      const cId = extractCardIdFromUrl(item.linkUrl);
      return Boolean(cId && linkedFilesByCardId.has(cId));
    });
  }, [task.items, linkedFilesByCardId]);

  const handleCollectAllInPackage = () => {
    uncollectedInPackageItems.forEach((item) => {
      onToggleItemCollected(task.id, item.id);
    });
  };

  // Trigger confetti when transition to 100% collected occurs
  useEffect(() => {
    if (isOpen && isAllCollected && prevCollectedCountRef.current < totalCount && totalCount > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: CELEBRATION_COLORS,
        });
      } catch {
        // ignore if confetti fails in some contexts
      }
    }
    prevCollectedCountRef.current = collectedCount;
  }, [isOpen, isAllCollected, collectedCount, totalCount]);

  // Group items by sections
  const sections = task.sections && task.sections.length > 0
    ? task.sections
    : DEFAULT_IMPLEMENTATION_SECTIONS;

  const { groupedItems, unsectionedItems } = useMemo(() => {
    const map = new Map<string, ImplementationChangeItem[]>();
    const unsectioned: ImplementationChangeItem[] = [];
    const secIds = new Set(sections.map((s) => s.id));

    task.items.forEach((item) => {
      if (item.sectionId && secIds.has(item.sectionId)) {
        const list = map.get(item.sectionId) || [];
        list.push(item);
        map.set(item.sectionId, list);
      } else {
        unsectioned.push(item);
      }
    });

    return { groupedItems: map, unsectionedItems: unsectioned };
  }, [task.items, sections]);

  // Filter & sort logic for displaying items
  const processItems = useCallback(
    (itemsList: ImplementationChangeItem[]) => {
      let result = itemsList;

      if (filterStatus === 'uncollected') {
        result = result.filter((i) => !i.isCollected);
      } else if (filterStatus === 'collected') {
        result = result.filter((i) => i.isCollected);
      }

      if (sortOrder === 'uncollected_first') {
        result = [...result].sort((a, b) => {
          if (!a.isCollected && b.isCollected) return -1;
          if (a.isCollected && !b.isCollected) return 1;
          return 0;
        });
      }

      return result;
    },
    [filterStatus, sortOrder]
  );

  const displayedGroupedItems = useMemo(() => {
    const map = new Map<string, ImplementationChangeItem[]>();
    groupedItems.forEach((list, secId) => {
      map.set(secId, processItems(list));
    });
    return map;
  }, [groupedItems, processItems]);

  const displayedUnsectionedItems = useMemo(() => {
    return processItems(unsectionedItems);
  }, [unsectionedItems, processItems]);

  // Handle opening link and automatically collecting the item
  const handleOpenAndCollect = (item: ImplementationChangeItem) => {
    if (item.linkUrl) {
      try {
        if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
          chrome.tabs.create({ url: item.linkUrl, active: false });
        } else {
          window.open(item.linkUrl, '_blank');
        }
      } catch {
        window.open(item.linkUrl, '_blank');
      }
    }

    if (!item.isCollected) {
      onToggleItemCollected(task.id, item.id);
    }
  };

  const handleCopyMarkdown = () => {
    const md = formatTaskToMarkdown({
      ...task,
      linkedPackages,
    });
    void copy(md);
  };

  const handleOpenStandalone = () => {
    try {
      const url = typeof chrome !== 'undefined' && chrome.runtime?.getURL
        ? chrome.runtime.getURL(`checklist.html?taskId=${encodeURIComponent(task.id)}`)
        : `checklist.html?taskId=${encodeURIComponent(task.id)}`;

      if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    } catch {
      window.open(`checklist.html?taskId=${encodeURIComponent(task.id)}`, '_blank');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Чек-лист сбора объектов"
      maxWidth="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Собрано:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              {collectedCount} из {totalCount}
            </span>
            <span className="text-slate-400 font-medium">({progressPercent}%)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyMarkdown}
              leftIcon={
                copiedMd ? (
                  <Check className="w-3.5 h-3.5 text-accent-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
              title="Копировать Markdown с отметками"
            >
              {copiedMd ? 'Скопировано' : 'Копировать MD'}
            </Button>

            <Button variant="emerald" size="sm" onClick={onClose}>
              Готово
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-slate-800">
        {/* Task Info & Progress Card */}
        <div className="p-3.5 bg-gradient-to-r from-accent-50/90 via-accent-50/50 to-white border border-accent-200/90 rounded-xl shadow-2xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-accent-950 font-mono bg-accent-100/80 px-2 py-0.5 rounded-md border border-accent-200">
                  {task.taskNumber || 'Без номера'}
                </span>
                {task.releaseNumber && (
                  <span className="text-[11px] font-bold text-slate-600 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
                    Релиз {task.releaseNumber}
                  </span>
                )}
                {isAllCollected ? (
                  <Badge variant="success" className="font-bold">
                    Всё собрано ✅
                  </Badge>
                ) : (
                  <Badge variant="default">
                    {progressPercent}% собрано
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1 truncate max-w-md">
                {task.title || 'Без названия'}
              </p>
            </div>

            {/* Quick standalone tab button */}
            <button
              type="button"
              onClick={handleOpenStandalone}
              title="Открыть чек-лист в отдельной вкладке"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-accent-50 border border-slate-200 hover:border-accent-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-accent-600" />
              <span>В отдельной вкладке</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>Прогресс сбора объектов:</span>
              <span className="text-accent-800 font-bold">
                {collectedCount} из {totalCount} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden border border-slate-200 shadow-inner">
              <div
                className="bg-gradient-to-r from-accent-500 via-accent-500 to-accent-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Success Banner when 100% completed */}
          {isAllCollected && (
            <div className="p-2.5 bg-accent-100/90 border border-accent-300/80 rounded-xl flex items-center justify-between gap-2 text-xs text-accent-950 font-semibold animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-accent-700 flex-shrink-0" />
                <span className="truncate">
                  Все объекты собраны — в Markdown проставлены отметки [x].
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Batch Actions Bar & Package Quick Collect */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            {uncollectedInPackageItems.length > 0 && (
              <button
                type="button"
                onClick={handleCollectAllInPackage}
                title="Отметить собранными объекты, которые уже есть в привязанном пакете"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl transition-all shadow-2xs cursor-pointer animate-pulse-subtle"
              >
                <Package className="w-3.5 h-3.5 text-sky-600" />
                <span>Собрать из пакета ({uncollectedInPackageItems.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSetAllCollected(task.id, true)}
              disabled={totalCount === 0 || isAllCollected}
              title="Отметить собранными все объекты задачи"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-accent-800 bg-accent-50 hover:bg-accent-100 border border-accent-200/90 rounded-xl transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-accent-600" />
              <span>Отметить все собранными</span>
            </button>

            <button
              type="button"
              onClick={() => onSetAllCollected(task.id, false)}
              disabled={collectedCount === 0}
              title="Сбросить статус сбора у всех объектов"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Сбросить</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Осталось собрать: <span className="font-bold text-slate-800 font-mono">{uncollectedCount}</span>
          </div>
        </div>

        {/* Filter & Sorting Controls Bar */}
        {totalCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-accent-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Все ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('uncollected')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === 'uncollected'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Несобранные</span>
                <span
                  className={`px-1.5 py-px rounded-full text-[10px] font-bold ${
                    filterStatus === 'uncollected'
                      ? 'bg-amber-700/90 text-white'
                      : uncollectedCount > 0
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {uncollectedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('collected')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === 'collected'
                    ? 'bg-accent-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Собранные</span>
                <span
                  className={`px-1.5 py-px rounded-full text-[10px] font-bold ${
                    filterStatus === 'collected'
                      ? 'bg-accent-800/90 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {collectedCount}
                </span>
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === 'uncollected_first' ? 'default' : 'uncollected_first'))
              }
              title={
                sortOrder === 'uncollected_first'
                  ? 'Сначала несобранные. Нажмите, чтобы сбросить'
                  : 'Показать сначала несобранные'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'uncollected_first'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Сначала несобранные</span>
              {sortOrder === 'uncollected_first' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          </div>
        )}

        {/* Empty State */}
        {totalCount === 0 && (
          <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 mb-1">
              В задаче нет пунктов
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Добавьте пункты со ссылками на объекты GreenData во вкладке «Реализация» — они появятся в чек-листе.
            </p>
          </div>
        )}

        {/* Changes List Grouped by Sections */}
        {totalCount > 0 && (
          <div className="space-y-3.5 max-h-[58vh] overflow-y-auto pr-1">
            {/* Empty state by filter */}
            {filterStatus === 'uncollected' && uncollectedCount === 0 && (
              <div className="py-6 px-3 text-center bg-accent-50/50 border border-accent-200/80 rounded-xl space-y-1.5 animate-fade-in">
                <CheckCircle2 className="w-6 h-6 text-accent-600 mx-auto" />
                <p className="text-xs font-bold text-accent-950">Все объекты собраны</p>
                <p className="text-[11px] text-accent-800">
                  В фильтре «Несобранные» пусто.
                </p>
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className="text-[11px] text-accent-700 font-bold hover:underline cursor-pointer"
                >
                  Показать все ({totalCount})
                </button>
              </div>
            )}

            {filterStatus === 'collected' && collectedCount === 0 && (
              <div className="py-6 px-3 text-center bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 animate-fade-in">
                <Info className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Пока нет собранных объектов</p>
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className="text-[11px] text-accent-700 font-bold hover:underline cursor-pointer"
                >
                  Показать все ({totalCount})
                </button>
              </div>
            )}

            {sections.map((sec) => {
              const allItems = groupedItems.get(sec.id) || [];
              const items = displayedGroupedItems.get(sec.id) || [];
              if (allItems.length === 0) return null;
              if (filterStatus !== 'all' && items.length === 0) return null;

              const secCollected = allItems.filter((i) => i.isCollected).length;
              const secAllCollected = secCollected === allItems.length;

              return (
                <div
                  key={sec.id}
                  className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
                >
                  {/* Section Title Header */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="w-3.5 h-3.5 text-accent-600 flex-shrink-0" />
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {sec.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          secAllCollected
                            ? 'bg-accent-100/90 text-accent-800 border-accent-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {secCollected} / {allItems.length}
                      </span>
                    </div>
                  </div>

                  {/* Section Items */}
                  <div className="p-2 space-y-2">
                    {items.map((item, idx) => {
                      const isCollected = Boolean(item.isCollected);
                      const originalIdx = allItems.indexOf(item);
                      const displayNum = originalIdx !== -1 ? originalIdx + 1 : idx + 1;

                      const itemCardId = extractCardIdFromUrl(item.linkUrl);
                      const matchingFile = itemCardId ? linkedFilesByCardId.get(itemCardId) : undefined;

                      return (
                        <div
                          key={item.id}
                          className={`group rounded-xl border p-2.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                            isCollected
                              ? 'bg-accent-50/40 border-accent-200/90'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Item Left Info */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {/* Checkbox toggle */}
                            <button
                              type="button"
                              onClick={() => onToggleItemCollected(task.id, item.id)}
                              title={isCollected ? 'Отметить как несобранный' : 'Отметить как собранный'}
                              className="mt-0.5 text-accent-600 hover:text-accent-700 transition-transform p-0.5 rounded cursor-pointer flex-shrink-0"
                            >
                              {isCollected ? (
                                <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-gd-accent text-white"><Check className="h-3.5 w-3.5 animate-pop-in" strokeWidth={3} /></span>
                              ) : (
                                <span className="block h-[22px] w-[22px] rounded-full border-[1.5px] border-slate-300 hover:border-gd-accent group-hover:border-gd-accent transition-colors" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono font-bold px-1.5 py-px rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  #{displayNum}
                                </span>
                                {isCollected ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-800 bg-accent-100/90 px-1.5 py-0.5 rounded border border-accent-300">
                                    <Check className="w-3 h-3" /> Собран
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400">
                                    Не собран
                                  </span>
                                )}
                                {matchingFile && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-100/90 px-1.5 py-0.5 rounded border border-sky-300"
                                    title={`Файл есть в привязанном пакете: #${matchingFile.order} ${matchingFile.newName || matchingFile.originalName}`}
                                  >
                                    📦 В пакете #{matchingFile.order}
                                  </span>
                                )}
                                {item.collectedAt && (
                                  <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(item.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>

                              <p
                                className={`text-xs leading-relaxed break-words font-medium ${
                                  isCollected ? 'text-slate-800' : 'text-slate-900'
                                }`}
                              >
                                {item.description}
                              </p>

                              {/* Attached Link info if present */}
                              {item.linkUrl && (
                                <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
                                  {itemCardId && (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[9.5px] font-bold"
                                      title={`ID карточки в GreenData: ${itemCardId}`}
                                    >
                                      <span className="text-slate-400 font-normal">ID:</span>
                                      {itemCardId}
                                    </span>
                                  )}
                                  <a
                                    href={item.linkUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={item.linkUrl}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-700 hover:text-accent-800 hover:underline max-w-full truncate"
                                  >
                                    <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{item.linkTitle || item.linkUrl}</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Item Right Actions: "Собрать" or "Открыть и собрать" button */}
                          <div className="flex items-center gap-2 sm:self-center flex-shrink-0">
                            {matchingFile && !isCollected ? (
                              <Button
                                variant="emerald"
                                size="sm"
                                onClick={() => onToggleItemCollected(task.id, item.id)}
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                                title={`Файл #${matchingFile.order} уже есть в пакете. Нажмите, чтобы отметить объект собранным без перехода по ссылке`}
                                className="text-xs px-2.5 py-1 whitespace-nowrap shadow-2xs font-bold"
                              >
                                Собрать
                              </Button>
                            ) : item.linkUrl ? (
                              <Button
                                variant={isCollected ? 'secondary' : 'emerald'}
                                size="sm"
                                onClick={() => handleOpenAndCollect(item)}
                                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                                title="Открыть объект и отметить собранным"
                                className={`text-xs px-2.5 py-1 whitespace-nowrap shadow-2xs ${
                                  isCollected ? 'text-slate-700 font-medium' : 'font-bold'
                                }`}
                              >
                                {isCollected ? 'Открыть повторно' : 'Открыть и собрать'}
                              </Button>
                            ) : (
                              <Button
                                variant={isCollected ? 'secondary' : 'emerald'}
                                size="sm"
                                onClick={() => onToggleItemCollected(task.id, item.id)}
                                leftIcon={isCollected ? <Check className="w-3.5 h-3.5" /> : undefined}
                                className="text-xs px-2.5 py-1 whitespace-nowrap shadow-2xs"
                              >
                                {isCollected ? 'Собран' : 'Отметить собранным'}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Unsectioned Items */}
            {displayedUnsectionedItems.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="font-bold text-xs text-slate-800 truncate">
                      Без раздела
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {unsectionedItems.filter((i) => i.isCollected).length} / {unsectionedItems.length}
                  </span>
                </div>

                <div className="p-2 space-y-2">
                  {displayedUnsectionedItems.map((item, idx) => {
                    const isCollected = Boolean(item.isCollected);
                    const originalIdx = unsectionedItems.indexOf(item);
                    const displayNum = originalIdx !== -1 ? originalIdx + 1 : idx + 1;

                    const itemCardId = extractCardIdFromUrl(item.linkUrl);
                    const matchingFile = itemCardId ? linkedFilesByCardId.get(itemCardId) : undefined;

                    return (
                      <div
                        key={item.id}
                        className={`group rounded-xl border p-2.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isCollected
                            ? 'bg-accent-50/40 border-accent-200/90'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onToggleItemCollected(task.id, item.id)}
                            title={isCollected ? 'Отметить как несобранный' : 'Отметить как собранный'}
                            className="mt-0.5 text-accent-600 hover:text-accent-700 transition-transform p-0.5 rounded cursor-pointer flex-shrink-0"
                          >
                            {isCollected ? (
                              <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-gd-accent text-white"><Check className="h-3.5 w-3.5 animate-pop-in" strokeWidth={3} /></span>
                            ) : (
                              <span className="block h-[22px] w-[22px] rounded-full border-[1.5px] border-slate-300 hover:border-gd-accent group-hover:border-gd-accent transition-colors" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-px rounded bg-slate-100 text-slate-600 border border-slate-200">
                                #{displayNum}
                              </span>
                              {isCollected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-800 bg-accent-100/90 px-1.5 py-0.5 rounded border border-accent-300">
                                  <Check className="w-3 h-3" /> Собран
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">
                                  Не собран
                                </span>
                              )}
                              {matchingFile && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-100/90 px-1.5 py-0.5 rounded border border-sky-300"
                                  title={`Файл есть в привязанном пакете: #${matchingFile.order} ${matchingFile.newName || matchingFile.originalName}`}
                                >
                                  📦 В пакете #{matchingFile.order}
                                </span>
                              )}
                              {item.collectedAt && (
                                <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(item.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>

                            <p
                              className={`text-xs leading-relaxed break-words font-medium ${
                                isCollected ? 'text-slate-800' : 'text-slate-900'
                              }`}
                            >
                              {item.description}
                            </p>

                            {item.linkUrl && (
                              <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
                                {itemCardId && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[9.5px] font-bold"
                                    title={`ID карточки в GreenData: ${itemCardId}`}
                                  >
                                    <span className="text-slate-400 font-normal">ID:</span>
                                    {itemCardId}
                                  </span>
                                )}
                                <a
                                  href={item.linkUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={item.linkUrl}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-700 hover:text-accent-800 hover:underline max-w-full truncate"
                                >
                                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{item.linkTitle || item.linkUrl}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-center flex-shrink-0">
                          {matchingFile && !isCollected ? (
                            <Button
                              variant="emerald"
                              size="sm"
                              onClick={() => onToggleItemCollected(task.id, item.id)}
                              leftIcon={<Check className="w-3.5 h-3.5" />}
                              title={`Файл #${matchingFile.order} уже есть в пакете. Нажмите, чтобы отметить объект собранным без перехода по ссылке`}
                              className="text-xs px-2.5 py-1 whitespace-nowrap shadow-2xs font-bold"
                            >
                              Собрать
                            </Button>
                          ) : item.linkUrl ? (
                            <Button
                              variant={isCollected ? 'secondary' : 'emerald'}
                              size="sm"
                              onClick={() => handleOpenAndCollect(item)}
                              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                              title="Открыть объект и отметить собранным"
                              className={`text-xs px-2.5 py-1 whitespace-nowrap shadow-2xs ${
                                isCollected ? 'text-slate-700 font-medium' : 'font-bold'
                              }`}
                            >
                              {isCollected ? 'Открыть повторно' : 'Открыть и собрать'}
                            </Button>
                          ) : (
                            <Button
                              variant={isCollected ? 'secondary' : 'emerald'}
                              size="sm"
                              onClick={() => onToggleItemCollected(task.id, item.id)}
                              leftIcon={isCollected ? <Check className="w-3.5 h-3.5" /> : undefined}
                              className="text-xs px-2.5 py-1 whitespace-nowrap shadow-2xs"
                            >
                              {isCollected ? 'Собран' : 'Отметить собранным'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
