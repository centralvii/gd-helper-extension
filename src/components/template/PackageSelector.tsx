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
      {/* ── Toolbar row ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 rounded-xl"
        style={{
          background: 'rgba(13,21,13,0.8)',
          border: '1px solid rgba(34,197,94,0.12)',
        }}
      >
        {/* Package selector button */}
        <div className="relative flex-1 min-w-[180px]">
          <button
            onClick={() => setIsOpenList(!isOpenList)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all group"
            style={{
              background: 'rgba(17,26,17,0.9)',
              border: `1px solid ${isOpenList ? 'rgba(34,197,94,0.35)' : 'rgba(34,197,94,0.15)'}`,
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon28ArchiveOutline
                width={14} height={14}
                style={{ color: '#22c55e', flexShrink: 0 }}
              />
              <span
                className="text-xs font-bold truncate"
                style={{ color: '#d4edda', fontFamily: 'monospace' }}
              >
                {activePackage.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="text-[9px] font-mono rounded px-1.5 py-0.5"
                style={{
                  background: activePackage.files.length > 0
                    ? 'rgba(34,197,94,0.18)'
                    : 'rgba(34,197,94,0.06)',
                  color: activePackage.files.length > 0 ? '#22c55e' : '#3d5c3d',
                }}
              >
                {activePackage.files.length} files
              </span>
              <Icon28ChevronDownOutline
                width={13} height={13}
                style={{
                  color: '#6b9a6b',
                  transition: 'transform 0.2s',
                  transform: isOpenList ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </div>
          </button>

          {/* Dropdown */}
          {isOpenList && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpenList(false)} />
              <div
                className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl shadow-2xl overflow-hidden animate-fade-in"
                style={{
                  background: '#0d150d',
                  border: '1px solid rgba(34,197,94,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                  maxHeight: 272,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ borderBottom: '1px solid rgba(34,197,94,0.10)' }}
                >
                  <span className="console-label">ПАКЕТЫ ({packages.length})</span>
                  <button
                    onClick={() => { onCreatePackage(); setIsOpenList(false); }}
                    className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                    style={{ color: '#22c55e', fontFamily: 'monospace' }}
                  >
                    <Icon24AddOutline width={12} height={12} />
                    <span>+ NEW</span>
                  </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-1 space-y-0.5">
                  {packages.map((pkg) => {
                    const isActive = pkg.id === activePackage.id;
                    return (
                      <div
                        key={pkg.id}
                        className="group/item flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg transition-all"
                        style={{
                          background: isActive
                            ? 'rgba(34,197,94,0.12)'
                            : 'transparent',
                          border: isActive
                            ? '1px solid rgba(34,197,94,0.25)'
                            : '1px solid transparent',
                        }}
                      >
                        <button
                          onClick={() => { onSelectPackage(pkg.id); setIsOpenList(false); }}
                          className="flex-1 text-left truncate min-w-0 flex items-center gap-1.5"
                        >
                          <span
                            className="text-xs font-semibold truncate"
                            style={{
                              color: isActive ? '#22c55e' : '#d4edda',
                              fontFamily: 'monospace',
                            }}
                          >
                            {isActive ? '▸ ' : '  '}{pkg.name}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span
                            className="text-[9px] font-mono"
                            style={{ color: '#3d5c3d' }}
                          >
                            {pkg.files.length}f
                          </span>
                          {isActive && (
                            <Icon16Done width={12} height={12} style={{ color: '#22c55e' }} />
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenRename(pkg); }}
                            title="Переименовать"
                            className="p-1 rounded opacity-0 group-hover/item:opacity-100 transition-all icon-btn"
                          >
                            <Icon28EditOutline width={11} height={11} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPackageToDelete(pkg); }}
                            title="Удалить"
                            className="p-1 rounded opacity-0 group-hover/item:opacity-100 transition-all icon-btn icon-btn--danger"
                          >
                            <Icon20DeleteOutline width={11} height={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div
                  className="p-1.5"
                  style={{ borderTop: '1px solid rgba(34,197,94,0.08)' }}
                >
                  <button
                    onClick={() => { onCreatePackage(); setIsOpenList(false); }}
                    className="w-full flex items-center justify-center gap-1.5 py-1 rounded-md text-xs font-semibold transition-colors"
                    style={{
                      color: '#22c55e',
                      fontFamily: 'monospace',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon24AddOutline width={13} height={13} />
                    + Создать новый пакет сборки
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Auto-collect Toggle */}
          <button
            onClick={onToggleAutoCollect}
            title={
              isAutoCollectEnabled
                ? 'Автосбор ВКЛЮЧЕН: скачанные .guf файлы добавляются в активный пакет'
                : 'Автосбор ВЫКЛЮЧЕН: нажмите для включения'
            }
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{
              fontFamily: 'monospace',
              background: isAutoCollectEnabled
                ? 'rgba(34,197,94,0.14)'
                : 'rgba(17,26,17,0.8)',
              border: isAutoCollectEnabled
                ? '1px solid rgba(34,197,94,0.4)'
                : '1px solid rgba(34,197,94,0.12)',
              color: isAutoCollectEnabled ? '#22c55e' : '#6b9a6b',
            }}
          >
            {isAutoCollectEnabled ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                <Icon20FlashOutline width={13} height={13} />
                <span>AUTO</span>
              </>
            ) : (
              <>
                <Icon20FlashOutline width={13} height={13} style={{ opacity: 0.4 }} />
                <span>AUTO</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-4 mx-0.5" style={{ background: 'rgba(34,197,94,0.1)' }} />

          <button
            onClick={() => onCreatePackage()}
            title="Новый пакет"
            className="icon-btn"
          >
            <Icon24AddOutline width={15} height={15} />
          </button>

          <button
            onClick={() => handleOpenRename(activePackage)}
            title="Переименовать пакет"
            className="icon-btn"
          >
            <Icon28EditOutline width={15} height={15} />
          </button>

          <button
            onClick={() => onDuplicatePackage(activePackage.id)}
            title="Дублировать пакет"
            className="icon-btn"
          >
            <Icon20CopyOutline width={15} height={15} />
          </button>

          <button
            onClick={() => setPackageToDelete(activePackage)}
            title="Удалить пакет"
            className="icon-btn icon-btn--danger"
          >
            <Icon20DeleteOutline width={15} height={15} />
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
              leftIcon={<Icon20DeleteOutline width={14} height={14} />}
              onClick={() => {
                if (packageToDelete) onDeletePackage(packageToDelete.id);
                setPackageToDelete(null);
              }}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-xs" style={{ color: '#d4edda' }}>
          Вы уверены, что хотите удалить пакет сборки{' '}
          <strong style={{ color: '#22c55e', fontFamily: 'monospace' }}>{packageToDelete?.name}</strong>{' '}
          ({packageToDelete?.files.length} файлов в очереди)?
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
          <label className="block text-xs font-medium" style={{ color: '#d4edda' }}>
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
