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
            className={`group relative flex items-center gap-2 rounded-2xl border p-2.5 transition-all duration-200 ${
                isDragging
                    ? 'border-emerald-400/60 bg-slate-800/95 shadow-[0_20px_40px_rgba(16,185,129,0.12)]'
                    : hasError
                      ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-400/50'
                      : 'border-white/10 bg-slate-900/75 hover:border-emerald-500/30 hover:bg-slate-900/90'
            }`}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Перетащить для изменения порядка"
                className="flex h-7 w-7 flex-shrink-0 touch-none items-center justify-center rounded-lg border border-white/10 bg-slate-950/60 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-200"
            >
                <GripVertical className="h-3.5 w-3.5" />
            </button>

            <div className="flex h-7 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-950/60 text-[11px] font-semibold text-slate-300">
                #{file.order}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                    <span className="block truncate font-mono text-xs font-semibold text-emerald-300">
                        {file.newName || file.originalName}
                    </span>

                    {isDuplicate && (
                        <Badge
                            variant="danger"
                            size="sm"
                            className="flex-shrink-0"
                        >
                            Дубликат
                        </Badge>
                    )}

                    {hasError && !isDuplicate && (
                        <Badge
                            variant="warning"
                            size="sm"
                            className="flex-shrink-0"
                        >
                            <AlertTriangle className="h-2.5 w-2.5" />
                        </Badge>
                    )}

                    {file.description && (
                        <span
                            title={`README: ${file.description}`}
                            className="flex-shrink-0 text-slate-400"
                        >
                            <FileText className="h-3 w-3 text-teal-300" />
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span
                        className="truncate max-w-[220px]"
                        title={file.originalName}
                    >
                        исходное: {file.originalName}
                    </span>

                    {file.detectedDate && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/60 px-1.5 py-0.5 text-slate-300">
                            <Calendar className="h-2.5 w-2.5" />
                            {file.detectedDate}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                <button
                    onClick={() => onEdit(file)}
                    title="Редактировать параметры файла"
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-emerald-300"
                >
                    <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={() => onDelete(file.id)}
                    title="Удалить из списка"
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-300"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
};
