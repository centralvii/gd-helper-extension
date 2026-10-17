import React, { useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Copy,
  Edit2,
  ChevronsUpDown,
  Check,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { BuildPackage, ImplementationTask } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { pluralizeRu, FILE_FORMS } from '../../utils/pluralize';

interface PackageSelectorProps {
  packages: BuildPackage[];
  activePackage: BuildPackage;
  tasks?: ImplementationTask[];
  onSelectPackage: (id: string) => void;
  onCreatePackage: (name?: string, taskId?: string) => void;
  onDuplicatePackage: (id: string) => void;
  onRenamePackage: (id: string, name: string, taskId?: string) => void;
  onDeletePackage: (id: string) => void;
  onNavigateToTask?: (taskId: string) => void;
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({
  packages,
  activePackage,
  tasks = [],
  onSelectPackage,
  onCreatePackage,
  onDuplicatePackage,
  onRenamePackage,
  onDeletePackage,
  onNavigateToTask,
}) => {
  const [isOpenList, setIsOpenList] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<BuildPackage | null>(null);

  // Edit / Rename Modal State
  const [packageToRename, setPackageToRename] = useState<BuildPackage | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [renameTaskId, setRenameTaskId] = useState('');

  // Create Package Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createPackageName, setCreatePackageName] = useState('');
  const [createPackageTaskId, setCreatePackageTaskId] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const activeLinkedTask = activePackage.taskId
    ? tasks.find((t) => t.id === activePackage.taskId)
    : null;

  const handleOpenRename = (pkg: BuildPackage) => {
    setPackageToRename(pkg);
    setRenameInputValue(pkg.name);
    setRenameTaskId(pkg.taskId || '');
  };

  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (packageToRename && renameInputValue.trim()) {
      onRenamePackage(packageToRename.id, renameInputValue.trim(), renameTaskId);
    }
    setPackageToRename(null);
  };

  const handleOpenCreateModal = () => {
    setCreatePackageName(`Пакет ${packages.length + 1}`);
    setCreatePackageTaskId('');
    setIsCreateModalOpen(true);
    setIsOpenList(false);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (createPackageName.trim()) {
      onCreatePackage(createPackageName.trim(), createPackageTaskId || undefined);
    }
    setIsCreateModalOpen(false);
  };

  const filteredPackages = packages.filter((pkg) => {
    const query = searchQuery.toLowerCase();
    const taskMatch = tasks.find((t) => t.id === pkg.taskId);
    return (
      pkg.name.toLowerCase().includes(query) ||
      (taskMatch && (taskMatch.taskNumber.toLowerCase().includes(query) || taskMatch.title.toLowerCase().includes(query)))
    );
  });

  return (
    <>
      {/* Строка группы: активный пакет (тап — меню пакетов) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpenList(!isOpenList)}
          className="gd-row gd-row--tap w-full text-left rounded-t-xl"
          title="Пакеты сборки"
        >
          <span className="gd-row-icon gd-row-icon--accent">
            <Package />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-[14px] font-semibold text-slate-900 truncate">
                {activePackage.name}
              </span>
              {activeLinkedTask && (
                <span
                  onClick={(e) => {
                    if (onNavigateToTask) {
                      e.stopPropagation();
                      onNavigateToTask(activeLinkedTask.id);
                    }
                  }}
                  title={`Привязан к задаче "${activeLinkedTask.taskNumber}: ${activeLinkedTask.title}". Нажмите для перехода.`}
                  className="inline-flex items-center gap-1 px-2 py-px rounded-full bg-gd-accent-light hover:bg-accent-500/20 text-gd-accent text-[11px] font-semibold transition-colors flex-shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <FileCode className="w-3 h-3" />
                  {activeLinkedTask.taskNumber}
                </span>
              )}
            </span>
            <span className="block text-[12px] text-gd-muted truncate">
              {activePackage.files.length} {pluralizeRu(activePackage.files.length, FILE_FORMS)}
              {packages.length > 1 ? ` · пакетов: ${packages.length}` : ''}
            </span>
          </span>
          <ChevronsUpDown
            className={`w-4 h-4 text-gd-faint flex-shrink-0 transition-transform duration-300 ${
              isOpenList ? 'rotate-180 text-gd-accent' : ''
            }`}
          />
        </button>

        {/* Меню пакетов */}
        {isOpenList && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpenList(false)} />
            <div className="gd-menu absolute top-full left-2 right-2 mt-1 z-50 overflow-hidden flex flex-col">
              {packages.length > 2 && (
                <div className="p-2 pb-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по названию или задаче"
                    className="gd-field"
                    autoFocus
                  />
                </div>
              )}

              <div className="px-3.5 pt-2.5 pb-1 gd-label">Пакеты сборки · {packages.length}</div>

              <div className="overflow-y-auto max-h-64 px-1.5 pb-1.5 gd-stagger">
                {filteredPackages.map((pkg) => {
                  const isActive = pkg.id === activePackage.id;
                  const linkedTask = pkg.taskId ? tasks.find((t) => t.id === pkg.taskId) : null;
                  return (
                    <div
                      key={pkg.id}
                      role="button"
                      onClick={() => {
                        onSelectPackage(pkg.id);
                        setIsOpenList(false);
                      }}
                      className="group/row flex items-center gap-2.5 px-2 py-2 rounded-[10px] cursor-pointer hover:bg-gd-fill-2"
                    >
                      <span className="w-5 flex justify-center flex-shrink-0">
                        {isActive && <Check className="w-4 h-4 text-gd-accent" strokeWidth={2.75} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[13.5px] truncate min-w-0 ${isActive ? 'font-semibold text-slate-900' : 'text-slate-900'}`}>
                            {pkg.name}
                          </span>
                          {linkedTask && (
                            <span className="px-1.5 py-px rounded-full bg-gd-fill text-slate-600 text-[10px] font-mono flex-shrink-0 whitespace-nowrap">
                              {linkedTask.taskNumber}
                            </span>
                          )}
                        </div>
                        <span className="block text-[11.5px] text-gd-muted truncate">
                          {pkg.files.length} {pluralizeRu(pkg.files.length, FILE_FORMS)}
                          {linkedTask ? ` · ${linkedTask.title}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            onDuplicatePackage(pkg.id);
                            setIsOpenList(false);
                          }}
                          title="Дублировать пакет"
                          className="icon-btn icon-btn--plain w-7 h-7"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenRename(pkg);
                            setIsOpenList(false);
                          }}
                          title="Редактировать параметры пакета"
                          className="icon-btn icon-btn--plain w-7 h-7"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {packages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPackageToDelete(pkg);
                              setIsOpenList(false);
                            }}
                            title="Удалить пакет"
                            className="icon-btn icon-btn--plain icon-btn--danger w-7 h-7"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2.5 px-3.5 py-2.5 border-t border-gd-border text-[13.5px] font-medium text-gd-accent hover:bg-gd-fill-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Новый пакет
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(packageToDelete)}
        onClose={() => setPackageToDelete(null)}
        title="Удалить пакет сборки?"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPackageToDelete(null)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                if (packageToDelete) {
                  onDeletePackage(packageToDelete.id);
                }
                setPackageToDelete(null);
              }}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-700">
          Вы уверены, что хотите удалить пакет сборки{' '}
          <strong className="text-slate-900">"{packageToDelete?.name}"</strong> (
          {packageToDelete?.files.length} файлов в очереди)?
        </p>
      </Modal>

      {/* Create Package Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать новый пакет сборки"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="emerald"
              size="sm"
              disabled={!createPackageName.trim()}
              onClick={handleConfirmCreate}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Создать
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Название пакета: <span className="text-rose-500">*</span>
            </label>
            <Input
              value={createPackageName}
              onChange={(e) => setCreatePackageName(e.target.value)}
              placeholder="Например: Релиз 2.4 - Модуль Заявки"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-accent-600" />
              <span>Привязать к задаче реализации (опционально):</span>
            </label>
            <Select
              value={createPackageTaskId}
              onChange={(val) => setCreatePackageTaskId(val)}
              options={[
                { value: '', label: '— Без привязки к задаче —' },
                ...tasks.map((t) => ({
                  value: t.id,
                  label: `${t.taskNumber}: ${t.title}`,
                })),
              ]}
              placeholder="— Без привязки к задаче —"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              💡 К одной задаче реализации можно привязать несколько разных пакетов обновлений
            </span>
          </div>
        </form>
      </Modal>

      {/* Edit / Rename Package Modal */}
      <Modal
        isOpen={Boolean(packageToRename)}
        onClose={() => setPackageToRename(null)}
        title="Параметры пакета сборки"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPackageToRename(null)}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!renameInputValue.trim()}
              onClick={handleConfirmRename}
            >
              Сохранить
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmRename} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Название пакета сборки:
            </label>
            <Input
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              placeholder="Например: Релиз 2.4 - Модуль Заявки"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-accent-600" />
              <span>Привязанная задача реализации:</span>
            </label>
            <Select
              value={renameTaskId}
              onChange={(val) => setRenameTaskId(val)}
              options={[
                { value: '', label: '— Без привязки к задаче —' },
                ...tasks.map((t) => ({
                  value: t.id,
                  label: `${t.taskNumber}: ${t.title}`,
                })),
              ]}
              placeholder="— Без привязки к задаче —"
            />
            {renameTaskId && onNavigateToTask && (
              <button
                type="button"
                onClick={() => {
                  setPackageToRename(null);
                  onNavigateToTask(renameTaskId);
                }}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-accent-700 hover:text-accent-800 hover:underline font-semibold"
              >
                <span>Перейти к задаче реализации</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
};
