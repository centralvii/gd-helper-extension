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
            className={`group relative flex items-center gap-2 rounded-xl border p-2.5 transition-all duration-150 ${
                isDragging
                    ? 'border-emerald-500 bg-emerald-50/90 shadow-lg'
                    : hasError
                      ? 'border-rose-300 bg-rose-50/50 hover:border-rose-400'
                      : 'border-gray-200 bg-white hover:border-emerald-500/40 hover:shadow-sm'
            }`}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Перетащить для изменения порядка"
                className="flex h-7 w-7 flex-shrink-0 touch-none items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-700"
            >
                <GripVertical className="h-3.5 w-3.5" />
            </button>

            <div className="flex h-7 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-600">
                #{file.order}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex min-w-0 items-center gap-1.5">
                    <span className="block truncate font-mono text-xs font-bold text-gray-900">
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
                            className="flex-shrink-0 text-emerald-600"
                        >
                            <FileText className="h-3 w-3" />
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                    <span
                        className="truncate max-w-[220px]"
                        title={file.originalName}
                    >
                        исходное: {file.originalName}
                    </span>

                    {file.detectedDate && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-gray-600">
                            <Calendar className="h-2.5 w-2.5 text-gray-400" />
                            {file.detectedDate}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <button
                    onClick={() => onEdit(file)}
                    title="Редактировать параметры файла"
                    className="icon-btn p-1.5 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-50"
                >
                    <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={() => onDelete(file.id)}
                    title="Удалить из списка"
                    className="icon-btn icon-btn--danger p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
};
