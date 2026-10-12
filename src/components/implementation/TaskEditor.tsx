import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Sparkles,
  Copy,
  Check,
  Eye,
  Info,
  FolderPlus,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Edit2,
  Trash2,
  Layers,
  FileJson,
  MoreHorizontal,
  X,
  Code2,
  Settings,
  RotateCw,
  AlertCircle,
  Link as LinkIcon,
  ListChecks,
  Filter,
} from 'lucide-react';
import {
  ImplementationTask,
  ImplementationChangeItem,
  ImplementationSection,
  BuildPackage,
  AlgorithmHeaderSettings,
} from '../../types';
import {
  DEFAULT_ALGORITHM_HEADER_SETTINGS,
  ALGORITHM_HEADER_SETTINGS_KEY,
  formatAlgorithmHeaderComment,
} from '../../constants/algorithmHeader';
import { injectAlgorithmComment } from '../../utils/algorithmCommentInjector';
import { AlgorithmHeaderSettingsModal } from './AlgorithmHeaderSettingsModal';
import { TaskSettingsModal } from './TaskSettingsModal';
import { TaskChecklistModal } from './TaskChecklistModal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { ToolRow } from '../ui/ToolRow';
import { ChangeItemRow } from './ChangeItemRow';
import { AddChangeItemModal } from './AddChangeItemModal';
import { TaskExportPreviewModal } from './TaskExportPreviewModal';
import {
  getActiveTabInfo,
  formatTaskToMarkdown,
  DEFAULT_IMPLEMENTATION_SECTIONS,
  matchSectionForType,
  formatTitleInQuotes,
  isSameUrl,
  extractCardIdFromUrl,
  isGreenDataUpdatePackage,
} from '../../utils/tabUtils';
import { getErrorMessage } from '../../utils/errorUtils';

interface TaskEditorProps {
  task: ImplementationTask;
  packages?: BuildPackage[];
  onNavigateToPackage?: (pkgId: string) => void;
  onUpdateTask: (id: string, updates: Partial<Omit<ImplementationTask, 'id' | 'createdAt'>>) => void;
  onAddSection: (taskId: string, name: string) => ImplementationSection | null | void;
  onUpdateSection: (taskId: string, sectionId: string, updates: Partial<ImplementationSection>) => void;
  onDeleteSection: (taskId: string, sectionId: string) => void;
  onReorderSections: (taskId: string, fromIndex: number, toIndex: number) => void;
  onAddChangeItem: (taskId: string, item: Omit<ImplementationChangeItem, 'id'>) => void;
  onUpdateChangeItem: (taskId: string, itemId: string, updates: Partial<ImplementationChangeItem>) => void;
  onDeleteChangeItem: (taskId: string, itemId: string) => void;
  onToggleChangeItemCollected?: (taskId: string, itemId: string) => void;
  onSetAllChangeItemsCollected?: (taskId: string, isCollected: boolean) => void;
  onReorderChangeItems: (taskId: string, fromIndex: number, toIndex: number) => void;
  onMoveChangeItem: (taskId: string, itemId: string, targetSectionId?: string, targetIndex?: number) => void;
  onOpenImportExport?: (defaultTab?: 'export' | 'import') => void;
  onSetStartNumber?: (num: number) => void;
  onShowToast?: (notification: { fileName: string; number: number }) => void;
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
  onToggleChangeItemCollected,
  onSetAllChangeItemsCollected,
  onReorderChangeItems,
  onOpenImportExport,
  onSetStartNumber,
  onShowToast,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ImplementationChangeItem | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | undefined>(undefined);

  const handleApplyPackageNumber = useCallback(
    (item: ImplementationChangeItem, num: number, fileName?: string) => {
      onUpdateChangeItem(task.id, item.id, {
        lastFileNumber: num,
        lastFileName: fileName,
      });
      onUpdateTask(task.id, {
        lastFileNumber: num,
        lastFileName: fileName,
      });
      if (onSetStartNumber) {
        onSetStartNumber(num);
      }
      if (onShowToast) {
        onShowToast({ fileName: fileName || `Пакет № ${num}`, number: num });
      }
    },
    [task.id, onUpdateChangeItem, onUpdateTask, onSetStartNumber, onShowToast]
  );

  // Duplicate URL candidate state when a link already exists in the task
  const [duplicateCandidate, setDuplicateCandidate] = useState<{
    existingItem: ImplementationChangeItem;
    newItemData: Omit<ImplementationChangeItem, 'id'>;
  } | null>(null);

