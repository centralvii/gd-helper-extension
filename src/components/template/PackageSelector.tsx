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
import { Badge } from '../ui/Badge';
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
      <div className="flex items-center justify-between gap-2 p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* Active Package Trigger / Dropdown */}
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => setIsOpenList(!isOpenList)}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-left border border-gray-200 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Package className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="truncate">
                <span className="font-bold text-xs text-emerald-700 mr-1.5">
                  Пакет:
                </span>
                <span className="text-xs text-gray-900 font-medium truncate">
                  {activePackage.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge variant={activePackage.files.length > 0 ? 'success' : 'default'} size="sm">
                {activePackage.files.length} {activePackage.files.length === 1 ? 'файл' : 'файлов'}
              </Badge>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-900 transition-transform" />
            </div>
          </button>

          {/* Package Dropdown Menu */}
          {isOpenList && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpenList(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in max-h-72 flex flex-col">
                {/* Search */}
                {packages.length > 2 && (
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск пакета..."
                      className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* List */}
                <div className="overflow-y-auto flex-1 p-1.5 space-y-0.5">
                  {filteredPackages.map((pkg) => {
                    const isActive = pkg.id === activePackage.id;
                    return (
                      <div
                        key={pkg.id}
                        className={`group/item flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <button
                          onClick={() => {
                            onSelectPackage(pkg.id);
                            setIsOpenList(false);
                          }}
                          className="flex-1 text-left truncate min-w-0 flex items-center gap-1.5"
                        >
                          <span className="font-bold text-emerald-700 flex-shrink-0">
                            {isActive ? '▸' : '•'}
                          </span>
                          <span className="truncate font-medium">{pkg.name}</span>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[10px] text-gray-400">
                            {pkg.files.length} ф.
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRename(pkg);
                            }}
                            title="Переименовать пакет"
                            className="icon-btn p-1 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors opacity-0 group-hover/item:opacity-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPackageToDelete(pkg);
                            }}
                            title="Удалить пакет"
                            className="icon-btn icon-btn--danger p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover/item:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer of dropdown */}
                <div className="p-1.5 border-t border-gray-100 bg-gray-50/70">
                  <button
                    onClick={() => {
                      onCreatePackage();
                      setIsOpenList(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Создать новый пакет сборки</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Package Actions Toolbar */}
        <div className="flex items-center gap-1">
          {/* Auto-collect toggle — icon-only lightning bolt */}
          <button
            onClick={onToggleAutoCollect}
            title={
              isAutoCollectEnabled
                ? 'Автосбор ВКЛЮЧЕН: скачанные .guf файлы добавляются автоматически'
                : 'Автосбор ВЫКЛЮЧЕН: нажмите для включения'
            }
            className={[
              'icon-btn',
              isAutoCollectEnabled
                ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-600'
                : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50',
            ].join(' ')}
          >
            <Zap
              className={[
                'w-4 h-4 transition-none',
                isAutoCollectEnabled ? 'zap-pulse' : '',
              ].join(' ')}
              style={
                isAutoCollectEnabled
                  ? { filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.7))' }
                  : undefined
              }
            />
          </button>

          {/* Create new package */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreatePackage()}
            title="Создать новый пакет"
            leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
          >
            <span className="hidden sm:inline">Создать</span>
          </Button>

          {/* Rename active package */}
          <button
            onClick={() => handleOpenRename(activePackage)}
            title="Переименовать пакет"
            className="icon-btn p-1.5 text-gray-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate active package */}
          <button
            onClick={() => onDuplicatePackage(activePackage.id)}
            title="Дублировать пакет"
            className="icon-btn p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete active package */}
          <button
            onClick={() => setPackageToDelete(activePackage)}
            title="Удалить пакет"
            className="icon-btn icon-btn--danger p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
          <strong className="text-gray-900">{packageToDelete?.name}</strong> (
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
