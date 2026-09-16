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
  Clock,
  Link as LinkIcon,
  Info,
  ListChecks,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImplementationChangeItem } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatTaskToMarkdown, DEFAULT_IMPLEMENTATION_SECTIONS } from '../utils/tabUtils';
import { useImplementationTasks } from '../hooks/useImplementationTasks';

export const ChecklistPage: React.FC = () => {
  const {
    tasks,
    activeTask,
    selectTask,
    toggleChangeItemCollected,
    setAllChangeItemsCollected,
  } = useImplementationTasks();

  const [copiedMd, setCopiedMd] = useState(false);
  const prevCollectedCountRef = useRef(0);

  // Read initial taskId from URL search params if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const taskIdFromUrl = params.get('taskId');
      if (taskIdFromUrl && tasks.some((t) => t.id === taskIdFromUrl)) {
        selectTask(taskIdFromUrl);
      }
    } catch {
      // ignore
    }
  }, [tasks, selectTask]);

  const task = activeTask;
  const totalCount = task ? task.items.length : 0;
  const collectedCount = useMemo(
    () => (task ? task.items.filter((i) => i.isCollected).length : 0),
    [task]
  );
  const isAllCollected = totalCount > 0 && collectedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  // Trigger confetti when transition to 100% collected occurs
  useEffect(() => {
    if (isAllCollected && prevCollectedCountRef.current < totalCount && totalCount > 0) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#22c55e', '#10b981', '#14b8a6', '#3b82f6', '#f59e0b'],
        });
      } catch {
        // ignore
      }
    }
    prevCollectedCountRef.current = collectedCount;
  }, [isAllCollected, collectedCount, totalCount]);

  const sections = task && task.sections && task.sections.length > 0
    ? task.sections
    : DEFAULT_IMPLEMENTATION_SECTIONS;

  const { groupedItems, unsectionedItems } = useMemo(() => {
    if (!task) {
      return {
        groupedItems: new Map<string, ImplementationChangeItem[]>(),
        unsectionedItems: [] as ImplementationChangeItem[],
      };
    }
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
  }, [task, sections]);

  const handleOpenAndCollect = (item: ImplementationChangeItem) => {
    if (!task) return;
    if (item.linkUrl) {
      window.open(item.linkUrl, '_blank');
    }
    if (!item.isCollected) {
      toggleChangeItemCollected(task.id, item.id);
    }
  };

  const handleCopyMarkdown = () => {
    if (!task) return;
    const md = formatTaskToMarkdown(task);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-[#f0f4f0] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md text-center shadow-sm">
          <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-900 mb-1">Задача не найдена</h2>
          <p className="text-xs text-slate-600 mb-4">
            В списке задач реализации нет доступных элементов. Создайте задачу в боковой панели GD Helper.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f0] text-slate-900 pb-12 font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
              <ListChecks className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900 font-mono">
                  {task.taskNumber || 'Без номера'}
                </span>
                {task.releaseNumber && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Релиз {task.releaseNumber}
                  </span>
                )}
                {isAllCollected && (
                  <Badge variant="success" className="font-bold text-xs">
                    Все собраны ✅
                  </Badge>
                )}
              </div>
              <h1 className="text-xs text-slate-600 font-medium truncate max-w-lg">
                {task.title || 'Чеклист сбора объектов'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Task selector dropdown if multiple tasks exist */}
            {tasks.length > 1 && (
              <select
                value={task.id}
                onChange={(e) => selectTask(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.taskNumber ? `${t.taskNumber} — ${t.title}` : t.title}
                  </option>
                ))}
              </select>
            )}

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
              title="Скопировать Markdown"
            >
              {copiedMd ? 'Скопировано!' : 'Копировать MD'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        {/* Progress Card */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Прогресс сбора объектов</h2>
              <p className="text-xs text-slate-500">
                Нажимайте «Открыть и собрать» для открытия объекта в браузере и автоматической отметки статуса.
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-emerald-700 font-mono">
                {collectedCount}
              </span>
              <span className="text-xs text-slate-500 font-medium"> / {totalCount} ({progressPercent}%)</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/90 shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isAllCollected && (
            <div className="p-3 bg-emerald-50 border border-emerald-300/80 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950 font-semibold animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>
                  Все объекты собраны! Итоговый Markdown обновлен и зафиксирован с отметками готовности к релизу.
                </span>
              </div>
              <Button
                variant="emerald"
                size="sm"
                onClick={handleCopyMarkdown}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
                className="whitespace-nowrap px-3 py-1 text-xs font-bold"
              >
                {copiedMd ? 'Скопировано!' : 'Копировать MD'}
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAllChangeItemsCollected(task.id, true)}
                disabled={totalCount === 0 || isAllCollected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Отметить все собранными</span>
              </button>

              <button
                type="button"
                onClick={() => setAllChangeItemsCollected(task.id, false)}
                disabled={collectedCount === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Сбросить</span>
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Осталось собрать: <span className="font-bold text-slate-800">{totalCount - collectedCount}</span>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {totalCount === 0 && (
          <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 mb-1">Список изменений пуст</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              В этой задаче пока нет добавленных пунктов изменений. Добавьте их в расширении GD Helper.
            </p>
          </div>
        )}

        {/* Sections */}
        {totalCount > 0 && (
          <div className="space-y-4">
            {sections.map((sec) => {
              const items = groupedItems.get(sec.id) || [];
              if (items.length === 0) return null;

              const secCollected = items.filter((i) => i.isCollected).length;
              const secAllCollected = secCollected === items.length;

              return (
                <div
                  key={sec.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <h3 className="font-bold text-xs text-slate-900 truncate">
                        {sec.name}
                      </h3>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                        secAllCollected
                          ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {secCollected} / {items.length}
                    </span>
                  </div>

                  <div className="p-3 space-y-2.5">
                    {items.map((item, idx) => {
                      const isCollected = Boolean(item.isCollected);

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-3 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isCollected
                              ? 'bg-emerald-50/30 border-emerald-200/90'
                              : 'bg-white border-slate-200/90 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => toggleChangeItemCollected(task.id, item.id)}
                              title={isCollected ? 'Отметить как не собранный' : 'Отметить как собранный'}
                              className="mt-0.5 text-emerald-600 hover:text-emerald-700 transition-transform p-0.5 rounded cursor-pointer flex-shrink-0"
                            >
                              {isCollected ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400 hover:text-emerald-500" />
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
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-900 leading-relaxed font-medium break-words">
                                {item.description}
                              </p>

                              {item.linkUrl && (
                                <div className="pt-0.5">
                                  <a
                                    href={item.linkUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={item.linkUrl}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline max-w-full truncate"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{item.linkTitle || item.linkUrl}</span>
                                    <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 md:self-center flex-shrink-0">
                            {item.linkUrl ? (
                              <Button
                                variant={isCollected ? 'secondary' : 'emerald'}
                                size="sm"
                                onClick={() => handleOpenAndCollect(item)}
                                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                                className={`text-xs px-3 py-1.5 shadow-2xs ${
                                  isCollected ? 'text-slate-700' : 'font-bold'
                                }`}
                              >
                                {isCollected ? 'Открыть повторно' : 'Открыть и собрать'}
                              </Button>
                            ) : (
                              <Button
                                variant={isCollected ? 'secondary' : 'emerald'}
                                size="sm"
                                onClick={() => toggleChangeItemCollected(task.id, item.id)}
                                leftIcon={isCollected ? <Check className="w-3.5 h-3.5" /> : undefined}
                                className="text-xs px-3 py-1.5 shadow-2xs"
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

            {/* Unsectioned */}
            {unsectionedItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80">
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <h3 className="font-bold text-xs text-slate-800 truncate">
                      Прочее / Без раздела
                    </h3>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {unsectionedItems.filter((i) => i.isCollected).length} / {unsectionedItems.length}
                  </span>
                </div>

                <div className="p-3 space-y-2.5">
                  {unsectionedItems.map((item, idx) => {
                    const isCollected = Boolean(item.isCollected);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isCollected
                            ? 'bg-emerald-50/30 border-emerald-200/90'
                            : 'bg-white border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleChangeItemCollected(task.id, item.id)}
                            title={isCollected ? 'Отметить как не собранный' : 'Отметить как собранный'}
                            className="mt-0.5 text-emerald-600 hover:text-emerald-700 transition-transform p-0.5 rounded cursor-pointer flex-shrink-0"
                          >
                            {isCollected ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400 hover:text-emerald-500" />
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
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-900 leading-relaxed font-medium break-words">
                              {item.description}
                            </p>

                            {item.linkUrl && (
                              <div className="pt-0.5">
                                <a
                                  href={item.linkUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={item.linkUrl}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline max-w-full truncate"
                                >
                                  <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{item.linkTitle || item.linkUrl}</span>
                                  <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:self-center flex-shrink-0">
                          {item.linkUrl ? (
                            <Button
                              variant={isCollected ? 'secondary' : 'emerald'}
                              size="sm"
                              onClick={() => handleOpenAndCollect(item)}
                              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                              className={`text-xs px-3 py-1.5 shadow-2xs ${
                                isCollected ? 'text-slate-700' : 'font-bold'
                              }`}
                            >
                              {isCollected ? 'Открыть повторно' : 'Открыть и собрать'}
                            </Button>
                          ) : (
                            <Button
                              variant={isCollected ? 'secondary' : 'emerald'}
                              size="sm"
                              onClick={() => toggleChangeItemCollected(task.id, item.id)}
                              leftIcon={isCollected ? <Check className="w-3.5 h-3.5" /> : undefined}
                              className="text-xs px-3 py-1.5 shadow-2xs"
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
      </main>
    </div>
  );
};
