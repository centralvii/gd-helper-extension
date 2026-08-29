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
            className={`group relative flex items-center gap-2 rounded-2xl border p-2 transition-all duration-150 ${
                isDragging
                    ? 'border-emerald-500 bg-emerald-50/90 shadow-lg scale-[1.01]'
                    : hasError
                      ? 'border-rose-300 bg-rose-50/50 hover:border-rose-400 shadow-2xs'
                      : 'border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs'
            }`}
        >
            {/* Combined Drag Handle + Order Number */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                title="Перетащите для изменения порядка"
                className="flex h-7 px-1.5 gap-0.5 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 cursor-grab active:cursor-grabbing shadow-2xs select-none"
            >
                <GripVertical className="h-3 w-3 text-slate-400" />
                <span className="font-mono text-[10.5px] font-bold">#{file.order}</span>
            </button>

            {/* File Info */}
            <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                    <span
                        className="truncate font-mono text-xs font-bold text-slate-900 min-w-0 flex-1"
                        title={file.newName || file.originalName}
                    >
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

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 min-w-0 mt-0.5">
                    <span
                        className="truncate min-w-0 flex-1"
                        title={file.originalName}
                    >
                        исх: {file.originalName}
                    </span>

                    {file.detectedDate && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-slate-100 text-slate-500 text-[9.5px] font-mono flex-shrink-0 whitespace-nowrap">
                            <Calendar className="h-2.5 w-2.5 text-slate-400" />
                            {file.detectedDate}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 items-center gap-0.5">
                <button
                    type="button"
                    onClick={() => onEdit(file)}
                    title="Редактировать параметры файла"
                    className="icon-btn p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                >
                    <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(file.id)}
                    title="Удалить из списка"
                    className="icon-btn icon-btn--danger p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
});
