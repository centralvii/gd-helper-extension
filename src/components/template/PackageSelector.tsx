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
} from 'lucide-react';
import { BuildPackage } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface PackageSelectorProps {
  packages: BuildPackage[];
  activePackage: BuildPackage;
  onSelectPackage: (id: string) => void;
  onCreatePackage: (name?: string) => void;
  onDuplicatePackage: (id: string) => void;
  onRenamePackage: (id: string, name: string) => void;
  onDeletePackage: (id: string) => void;
  isAutoCollectEnabled: boolean;
  onToggleAutoCollect: () => void;
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({
  packages,
  activePackage,
  onSelectPackage,
  onCreatePackage,
  onDuplicatePackage,
  onRenamePackage,
  onDeletePackage,
  isAutoCollectEnabled,
  onToggleAutoCollect,
}) => {
  const [isOpenList, setIsOpenList] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<BuildPackage | null>(null);
  const [packageToRename, setPackageToRename] = useState<BuildPackage | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenRename = (pkg: BuildPackage) => {
    setPackageToRename(pkg);
    setRenameInputValue(pkg.name);
  };

  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (packageToRename && renameInputValue.trim()) {
      onRenamePackage(packageToRename.id, renameInputValue.trim());
    }
    setPackageToRename(null);
  };

  const filteredPackages = packages.filter((pkg) => {
    const query = searchQuery.toLowerCase();
    return pkg.name.toLowerCase().includes(query);
  });

  return (
    <>
      <div className="flex items-center justify-between gap-1.5 p-1.5 bg-white border border-gray-200 rounded-xl shadow-xs">
        {/* Active Package Selector Trigger */}
        <div className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setIsOpenList(!isOpenList)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100/80 text-left border border-gray-200/90 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Package className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-bold text-gray-500 flex-shrink-0">
                  Пакет:
                </span>
                <span className="text-xs text-gray-900 font-semibold truncate">
                  {activePackage.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="px-1.5 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-medium text-gray-600">
                {activePackage.files.length} {activePackage.files.length === 1 ? 'файл' : 'файлов'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-transform ${
                  isOpenList ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Package Dropdown Menu */}
          {isOpenList && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpenList(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in flex flex-col min-w-[260px]">
                {/* Search if more than 3 packages */}
                {packages.length > 3 && (
                  <div className="p-2 border-b border-gray-100 bg-gray-50/70">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по названию пакета..."
                      className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>
                )}

                {/* Header title in popover */}
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                  <span>Список пакетов сборки ({packages.length})</span>
                </div>

                {/* List */}
                <div className="overflow-y-auto max-h-56 p-1.5 space-y-1">
                  {filteredPackages.map((pkg) => {
                    const isActive = pkg.id === activePackage.id;
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
                            <span className="block truncate text-xs">
                              {pkg.name}
                            </span>
                            <span className="block text-[10px] text-gray-400 font-normal">
                              {pkg.files.length} {pkg.files.length === 1 ? 'файл' : 'файлов'}
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
                              handleOpenRename(pkg);
                              setIsOpenList(false);
                            }}
                            title="Переименовать пакет"
                            className="icon-btn p-1 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
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
                              className="icon-btn icon-btn--danger p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                <div className="p-2 border-t border-gray-100 bg-gray-50/60">
                  <button
                    type="button"
                    onClick={() => {
                      onCreatePackage();
                      setIsOpenList(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200/80 rounded-xl transition-all font-semibold shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Создать новый пакет</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Package Actions Toolbar */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Auto-collect toggle — lightning icon */}
          <button
            type="button"
            onClick={onToggleAutoCollect}
            title={
              isAutoCollectEnabled
                ? 'Автосбор ВКЛЮЧЕН: скачанные .guf файлы добавляются автоматически'
                : 'Автосбор ВЫКЛЮЧЕН: нажмите для включения'
            }
            className={[
              'icon-btn p-1.5 rounded-lg transition-colors',
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

          {/* Quick Create Package */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreatePackage()}
            title="Создать новый пакет"
            leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
            className="hidden sm:inline-flex"
          >
            Создать
          </Button>

          {/* Rename active package */}
          <button
            type="button"
            onClick={() => handleOpenRename(activePackage)}
            title="Переименовать пакет"
            className="icon-btn p-1.5 text-gray-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate active package */}
          <button
            type="button"
            onClick={() => onDuplicatePackage(activePackage.id)}
            title="Дублировать пакет"
            className="icon-btn p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete active package if more than 1 */}
          {packages.length > 1 && (
            <button
              type="button"
              onClick={() => setPackageToDelete(activePackage)}
              title="Удалить пакет"
              className="icon-btn icon-btn--danger p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
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

      {/* Rename Modal */}
      <Modal
        isOpen={Boolean(packageToRename)}
        onClose={() => setPackageToRename(null)}
        title="Переименовать пакет сборки"
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
          <label className="block text-xs font-medium text-gray-700">
            Название пакета сборки:
          </label>
          <Input
            value={renameInputValue}
            onChange={(e) => setRenameInputValue(e.target.value)}
            placeholder="Например: Релиз 2.4 - Модуль Заявки"
            autoFocus
          />
        </form>
      </Modal>
    </>
  );
};
