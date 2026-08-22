import React, { useState } from 'react';
import {
  Package,
  Plus,
  Copy,
  Trash2,
  Edit2,
  ChevronDown,
  Check,
  Zap,
  ZapOff,
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-xl">
        {/* Package Selector Trigger */}
        <div className="relative flex-1 min-w-[200px]">
          <button
            onClick={() => setIsOpenList(!isOpenList)}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-left border border-slate-700/80 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Package className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="truncate">
                <span className="font-bold text-xs text-slate-200 truncate">
                  {activePackage.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge variant={activePackage.files.length > 0 ? 'success' : 'default'} size="sm">
                {activePackage.files.length} {activePackage.files.length === 1 ? 'файл' : 'файлов'}
              </Badge>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform" />
            </div>
          </button>

          {/* Package Dropdown Menu */}
          {isOpenList && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpenList(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-72 flex flex-col">
                <div className="p-2 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Пакеты сборок ({packages.length})
                  </span>
                  <button
                    onClick={() => {
                      onCreatePackage();
                      setIsOpenList(false);
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Новый</span>
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-1 space-y-0.5">
                  {packages.map((pkg) => {
                    const isActive = pkg.id === activePackage.id;
                    return (
                      <div
                        key={pkg.id}
                        className={`group/item flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <button
                          onClick={() => {
                            onSelectPackage(pkg.id);
                            setIsOpenList(false);
                          }}
                          className="flex-1 text-left truncate min-w-0 flex items-center gap-1.5"
                        >
                          <span className="font-semibold truncate">{pkg.name}</span>
                        </button>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[10px] text-slate-500">
                            {pkg.files.length} ф.
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRename(pkg);
                            }}
                            title="Переименовать пакет"
                            className="p-1 text-slate-500 hover:text-sky-400 hover:bg-slate-700/80 rounded transition-colors opacity-0 group-hover/item:opacity-100"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPackageToDelete(pkg);
                            }}
                            title="Удалить пакет"
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700/80 rounded transition-colors opacity-0 group-hover/item:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-1.5 border-t border-slate-800 bg-slate-950/60">
                  <button
                    onClick={() => {
                      onCreatePackage();
                      setIsOpenList(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 rounded-md transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Создать новый пакет сборки</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action buttons & Auto-collect toggle */}
        <div className="flex items-center gap-1.5">
          {/* Auto-collect Toggle */}
          <button
            onClick={onToggleAutoCollect}
            title={
              isAutoCollectEnabled
                ? 'Автосбор скачиваний ВКЛЮЧЕН: скачанные .guf файлы сразу добавляются в активный пакет'
                : 'Автосбор скачиваний ВЫКЛЮЧЕН: нажмите, чтобы включить автоматический перехват .guf'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isAutoCollectEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-950'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/60'
            }`}
          >
            {isAutoCollectEnabled ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Автосбор .guf</span>
              </>
            ) : (
              <>
                <ZapOff className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px]">Автосбор выкл</span>
              </>
            )}
          </button>

          {/* Create new package */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreatePackage()}
            title="Создать новый пакет"
            leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-400" />}
          >
            <span className="hidden sm:inline">Новый</span>
          </Button>

          {/* Rename active package */}
          <button
            onClick={() => handleOpenRename(activePackage)}
            title="Переименовать пакет"
            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate active package */}
          <button
            onClick={() => onDuplicatePackage(activePackage.id)}
            title="Дублировать пакет"
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete active package */}
          <button
            onClick={() => setPackageToDelete(activePackage)}
            title="Удалить пакет"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
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
            <Button variant="secondary" size="sm" onClick={() => setPackageToDelete(null)}>
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
        <p className="text-xs text-slate-300">
          Вы уверены, что хотите удалить пакет сборки{' '}
          <strong className="text-slate-100">{packageToDelete?.name}</strong> (
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
            <Button variant="secondary" size="sm" onClick={() => setPackageToRename(null)}>
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
          <label className="block text-xs font-medium text-slate-300">
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
