import React, { useState } from 'react';
import {
  Layers,
  FileText,
  Bookmark,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

import { ActiveTool } from '../../types';

interface HeaderProps {
  activeTool: ActiveTool;
  fileCount: number;
  hasReadme: boolean;
  onOpenPresets: () => void;
  onOpenMassActions: () => void;
  onOpenReadme: () => void;
  onClearFiles: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTool,
  fileCount,
  hasReadme,
  onOpenPresets,
  onOpenMassActions,
  onOpenReadme,
  onClearFiles,
}) => {
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const handleOpenFullscreen = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/icons/icon48.png"
            alt="GDHelper"
            className="w-7 h-7 rounded-lg shadow-sm shadow-emerald-950/60 flex-shrink-0 object-cover border border-emerald-500/30"
          />
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-sm text-slate-100 tracking-tight">GDHelper</span>
            <Badge variant={activeTool === 'packer' ? 'success' : 'info'} size="sm">
              {activeTool === 'packer' ? 'GUF Packer' : 'Реализация'}
            </Badge>
            {activeTool === 'packer' && fileCount > 0 && (
              <Badge variant="default" size="sm">
                {fileCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1">
          {activeTool === 'packer' && (
            <>
              <button
                onClick={onOpenPresets}
                title="Пресеты шаблонов"
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenMassActions}
                title="Массовые действия"
                disabled={fileCount === 0}
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              >
                <Layers className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenReadme}
                title="Редактор README.txt"
                className="relative p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                {hasReadme && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
                )}
              </button>
            </>
          )}

          <button
            onClick={handleOpenFullscreen}
            title="Открыть во весь экран"
            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {activeTool === 'packer' && fileCount > 0 && (
            <button
              onClick={() => setIsClearConfirmOpen(true)}
              title="Очистить все файлы"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        title="Очистить список файлов?"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsClearConfirmOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                onClearFiles();
                setIsClearConfirmOpen(false);
              }}
            >
              Очистить
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-300">
          Вы уверены, что хотите удалить все загруженные файлы ({fileCount} шт.) из памяти и очистить состояние?
        </p>
      </Modal>
    </>
  );
};
