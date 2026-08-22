import React, { useState } from 'react';
import {
  Icon28ArchiveOutline,
  Icon24AddOutline,
  Icon20CopyOutline,
  Icon20DeleteOutline,
  Icon28EditOutline,
  Icon28ChevronDownOutline,
  Icon16Done,
  Icon20FlashOutline,
} from '@vkontakte/icons';
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
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8e2',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Selector */}
        <div className="relative flex-1 min-w-[180px]">
          <button
            onClick={() => setIsOpenList(!isOpenList)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all group"
            style={{
              background: isOpenList ? '#dcfce7' : '#f0f4f0',
              border: `1.5px solid ${isOpenList ? '#22c55e' : '#e2e8e2'}`,
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Иконка с pop при открытии */}
              <span style={{ display: 'inline-flex', color: '#22c55e', transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)', transform: isOpenList ? 'scale(1.18)' : 'scale(1)' }}>
                <Icon28ArchiveOutline width={15} height={15} />
              </span>
              <span className="text-xs font-bold truncate" style={{ color: '#111827' }}>
                {activePackage.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="text-[9px] font-bold rounded-full px-1.5 py-0.5"
                style={{
                  background: activePackage.files.length > 0 ? '#22c55e' : '#f0f4f0',
                  color:      activePackage.files.length > 0 ? '#fff'    : '#6b7280',
                }}
              >
                {activePackage.files.length}
              </span>
              <span style={{ display: 'inline-flex', color: '#6b7280', transition: 'transform 0.2s', transform: isOpenList ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <Icon28ChevronDownOutline width={14} height={14} />
              </span>
            </div>
          </button>

          {/* Dropdown */}
          {isOpenList && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpenList(false)} />
              <div
                className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden animate-fade-in"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8e2',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  maxHeight: 272,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ borderBottom: '1px solid #f0f4f0', background: '#f8faf8' }}
                >
                  <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: '#6b7280' }}>
                    Пакеты ({packages.length})
                  </span>
                  <button
                    onClick={() => { onCreatePackage(); setIsOpenList(false); }}
                    className="flex items-center gap-1 text-[11px] font-semibold transition-all icon-btn py-0.5 px-1.5 rounded-md"
                    style={{ color: '#16a34a' }}
                  >
                    <Icon24AddOutline width={13} height={13} />
                    <span>+ Новый</span>
                  </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-1.5 space-y-0.5">
                  {packages.map((pkg) => {
                    const isActive = pkg.id === activePackage.id;
                    return (
                      <div
                        key={pkg.id}
                        className="group/item flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        style={{
                          background: isActive ? '#dcfce7' : 'transparent',
                          border: isActive ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8faf8'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <button
                          onClick={() => { onSelectPackage(pkg.id); setIsOpenList(false); }}
                          className="flex-1 text-left truncate min-w-0 flex items-center gap-1.5"
                        >
                          <span className="text-xs font-semibold truncate" style={{ color: isActive ? '#16a34a' : '#111827' }}>
                            {pkg.name}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[9px]" style={{ color: '#9ca3af' }}>{pkg.files.length}f</span>
                          {isActive && <Icon16Done width={13} height={13} style={{ color: '#22c55e' }} />}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenRename(pkg); }}
                            className="icon-btn p-1 opacity-0 group-hover/item:opacity-100"
                          >
                            <Icon28EditOutline width={12} height={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPackageToDelete(pkg); }}
                            className="icon-btn icon-btn--danger p-1 opacity-0 group-hover/item:opacity-100"
                          >
                            <Icon20DeleteOutline width={12} height={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid #f0f4f0' }} className="p-1.5">
                  <button
                    onClick={() => { onCreatePackage(); setIsOpenList(false); }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ color: '#16a34a' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon24AddOutline width={13} height={13} />
                    Создать новый пакет сборки
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Правые кнопки */}
        <div className="flex items-center gap-1">
          {/* Автосбор */}
          <button
            onClick={onToggleAutoCollect}
            title={isAutoCollectEnabled ? 'Автосбор ВКЛЮЧЕН' : 'Автосбор ВЫКЛЮЧЕН'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: isAutoCollectEnabled ? '#dcfce7' : '#f0f4f0',
              border: `1.5px solid ${isAutoCollectEnabled ? '#22c55e' : '#e2e8e2'}`,
              color: isAutoCollectEnabled ? '#16a34a' : '#6b7280',
            }}
          >
            {isAutoCollectEnabled && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
            )}
            {/* Flash icon с bounce */}
            <span className="icon-btn p-0" style={{ pointerEvents: 'none' }}>
              <Icon20FlashOutline width={14} height={14} />
            </span>
            <span>AUTO</span>
          </button>

          <div className="w-px h-4" style={{ background: '#e2e8e2' }} />

          <button onClick={() => onCreatePackage()} title="Новый пакет" className="icon-btn">
            <Icon24AddOutline width={16} height={16} />
          </button>
          <button onClick={() => handleOpenRename(activePackage)} title="Переименовать" className="icon-btn">
            <Icon28EditOutline width={16} height={16} />
          </button>
          <button onClick={() => onDuplicatePackage(activePackage.id)} title="Дублировать" className="icon-btn">
            <Icon20CopyOutline width={16} height={16} />
          </button>
          <button onClick={() => setPackageToDelete(activePackage)} title="Удалить пакет" className="icon-btn icon-btn--danger">
            <Icon20DeleteOutline width={16} height={16} />
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={Boolean(packageToDelete)}
        onClose={() => setPackageToDelete(null)}
        title="Удалить пакет сборки?"
        maxWidth="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPackageToDelete(null)}>Отмена</Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Icon20DeleteOutline width={14} height={14} />}
              onClick={() => { if (packageToDelete) onDeletePackage(packageToDelete.id); setPackageToDelete(null); }}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-xs text-gray-600">
          Вы уверены, что хотите удалить пакет{' '}
          <strong className="text-gray-900">{packageToDelete?.name}</strong>{' '}
          ({packageToDelete?.files.length} файлов)?
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
            <Button variant="secondary" size="sm" onClick={() => setPackageToRename(null)}>Отмена</Button>
            <Button variant="primary" size="sm" disabled={!renameInputValue.trim()} onClick={handleConfirmRename}>
              Сохранить
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmRename} className="space-y-3">
          <label className="block text-xs font-medium text-gray-700">Название пакета:</label>
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
