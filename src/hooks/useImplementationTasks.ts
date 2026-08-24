import { useState, useEffect, useCallback, useMemo } from 'react';
import { ImplementationTask, ImplementationChangeItem, ImplementationSection } from '../types';
import { DEFAULT_IMPLEMENTATION_SECTIONS } from '../utils/tabUtils';

const STORAGE_KEY_TASKS = 'gd-helper-implementation-tasks';
const STORAGE_KEY_ACTIVE_TASK = 'gd-helper-implementation-active-task-id';

function normalizeTask(task: ImplementationTask): ImplementationTask {
  return {
    ...task,
    sections:
      task.sections && task.sections.length > 0
        ? task.sections
        : DEFAULT_IMPLEMENTATION_SECTIONS.map((s, idx) => ({ ...s, order: idx })),
    items: task.items || [],
  };
}

const INITIAL_TASK: ImplementationTask = {
  id: 'task-welcome-1',
  taskNumber: 'TASK-101',
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

  const addSection = useCallback((taskId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentSections = t.sections || DEFAULT_IMPLEMENTATION_SECTIONS;
        const newSec: ImplementationSection = {
          id: `sec-${crypto.randomUUID().slice(0, 8)}`,
          name: trimmed,
          order: currentSections.length,
        };
        return {
          ...t,
          sections: [...currentSections, newSec],
          updatedAt: Date.now(),
        };
      })
    );
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
  };
}
