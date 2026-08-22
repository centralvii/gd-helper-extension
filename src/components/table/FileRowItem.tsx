import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Edit3,
  Trash2,
  AlertTriangle,
  FileText,
  Calendar,
} from 'lucide-react';
import { FileRow } from '../../types';
import { Badge } from '../ui/Badge';

interface FileRowItemProps {
  file: FileRow;
  hasError: boolean;
  isDuplicate: boolean;
  onEdit: (file: FileRow) => void;
  onDelete: (id: string) => void;
}

export const FileRowItem: React.FC<FileRowItemProps> = ({
  file,
  hasError,
  isDuplicate,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-2 p-2.5 rounded-lg border transition-all duration-150 ${
        isDragging
          ? 'bg-slate-800/90 border-emerald-500 shadow-xl shadow-black/50'
          : hasError
          ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700'
          : 'bg-slate-900/70 hover:bg-slate-900/95 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Drag Handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Перетащить для изменения порядка"
        className="touch-none cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-200 transition-colors flex-shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Order Badge */}
      <div className="w-7 text-center flex-shrink-0">
        <span className="font-mono text-[11px] font-semibold text-slate-400">
          #{file.order}
        </span>
      </div>

      {/* Main File Details */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Calculated New Name */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-xs font-semibold text-emerald-400 truncate block">
            {file.newName || file.originalName}
          </span>
          {isDuplicate && (
            <Badge variant="danger" size="sm" className="flex-shrink-0">
              Дубликат
            </Badge>
          )}
          {hasError && !isDuplicate && (
            <Badge variant="warning" size="sm" className="flex-shrink-0">
              <AlertTriangle className="w-2.5 h-2.5" />
            </Badge>
          )}
          {file.description && (
            <span title={`README: ${file.description}`} className="flex-shrink-0 text-slate-400">
              <FileText className="w-3 h-3 text-teal-400" />
            </span>
          )}
        </div>

        {/* Clean Name / Original Name subline */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate">
          <span className="truncate max-w-[200px]" title={file.originalName}>
            исходное: {file.originalName}
          </span>
          {file.detectedDate && (
            <span className="flex items-center gap-0.5 text-slate-400 flex-shrink-0">
              <Calendar className="w-2.5 h-2.5" />
              {file.detectedDate}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(file)}
          title="Редактировать параметры файла"
          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(file.id)}
          title="Удалить из списка"
          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
