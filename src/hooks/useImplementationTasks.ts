import { useState, useEffect, useCallback, useMemo } from 'react';
import { ImplementationTask, ImplementationChangeItem, ImplementationSection } from '../types';
import { DEFAULT_IMPLEMENTATION_SECTIONS } from '../utils/tabUtils';

const STORAGE_KEY_TASKS = 'gd-helper-implementation-tasks';
const STORAGE_KEY_ACTIVE_TASK = 'gd-helper-implementation-active-task-id';

function normalizeTask(task: ImplementationTask): ImplementationTask {
  return {
    ...task,
    releaseNumber: task.releaseNumber || '',
    sections:
      task.sections && task.sections.length > 0
        ? task.sections
        : DEFAULT_IMPLEMENTATION_SECTIONS.map((s, idx) => ({ ...s, order: idx })),
    items: task.items || [],
  };
}

const INITIAL_TASK: ImplementationTask = {
  id: 'task-welcome-1',
  taskNumber: 'FINAPP-5638',
  releaseNumber: '11-2026',
  title: 'Пример описания реализации задачи',
  summary: 'В рамках задачи доработана логика валидации и обновлены сопутствующие алгоритмы.',
  sections: DEFAULT_IMPLEMENTATION_SECTIONS.map((s, idx) => ({ ...s, order: idx })),
  items: [
    {
      id: 'change-item-1',
      sectionId: 'sec-algorithms',
      description: 'Изменен алгоритм, добавили цикл по участникам проверки, проверяем статус согласования',
      linkTitle: 'Алгоритм. Обработка данных',
      linkUrl: 'https://greendata.example.com/algorithm/42',
    },
    {
      id: 'change-item-2',
      sectionId: 'sec-visuals',
      description: 'Обновлена экранная форма согласования заявки и добавлены подсказки для пользователей',
      linkTitle: 'Форма. Заявка на согласование',
      linkUrl: '',
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export function useImplementationTasks() {
  const [tasks, setTasks] = useState<ImplementationTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeTask);
        }
      }
    } catch (e) {
      console.warn('Failed to parse implementation tasks from storage:', e);
    }
    return [INITIAL_TASK];
  });

  const [activeTaskId, setActiveTaskId] = useState<string>(() => {
    try {
      const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE_TASK);
      if (savedActive) return savedActive;
    } catch {
      // ignore
    }
    return INITIAL_TASK.id;
  });

  // Save tasks to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save implementation tasks:', e);
    }
  }, [tasks]);

  // Save active task ID
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TASK, activeTaskId);
    } catch {
      // ignore
    }
  }, [activeTaskId]);

  // Ensure activeTaskId always points to an existing task
  useEffect(() => {
    if (tasks.length > 0 && !tasks.some((t) => t.id === activeTaskId)) {
      setActiveTaskId(tasks[0].id);
    }
  }, [tasks, activeTaskId]);

  const activeTask = useMemo(() => {
    const found = tasks.find((t) => t.id === activeTaskId) || tasks[0] || null;
    return found ? normalizeTask(found) : null;
  }, [tasks, activeTaskId]);

  // Create new task
  const createTask = useCallback((taskNumber: string = '', title: string = '') => {
    const newTask: ImplementationTask = {
      id: crypto.randomUUID(),
      taskNumber: taskNumber.trim() || `TASK-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim() || 'Новая задача',
      summary: '',
      sections: DEFAULT_IMPLEMENTATION_SECTIONS.map((s, idx) => ({ ...s, order: idx })),
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setActiveTaskId(newTask.id);
    return newTask.id;
  }, []);

  // Update task metadata/summary
  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<ImplementationTask, 'id' | 'createdAt'>>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? normalizeTask({ ...t, ...updates, updatedAt: Date.now() }) : t))
      );
    },
    []
  );

  // Delete task
  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        if (filtered.length === 0) {
          const freshTask: ImplementationTask = {
            id: crypto.randomUUID(),
            taskNumber: 'TASK-1',
            title: 'Новая задача',
            summary: '',
            sections: DEFAULT_IMPLEMENTATION_SECTIONS.map((s, idx) => ({ ...s, order: idx })),
            items: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          return [freshTask];
        }
        return filtered;
      });
    },
    []
  );

  // Duplicate task
  const duplicateTask = useCallback((id: string) => {
    setTasks((prev) => {
      const source = prev.find((t) => t.id === id);
      if (!source) return prev;

      const copy: ImplementationTask = {
        ...source,
        id: crypto.randomUUID(),
        title: `${source.title} (копия)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sections: (source.sections || DEFAULT_IMPLEMENTATION_SECTIONS).map((s) => ({ ...s })),
        items: source.items.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        })),
      };

      const idx = prev.findIndex((t) => t.id === id);
      const updated = [...prev];
      updated.splice(idx + 1, 0, copy);
      setActiveTaskId(copy.id);
      return updated;
    });
  }, []);

  // Select task
  const selectTask = useCallback((id: string) => {
    setActiveTaskId(id);
  }, []);

  // ── Sections Management ───────────────────────────────────────────────────

  const addSection = useCallback((taskId: string, name: string): ImplementationSection | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const newSec: ImplementationSection = {
      id: `sec-${crypto.randomUUID().slice(0, 8)}`,
      name: trimmed,
      order: 999,
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentSections = t.sections || DEFAULT_IMPLEMENTATION_SECTIONS;
        newSec.order = currentSections.length;
        return {
          ...t,
          sections: [...currentSections, newSec],
          updatedAt: Date.now(),
        };
      })
    );
    return newSec;
  }, []);

  const updateSection = useCallback(
    (taskId: string, sectionId: string, updates: Partial<ImplementationSection>) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          const currentSections = t.sections || DEFAULT_IMPLEMENTATION_SECTIONS;
          return {
            ...t,
            sections: currentSections.map((s) =>
              s.id === sectionId ? { ...s, ...updates } : s
            ),
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  const deleteSection = useCallback((taskId: string, sectionId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentSections = (t.sections || DEFAULT_IMPLEMENTATION_SECTIONS).filter(
          (s) => s.id !== sectionId
        );
        // Unset sectionId on items that belonged to this section
        const updatedItems = t.items.map((i) =>
          i.sectionId === sectionId ? { ...i, sectionId: undefined } : i
        );
        return {
          ...t,
          sections: currentSections.map((s, idx) => ({ ...s, order: idx })),
          items: updatedItems,
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const reorderSections = useCallback(
    (taskId: string, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          const sections = [...(t.sections || DEFAULT_IMPLEMENTATION_SECTIONS)].sort(
            (a, b) => a.order - b.order
          );
          const [moved] = sections.splice(fromIndex, 1);
          sections.splice(toIndex, 0, moved);
          const reindexed = sections.map((s, idx) => ({ ...s, order: idx }));
          return {
            ...t,
            sections: reindexed,
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  // ── Items Management ──────────────────────────────────────────────────────

  // Add change item to task
  const addChangeItem = useCallback(
    (taskId: string, item: Omit<ImplementationChangeItem, 'id'>) => {
      const newItem: ImplementationChangeItem = {
        id: crypto.randomUUID(),
        sectionId: item.sectionId || undefined,
        description: item.description.trim(),
        linkTitle: item.linkTitle?.trim() || undefined,
        linkUrl: item.linkUrl?.trim() || undefined,
      };

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            items: [...t.items, newItem],
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  // Update change item
  const updateChangeItem = useCallback(
    (taskId: string, itemId: string, updates: Partial<ImplementationChangeItem>) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            items: t.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  // Delete change item
  const deleteChangeItem = useCallback((taskId: string, itemId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          items: t.items.filter((i) => i.id !== itemId),
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  // Reorder change items within a specific section or globally
  const reorderChangeItems = useCallback(
    (taskId: string, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          const items = [...t.items];
          const [removed] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, removed);
          return {
            ...t,
            items,
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  // Move item between sections or reorder within section
  const moveChangeItem = useCallback(
    (taskId: string, itemId: string, targetSectionId?: string, targetIndex?: number) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          const item = t.items.find((i) => i.id === itemId);
          if (!item) return t;

          const remaining = t.items.filter((i) => i.id !== itemId);
          const updatedItem = { ...item, sectionId: targetSectionId };

          if (typeof targetIndex === 'number' && targetIndex >= 0) {
            remaining.splice(targetIndex, 0, updatedItem);
            return { ...t, items: remaining, updatedAt: Date.now() };
          }

          return { ...t, items: [...remaining, updatedItem], updatedAt: Date.now() };
        })
      );
    },
    []
  );

  // Clear all change items for a task
  const clearTaskItems = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, items: [], updatedAt: Date.now() } : t))
    );
  }, []);

  // Export all tasks to JSON format
  const exportAllTasksJSON = useCallback(() => {
    const payload = {
      version: '1.0',
      type: 'gd_implementation_backup',
      exportedAt: Date.now(),
      exportDate: new Date().toISOString(),
      totalTasks: tasks.length,
      tasks: tasks.map(normalizeTask),
    };
    return JSON.stringify(payload, null, 2);
  }, [tasks]);

  // Export a single task to JSON format
  const exportTaskJSON = useCallback(
    (taskId: string) => {
      const t = tasks.find((item) => item.id === taskId) || activeTask;
      if (!t) return '{}';
      const payload = {
        version: '1.0',
        type: 'gd_single_task_backup',
        exportedAt: Date.now(),
        exportDate: new Date().toISOString(),
        task: normalizeTask(t),
      };
      return JSON.stringify(payload, null, 2);
    },
    [tasks, activeTask]
  );

  // Import tasks with options
  const importTasks = useCallback(
    (
      importedTasks: ImplementationTask[],
      mode: 'merge' | 'replace' | 'update_active',
      targetTaskId?: string
    ): { success: boolean; count: number; error?: string } => {
      if (!importedTasks || importedTasks.length === 0) {
        return { success: false, count: 0, error: 'Нет задач для импорта' };
      }

      try {
        if (mode === 'replace') {
          const fresh = importedTasks.map((t) =>
            normalizeTask({ ...t, id: t.id || crypto.randomUUID() })
          );
          setTasks(fresh);
          if (fresh[0]) {
            setActiveTaskId(fresh[0].id);
          }
          return { success: true, count: fresh.length };
        }

        if (mode === 'update_active') {
          const taskToApply = importedTasks[0];
          const targetId = targetTaskId || activeTaskId;
          if (!targetId || !taskToApply) {
            return { success: false, count: 0, error: 'Не указана целевая задача' };
          }

          setTasks((prev) =>
            prev.map((t) => {
              if (t.id !== targetId) return t;
              return normalizeTask({
                ...taskToApply,
                id: targetId, // preserve original task ID
                updatedAt: Date.now(),
              });
            })
          );
          return { success: true, count: 1 };
        }

        // Default: 'merge' (append, avoiding ID conflicts)
        const existingIds = new Set(tasks.map((t) => t.id));
        const newTasks = importedTasks.map((t) => {
          const finalId = existingIds.has(t.id) ? crypto.randomUUID() : t.id;
          existingIds.add(finalId);
          return normalizeTask({
            ...t,
            id: finalId,
            updatedAt: Date.now(),
          });
        });

        setTasks((prev) => [...newTasks, ...prev]);

        if (newTasks[0]) {
          setActiveTaskId(newTasks[0].id);
        }

        return { success: true, count: newTasks.length };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Ошибка импорта';
        return { success: false, count: 0, error: msg };
      }
    },
    [tasks, activeTaskId]
  );

  return {
    tasks,
    activeTask,
    activeTaskId,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    selectTask,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    addChangeItem,
    updateChangeItem,
    deleteChangeItem,
    reorderChangeItems,
    moveChangeItem,
    clearTaskItems,
    exportAllTasksJSON,
    exportTaskJSON,
    importTasks,
  };
}

/**
 * Utility to parse, validate and normalize tasks from JSON import string
 */
export function parseTasksFromImport(jsonString: string): {
  valid: boolean;
  tasks: ImplementationTask[];
  error?: string;
  sourceType?: 'backup' | 'array' | 'single';
} {
  try {
    const trimmed = jsonString.trim();
    if (!trimmed) {
      return { valid: false, tasks: [], error: 'Введен пустой текст' };
    }

    const parsed = JSON.parse(trimmed);
    let rawTasks: unknown[] = [];
    let sourceType: 'backup' | 'array' | 'single' = 'backup';

    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed)) {
        rawTasks = parsed;
        sourceType = 'array';
      } else if ('tasks' in parsed && Array.isArray((parsed as { tasks: unknown[] }).tasks)) {
        rawTasks = (parsed as { tasks: unknown[] }).tasks;
        sourceType = 'backup';
      } else if ('task' in parsed && typeof (parsed as { task: unknown }).task === 'object') {
        rawTasks = [(parsed as { task: unknown }).task];
        sourceType = 'single';
      } else if ('taskNumber' in parsed || 'title' in parsed || 'items' in parsed) {
        // Single task object
        rawTasks = [parsed];
        sourceType = 'single';
      } else {
        return { valid: false, tasks: [], error: 'Не найдены задачи в структуре JSON' };
      }
    } else {
      return { valid: false, tasks: [], error: 'Некорректный JSON формат' };
    }

    if (rawTasks.length === 0) {
      return { valid: false, tasks: [], error: 'Список задач пуст' };
    }

    const normalized: ImplementationTask[] = rawTasks.map((raw: unknown, idx: number) => {
      const t = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
      const taskNumber = String(t.taskNumber || `TASK-${idx + 1}`).trim();
      const title = String(t.title || 'Импортированная задача').trim();
      const summary = String(t.summary || '').trim();
      const id = typeof t.id === 'string' && t.id.length > 0 ? t.id : crypto.randomUUID();

      let sections: ImplementationSection[] = DEFAULT_IMPLEMENTATION_SECTIONS.map((s, sIdx) => ({
        ...s,
        order: sIdx,
      }));
      if (Array.isArray(t.sections) && t.sections.length > 0) {
        sections = t.sections.map((sRaw: unknown, sIdx: number) => {
          const s = (sRaw && typeof sRaw === 'object' ? sRaw : {}) as Record<string, unknown>;
          return {
            id: String(s.id || `sec-${sIdx}`),
            name: String(s.name || `Раздел ${sIdx + 1}`),
            order: typeof s.order === 'number' ? s.order : sIdx,
          };
        });
      }

      let items: ImplementationChangeItem[] = [];
      if (Array.isArray(t.items)) {
        items = t.items.map((itRaw: unknown, itIdx: number) => {
          const it = (itRaw && typeof itRaw === 'object' ? itRaw : {}) as Record<string, unknown>;
          return {
            id: String(it.id || `item-${Date.now()}-${itIdx}`),
            sectionId: it.sectionId ? String(it.sectionId) : undefined,
            description: String(it.description || '').trim(),
            linkTitle: it.linkTitle ? String(it.linkTitle).trim() : undefined,
            linkUrl: it.linkUrl ? String(it.linkUrl).trim() : undefined,
          };
        });
      }

      const task: ImplementationTask = {
        id,
        taskNumber,
        releaseNumber: typeof t.releaseNumber === 'string' ? t.releaseNumber.trim() : '',
        title,
        summary,
        sections,
        items,
        createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
        updatedAt: Date.now(),
      };

      return normalizeTask(task);
    });

    return {
      valid: true,
      tasks: normalized,
      sourceType,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Некорректный синтаксис';
    return {
      valid: false,
      tasks: [],
      error: `Ошибка парсинга JSON: ${msg}`,
    };
  }
}
