import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    Trash2,
    AlertTriangle,
    FileText,
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

    const cardLink = file.sourceUrl ? trimGreenDataUrl(file.sourceUrl) : '';
    const issue = isDuplicate ? 'Дубликат имени' : hasError ? 'Ошибка в имени файла' : '';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`gd-row group !min-h-[40px] !py-1.5 !gap-2 transition-[background-color,box-shadow,border-radius] duration-200 ${
                isDragging
                    ? 'bg-white shadow-xl rounded-2xl scale-[1.02] relative'
                    : issue
                      ? 'bg-[#f59e3b]/[0.07]'
                      : 'hover:bg-white/50'
            }`}
        >
            {/* Номер; при наведении — ручка перетаскивания */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                title="Перетащите для изменения порядка"
                aria-label={`Файл ${file.order}: перетащите для изменения порядка`}
                data-icon-anim="none"
                className="relative grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-gd-faint hover:bg-white/70 cursor-grab active:cursor-grabbing select-none touch-none"
            >
                <span className="font-mono text-[11px] tabular-nums transition-opacity group-hover:opacity-0">
                    {String(file.order).padStart(3, '0')}
                </span>
                <GripVertical className="absolute h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>

            {/* Имя (тап — редактирование) + индикаторы */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => onEdit(file)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onEdit(file);
                }}
                title={`${file.newName || file.originalName}\nИсходное: ${file.originalName}\nНажмите для редактирования`}
                className="min-w-0 flex-1 cursor-pointer !scale-100"
            >
                <div className="flex min-w-0 items-center gap-1.5">
                    <span className="min-w-0 truncate font-mono text-[12px] font-medium tracking-[-0.02em] text-slate-900">
                        {file.newName || file.originalName}
                    </span>
                    {file.description && (
                        <FileText className="h-3 w-3 flex-shrink-0 text-accent-600" aria-label="Есть описание для README" />
                    )}
                </div>
                {issue && (
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-[#a4500f]">
                        <AlertTriangle className="h-3 w-3" />
                        {issue}
                    </div>
                )}
            </div>

            {/* Индикаторы связи с GreenData и задачей */}
            {cardLink && (
                <a
                    href={cardLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`Открыть карточку в GreenData${file.cardId ? ` (ID ${file.cardId})` : ''}`}
                    aria-label="Открыть карточку в GreenData"
                    className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-accent-600 hover:bg-gd-accent-light"
                >
                    <LinkIcon className="h-3.5 w-3.5" />
                </a>
            )}
            {isMatchedInTask && (
                <span
                    title="Объект найден в привязанной задаче реализации по ID карточки"
                    aria-label="В задаче"
                    className="h-2 w-2 flex-shrink-0 rounded-full bg-gd-success"
                />
            )}

            {/* Действия */}
            <div className="-mr-1 flex flex-shrink-0 items-center">
                <IconButton
                    size="sm"
                    variant="ghost"
                    icon={
                        isDownloaded ? (
                            <Check className="h-3.5 w-3.5 text-gd-success animate-pop-in" strokeWidth={2.75} />
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
