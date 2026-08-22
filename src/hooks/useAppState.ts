import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  FileRow,
  VariableDefinition,
  TemplatePreset,
  StoredAppState,
} from '../types';
import {
  applyTemplate,
  recalculateAllNames,
  DEFAULT_TEMPLATE,
} from '../core/templateEngine';
import { validateFiles } from '../core/validation';
import { extractZip, gufFilesToRows, generateZip } from '../core/zipHandler';
import {
  saveAppStateToDB,
  loadAppStateFromDB,
  clearAppStateDB,
} from '../utils/indexedDB';

const PRESETS_STORAGE_KEY = 'gd-helper-template-presets';
const PRIMARY_TEMPLATE_KEY = 'gd-helper-primary-template';

const DEFAULT_VARIABLES: VariableDefinition[] = [
  { key: 'type', label: 'Тип (ДО/ПОСЛЕ)' },
  { key: 'module', label: 'Модуль' },
  { key: 'task', label: 'Задача' },
];

const DEFAULT_PRESETS: TemplatePreset[] = [
  {
    id: 'gd-task-release',
    name: 'GreenData Релиз ({indexPad6}_{type}_{module}_{task}_{cleanName})',
    template: '{indexPad6}_{type}_{module}_{task}_{cleanName}',
    isDefault: true,
    isPrimary: true,
  },
  {
    id: 'standard-pad6',
    name: 'Стандартный (000001_Имя)',
    template: '{indexPad6}_{cleanName}',
    isDefault: true,
  },
  {
    id: 'with-date',
    name: 'С датой (000001_2026-04-17_Имя)',
    template: '{indexPad6}_{date}_{cleanName}',
    isDefault: true,
  },
  {
    id: 'with-module-only',
    name: 'С модулем (000001_{module}_{cleanName})',
    template: '{indexPad6}_{module}_{cleanName}',
    isDefault: true,
  },
  {
    id: 'index-only',
    name: 'Простая нумерация (1_Имя)',
    template: '{index}_{cleanName}',
    isDefault: true,
  },
];

