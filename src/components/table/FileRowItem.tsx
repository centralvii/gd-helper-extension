import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    Edit3,
    Trash2,
    AlertTriangle,
    FileText,
    Calendar,
    Link as LinkIcon,
    ExternalLink,
    Download,
    Check,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { FileRow } from '../../types';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui';
import { trimGreenDataUrl } from '../../utils/tabUtils';

interface FileRowItemProps {
    file: FileRow;
    hasError: boolean;
    isDuplicate: boolean;
    isMatchedInTask?: boolean;
    onEdit: (file: FileRow) => void;
    onDelete: (id: string) => void;
    onDownload?: (file: FileRow) => void;
}

export const FileRowItem: React.FC<FileRowItemProps> = React.memo(({
    file,
    hasError,
    isDuplicate,
    isMatchedInTask,
    onEdit,
    onDelete,
    onDownload,
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

    const [isDownloaded, setIsDownloaded] = useState(false);

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        let downloadName = file.newName || file.originalName;
        if (!downloadName.toLowerCase().endsWith('.guf')) {
            downloadName = `${downloadName}.guf`;
        }

        // Notify background that this is an internal extension download so auto-collector ignores it
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage({
                    type: 'REGISTER_INTERNAL_DOWNLOAD',
                    payload: { filename: downloadName },
                }).catch(() => {
                    // ignore if background is not listening or suspended
                });
            }
        } catch {
            // ignore
        }

        saveAs(file.file, downloadName);
        if (onDownload) {
            onDownload(file);
        }
        setIsDownloaded(true);
        setTimeout(() => setIsDownloaded(false), 1500);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex items-start gap-2 rounded-xl border p-2 transition-all duration-150 ${
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
                className="flex h-6 px-1.5 gap-0.5 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 cursor-grab active:cursor-grabbing shadow-2xs select-none mt-0.5"
            >
                <GripVertical className="h-3 w-3 text-slate-400" />
                <span className="font-mono text-[10.5px] font-bold">#{file.order}</span>
            </button>

            {/* File Info Body */}
            <div className="min-w-0 flex-1 space-y-1">
                {/* Line 1: Filename + Indicators + Actions */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                            className="truncate font-mono text-xs font-bold text-slate-900 min-w-0"
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
                            <span
                                title="Ошибка валидации файла"
                                className="flex-shrink-0 text-amber-500"
                            >
                                <AlertTriangle className="h-3 w-3" />
                            </span>
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

                    {/* Actions */}
                    <div className="flex flex-shrink-0 items-center gap-0.5">
                        <IconButton
                            size="xs"
                            variant="sky"
                            icon={
                                isDownloaded ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                    <Download className="h-3 w-3" />
                                )
                            }
                            onClick={handleDownload}
                            title="Скачать этот GUF-файл"
                        />
                        <IconButton
                            size="xs"
                            variant="emerald"
                            icon={<Edit3 className="h-3 w-3" />}
                            onClick={() => onEdit(file)}
                            title="Редактировать параметры файла"
                        />
                        <IconButton
                            size="xs"
                            variant="danger"
                            icon={<Trash2 className="h-3 w-3" />}
                            onClick={() => onDelete(file.id)}
                            title="Удалить файл из пакета"
                        />
                    </div>
                </div>

                {/* Line 2: Metadata row */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 min-w-0 flex-wrap">
                    {file.newName && file.newName !== file.originalName && (
                        <span
                            className="truncate min-w-0 text-slate-400 text-[10px]"
                            title={`Исходное имя: ${file.originalName}`}
                        >
                            исх: {file.originalName}
                        </span>
                    )}

                    {file.detectedDate && (
                        <span
                            title={`Дата обнаружения / создания: ${file.detectedDate}`}
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-slate-100 text-slate-500 text-[9.5px] font-mono flex-shrink-0 whitespace-nowrap"
                        >
                            <Calendar className="h-2.5 w-2.5 text-slate-400" />
                            {file.detectedDate}
                        </span>
                    )}

                    {/* Compact Card ID & Link */}
                    {file.cardId ? (
                        file.sourceUrl ? (
                            <a
                                href={trimGreenDataUrl(file.sourceUrl)}
                                target="_blank"
                                rel="noreferrer"
                                title={`Открыть карточку в GreenData: ${trimGreenDataUrl(file.sourceUrl)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 rounded-md font-mono text-[9.5px] font-bold transition-all shadow-2xs cursor-pointer flex-shrink-0"
                            >
                                <LinkIcon className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
                                <span>ID: {file.cardId}</span>
                                <ExternalLink className="w-2 h-2 text-emerald-600 opacity-60 flex-shrink-0" />
                            </a>
                        ) : (
                            <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 border border-slate-200/90 font-mono text-[9.5px] font-bold shadow-2xs flex-shrink-0"
                                title={`ID карточки в GreenData: ${file.cardId}`}
                            >
                                <span className="text-slate-400 font-normal">ID:</span>
                                {file.cardId}
                            </span>
                        )
                    ) : file.sourceUrl ? (
                        <a
                            href={trimGreenDataUrl(file.sourceUrl)}
                            target="_blank"
                            rel="noreferrer"
                            title={trimGreenDataUrl(file.sourceUrl)}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 text-[9.5px] font-semibold transition-all shadow-2xs flex-shrink-0"
                        >
                            <LinkIcon className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
                            <span>Карточка</span>
                            <ExternalLink className="w-2 h-2 text-emerald-600 opacity-60 flex-shrink-0" />
                        </a>
                    ) : null}

                    {/* Matched in Task Badge */}
                    {isMatchedInTask && (
                        <span
                            title="Объект найден в привязанной задаче реализации по ID карточки"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 text-[9.5px] font-bold shadow-2xs flex-shrink-0"
                        >
                            <Check className="w-2.5 h-2.5 text-emerald-700 flex-shrink-0" />
                            <span className="hidden xs:inline">В задаче</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});
