import React from 'react';
import {
  AlertTriangle,
  Link as LinkIcon,
  ExternalLink,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { FileRow } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatSourceUrlDisplay, trimGreenDataUrl } from '../../utils/tabUtils';

interface DuplicateAutoCollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingFile: FileRow;
  newFile: File;
  newCleanName?: string;
  sourceUrl: string;
  onReplace: () => void;
  onAppend: () => void;
}

export const DuplicateAutoCollectModal: React.FC<DuplicateAutoCollectModalProps> = ({
  isOpen,
  onClose,
  existingFile,
  newFile,
  newCleanName,
  sourceUrl,
  onReplace,
  onAppend,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Дубликат файла по ссылке"
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Отмена
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onAppend}
            title="Добавить файл как новый в конец пакета"
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Добавить в конец</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onReplace}
            title="Убрать старый файл и поставить новый на его позицию"
            className="gap-1.5 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Заменить файл</span>
          </Button>
        </>
      }
    >
      <div className="space-y-3 py-1">
        {/* Warning Banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-950">
              Файл с этой страницы уже добавлен в пакет
            </p>
            <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
              Вы можете <strong>заменить</strong> текущий файл в пакете на свежевыгруженный (на той же позиции #{existingFile.order}) или добавить его в самый конец.
            </p>
          </div>
        </div>

        {/* Source Page Link */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-500">
            Страница источника:
          </span>
          <a
            href={trimGreenDataUrl(sourceUrl)}
            target="_blank"
            rel="noreferrer"
            title={trimGreenDataUrl(sourceUrl)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 rounded-xl text-xs font-semibold transition-colors max-w-full truncate shadow-2xs"
          >
            <LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
            <span className="truncate flex-1">{formatSourceUrlDisplay(sourceUrl)}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70 text-emerald-600" />
          </a>
        </div>

        {/* Comparison grid */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          {/* Existing file */}
          <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              В пакете (позиция #{existingFile.order})
            </span>
            <p
              className="font-mono text-xs font-bold text-slate-800 break-words line-clamp-2"
              title={existingFile.newName || existingFile.originalName}
            >
              {existingFile.newName || existingFile.originalName}
            </p>
            <p
              className="text-[10px] text-slate-400 truncate"
              title={existingFile.originalName}
            >
              исх: {existingFile.originalName}
            </p>
          </div>

          {/* New file */}
          <div className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Новая выгрузка
            </span>
            <p
              className="font-mono text-xs font-bold text-emerald-950 break-words line-clamp-2"
              title={newCleanName ? `${newCleanName}.guf` : newFile.name}
            >
              {newCleanName ? `${newCleanName}.guf` : newFile.name}
            </p>
            <p
              className="text-[10px] text-emerald-700/80 truncate"
              title={newFile.name}
            >
              исх: {newFile.name}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