  // Editable fields within the duplicate replace modal
  const [replaceDescription, setReplaceDescription] = useState('');
  const [replaceSectionId, setReplaceSectionId] = useState<string>('');
  const [replaceLinkTitle, setReplaceLinkTitle] = useState('');

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);
  const [isTabFetching, setIsTabFetching] = useState(false);

  const collectedCount = useMemo(
    () => task.items.filter((i) => i.isCollected).length,
    [task.items]
  );
  const isAllCollected = task.items.length > 0 && collectedCount === task.items.length;

  // Algorithm Header Comment State & Settings
  const [isHeaderSettingsOpen, setIsHeaderSettingsOpen] = useState(false);
  const [headerSettings, setHeaderSettings] = useState<AlgorithmHeaderSettings>(() => {
    try {
      const saved = localStorage.getItem(ALGORITHM_HEADER_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_ALGORITHM_HEADER_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_ALGORITHM_HEADER_SETTINGS;
  });

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([ALGORITHM_HEADER_SETTINGS_KEY], (res) => {
        if (res[ALGORITHM_HEADER_SETTINGS_KEY]) {
          setHeaderSettings((prev) => ({ ...prev, ...res[ALGORITHM_HEADER_SETTINGS_KEY] }));
        }
      });
    }
  }, []);

  const handleSaveHeaderSettings = (newSettings: AlgorithmHeaderSettings) => {
    setHeaderSettings(newSettings);
    try {
      localStorage.setItem(ALGORITHM_HEADER_SETTINGS_KEY, JSON.stringify(newSettings));
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [ALGORITHM_HEADER_SETTINGS_KEY]: newSettings });
      }
    } catch {
      // ignore
    }
  };

  const [isInjecting, setIsInjecting] = useState(false);
  const [injectResult, setInjectResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedHeader, setCopiedHeader] = useState(false);

  // Live comment string
  const headerCommentText = useMemo(() => {
    return formatAlgorithmHeaderComment({
      author: headerSettings.author,
      taskNumber: task.taskNumber,
      releaseNumber: task.releaseNumber || headerSettings.defaultRelease,
    });
  }, [headerSettings.author, headerSettings.defaultRelease, task.taskNumber, task.releaseNumber]);

  const handleCopyHeaderComment = async () => {
    const full = headerCommentText + (headerSettings.insertNewline ? '\n' : '');
    try {
      await navigator.clipboard.writeText(full);
      setCopiedHeader(true);
      setTimeout(() => setCopiedHeader(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleInsertHeaderComment = async () => {
    setIsInjecting(true);
    setInjectResult(null);
    try {
      const res = await injectAlgorithmComment(headerCommentText, headerSettings.insertNewline);
      setInjectResult({
        success: res.success,
        message: res.message,
      });
      if (res.copiedToClipboard) {
        setCopiedHeader(true);
        setTimeout(() => setCopiedHeader(false), 2500);
      }
    } catch (err) {
      setInjectResult({
        success: false,
        message: getErrorMessage(err, 'Ошибка вставки комментария'),
      });
    } finally {
      setIsInjecting(false);
    }
  };

  // Section Create/Edit Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ImplementationSection | null>(null);
  const [sectionNameInput, setSectionNameInput] = useState('');

  // Delete Section Confirm Modal State
  const [sectionToDelete, setSectionToDelete] = useState<ImplementationSection | null>(null);

  // Section 3-dots Menu State
  const [openSectionMenuId, setOpenSectionMenuId] = useState<string | null>(null);

  const getStorageKey = (taskId: string) => `gd_collapsed_sections_${taskId}`;

  // Collapsed Sections Accordion State (persisted & default collapsed)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(task.id));
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    // Default: all sections collapsed so it doesn't take too much space
    const initial: Record<string, boolean> = { '__unsectioned__': true };
    const raw = task.sections && task.sections.length > 0 ? task.sections : DEFAULT_IMPLEMENTATION_SECTIONS;
    raw.forEach((s) => {
      initial[s.id] = true;
    });
    return initial;
  });

  // Sync / Reload when task.id changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(task.id));
      if (saved) {
        setCollapsedSections(JSON.parse(saved));
        return;
      }
    } catch {
      // ignore
    }
    const initial: Record<string, boolean> = { '__unsectioned__': true };
    const raw = task.sections && task.sections.length > 0 ? task.sections : DEFAULT_IMPLEMENTATION_SECTIONS;
    raw.forEach((s) => {
      initial[s.id] = true;
    });
    setCollapsedSections(initial);
  }, [task.id]);

  const updateCollapsedSections = (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => {
    setCollapsedSections((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(getStorageKey(task.id), JSON.stringify(next));
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ [getStorageKey(task.id)]: next });
        }
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleSectionCollapse = (secId: string) => {
    updateCollapsedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const linkedPackages = useMemo(() => {
    return packages.filter((p) => p.taskId === task.id || p.id === task.packageId);
  }, [task.id, task.packageId, packages]);

  const linkedFilesByCardId = useMemo(() => {
    const map = new Map<string, { order: number; newName?: string; originalName: string; cardId?: string }>();
    linkedPackages.forEach((pkg) => {
      pkg.files.forEach((f) => {
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

  const sections = useMemo(() => {
    const raw =
      task.sections && task.sections.length > 0
        ? task.sections
        : DEFAULT_IMPLEMENTATION_SECTIONS;
    return [...raw].sort((a, b) => a.order - b.order);
  }, [task.sections]);

  // Synchronize fields when duplicate candidate appears
  useEffect(() => {
    if (duplicateCandidate) {
      const isFromActiveTab =
        duplicateCandidate.newItemData.description ===
          formatTitleInQuotes(duplicateCandidate.newItemData.linkTitle || '') ||
        duplicateCandidate.newItemData.description ===
          duplicateCandidate.newItemData.linkTitle;

      if (isFromActiveTab && duplicateCandidate.existingItem.description) {
        setReplaceDescription(duplicateCandidate.existingItem.description);
      } else {
        setReplaceDescription(
          duplicateCandidate.newItemData.description ||
            duplicateCandidate.existingItem.description ||
            ''
        );
      }

      setReplaceSectionId(
        duplicateCandidate.newItemData.sectionId ||
          duplicateCandidate.existingItem.sectionId ||
          sections[0]?.id ||
          ''
      );

      setReplaceLinkTitle(
        duplicateCandidate.newItemData.linkTitle ||
          duplicateCandidate.existingItem.linkTitle ||
          ''
      );
    }
  }, [duplicateCandidate, sections]);

  const handleConfirmReplaceDuplicate = () => {
    if (!duplicateCandidate || !replaceDescription.trim()) return;
    const finalData: Omit<ImplementationChangeItem, 'id'> = {
      sectionId: replaceSectionId || undefined,
      description: replaceDescription.trim(),
      linkTitle: replaceLinkTitle.trim() || undefined,
      linkUrl: duplicateCandidate.existingItem.linkUrl,
    };
    onUpdateChangeItem(task.id, duplicateCandidate.existingItem.id, finalData);
    if (finalData.sectionId) {
      updateCollapsedSections((prev) => ({
        ...prev,
        [finalData.sectionId!]: false,
      }));
    }
    setDuplicateCandidate(null);
    setEditingItem(null);
    setIsAddModalOpen(false);
  };

  const handleConfirmAddDuplicateAnyway = () => {
    if (!duplicateCandidate || !replaceDescription.trim()) return;
    const finalData: Omit<ImplementationChangeItem, 'id'> = {
      sectionId: replaceSectionId || undefined,
      description: replaceDescription.trim(),
      linkTitle: replaceLinkTitle.trim() || undefined,
      linkUrl: duplicateCandidate.existingItem.linkUrl,
    };
    onAddChangeItem(task.id, finalData);
    if (finalData.sectionId) {
      updateCollapsedSections((prev) => ({
        ...prev,
        [finalData.sectionId!]: false,
      }));
    }
    setDuplicateCandidate(null);
    setEditingItem(null);
    setIsAddModalOpen(false);
  };

  const handleOpenInFullEditor = () => {
    if (!duplicateCandidate) return;
    setEditingItem({
      ...duplicateCandidate.existingItem,
      description: replaceDescription.trim() || duplicateCandidate.existingItem.description,
      sectionId: replaceSectionId || duplicateCandidate.existingItem.sectionId,
      linkTitle: replaceLinkTitle.trim() || duplicateCandidate.existingItem.linkTitle,
    });
    setTargetSectionId(replaceSectionId || duplicateCandidate.existingItem.sectionId);
    setDuplicateCandidate(null);
    setIsAddModalOpen(true);
  };

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

  // Filter state: show all or only uncollected items
  const [filterStatus, setFilterStatus] = useState<'all' | 'uncollected'>('all');
  const uncollectedCount = useMemo(
    () => task.items.filter((i) => !i.isCollected).length,
    [task.items]
  );

  const allSectionsCollapsed = useMemo(() => {
    if (sections.length === 0) return false;
    return sections.every((s) => collapsedSections[s.id]);
  }, [sections, collapsedSections]);

  const toggleCollapseAll = () => {
    if (allSectionsCollapsed) {
      updateCollapsedSections(() => ({}));
    } else {
      const next: Record<string, boolean> = {};
      sections.forEach((s) => {
        next[s.id] = true;
      });
      if (unsectionedItems.length > 0) {
        next['__unsectioned__'] = true;
      }
      updateCollapsedSections(() => next);
    }
  };

  const handleEditItem = useCallback((item: ImplementationChangeItem) => {
    setEditingItem(item);
    setTargetSectionId(item.sectionId);
    setIsAddModalOpen(true);
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    onDeleteChangeItem(task.id, itemId);
  }, [task.id, onDeleteChangeItem]);

  const handleMoveUpItem = useCallback((itemId: string) => {
    const idx = task.items.findIndex((i) => i.id === itemId);
    if (idx > 0) {
      onReorderChangeItems(task.id, idx, idx - 1);
    }
  }, [task.id, task.items, onReorderChangeItems]);

  const handleMoveDownItem = useCallback((itemId: string) => {
    const idx = task.items.findIndex((i) => i.id === itemId);
    if (idx !== -1 && idx < task.items.length - 1) {
      onReorderChangeItems(task.id, idx, idx + 1);
    }
  }, [task.id, task.items, onReorderChangeItems]);

  const handleOpenAddWithTab = async (sectionId?: string) => {
    setIsTabFetching(true);
    try {
      const tabInfo = await getActiveTabInfo();
      if (tabInfo) {
        let secId = sectionId;

        // Auto-match against user's created sections
        if (!secId) {
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
            secId = matched.section.id;
          }
        }

        const assignedSec = secId || sections[0]?.id;
        const rawName = tabInfo.cleanTitle || tabInfo.title;

        // Check if an item with this URL is already added to the task
        if (tabInfo.url) {
          const existing = task.items.find((i) => isSameUrl(i.linkUrl, tabInfo.url));
          if (existing) {
            const initialDesc = existing.description || formatTitleInQuotes(rawName);
            setReplaceDescription(initialDesc);
            setReplaceSectionId(assignedSec || existing.sectionId || sections[0]?.id || '');
            setReplaceLinkTitle(rawName || existing.linkTitle || '');
            setDuplicateCandidate({
              existingItem: existing,
              newItemData: {
                sectionId: assignedSec,
                description: formatTitleInQuotes(rawName),
                linkTitle: rawName,
                linkUrl: tabInfo.url,
              },
            });
            return;
          }
        }

        const isPkg = isGreenDataUpdatePackage(rawName, tabInfo.url);
        setTargetSectionId(assignedSec);
        setEditingItem({
          id: '',
          sectionId: assignedSec,
          description: formatTitleInQuotes(rawName),
          linkTitle: rawName,
          linkUrl: tabInfo.url,
          isUpdatePackage: isPkg || undefined,
        });
        setIsAddModalOpen(true);
      } else {
        setEditingItem(null);
        setIsAddModalOpen(true);
      }
    } catch {
      setEditingItem(null);
      setIsAddModalOpen(true);
    } finally {
      setIsTabFetching(false);
    }
  };

  const handleOpenAddNew = (presetSectionId?: string) => {
    setEditingItem(null);
    setTargetSectionId(presetSectionId || sections[0]?.id);
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (itemData: Omit<ImplementationChangeItem, 'id'>) => {
    const assignedSec = itemData.sectionId || targetSectionId;

    // Check if an item with this URL already exists in current task (excluding current editing item)
    if (itemData.linkUrl && itemData.linkUrl.trim()) {
      const existing = task.items.find(
        (i) => i.id !== editingItem?.id && isSameUrl(i.linkUrl, itemData.linkUrl)
      );
      if (existing) {
        setReplaceDescription(itemData.description || existing.description || '');
        setReplaceSectionId(assignedSec || existing.sectionId || sections[0]?.id || '');
        setReplaceLinkTitle(itemData.linkTitle || existing.linkTitle || '');
        setDuplicateCandidate({
          existingItem: existing,
          newItemData: {
            ...itemData,
            sectionId: assignedSec,
          },
        });
        setIsAddModalOpen(false);
        return;
      }
    }

    if (editingItem && editingItem.id) {
      onUpdateChangeItem(task.id, editingItem.id, itemData);
    } else {
      onAddChangeItem(task.id, {
        ...itemData,
        sectionId: assignedSec,
      });
    }
    if (assignedSec) {
      updateCollapsedSections((prev) => ({
        ...prev,
        [assignedSec]: false,
      }));
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
    const md = formatTaskToMarkdown({
      ...task,
      linkedPackages: linkedPackages.map((p) => ({ name: p.name, files: p.files })),
    });
    navigator.clipboard.writeText(md);
    setQuickCopied(true);
    setTimeout(() => setQuickCopied(false), 2000);
  };

  const progressPct = task.items.length ? Math.round((collectedCount / task.items.length) * 100) : 0;

  const renderItems = (items: ImplementationChangeItem[], totalCount: number) =>
    items.map((item, idx) => {
      const itemCardId = extractCardIdFromUrl(item.linkUrl);
      const matchingFile = itemCardId ? linkedFilesByCardId.get(itemCardId) : undefined;
      return (
        <ChangeItemRow
          key={item.id}
          item={item}
          index={idx}
          totalCount={totalCount}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onMoveUp={handleMoveUpItem}
          onMoveDown={handleMoveDownItem}
          onToggleCollected={(id) => onToggleChangeItemCollected?.(task.id, id)}
          matchingPackageFile={matchingFile}
          onApplyPackageNumber={handleApplyPackageNumber}
        />
      );
    });

  const menuItemClass =
    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-slate-900 hover:bg-gd-fill-2 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer';

  return (
    <div className="space-y-5">
      {/* ── Сводка: прогресс сбора, параметры, бэкап ── */}
      <div className="gd-group gd-group--icons">
        <button
          type="button"
          onClick={() => setIsChecklistModalOpen(true)}
          title="Чеклист сбора объектов (открыть ссылку, отслеживать прогресс)"
          className="gd-row gd-row--tap w-full text-left !py-3"
        >
          <span className={`gd-row-icon ${isAllCollected ? 'gd-row-icon--accent' : ''}`}>
            <ListChecks />
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[14px] text-slate-900">Чеклист сбора</span>
              <span className="text-[13px] text-gd-muted tabular-nums">
                {task.items.length > 0 ? `${collectedCount} из ${task.items.length}` : 'нет пунктов'}
              </span>
            </span>
            <span className="mt-2 block h-1.5 rounded-full bg-gd-fill overflow-hidden">
              <span
                className="block h-full rounded-full bg-gd-green transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${progressPct}%` }}
              />
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-gd-faint flex-shrink-0" />
        </button>

        <ToolRow
          icon={
            <>
              <Settings />
              {task.summary?.trim() && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gd-green ring-2 ring-white" />
              )}
            </>
          }
          label="Параметры задачи"
          value={task.releaseNumber ? `Релиз ${task.releaseNumber}` : undefined}
          title="Параметры задачи (номер, релиз, название, пакеты, заметка)"
          onClick={() => setIsSettingsModalOpen(true)}
        />

        {onOpenImportExport && (
          <ToolRow
            icon={<FileJson />}
            label="Бэкап и импорт JSON"
            title="Резервное копирование и экспорт в JSON"
            onClick={() => onOpenImportExport('export')}
          />
        )}
      </div>

      {/* ── Шапка алгоритма: вставка комментария в формулу GreenData ── */}
      <div>
        <div className="gd-section-title">
          <span>Шапка алгоритма</span>
          <button
            type="button"
            onClick={() => setIsHeaderSettingsOpen(true)}
            title="Настройки шапки (Фамилия И.О., релиз)"
            className="normal-case tracking-normal text-[12.5px] font-medium text-gd-green cursor-pointer"
          >
            Настроить
          </button>
        </div>
        <div className="gd-group">
          <div className="gd-row !py-2.5">
            <span className="flex-1 min-w-0 font-mono text-[12px] text-slate-700 truncate select-all" title={headerCommentText}>
              {headerCommentText}
            </span>
            <button
              type="button"
              onClick={handleCopyHeaderComment}
              title="Скопировать комментарий в буфер обмена"
              className="icon-btn w-8 h-8"
            >
              {copiedHeader ? (
                <Check className="w-4 h-4 text-gd-green animate-pop-in" strokeWidth={2.75} />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <Button
              variant="outline"
              size="sm"
              disabled={isInjecting}
              onClick={handleInsertHeaderComment}
              leftIcon={<Code2 className="w-3.5 h-3.5" />}
              title="Вставить комментарий в редактор алгоритма на открытой вкладке"
            >
              {isInjecting ? 'Вставка…' : injectResult?.success ? 'Вставлено' : 'Вставить'}
            </Button>
          </div>
          {injectResult && (
            <div
              className={`gd-row !min-h-0 !py-2 text-[12px] font-medium animate-fade-in ${
                injectResult.success ? 'text-gd-green' : 'text-[#c26a00]'
              }`}
            >
              <span className="flex-1 min-w-0">{injectResult.message}</span>
              <button
                type="button"
                onClick={() => setInjectResult(null)}
                className="icon-btn icon-btn--plain w-6 h-6"
                title="Скрыть"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <p className="px-3.5 pt-1.5 text-[11.5px] text-gd-muted">Автор: {headerSettings.author}</p>
      </div>

      {/* ── Внесённые изменения ── */}
      <div className="space-y-3">
        {/* Панель действий */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAddNew()}
            leftIcon={<Plus className="w-4 h-4" strokeWidth={2.5} />}
          >
            Добавить
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenAddWithTab()}
            disabled={isTabFetching}
            title="Добавить пункт и автоматически подставить ссылку на открытую вкладку"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-gd-green" />}
          >
            С вкладки
          </Button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={handleOpenCreateSection}
            title="Создать новый раздел (категорию)"
            className="icon-btn"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          {task.items.length > 0 && (uncollectedCount > 0 || filterStatus === 'uncollected') && (
            <button
              type="button"
              onClick={() => setFilterStatus((prev) => (prev === 'all' ? 'uncollected' : 'all'))}
              title={filterStatus === 'uncollected' ? 'Показать все пункты' : 'Показать только не собранные'}
              className={`icon-btn relative ${filterStatus === 'uncollected' ? '!bg-[#ff9500]/15 !text-[#c26a00]' : ''}`}
            >
              <Filter className="w-3.5 h-3.5" />
              {uncollectedCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#ff9500] text-white text-[9.5px] font-bold leading-4 text-center tabular-nums">
                  {uncollectedCount}
                </span>
              )}
            </button>
          )}
          {sections.length > 1 && (
            <button
              type="button"
              onClick={toggleCollapseAll}
              title={allSectionsCollapsed ? 'Развернуть все разделы' : 'Свернуть все разделы'}
              className="icon-btn"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filterStatus === 'uncollected' && (
          <p className="px-1 text-[12px] font-medium text-[#c26a00] animate-fade-in">
            Показаны только не собранные пункты
          </p>
        )}

        {task.items.length === 0 && sections.length === 0 ? (
          <div className="gd-group px-5 py-7 text-center animate-pop-in">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gd-fill text-gd-muted">
              <Info className="w-6 h-6" />
            </div>
            <p className="text-[15px] font-semibold text-slate-900">Изменений пока нет</p>
            <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-snug text-gd-muted">
              Зафиксируйте, что было изменено, и прикрепите ссылки на алгоритмы, формы и модули.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((sec, secIdx) => {
              const allSectionItems = groupedItems.get(sec.id) || [];
              const items = filterStatus === 'uncollected'
                ? allSectionItems.filter((i) => !i.isCollected)
                : allSectionItems;
              const isCollapsed = !!collapsedSections[sec.id];

              return (
                <div key={sec.id} className={`relative ${openSectionMenuId === sec.id ? 'z-30' : 'z-0'}`}>
                  {/* Заголовок раздела */}
                  <div className="flex items-center gap-1 pl-1.5 pr-1 pb-1.5">
                    <button
                      type="button"
                      onClick={() => toggleSectionCollapse(sec.id)}
                      className="flex flex-1 min-w-0 items-center gap-1 text-left cursor-pointer !scale-100"
                      title={isCollapsed ? 'Развернуть раздел' : 'Свернуть раздел'}
                    >
                      <ChevronRight
                        className={`w-4 h-4 text-gd-muted flex-shrink-0 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-90'}`}
                      />
                      <span className="gd-label !text-[11.5px] truncate" title={sec.name}>
                        {sec.name}
                      </span>
                      <span className="text-[11.5px] font-semibold text-gd-faint tabular-nums flex-shrink-0">
                        {filterStatus === 'uncollected' ? `${items.length}/${allSectionItems.length}` : allSectionItems.length}
                      </span>
                    </button>

                    <div className="relative flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenAddNew(sec.id)}
                        title={`Добавить пункт в раздел "${sec.name}"`}
                        className="inline-flex items-center gap-0.5 px-2 h-7 rounded-full text-[12.5px] font-medium text-gd-green hover:bg-gd-green-light cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Пункт
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenSectionMenuId(openSectionMenuId === sec.id ? null : sec.id)}
                        title="Опции раздела"
                        className={`icon-btn icon-btn--plain w-7 h-7 ${openSectionMenuId === sec.id ? '!bg-gd-fill !text-slate-900' : ''}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {openSectionMenuId === sec.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenSectionMenuId(null);
                            }}
                          />
                          <div
                            className="gd-menu absolute right-0 top-full mt-1 z-50 p-1 min-w-[190px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onReorderSections(task.id, secIdx, secIdx - 1);
                                setOpenSectionMenuId(null);
                              }}
                              disabled={secIdx === 0}
                              className={menuItemClass}
                            >
                              <ChevronUp className="w-4 h-4 text-gd-muted" />
                              Поднять выше
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onReorderSections(task.id, secIdx, secIdx + 1);
                                setOpenSectionMenuId(null);
                              }}
                              disabled={secIdx === sections.length - 1}
                              className={menuItemClass}
                            >
                              <ChevronDown className="w-4 h-4 text-gd-muted" />
                              Опустить ниже
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenEditSection(sec);
                                setOpenSectionMenuId(null);
                              }}
                              className={menuItemClass}
                            >
                              <Edit2 className="w-4 h-4 text-gd-muted" />
                              Переименовать
                            </button>
                            <div className="h-px bg-gd-border my-1 mx-2" />
                            <button
                              type="button"
                              onClick={() => {
                                setSectionToDelete(sec);
                                setOpenSectionMenuId(null);
                              }}
                              className={`${menuItemClass} !text-[#ff3b30]`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Удалить раздел
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Пункты раздела */}
                  {!isCollapsed && (
                    <div className="gd-group !overflow-visible animate-slide-down">
                      {allSectionItems.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAddNew(sec.id)}
                          className="gd-row gd-row--tap w-full justify-center rounded-xl text-[13px] text-gd-muted"
                        >
                          Пусто · <span className="text-gd-green font-medium">Добавить пункт</span>
                        </button>
                      ) : items.length === 0 && filterStatus === 'uncollected' ? (
                        <div className="gd-row justify-center text-[13px] font-medium text-gd-green">
                          <Check className="w-4 h-4" strokeWidth={2.75} />
                          Все {allSectionItems.length} собраны
                        </div>
                      ) : (
                        renderItems(items, items.length)
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Пункты без раздела */}
            {unsectionedItems.length > 0 && (() => {
              const visible = filterStatus === 'uncollected'
                ? unsectionedItems.filter((i) => !i.isCollected)
                : unsectionedItems;
              const isCollapsed = !!collapsedSections['__unsectioned__'];
              return (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('__unsectioned__')}
                    className="flex w-full items-center gap-1 pl-1.5 pb-1.5 text-left cursor-pointer !scale-100"
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-gd-muted flex-shrink-0 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-90'}`}
                    />
                    <span className="gd-label !text-[11.5px]">Без раздела</span>
                    <span className="text-[11.5px] font-semibold text-gd-faint tabular-nums">
                      {filterStatus === 'uncollected' ? `${visible.length}/${unsectionedItems.length}` : unsectionedItems.length}
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="gd-group !overflow-visible animate-slide-down">
                      {visible.length === 0 && filterStatus === 'uncollected' ? (
                        <div className="gd-row justify-center text-[13px] font-medium text-gd-green">
                          <Check className="w-4 h-4" strokeWidth={2.75} />
                          Все объекты без раздела собраны
                        </div>
                      ) : (
                        renderItems(visible, unsectionedItems.length)
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Итог: копирование и экспорт описания */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={handleQuickCopyMarkdown}
            leftIcon={
              quickCopied ? (
                <Check className="w-4 h-4 text-gd-green animate-pop-in" strokeWidth={2.75} />
              ) : (
                <Copy className="w-4 h-4" />
              )
            }
            title="Копировать всё описание в формате Markdown"
          >
            {quickCopied ? 'Скопировано' : 'Копировать MD'}
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => setIsPreviewModalOpen(true)}
            leftIcon={<Eye className="w-4 h-4" />}
            title="Просмотр и экспорт описания"
          >
            Экспорт
          </Button>
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
        existingItems={task.items}
      />

      {/* Task Markdown Preview Modal */}
      <TaskExportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        task={task}
        packages={packages}
      />

      {/* Task Checklist Modal */}
      <TaskChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        task={task}
        onToggleItemCollected={(taskId, itemId) => {
          onToggleChangeItemCollected?.(taskId, itemId);
        }}
        onSetAllCollected={(taskId, isCollected) => {
          onSetAllChangeItemsCollected?.(taskId, isCollected);
        }}
        linkedPackages={linkedPackages.map((p) => ({ name: p.name, files: p.files }))}
      />

      {/* Task Settings Modal */}
      <TaskSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        task={task}
        packages={packages}
        onUpdateTask={onUpdateTask}
        onNavigateToPackage={onNavigateToPackage}
        onSetStartNumber={onSetStartNumber}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
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
            <span className="text-[10px] text-slate-400 block w-full">
              Быстрые варианты:
            </span>
            {['Типы объекта', 'Алгоритмы', 'Визуалы', 'Бизнес-процессы', 'Печатные формы'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSectionNameInput(opt)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-[10px] font-medium text-slate-600 transition-colors border border-slate-200"
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
        <p className="text-xs text-slate-700">
          Вы уверены, что хотите удалить раздел{' '}
          <strong className="text-slate-900">"{sectionToDelete?.name}"</strong>?
          Пункты из этого раздела не удалятся, а переместятся в список «Без раздела».
        </p>
      </Modal>

      {/* Algorithm Header Settings Modal */}
      <AlgorithmHeaderSettingsModal
        isOpen={isHeaderSettingsOpen}
        onClose={() => setIsHeaderSettingsOpen(false)}
        settings={headerSettings}
        onSave={handleSaveHeaderSettings}
        currentTask={task}
      />

      {/* ── Duplicate URL Replace Confirmation Modal ── */}
      <Modal
        isOpen={Boolean(duplicateCandidate)}
        onClose={() => setDuplicateCandidate(null)}
        title="Ссылка уже добавлена в реализацию"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDuplicateCandidate(null)}
            >
              Отмена
            </Button>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleConfirmAddDuplicateAnyway}
                disabled={!replaceDescription.trim()}
                title="Добавить как отдельный пункт без замены"
                className="text-slate-600 hover:text-slate-900 text-xs cursor-pointer"
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Добавить копию
              </Button>

              <Button
                variant="emerald"
                size="sm"
                onClick={handleConfirmReplaceDuplicate}
                disabled={!replaceDescription.trim()}
                leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                className="font-bold shadow-xs cursor-pointer"
              >
                Заменить
              </Button>
            </div>
          </div>
        }
      >
        {duplicateCandidate && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-amber-950 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="font-bold text-xs block">
                  Эта ссылка уже добавлена в текущую реализацию!
                </span>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Отредактируйте комментарий к изменениям ниже и нажмите «Заменить», либо сохраните как отдельную копию.
                </p>
              </div>
            </div>

            {/* Existing Item Card */}
            <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-400" />
                  Существующая запись в реализации:
                </span>
                {duplicateCandidate.existingItem.sectionId && (
                  <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    {sections.find((s) => s.id === duplicateCandidate.existingItem.sectionId)?.name || 'Без раздела'}
                  </span>
                )}
              </div>
              <p className="font-semibold text-slate-800 text-xs line-clamp-2 bg-white p-2 rounded-lg border border-slate-200">
                {duplicateCandidate.existingItem.description}
              </p>
              {duplicateCandidate.existingItem.linkUrl && (
                <div className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1">
                  <LinkIcon className="w-2.5 h-2.5 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{duplicateCandidate.existingItem.linkUrl}</span>
                </div>
              )}
            </div>

            {/* Section & Link Title Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-slate-800 text-[11px] mb-1 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-emerald-600" />
                  <span>Раздел (категория)</span>
                </label>
                <Select
                  value={replaceSectionId}
                  onChange={(val) => setReplaceSectionId(val)}
                  options={[
                    { value: '', label: 'Без раздела' },
                    ...sections.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <Input
                  label="Заголовок ссылки (название объекта)"
                  value={replaceLinkTitle}
                  onChange={(e) => setReplaceLinkTitle(e.target.value)}
                  placeholder="Например: ЖЦ до сохранения"
                />
              </div>
            </div>

            {/* Editable Description / Changes Comment Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                  <span>Текст изменений / комментарий</span>
                  <span className="text-rose-500">*</span>
                </label>

                {/* Helper action chips */}
                <div className="flex items-center gap-1 text-[10.5px]">
                  {duplicateCandidate.existingItem.description && (
                    <button
                      type="button"
                      onClick={() => {
                        const existing = duplicateCandidate.existingItem.description;
                        if (!replaceDescription.trim()) {
                          setReplaceDescription(existing + '\n• ');
                        } else if (!replaceDescription.includes(existing)) {
                          setReplaceDescription(existing + '\n• ' + replaceDescription);
                        } else {
                          setReplaceDescription((prev) => prev + '\n• ');
                        }
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                      title="Добавить новый пункт к существующему описанию"
                    >
                      + Дополнить старое
                    </button>
                  )}

                  {duplicateCandidate.existingItem.description && (
                    <button
                      type="button"
                      onClick={() => setReplaceDescription(duplicateCandidate.existingItem.description)}
                      className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer underline bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                      title="Восстановить текст существующей записи"
                    >
                      Вернуть старое
                    </button>
                  )}

                  {(replaceLinkTitle || duplicateCandidate.newItemData.linkTitle) && (
                    <button
                      type="button"
                      onClick={() =>
                        setReplaceDescription(
                          formatTitleInQuotes(replaceLinkTitle || duplicateCandidate.newItemData.linkTitle || '')
                        )
                      }
                      className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer underline bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                      title="Вставить только заголовок в кавычках"
                    >
                      «Заголовок»
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={replaceDescription}
                onChange={(e) => setReplaceDescription(e.target.value)}
                placeholder="Опишите внесенные изменения или добавьте комментарий..."
                rows={3}
                autoFocus
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs resize-y shadow-2xs"
              />
            </div>

            {/* Optional link to open full editor */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
              <span>Нужно детально изменить поля ссылки?</span>
              <button
                type="button"
                onClick={handleOpenInFullEditor}
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer inline-flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>Открыть в полном редакторе</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
