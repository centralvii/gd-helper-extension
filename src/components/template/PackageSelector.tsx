import React, { useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Copy,
  Edit2,
  ChevronDown,
  Check,
  Zap,
  FileCode,
  ExternalLink,
  Sparkles,
  FileText,
} from 'lucide-react';
import { BuildPackage, ImplementationTask, AutoCollectNamingMode } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

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
  isAutoCollectEnabled: boolean;
  onToggleAutoCollect: () => void;
  namingMode?: AutoCollectNamingMode;
  onChangeNamingMode?: (mode: AutoCollectNamingMode) => void;
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
  isAutoCollectEnabled,
  onToggleAutoCollect,
  namingMode = 'pageName',
  onChangeNamingMode,
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
      <div className="relative flex items-center justify-between gap-1.5 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        {/* Active Package Selector Trigger */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setIsOpenList(!isOpenList)}
            className="w-full flex items-center justify-between gap-1.5 px-3 py-2 bg-slate-50/90 hover:bg-slate-100/90 text-left border border-slate-200/90 rounded-xl transition-all group shadow-2xs cursor-pointer min-w-0 overflow-hidden"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold shadow-2xs">
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap flex-shrink-0">
                  Пакет:
                </span>
                <span className="text-xs text-slate-900 font-bold truncate min-w-0 flex-1">
                  {activePackage.name}
                </span>

                {/* Linked task badge */}
                {activeLinkedTask && (
                  <span
                    onClick={(e) => {
                      if (onNavigateToTask) {
                        e.stopPropagation();
                        onNavigateToTask(activeLinkedTask.id);
                      }
                    }}
                    title={`Привязан к задаче "${activeLinkedTask.taskNumber}: ${activeLinkedTask.title}". Нажмите для перехода.`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold border border-emerald-300/80 transition-colors flex-shrink-0 shadow-2xs cursor-pointer whitespace-nowrap"
                  >
                    <FileCode className="w-2.5 h-2.5 text-emerald-700" />
                    <span>{activeLinkedTask.taskNumber}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform flex-shrink-0 ${
                  isOpenList ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Package Dropdown Menu - Spans full card width */}
        {isOpenList && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpenList(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-fade-in flex flex-col w-full">
              {/* Search if more than 2 packages */}
              {packages.length > 2 && (
                <div className="p-2 border-b border-gray-100 bg-gray-50/70">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по названию или задаче..."
                    className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              )}

              {/* Header title in popover */}
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                <span>Пакеты сборки ({packages.length})</span>
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-56 p-1.5 space-y-1">
                {filteredPackages.map((pkg) => {
                  const isActive = pkg.id === activePackage.id;
                  const linkedTask = pkg.taskId ? tasks.find((t) => t.id === pkg.taskId) : null;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        onSelectPackage(pkg.id);
                        setIsOpenList(false);
                      }}
                      className={`group/row flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50/70 text-emerald-950 font-semibold border border-emerald-200/80 shadow-2xs'
                          : 'hover:bg-gray-50 text-gray-800 border border-transparent'
                      }`}
                    >
                      {/* Left: Indicator & Name */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isActive ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-gray-300'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-emerald-900 text-xs truncate min-w-0 flex-1">
                              {pkg.name}
                            </span>
                            {linkedTask && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-mono border border-emerald-200 flex-shrink-0 whitespace-nowrap">
                                {linkedTask.taskNumber}
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-gray-400 font-normal truncate">
                            {pkg.files.length} {pkg.files.length === 1 ? 'файл' : 'файлов'}
                            {linkedTask ? ` • ${linkedTask.title}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div
                        className="flex items-center gap-0.5 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isActive && (
                          <Check className="w-4 h-4 text-emerald-600 mr-1 flex-shrink-0" />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onDuplicatePackage(pkg.id);
                            setIsOpenList(false);
                          }}
                          title="Дублировать пакет"
                          className="icon-btn p-1 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
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
                          className="icon-btn p-1 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
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
                            className="icon-btn icon-btn--danger p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer: Create Package Button */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/70 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200/80 rounded-xl transition-all font-semibold shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Новый пакет</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Package Actions Toolbar */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Auto-collect naming mode segmented switcher */}
          {onChangeNamingMode && (
            <div
              className={`flex items-center p-0.5 bg-slate-100/90 border border-slate-200/90 rounded-xl text-[10px] font-medium shadow-2xs transition-opacity ${
                !isAutoCollectEnabled ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={() => onChangeNamingMode('pageName')}
                title="Режим автосбора: с названиями из алгоритма (со страницы GreenData)"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                  namingMode === 'pageName'
                    ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span className="whitespace-nowrap">Алгоритм</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeNamingMode('original')}
                title="Режим автосбора: обычное название файла без изменения"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                  namingMode === 'original'
                    ? 'bg-white text-slate-800 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span className="whitespace-nowrap">Обычное</span>
              </button>
            </div>
          )}

          {/* Auto-collect toggle — lightning icon */}
          <button
            type="button"
            onClick={onToggleAutoCollect}
            title={
              isAutoCollectEnabled
                ? `Автосбор ВКЛЮЧЕН (${namingMode === 'original' ? 'обычное имя' : 'из алгоритма'}): скачанные .guf файлы добавляются автоматически`
                : 'Автосбор ВЫКЛЮЧЕН: нажмите для включения'
            }
            className={[
              'icon-btn p-1.5 rounded-xl transition-colors cursor-pointer',
              isAutoCollectEnabled
                ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700'
                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50',
            ].join(' ')}
          >
            <Zap
              className={[
                'w-4 h-4',
                isAutoCollectEnabled ? 'zap-pulse' : '',
              ].join(' ')}
              style={
                isAutoCollectEnabled
                  ? { filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.7))' }
                  : undefined
              }
            />
          </button>
        </div>
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
        <p className="text-xs text-gray-700">
          Вы уверены, что хотите удалить пакет сборки{' '}
          <strong className="text-gray-900">"{packageToDelete?.name}"</strong> (
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">
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
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-600" />
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
            <span className="text-[10px] text-gray-400 mt-1 block">
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">
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
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-600" />
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
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-semibold"
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
