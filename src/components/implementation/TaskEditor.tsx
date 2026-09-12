import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Sparkles,
  ListOrdered,
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
  MoreVertical,
  Code2,
  Settings,
  RotateCw,
  AlertCircle,
  Link as LinkIcon,
  SlidersHorizontal,
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
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
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
} from '../../utils/tabUtils';

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
  onReorderChangeItems: (taskId: string, fromIndex: number, toIndex: number) => void;
  onMoveChangeItem: (taskId: string, itemId: string, targetSectionId?: string, targetIndex?: number) => void;
  onOpenImportExport?: (defaultTab?: 'export' | 'import') => void;
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
  onOpenImportExport,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ImplementationChangeItem | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | undefined>(undefined);

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
  const [quickCopied, setQuickCopied] = useState(false);
  const [isTabFetching, setIsTabFetching] = useState(false);

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
    } catch (err: any) {
      setInjectResult({
        success: false,
        message: err.message || 'Ошибка вставки комментария',
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
    return packages.filter((p) => p.taskId === task.id);
  }, [task.id, packages]);

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

        setTargetSectionId(assignedSec);
        setEditingItem({
          id: '',
          sectionId: assignedSec,
          description: formatTitleInQuotes(rawName),
          linkTitle: rawName,
          linkUrl: tabInfo.url,
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

  return (
    <div className="space-y-3">
      {/* ── Implementation Tools Bar ── */}
      <div className="flex items-center justify-between gap-1.5 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs animate-fade-in">
        <div className="flex items-center gap-1.5 pl-1.5 text-xs font-bold text-slate-800 min-w-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="truncate">Инструменты</span>
          {task.releaseNumber && (
            <span className="hidden xs:inline-flex px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/80">
              Релиз {task.releaseNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            title="Параметры задачи (номер, релиз, название, пакеты, заметка)"
            className="relative inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-semibold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <Settings className="w-3 h-3 text-emerald-600" />
            <span>Настройки</span>
            {Boolean(task.summary?.trim()) && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                style={{ boxShadow: '0 0 4px rgba(34,197,94,0.7)' }}
                title="Есть заметка"
              />
            )}
          </button>

          {onOpenImportExport && (
            <button
              type="button"
              onClick={() => onOpenImportExport('export')}
              title="Резервное копирование и экспорт в JSON"
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-semibold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <FileJson className="w-3 h-3 text-emerald-600" />
              <span>Бэкап</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Algorithm Header Quick Action Card (Feature: Вставка комментария в алгоритм) ── */}
      <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200/90 rounded-2xl shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-2xs flex-shrink-0">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block truncate">
                Шапка алгоритма
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Быстрая вставка комментария в формулу GreenData
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsHeaderSettingsOpen(true)}
              title="Настройки шапки (Фамилия И.О., релиз)"
              className="p-1.5 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-slate-600 hover:text-emerald-900 transition-all cursor-pointer shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleCopyHeaderComment}
              title="Скопировать комментарий в буфер обмена"
              className="p-1.5 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-slate-600 hover:text-emerald-900 transition-all cursor-pointer shadow-2xs"
            >
              {copiedHeader ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <Button
              variant="emerald"
              size="sm"
              disabled={isInjecting}
              onClick={handleInsertHeaderComment}
              className="px-2.5 py-1 text-[11px] font-bold shadow-xs cursor-pointer"
            >
              {isInjecting ? 'Вставка...' : injectResult?.success ? 'Вставлено!' : 'Вставить'}
            </Button>
          </div>
        </div>

        {/* Live Preview Bar */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white/95 border border-emerald-200/80 font-mono text-[11px] text-emerald-950 shadow-2xs select-all">
          <div className="flex items-center gap-1.5 truncate min-w-0">
            <span className="truncate">{headerCommentText}</span>
          </div>
          <span className="text-[9.5px] font-sans font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md flex-shrink-0">
            {headerSettings.author}
          </span>
        </div>

        {/* Feedback message if any */}
        {injectResult && (
          <div
            className={`text-[10px] font-medium px-2 py-1 rounded-xl flex items-center justify-between gap-1 animate-fade-in ${
              injectResult.success
                ? 'bg-emerald-100/90 text-emerald-950 border border-emerald-200'
                : 'bg-amber-100/90 text-amber-950 border border-amber-200'
            }`}
          >
            <span>{injectResult.message}</span>
            <button
              type="button"
              onClick={() => setInjectResult(null)}
              className="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Changes Section Container */}
      <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 shadow-xs">
        {/* Main Toolbar - Organized into 2 balanced rows to prevent any overflow */}
        <div className="space-y-2 border-b border-slate-100 pb-2.5">
          {/* Top Line: Header title on left, Primary add button on right */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <ListOrdered className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <h3 className="font-bold text-xs text-slate-900 tracking-tight whitespace-nowrap">
                Внесённые изменения
              </h3>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10.5px] font-bold border border-emerald-200 flex-shrink-0 shadow-2xs">
                {task.items.length}
              </span>
            </div>

            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleOpenAddNew()}
              leftIcon={<Plus className="w-3.5 h-3.5 flex-shrink-0" />}
              className="px-2.5 py-1 text-[11px]"
            >
              Добавить
            </Button>
          </div>

          {/* Sub Line: Section tools and quick tab import */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            {sections.length > 1 ? (
              <button
                type="button"
                onClick={toggleCollapseAll}
                title={allSectionsCollapsed ? 'Развернуть все разделы' : 'Свернуть все разделы'}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-[10.5px] font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>{allSectionsCollapsed ? 'Развернуть все' : 'Свернуть все'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleOpenAddWithTab()}
                disabled={isTabFetching}
                title="Добавить пункт и автоматически подставить ссылку на открытую вкладку"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-[10.5px] font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>С вкладки</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateSection}
                title="Создать новый раздел (категорию)"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-[10.5px] font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Раздел</span>
              </button>
            </div>
          </div>
        </div>

        {/* Changes List / Sections */}
        {task.items.length === 0 && sections.length === 0 ? (
          <div className="py-6 px-3 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Info className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-800 mb-1">
              Список изменений пуст
            </p>
            <p className="text-[11px] text-slate-500 mb-3 max-w-xs mx-auto leading-relaxed">
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
          <div className="space-y-3">
            {/* Render each section */}
            {sections.map((sec, secIdx) => {
              const items = groupedItems.get(sec.id) || [];
              const isCollapsed = !!collapsedSections[sec.id];

              return (
                <div
                  key={sec.id}
                  className={`rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all relative ${
                    openSectionMenuId === sec.id ? 'z-30' : 'z-0'
                  }`}
                >
                  {/* Section Header */}
                  <div
                    className={`flex items-center justify-between gap-1.5 px-3 py-2 bg-gradient-to-r from-slate-50/90 to-white cursor-pointer select-none transition-colors hover:bg-slate-100/70 ${
                      isCollapsed ? 'rounded-2xl' : 'rounded-t-2xl border-b border-slate-200/80'
                    }`}
                    onClick={() => toggleSectionCollapse(sec.id)}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionCollapse(sec.id);
                        }}
                        className="text-slate-400 hover:text-emerald-700 transition-transform p-0.5 rounded cursor-pointer flex-shrink-0"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </button>
                      <Layers className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-bold text-xs text-slate-900 truncate min-w-0" title={sec.name}>
                        {sec.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex-shrink-0 shadow-2xs">
                        {items.length}
                      </span>
                    </div>

                    {/* Section Controls */}
                    <div className="relative flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Responsive Reorder Arrows: Visible on wider screens */}
                      <div className="hidden xs:inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => onReorderSections(task.id, secIdx, secIdx - 1)}
                          disabled={secIdx === 0}
                          title="Переместить раздел выше"
                          className="icon-btn p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReorderSections(task.id, secIdx, secIdx + 1)}
                          disabled={secIdx === sections.length - 1}
                          title="Переместить раздел ниже"
                          className="icon-btn p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddNew(sec.id)}
                        title={`Добавить пункт в раздел "${sec.name}"`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-200/90 transition-all shadow-2xs cursor-pointer flex-shrink-0 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Пункт</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenSectionMenuId(openSectionMenuId === sec.id ? null : sec.id)}
                        title="Опции раздела"
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                          openSectionMenuId === sec.id
                            ? 'bg-slate-200 text-slate-900'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* 3-dots Dropdown Menu */}
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
                            className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-1.5 min-w-[175px] space-y-0.5 animate-fade-in text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Up / Down visible in menu only on narrow screens */}
                            <div className="xs:hidden space-y-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onReorderSections(task.id, secIdx, secIdx - 1);
                                  setOpenSectionMenuId(null);
                                }}
                                disabled={secIdx === 0}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors text-[11px] font-medium"
                              >
                                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                <span>Поднять выше</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  onReorderSections(task.id, secIdx, secIdx + 1);
                                  setOpenSectionMenuId(null);
                                }}
                                disabled={secIdx === sections.length - 1}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors text-[11px] font-medium"
                              >
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                <span>Опустить ниже</span>
                              </button>

                              <div className="h-px bg-slate-100 my-0.5" />
                            </div>

                            {/* Rename & Delete: ALWAYS in 3-dots menu */}
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenEditSection(sec);
                                setOpenSectionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-700 cursor-pointer transition-colors text-[11px] font-medium"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                              <span>Переименовать</span>
                            </button>

                            <div className="h-px bg-slate-100 my-0.5" />

                            <button
                              type="button"
                              onClick={() => {
                                setSectionToDelete(sec);
                                setOpenSectionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors text-[11px] font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Удалить раздел</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Section Items (when not collapsed) */}
                  {!isCollapsed && (
                    <div className="p-2 space-y-1.5 animate-slide-down">
                      {items.length === 0 ? (
                        <div className="py-2.5 px-3 text-center text-slate-400 text-[11px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          В этом разделе пока нет изменений.{' '}
                          <button
                            type="button"
                            onClick={() => handleOpenAddNew(sec.id)}
                            className="text-emerald-700 hover:underline font-bold cursor-pointer"
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
                            onDelete={handleDeleteItem}
                            onMoveUp={handleMoveUpItem}
                            onMoveDown={handleMoveDownItem}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unsectioned Items */}
            {unsectionedItems.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div
                  className="flex items-center justify-between gap-1.5 px-3 py-2 bg-slate-50/90 border-b border-slate-200 cursor-pointer select-none"
                  onClick={() => toggleSectionCollapse('__unsectioned__')}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionCollapse('__unsectioned__');
                      }}
                      className="text-slate-400 hover:text-emerald-700 transition-transform p-0.5 rounded cursor-pointer"
                    >
                      {collapsedSections['__unsectioned__'] ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </button>
                    <span className="font-bold text-xs text-slate-800">Прочее / Без раздела</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {unsectionedItems.length}
                    </span>
                  </div>
                </div>

                {!collapsedSections['__unsectioned__'] && (
                  <div className="p-2 space-y-1.5 animate-slide-down">
                    {unsectionedItems.map((item, idx) => (
                      <ChangeItemRow
                        key={item.id}
                        item={item}
                        index={idx}
                        totalCount={unsectionedItems.length}
                        onEdit={handleEditItem}
                        onDelete={handleDeleteItem}
                        onMoveUp={handleMoveUpItem}
                        onMoveDown={handleMoveDownItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Task Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <span>Всего изменений:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80 text-[11px]">
              {task.items.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
            {onOpenImportExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenImportExport('export')}
                leftIcon={<FileJson className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                title="Резервное копирование и экспорт в JSON"
                className="whitespace-nowrap px-2.5 py-1.5 text-xs font-semibold"
              >
                Бэкап
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleQuickCopyMarkdown}
              leftIcon={
                quickCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                )
              }
              title="Копировать всё описание в формате Markdown"
              className="whitespace-nowrap px-2.5 py-1.5 text-xs font-semibold"
            >
              {quickCopied ? 'Скопировано!' : 'Копировать'}
            </Button>

            <Button
              variant="emerald"
              size="sm"
              onClick={() => setIsPreviewModalOpen(true)}
              leftIcon={<Eye className="w-3.5 h-3.5 flex-shrink-0" />}
              title="Просмотр и экспорт описания"
              className="whitespace-nowrap px-3 py-1.5 text-xs font-semibold"
            >
              Экспорт
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
        existingItems={task.items}
      />

      {/* Task Markdown Preview Modal */}
      <TaskExportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        task={task}
        packages={packages}
      />

      {/* Task Settings Modal */}
      <TaskSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        task={task}
        packages={packages}
        onUpdateTask={onUpdateTask}
        onNavigateToPackage={onNavigateToPackage}
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
            <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-amber-950 shadow-2xs">
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
            <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-1.5 shadow-2xs">
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
              <p className="font-semibold text-slate-800 text-xs line-clamp-2 bg-white p-2 rounded-lg border border-slate-200/70">
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
