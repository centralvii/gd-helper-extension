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

export const FileRowItem: React.FC<FileRowItemProps> = React.memo(({
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
            className={`group relative flex items-center gap-2.5 rounded-2xl border p-3 transition-all duration-150 ${
                isDragging
                    ? 'border-emerald-500 bg-emerald-50/90 shadow-lg scale-[1.01]'
                    : hasError
                      ? 'border-rose-300 bg-rose-50/50 hover:border-rose-400 shadow-2xs'
                      : 'border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs'
            }`}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Перетащить для изменения порядка"
                className="flex h-7 w-7 flex-shrink-0 touch-none items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-700 cursor-grab active:cursor-grabbing shadow-2xs"
            >
                <GripVertical className="h-3.5 w-3.5" />
            </button>

            <div className="flex h-7 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-mono font-bold text-slate-700 shadow-2xs">
                #{file.order}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex min-w-0 items-center gap-1.5">
                    <span className="block truncate font-mono text-xs font-bold text-slate-900">
                        {file.newName || file.originalName}
                    </span>

                    {isDuplicate && (
                        <Badge
                            variant="danger"
                            size="xs"
                            className="flex-shrink-0"
                        >
                            Дубликат
                        </Badge>
                    )}

                    {hasError && !isDuplicate && (
                        <Badge
                            variant="warning"
                            size="xs"
                            className="flex-shrink-0"
                        >
                            <AlertTriangle className="h-2.5 w-2.5" />
                        </Badge>
                    )}

                    {file.description && (
                        <span
                            title={`README: ${file.description}`}
                            className="flex-shrink-0 text-emerald-600"
                        >
                            <FileText className="h-3 w-3" />
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-500">
                    <span
                        className="truncate max-w-[220px]"
                        title={file.originalName}
                    >
                        исходное: {file.originalName}
                    </span>

                    {file.detectedDate && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 shadow-2xs">
                            <Calendar className="h-2.5 w-2.5 text-slate-400" />
                            {file.detectedDate}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <button
                    onClick={() => onEdit(file)}
                    title="Редактировать параметры файла"
                    className="icon-btn p-1.5 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                >
                    <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={() => onDelete(file.id)}
                    title="Удалить из списка"
                    className="icon-btn icon-btn--danger p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
});
