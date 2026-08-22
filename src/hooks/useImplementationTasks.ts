import { useState, useEffect, useCallback, useMemo } from 'react';
import { ImplementationTask, ImplementationChangeItem } from '../types';

const STORAGE_KEY_TASKS = 'gd-helper-implementation-tasks';
const STORAGE_KEY_ACTIVE_TASK = 'gd-helper-implementation-active-task-id';

const INITIAL_TASK: ImplementationTask = {
  id: 'task-welcome-1',
  taskNumber: 'TASK-101',
  title: 'Пример описания реализации задачи',
  summary: 'В рамках задачи доработана логика валидации и обновлены сопутствующие алгоритмы.',
  items: [
    {
      id: 'change-item-1',
      description: 'Изменен алгоритм, добавили цикл по участникам проверки, проверяем статус согласования',
      linkTitle: 'Алгоритм. Обработка данных',
      linkUrl: 'https://greendata.example.com/algorithm/42',
    },
    {
      id: 'change-item-2',
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
          return parsed;
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
    return tasks.find((t) => t.id === activeTaskId) || tasks[0] || null;
  }, [tasks, activeTaskId]);

  // Create new task
  const createTask = useCallback((taskNumber: string = '', title: string = '') => {
    const newTask: ImplementationTask = {
      id: crypto.randomUUID(),
      taskNumber: taskNumber.trim() || `TASK-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim() || 'Новая задача',
      summary: '',
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
        prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t))
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

  // Add change item to task
  const addChangeItem = useCallback(
    (taskId: string, item: Omit<ImplementationChangeItem, 'id'>) => {
      const newItem: ImplementationChangeItem = {
        id: crypto.randomUUID(),
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

  // Reorder change items
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
    addChangeItem,
    updateChangeItem,
    deleteChangeItem,
    reorderChangeItems,
    clearTaskItems,
  };
}