export function useAppState() {
  const [primaryTemplate, setPrimaryTemplateState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(PRIMARY_TEMPLATE_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return DEFAULT_TEMPLATE;
  });

  const [template, setTemplateState] = useState<string>(primaryTemplate);
  const [startNumber, setStartNumberState] = useState<number>(1);
  const [archiveName, setArchiveName] = useState<string>('renamed_files.zip');
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [variables, setVariables] = useState<VariableDefinition[]>(DEFAULT_VARIABLES);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [presets, setPresets] = useState<TemplatePreset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_PRESETS;
  });

  const [files, setFiles] = useState<FileRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const isInitialLoadedRef = useRef<boolean>(false);

  // Load state on mount from IndexedDB
  useEffect(() => {
    async function initFromStorage() {
      try {
        const { state, blobs } = await loadAppStateFromDB();
        if (state && state.filesMeta.length > 0) {
          const restoredFiles: FileRow[] = state.filesMeta.map((meta) => {
            const blob = blobs.get(meta.id) || new Blob();
            return {
              ...meta,
              file: blob,
            };
          });

          const activeTpl = state.template || primaryTemplate;
          setTemplateState(activeTpl);
          setStartNumberState(state.startNumber || 1);
          setArchiveName(state.archiveName || 'renamed_files.zip');
          setReadmeContent(state.readmeContent || '');
          if (state.variables && state.variables.length > 0) {
            setVariables(state.variables);
          }
          if (state.variableValues) {
            setVariableValues(state.variableValues);
          }

          // Recalculate names to ensure freshness
          const calculated = recalculateAllNames(
            restoredFiles,
            activeTpl,
            state.startNumber || 1,
            state.variableValues || {}
          );
          setFiles(calculated);
        } else {
          // If no saved state, use primary template
          setTemplateState(primaryTemplate);
        }
      } catch (err) {
        console.error('Failed to initialize app state:', err);
      } finally {
        setIsLoading(false);
        isInitialLoadedRef.current = true;
      }
    }

    initFromStorage();
  }, [primaryTemplate]);

  // Save presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch {
      // ignore
    }
  }, [presets]);

  // Debounced auto-save to IndexedDB (300ms)
  useEffect(() => {
    if (!isInitialLoadedRef.current || isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      const filesMeta = files.map(({ file: _, ...meta }) => meta);
      const blobsMap = new Map<string, Blob | File>();
      files.forEach((f) => blobsMap.set(f.id, f.file));

      const state: StoredAppState = {
        filesMeta,
        template,
        primaryTemplate,
        startNumber,
        archiveName,
        readmeContent,
        variables,
        variableValues,
        updatedAt: Date.now(),
      };

      saveAppStateToDB(state, blobsMap);
    }, 300);

    return () => clearTimeout(timer);
  }, [files, template, primaryTemplate, startNumber, archiveName, readmeContent, variables, variableValues, isLoading]);

  // Validation
  const validation = useMemo(() => {
    return validateFiles(files);
  }, [files]);

  // Public Actions
  const setTemplate = useCallback(
    (newTemplate: string) => {
      setTemplateState(newTemplate);
      setFiles((prev) => recalculateAllNames(prev, newTemplate, startNumber, variableValues));
    },
    [startNumber, variableValues]
  );

  const setPrimaryTemplate = useCallback((newPrimaryTpl: string) => {
    setPrimaryTemplateState(newPrimaryTpl);
    try {
      localStorage.setItem(PRIMARY_TEMPLATE_KEY, newPrimaryTpl);
    } catch {
      // ignore
    }
    // Update presets primary flag
    setPresets((prev) =>
      prev.map((p) => ({
        ...p,
        isPrimary: p.template === newPrimaryTpl,
      }))
    );
  }, []);

  const resetTemplate = useCallback(() => {
    setTemplate(primaryTemplate);
  }, [setTemplate, primaryTemplate]);

  const setStartNumber = useCallback(
    (num: number) => {
      const validNum = Math.max(1, isNaN(num) ? 1 : num);
      setStartNumberState(validNum);
      setFiles((prev) => recalculateAllNames(prev, template, validNum, variableValues));
    },
    [template, variableValues]
  );

  const setVariableValue = useCallback(
    (key: string, value: string) => {
      const updatedValues = { ...variableValues, [key]: value };
      setVariableValues(updatedValues);
      setFiles((prev) => recalculateAllNames(prev, template, startNumber, updatedValues));
    },
    [template, startNumber, variableValues]
  );

  const addVariable = useCallback((key: string, label?: string) => {
    const cleanKey = key.trim().replace(/[{}]/g, '');
    if (!cleanKey) return;

    setVariables((prev) => {
      if (prev.some((v) => v.key === cleanKey)) return prev;
      return [...prev, { key: cleanKey, label: label || cleanKey }];
    });
  }, []);

  const removeVariable = useCallback(
    (key: string) => {
      setVariables((prev) => prev.filter((v) => v.key !== key));
      const newVals = { ...variableValues };
      delete newVals[key];
      setVariableValues(newVals);
      setFiles((prev) => recalculateAllNames(prev, template, startNumber, newVals));
    },
    [template, startNumber, variableValues]
  );

  const applyMassVariables = useCallback(
    (values: Record<string, string>) => {
      const merged = { ...variableValues, ...values };
      setVariableValues(merged);
      setFiles((prev) => recalculateAllNames(prev, template, startNumber, merged));
    },
    [template, startNumber, variableValues]
  );

  const loadZip = useCallback(
    async (file: File) => {
      setIsLoading(true);
      try {
        const result = await extractZip(file, file.name);
        const calculated = recalculateAllNames(result.files, template, startNumber, variableValues);
        setFiles(calculated);
        if (result.archiveName) {
          setArchiveName(result.archiveName);
        }
      } catch (err) {
        console.error('Failed to extract ZIP:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [template, startNumber, variableValues]
  );

  const loadGufFiles = useCallback(
    (gufFiles: File[]) => {
      const newRows = gufFilesToRows(gufFiles, startNumber);
      const calculated = recalculateAllNames(newRows, template, startNumber, variableValues);
      setFiles(calculated);
      if (gufFiles.length > 0) {
        setArchiveName('renamed_guf_files.zip');
      }
    },
    [template, startNumber, variableValues]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles = newFiles.filter((f) => f.name.toLowerCase().endsWith('.guf'));
      if (validFiles.length === 0) return;

      const newRows = gufFilesToRows(validFiles, startNumber + files.length);
      const combined = [...files, ...newRows];
      const calculated = recalculateAllNames(combined, template, startNumber, variableValues);
      setFiles(calculated);
    },
    [files, template, startNumber, variableValues]
  );

  const updateFileCleanName = useCallback(
    (id: string, cleanName: string) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          const updated = { ...f, cleanName };
          return {
            ...updated,
            newName: applyTemplate(template, updated, variableValues),
          };
        })
      );
    },
    [template, variableValues]
  );

  const updateFileDescription = useCallback((id: string, description: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, description } : f))
    );
  }, []);

  const updateFileVariable = useCallback(
    (id: string, key: string, value: string) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          const updatedVars = { ...(f.variables || {}), [key]: value };
          const updated = { ...f, variables: updatedVars };
          return {
            ...updated,
            newName: applyTemplate(template, updated, variableValues),
          };
        })
      );
    },
    [template, variableValues]
  );

  const reorderFiles = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      setFiles((prev) => {
        const result = Array.from(prev);
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);
        return recalculateAllNames(result, template, startNumber, variableValues);
      });
    },
    [template, startNumber, variableValues]
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const filtered = prev.filter((f) => f.id !== id);
        return recalculateAllNames(filtered, template, startNumber, variableValues);
      });
    },
    [template, startNumber, variableValues]
  );

  const removeFiles = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      setFiles((prev) => {
        const filtered = prev.filter((f) => !idSet.has(f.id));
        return recalculateAllNames(filtered, template, startNumber, variableValues);
      });
    },
    [template, startNumber, variableValues]
  );

  const clearFiles = useCallback(async () => {
    setFiles([]);
    setReadmeContent('');
    setVariableValues({});
    setArchiveName('renamed_files.zip');
    await clearAppStateDB();
  }, []);

  const savePreset = useCallback(
    (name: string, isPrimary: boolean = false) => {
      const newPreset: TemplatePreset = {
        id: crypto.randomUUID(),
        name,
        template,
        startNumber,
        variables: variableValues,
        isPrimary,
        createdAt: Date.now(),
      };
      if (isPrimary) {
        setPrimaryTemplate(template);
      }
      setPresets((prev) => [
        ...prev.map((p) => (isPrimary ? { ...p, isPrimary: false } : p)),
        newPreset,
      ]);
    },
    [template, startNumber, variableValues, setPrimaryTemplate]
  );

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setPresetAsPrimary = useCallback(
    (id: string) => {
      const targetPreset = presets.find((p) => p.id === id);
      if (!targetPreset) return;

      setPrimaryTemplate(targetPreset.template);
      setPresets((prev) =>
        prev.map((p) => ({
          ...p,
          isPrimary: p.id === id,
        }))
      );
    },
    [presets, setPrimaryTemplate]
  );

  const loadPreset = useCallback(
    (preset: TemplatePreset) => {
      setTemplateState(preset.template);
      if (preset.startNumber !== undefined) {
        setStartNumberState(preset.startNumber);
      }
      if (preset.variables) {
        setVariableValues(preset.variables);
      }
      setFiles((prev) =>
        recalculateAllNames(
          prev,
          preset.template,
          preset.startNumber ?? startNumber,
          preset.variables || variableValues
        )
      );
    },
    [startNumber, variableValues]
  );

  const exportZip = useCallback(async () => {
    if (validation.hasErrors || files.length === 0) {
      return;
    }
    setIsExporting(true);
    try {
      await generateZip(files, template, readmeContent, archiveName, variableValues);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, [validation.hasErrors, files, template, readmeContent, archiveName, variableValues]);

  return {
    files,
    template,
    primaryTemplate,
    startNumber,
    archiveName,
    readmeContent,
    variables,
    variableValues,
    presets,
    isLoading,
    isExporting,
    validation,
    setTemplate,
    setPrimaryTemplate,
    resetTemplate,
    setStartNumber,
    setArchiveName,
    setReadmeContent,
    setVariableValue,
    addVariable,
    removeVariable,
    applyMassVariables,
    loadZip,
    loadGufFiles,
    addFiles,
    updateFileCleanName,
    updateFileDescription,
    updateFileVariable,
    reorderFiles,
    removeFile,
    removeFiles,
    clearFiles,
    savePreset,
    deletePreset,
    setPresetAsPrimary,
    loadPreset,
    exportZip,
  };
}
