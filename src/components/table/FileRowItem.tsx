import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    Trash2,
    AlertTriangle,
    FileText,
    Calendar,
    Link as LinkIcon,
    Download,
    Check,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { FileRow } from '../../types';
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

    const hasAltName = Boolean(file.newName && file.newName !== file.originalName);
    const cardLink = file.sourceUrl ? trimGreenDataUrl(file.sourceUrl) : '';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`gd-row group !items-start !py-2.5 !gap-2.5 transition-[background-color,box-shadow,border-radius] duration-200 ${
                isDragging
                    ? 'bg-white shadow-xl rounded-xl scale-[1.02] relative'
                    : hasError
                      ? 'bg-[#ff3b30]/[0.05]'
                      : 'hover:bg-gd-fill-2'
            }`}
        >
            {/* Ручка перетаскивания + порядковый номер */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                title="Перетащите для изменения порядка"
                data-icon-anim="none"
                className="flex w-8 flex-shrink-0 flex-col items-center gap-0.5 pt-0.5 text-gd-faint hover:text-slate-600 cursor-grab active:cursor-grabbing select-none touch-none"
            >
                <span className="font-mono text-[11px] font-semibold text-gd-muted tabular-nums">
                    {String(file.order).padStart(3, '0')}
                </span>
                <GripVertical className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Имя и метаданные (тап — редактирование) */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => onEdit(file)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onEdit(file);
                }}
                title="Редактировать параметры файла"
                className="min-w-0 flex-1 space-y-0.5 cursor-pointer !scale-100"
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    <span
                        className="truncate font-mono text-[12.5px] font-semibold text-slate-900 min-w-0 tracking-[-0.02em]"
                        title={file.newName || file.originalName}
                    >
                        {file.newName || file.originalName}
                    </span>
                    {file.description && (
                        <span title={`README: ${file.description}`} className="flex-shrink-0 text-gd-green">
                            <FileText className="h-3 w-3" />
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-x-1.5 gap-y-0.5 text-[11.5px] text-gd-muted min-w-0 flex-wrap">
                    {isDuplicate ? (
                        <span className="font-medium text-[#d70015]">Дубликат имени</span>
                    ) : hasError ? (
                        <span className="inline-flex items-center gap-1 font-medium text-[#c26a00]">
                            <AlertTriangle className="h-3 w-3" />
                            Ошибка имени
                        </span>
                    ) : null}

                    {hasAltName && (
                        <span className="truncate min-w-0 max-w-full" title={`Исходное имя: ${file.originalName}`}>
                            {file.originalName}
                        </span>
                    )}

                    {file.detectedDate && !hasAltName && (
                        <span className="inline-flex items-center gap-1 tabular-nums" title={`Дата выгрузки: ${file.detectedDate}`}>
                            <Calendar className="h-3 w-3" />
                            {file.detectedDate}
                        </span>
                    )}

                    {(file.cardId || cardLink) &&
                        (cardLink ? (
                            <a
                                href={cardLink}
                                target="_blank"
                                rel="noreferrer"
                                title={`Открыть карточку в GreenData: ${cardLink}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-0.5 font-medium text-gd-green hover:underline flex-shrink-0"
                            >
                                <LinkIcon className="w-3 h-3" />
                                {file.cardId ? `ID ${file.cardId}` : 'Карточка'}
                            </a>
                        ) : (
                            <span className="font-mono flex-shrink-0" title={`ID карточки в GreenData: ${file.cardId}`}>
                                ID {file.cardId}
                            </span>
                        ))}

                    {isMatchedInTask && (
                        <span
                            title="Объект найден в привязанной задаче реализации по ID карточки"
                            className="inline-flex items-center gap-0.5 font-medium text-gd-green flex-shrink-0"
                        >
                            <Check className="w-3 h-3" strokeWidth={2.75} />
                            В задаче
                        </span>
                    )}
                </div>
            </div>

            {/* Действия */}
            <div className="flex flex-shrink-0 items-center gap-0.5 -mr-1">
                <IconButton
                    size="sm"
                    variant="ghost"
                    icon={
                        isDownloaded ? (
                            <Check className="h-3.5 w-3.5 text-gd-green animate-pop-in" strokeWidth={2.75} />
                        ) : (
                            <Download className="h-3.5 w-3.5" />
                        )
                    }
                    onClick={handleDownload}
                    title="Скачать этот GUF-файл"
                />
                <IconButton
                    size="sm"
                    variant="danger"
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => onDelete(file.id)}
                    title="Удалить файл из пакета"
                />
            </div>
        </div>
    );
});
