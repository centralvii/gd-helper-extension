import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  FileRow,
  VariableDefinition,
  TemplatePreset,
  StoredAppState,
  BuildPackage,
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
} from '../utils/indexedDB';

const PRESETS_STORAGE_KEY = 'gd-helper-template-presets';
const PRIMARY_TEMPLATE_KEY = 'gd-helper-primary-template';
const ACTIVE_PACKAGE_KEY = 'gd-helper-active-package-id';

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

const createDefaultPackage = (name: string = 'Пакет 1', tpl: string = DEFAULT_TEMPLATE): BuildPackage => ({
  id: crypto.randomUUID(),
  name,
  files: [],
  template: tpl,
  startNumber: 1,
  archiveName: 'renamed_files.zip',
  readmeContent: '',
  variableValues: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

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

  const [variables, setVariables] = useState<VariableDefinition[]>(DEFAULT_VARIABLES);
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

  const [packages, setPackages] = useState<BuildPackage[]>([createDefaultPackage('Пакет 1', primaryTemplate)]);
  const [activePackageId, setActivePackageId] = useState<string>(packages[0].id);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const isInitialLoadedRef = useRef<boolean>(false);

  // Active package computation
  const activePackage = useMemo(() => {
    return packages.find((p) => p.id === activePackageId) || packages[0];
  }, [packages, activePackageId]);

  const files = activePackage.files;
  const template = activePackage.template;
  const startNumber = activePackage.startNumber;
  const archiveName = activePackage.archiveName;
  const readmeContent = activePackage.readmeContent;
  const variableValues = activePackage.variableValues;

  // Load state on mount from IndexedDB
  useEffect(() => {
    async function initFromStorage() {
      try {
        const { state, blobs } = await loadAppStateFromDB();
        if (state) {
          if (state.variables && state.variables.length > 0) {
            setVariables(state.variables);
          }

          if (state.packages && state.packages.length > 0) {
            const restoredPackages: BuildPackage[] = state.packages.map((pkgMeta) => {
              const restoredFiles: FileRow[] = pkgMeta.filesMeta.map((meta) => {
                const blob = blobs.get(meta.id) || new Blob();
                return {
                  ...meta,
                  file: blob,
                };
              });

              const tpl = pkgMeta.template || primaryTemplate;
              const calculatedFiles = recalculateAllNames(
                restoredFiles,
                tpl,
                pkgMeta.startNumber || 1,
                pkgMeta.variableValues || {}
              );

              return {
                id: pkgMeta.id,
                name: pkgMeta.name || 'Пакет',
                files: calculatedFiles,
                template: tpl,
                startNumber: pkgMeta.startNumber || 1,
                archiveName: pkgMeta.archiveName || 'renamed_files.zip',
                readmeContent: pkgMeta.readmeContent || '',
                variableValues: pkgMeta.variableValues || {},
                createdAt: pkgMeta.createdAt || Date.now(),
                updatedAt: pkgMeta.updatedAt || Date.now(),
              };
            });

            setPackages(restoredPackages);

            const savedActiveId = localStorage.getItem(ACTIVE_PACKAGE_KEY);
            if (savedActiveId && restoredPackages.some((p) => p.id === savedActiveId)) {
              setActivePackageId(savedActiveId);
            } else if (state.activePackageId && restoredPackages.some((p) => p.id === state.activePackageId)) {
              setActivePackageId(state.activePackageId);
            } else {
              setActivePackageId(restoredPackages[0].id);
            }
          } else if (state.filesMeta && state.filesMeta.length > 0) {
            // Legacy single-package migration
            const restoredFiles: FileRow[] = state.filesMeta.map((meta) => {
              const blob = blobs.get(meta.id) || new Blob();
              return {
                ...meta,
                file: blob,
              };
            });

            const tpl = state.template || primaryTemplate;
            const calculated = recalculateAllNames(
              restoredFiles,
              tpl,
              state.startNumber || 1,
              state.variableValues || {}
            );

            const singlePkg: BuildPackage = {
              id: crypto.randomUUID(),
              name: 'Пакет 1',
              files: calculated,
              template: tpl,
              startNumber: state.startNumber || 1,
              archiveName: state.archiveName || 'renamed_files.zip',
              readmeContent: state.readmeContent || '',
              variableValues: state.variableValues || {},
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            setPackages([singlePkg]);
            setActivePackageId(singlePkg.id);
          }
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

  // Save activePackageId to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_PACKAGE_KEY, activePackageId);
    } catch {
      // ignore
    }
  }, [activePackageId]);

  // Debounced auto-save all packages to IndexedDB (300ms)
  useEffect(() => {
    if (!isInitialLoadedRef.current || isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      const blobsMap = new Map<string, Blob | File>();

      const packagesMeta = packages.map((pkg) => {
        pkg.files.forEach((f) => blobsMap.set(f.id, f.file));
        const filesMeta = pkg.files.map(({ file: _, ...meta }) => meta);
        return {
          id: pkg.id,
          name: pkg.name,
          filesMeta,
          template: pkg.template,
          startNumber: pkg.startNumber,
          archiveName: pkg.archiveName,
          readmeContent: pkg.readmeContent,
          variableValues: pkg.variableValues,
          createdAt: pkg.createdAt,
          updatedAt: pkg.updatedAt,
        };
      });

      const state: StoredAppState = {
        packages: packagesMeta,
        activePackageId,
        primaryTemplate,
        variables,
        updatedAt: Date.now(),
      };

      saveAppStateToDB(state, blobsMap);
    }, 300);

    return () => clearTimeout(timer);
  }, [packages, activePackageId, primaryTemplate, variables, isLoading]);

  // Validation for active package
  const validation = useMemo(() => {
    return validateFiles(files);
  }, [files]);

  // Package Management Actions
  const createPackage = useCallback(
    (name?: string) => {
      const pkgName = name?.trim() || `Пакет ${packages.length + 1}`;
      const newPkg = createDefaultPackage(pkgName, primaryTemplate);
      setPackages((prev) => [...prev, newPkg]);
      setActivePackageId(newPkg.id);
      return newPkg.id;
    },
    [packages.length, primaryTemplate]
  );

  const selectPackage = useCallback((id: string) => {
    setActivePackageId(id);
  }, []);

  const renamePackage = useCallback((id: string, newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: clean, updatedAt: Date.now() } : p))
    );
  }, []);

  const duplicatePackage = useCallback((id: string) => {
    setPackages((prev) => {
      const source = prev.find((p) => p.id === id);
      if (!source) return prev;

      const duplicatedFiles: FileRow[] = source.files.map((f) => ({
        ...f,
        id: crypto.randomUUID(),
      }));

      const newPkg: BuildPackage = {
        ...source,
        id: crypto.randomUUID(),
        name: `${source.name} (копия)`,
        files: duplicatedFiles,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const idx = prev.findIndex((p) => p.id === id);
      const updated = [...prev];
      updated.splice(idx + 1, 0, newPkg);
      setActivePackageId(newPkg.id);
      return updated;
    });
  }, []);

  const deletePackage = useCallback(
    (id: string) => {
      setPackages((prev) => {
        const filtered = prev.filter((p) => p.id !== id);
        if (filtered.length === 0) {
          const fresh = createDefaultPackage('Пакет 1', primaryTemplate);
          setActivePackageId(fresh.id);
          return [fresh];
        }
        if (activePackageId === id) {
          setActivePackageId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activePackageId, primaryTemplate]
  );

  // Helper to update active package
  const updateActivePackage = useCallback(
    (updater: (prevPkg: BuildPackage) => BuildPackage) => {
      setPackages((prev) =>
        prev.map((p) => {
          if (p.id !== activePackageId) return p;
          const updated = updater(p);
          return { ...updated, updatedAt: Date.now() };
        })
      );
    },
    [activePackageId]
  );

  // Template and StartNumber actions on active package
  const setTemplate = useCallback(
    (newTemplate: string) => {
      updateActivePackage((pkg) => ({
        ...pkg,
        template: newTemplate,
        files: recalculateAllNames(pkg.files, newTemplate, pkg.startNumber, pkg.variableValues),
      }));
    },
    [updateActivePackage]
  );

  const setPrimaryTemplate = useCallback((newPrimaryTpl: string) => {
    setPrimaryTemplateState(newPrimaryTpl);
    try {
      localStorage.setItem(PRIMARY_TEMPLATE_KEY, newPrimaryTpl);
    } catch {
      // ignore
    }
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
      updateActivePackage((pkg) => ({
        ...pkg,
        startNumber: validNum,
        files: recalculateAllNames(pkg.files, pkg.template, validNum, pkg.variableValues),
      }));
    },
    [updateActivePackage]
  );

  const setArchiveName = useCallback(
    (name: string) => {
      updateActivePackage((pkg) => ({ ...pkg, archiveName: name }));
    },
    [updateActivePackage]
  );

  const setReadmeContent = useCallback(
    (content: string) => {
      updateActivePackage((pkg) => ({ ...pkg, readmeContent: content }));
    },
    [updateActivePackage]
  );

  const setVariableValue = useCallback(
    (key: string, value: string) => {
      updateActivePackage((pkg) => {
        const updatedValues = { ...pkg.variableValues, [key]: value };
        return {
          ...pkg,
          variableValues: updatedValues,
          files: recalculateAllNames(pkg.files, pkg.template, pkg.startNumber, updatedValues),
        };
      });
    },
    [updateActivePackage]
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
      updateActivePackage((pkg) => {
        const newVals = { ...pkg.variableValues };
        delete newVals[key];
        return {
          ...pkg,
          variableValues: newVals,
          files: recalculateAllNames(pkg.files, pkg.template, pkg.startNumber, newVals),
        };
      });
    },
    [updateActivePackage]
  );

  const applyMassVariables = useCallback(
    (values: Record<string, string>) => {
      updateActivePackage((pkg) => {
        const merged = { ...pkg.variableValues, ...values };
        return {
          ...pkg,
          variableValues: merged,
          files: recalculateAllNames(pkg.files, pkg.template, pkg.startNumber, merged),
        };
      });
    },
    [updateActivePackage]
  );

  // File loading actions
  const loadZip = useCallback(
    async (file: File) => {
      setIsLoading(true);
      try {
        const result = await extractZip(file, file.name);
        updateActivePackage((pkg) => {
          const calculated = recalculateAllNames(result.files, pkg.template, pkg.startNumber, pkg.variableValues);
          return {
            ...pkg,
            files: calculated,
            archiveName: result.archiveName || pkg.archiveName,
          };
        });
      } catch (err) {
        console.error('Failed to extract ZIP:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [updateActivePackage]
  );

  const loadGufFiles = useCallback(
    (gufFiles: File[]) => {
      updateActivePackage((pkg) => {
        const newRows = gufFilesToRows(gufFiles, pkg.startNumber);
        const calculated = recalculateAllNames(newRows, pkg.template, pkg.startNumber, pkg.variableValues);
        return {
          ...pkg,
          files: calculated,
          archiveName: gufFiles.length > 0 ? 'renamed_guf_files.zip' : pkg.archiveName,
        };
      });
    },
    [updateActivePackage]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles = newFiles.filter((f) => f.name.toLowerCase().endsWith('.guf'));
      if (validFiles.length === 0) return;

      updateActivePackage((pkg) => {
        const newRows = gufFilesToRows(validFiles, pkg.startNumber + pkg.files.length);
        const combined = [...pkg.files, ...newRows];
        const calculated = recalculateAllNames(combined, pkg.template, pkg.startNumber, pkg.variableValues);
        return {
          ...pkg,
          files: calculated,
        };
      });
    },
    [updateActivePackage]
  );

  const updateFileCleanName = useCallback(
    (id: string, cleanName: string) => {
      updateActivePackage((pkg) => ({
        ...pkg,
        files: pkg.files.map((f) => {
          if (f.id !== id) return f;
          const updated = { ...f, cleanName };
          return {
            ...updated,
            newName: applyTemplate(pkg.template, updated, pkg.variableValues),
          };
        }),
      }));
    },
    [updateActivePackage]
  );

  const updateFileDescription = useCallback(
    (id: string, description: string) => {
      updateActivePackage((pkg) => ({
        ...pkg,
        files: pkg.files.map((f) => (f.id === id ? { ...f, description } : f)),
      }));
    },
    [updateActivePackage]
  );

  const updateFileVariable = useCallback(
    (id: string, key: string, value: string) => {
      updateActivePackage((pkg) => ({
        ...pkg,
        files: pkg.files.map((f) => {
          if (f.id !== id) return f;
          const updatedVars = { ...(f.variables || {}), [key]: value };
          const updated = { ...f, variables: updatedVars };
          return {
            ...updated,
            newName: applyTemplate(pkg.template, updated, pkg.variableValues),
          };
        }),
      }));
    },
    [updateActivePackage]
  );

  const reorderFiles = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      updateActivePackage((pkg) => {
        const result = Array.from(pkg.files);
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);
        return {
          ...pkg,
          files: recalculateAllNames(result, pkg.template, pkg.startNumber, pkg.variableValues),
        };
      });
    },
    [updateActivePackage]
  );

  const removeFile = useCallback(
    (id: string) => {
      updateActivePackage((pkg) => {
        const filtered = pkg.files.filter((f) => f.id !== id);
        return {
          ...pkg,
          files: recalculateAllNames(filtered, pkg.template, pkg.startNumber, pkg.variableValues),
        };
      });
    },
    [updateActivePackage]
  );

  const removeFiles = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      updateActivePackage((pkg) => {
        const filtered = pkg.files.filter((f) => !idSet.has(f.id));
        return {
          ...pkg,
          files: recalculateAllNames(filtered, pkg.template, pkg.startNumber, pkg.variableValues),
        };
      });
    },
    [updateActivePackage]
  );

  const clearFiles = useCallback(async () => {
    updateActivePackage((pkg) => ({
      ...pkg,
      files: [],
      readmeContent: '',
      variableValues: {},
      archiveName: 'renamed_files.zip',
    }));
  }, [updateActivePackage]);

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
      updateActivePackage((pkg) => {
        const targetStartNumber = preset.startNumber !== undefined ? preset.startNumber : pkg.startNumber;
        const targetVars = preset.variables || pkg.variableValues;
        return {
          ...pkg,
          template: preset.template,
          startNumber: targetStartNumber,
          variableValues: targetVars,
          files: recalculateAllNames(pkg.files, preset.template, targetStartNumber, targetVars),
        };
      });
    },
    [updateActivePackage]
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
    packages,
    activePackage,
    activePackageId,
    createPackage,
    selectPackage,
    renamePackage,
    duplicatePackage,
    deletePackage,
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
