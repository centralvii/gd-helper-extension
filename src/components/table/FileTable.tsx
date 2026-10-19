import React, { useState, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Search } from 'lucide-react';
import { FileRow, ValidationSummary, ImplementationChangeItem } from '../../types';
import { extractCardIdFromUrl } from '../../utils/tabUtils';
import { FileRowItem } from './FileRowItem';
import { FileUploader } from '../upload/FileUploader';

interface FileTableProps {
    files: FileRow[];
    validation: ValidationSummary;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onEditFile: (file: FileRow) => void;
    onDeleteFile: (id: string) => void;
    onAddFiles: (files: File[]) => void;
    onDownloadFile?: (file: FileRow) => void;
    onClearFiles?: () => void;
    taskItems?: ImplementationChangeItem[];
}

export const FileTable: React.FC<FileTableProps> = ({
    files,
    validation,
    onReorder,
    onEditFile,
    onDeleteFile,
    onAddFiles,
    onDownloadFile,
    onClearFiles,
    taskItems,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const taskCardIdsSet = useMemo(() => {
        const set = new Set<string>();
        if (taskItems) {
            taskItems.forEach((item) => {
                const cId = extractCardIdFromUrl(item.linkUrl);
                if (cId) set.add(cId);
            });
        }
        return set;
    }, [taskItems]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 4,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const filteredFiles = useMemo(() => {
        if (!searchQuery.trim()) return files;
        const query = searchQuery.toLowerCase();
        return files.filter(
            (f) =>
                f.originalName.toLowerCase().includes(query) ||
                f.cleanName.toLowerCase().includes(query) ||
                f.newName.toLowerCase().includes(query),
        );
    }, [files, searchQuery]);

    const fileIds = useMemo(() => filteredFiles.map((f) => f.id), [filteredFiles]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = files.findIndex((f) => f.id === active.id);
        const newIndex = files.findIndex((f) => f.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            onReorder(oldIndex, newIndex);
        }
    };

    const isFiltered = Boolean(searchQuery.trim());

    return (
        <div className="space-y-3">
            {/* Поиск + добавление */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-faint" />
                    <input
                        type="text"
                        placeholder="Поиск по файлам"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' && searchQuery) {
                                e.preventDefault();
                                setSearchQuery('');
                            }
                        }}
                        aria-label="Поиск по файлам"
                        className="gd-field !pl-8 !bg-[rgba(118,118,128,0.12)]"
                    />
                </div>
                <FileUploader isCompact onAddFiles={onAddFiles} />
            </div>

            <div>
                <div className="gd-section-title">
                    <span>
                        Файлы · {isFiltered ? `${filteredFiles.length} из ${files.length}` : files.length}
                    </span>
                    {onClearFiles && (
                        <button
                            type="button"
                            onClick={onClearFiles}
                            title="Удалить все файлы из пакета"
                            className="normal-case tracking-normal text-[12.5px] font-medium text-[#ff3b30] cursor-pointer"
                        >
                            Очистить
                        </button>
                    )}
                </div>

                {isFiltered && (
                    <p className="px-3.5 pb-1.5 text-[11.5px] text-gd-muted animate-fade-in">
                        Перетаскивание отключено во время поиска.
                    </p>
                )}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={fileIds} strategy={verticalListSortingStrategy} disabled={isFiltered}>
                        <div className="gd-group !overflow-visible [--gd-sep-inset:48px] gd-stagger">
                            {filteredFiles.map((file) => (
                                <FileRowItem
                                    key={file.id}
                                    file={file}
                                    hasError={validation.errorFileIds.has(file.id)}
                                    isDuplicate={validation.duplicateFileIds.has(file.id)}
                                    onEdit={onEditFile}
                                    onDelete={onDeleteFile}
                                    onDownload={onDownloadFile}
                                    isMatchedInTask={Boolean(file.cardId && taskCardIdsSet.has(file.cardId))}
                                />
                            ))}
                            {filteredFiles.length === 0 && (
                                <div className="gd-row justify-center text-[13px] text-gd-muted">Ничего не найдено</div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};
