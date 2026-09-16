import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CheckSquare,
  Square,
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImplementationTask, ImplementationChangeItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatTaskToMarkdown, DEFAULT_IMPLEMENTATION_SECTIONS } from '../../utils/tabUtils';

interface TaskChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ImplementationTask;
  onToggleItemCollected: (taskId: string, itemId: string) => void;
  onSetAllCollected: (taskId: string, isCollected: boolean) => void;
  linkedPackages?: { name: string; files?: { newName?: string; originalName: string; order: number }[] }[];
}

export const TaskChecklistModal: React.FC<TaskChecklistModalProps> = ({
  isOpen,
  onClose,
  task,
  onToggleItemCollected,
  onSetAllCollected,
  linkedPackages = [],
}) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const prevCollectedCountRef = useRef(0);

  const totalCount = task.items.length;
  const collectedCount = useMemo(
    () => task.items.filter((i) => i.isCollected).length,
    [task.items]
  );
  const isAllCollected = totalCount > 0 && collectedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  // Trigger confetti when transition to 100% collected occurs
  useEffect(() => {
    if (isOpen && isAllCollected && prevCollectedCountRef.current < totalCount && totalCount > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#10b981', '#14b8a6', '#3b82f6', '#f59e0b'],
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
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
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
      title="Чеклист сбора объектов реализации"
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
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
              title="Скопировать обновленный Markdown"
            >
              {copiedMd ? 'Скопировано!' : 'Копировать MD'}
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
        <div className="p-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200/90 rounded-2xl shadow-2xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-emerald-950 font-mono bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                  {task.taskNumber || 'Без номера'}
                </span>
                {task.releaseNumber && (
                  <span className="text-[11px] font-bold text-slate-600 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
                    Релиз {task.releaseNumber}
                  </span>
                )}
                {isAllCollected ? (
                  <Badge variant="success" className="font-bold">
                    Все собраны ✅
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
              title="Открыть чеклист в отдельной полноэкранной вкладке браузера"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>В отдельном окне</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>Прогресс сбора объектов:</span>
              <span className="text-emerald-800 font-bold">
                {collectedCount} из {totalCount} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden border border-slate-200 shadow-inner">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Success Banner when 100% completed */}
          {isAllCollected && (
            <div className="p-2.5 bg-emerald-100/90 border border-emerald-300/80 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-950 font-semibold animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span className="truncate">
                  Все объекты собраны! Markdown автоматически обновлен с чекбоксами [x] и статусами.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Batch Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSetAllCollected(task.id, true)}
              disabled={totalCount === 0 || isAllCollected}
              title="Отметить все объекты задачи как собранные"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 rounded-xl transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
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

          <div className="text-[11px] text-slate-500">
            Осталось собрать: <span className="font-bold text-slate-800">{totalCount - collectedCount}</span>
          </div>
        </div>

        {/* Empty State */}
        {totalCount === 0 && (
          <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 mb-1">
              В задаче нет пунктов изменений
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Добавьте изменения со ссылками на объекты GreenData в редакторе реализации, чтобы они появились в чеклисте сбора.
            </p>
          </div>
        )}

        {/* Changes List Grouped by Sections */}
        {totalCount > 0 && (
          <div className="space-y-3.5 max-h-[58vh] overflow-y-auto pr-1">
            {sections.map((sec) => {
              const items = groupedItems.get(sec.id) || [];
              if (items.length === 0) return null;

              const secCollected = items.filter((i) => i.isCollected).length;
              const secAllCollected = secCollected === items.length;

              return (
                <div
                  key={sec.id}
                  className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden"
                >
                  {/* Section Title Header */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {sec.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          secAllCollected
                            ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {secCollected} / {items.length}
                      </span>
                    </div>
                  </div>

                  {/* Section Items */}
                  <div className="p-2 space-y-2">
                    {items.map((item, idx) => {
                      const isCollected = Boolean(item.isCollected);

                      return (
                        <div
                          key={item.id}
                          className={`group rounded-xl border p-2.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                            isCollected
                              ? 'bg-emerald-50/40 border-emerald-200/90'
                              : 'bg-white border-slate-200/90 hover:border-slate-300'
                          }`}
                        >
                          {/* Item Left Info */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {/* Checkbox toggle */}
                            <button
                              type="button"
                              onClick={() => onToggleItemCollected(task.id, item.id)}
                              title={isCollected ? 'Отметить как не собранный' : 'Отметить как собранный'}
                              className="mt-0.5 text-emerald-600 hover:text-emerald-700 transition-transform p-0.5 rounded cursor-pointer flex-shrink-0"
                            >
                              {isCollected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  #{idx + 1}
                                </span>
                                {isCollected ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                                    <Check className="w-3 h-3" /> Собран
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400">
                                    Не собран
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
                                <div className="pt-0.5">
                                  <a
                                    href={item.linkUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={item.linkUrl}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline max-w-full truncate"
                                  >
                                    <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{item.linkTitle || item.linkUrl}</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Item Right Actions: "Открыть и собрать" button */}
                          <div className="flex items-center gap-2 sm:self-center flex-shrink-0">
                            {item.linkUrl ? (
                              <Button
                                variant={isCollected ? 'secondary' : 'emerald'}
                                size="sm"
                                onClick={() => handleOpenAndCollect(item)}
                                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                                title="Открыть ссылку объекта в браузере и пометить как собранный"
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
            {unsectionedItems.length > 0 && (
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80">
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="font-bold text-xs text-slate-800 truncate">
                      Прочее / Без раздела
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {unsectionedItems.filter((i) => i.isCollected).length} / {unsectionedItems.length}
                  </span>
                </div>

                <div className="p-2 space-y-2">
                  {unsectionedItems.map((item, idx) => {
                    const isCollected = Boolean(item.isCollected);

                    return (
                      <div
                        key={item.id}
                        className={`group rounded-xl border p-2.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isCollected
                            ? 'bg-emerald-50/40 border-emerald-200/90'
                            : 'bg-white border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onToggleItemCollected(task.id, item.id)}
                            title={isCollected ? 'Отметить как не собранный' : 'Отметить как собранный'}
                            className="mt-0.5 text-emerald-600 hover:text-emerald-700 transition-transform p-0.5 rounded cursor-pointer flex-shrink-0"
                          >
                            {isCollected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                #{idx + 1}
                              </span>
                              {isCollected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                                  <Check className="w-3 h-3" /> Собран
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">
                                  Не собран
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
                              <div className="pt-0.5">
                                <a
                                  href={item.linkUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={item.linkUrl}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline max-w-full truncate"
                                >
                                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{item.linkTitle || item.linkUrl}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-center flex-shrink-0">
                          {item.linkUrl ? (
                            <Button
                              variant={isCollected ? 'secondary' : 'emerald'}
                              size="sm"
                              onClick={() => handleOpenAndCollect(item)}
                              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                              title="Открыть ссылку объекта в браузере и пометить как собранный"
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
