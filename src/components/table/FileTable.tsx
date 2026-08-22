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
import { FileRow, ValidationSummary } from '../../types';
import { FileRowItem } from './FileRowItem';
import { FileUploader } from '../upload/FileUploader';

interface FileTableProps {
    files: FileRow[];
    validation: ValidationSummary;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onEditFile: (file: FileRow) => void;
    onDeleteFile: (id: string) => void;
    onAddFiles: (files: File[]) => void;
}

export const FileTable: React.FC<FileTableProps> = ({
    files,
    validation,
    onReorder,
    onEditFile,
    onDeleteFile,
    onAddFiles,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

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
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Поиск по файлам..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500"
                    />
                </div>

                <FileUploader
                    isCompact
                    onLoadZip={async () => {}}
                    onLoadGufFiles={() => {}}
                    onAddFiles={onAddFiles}
                />
            </div>

            {isFiltered && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200">
                    Показано {filteredFiles.length} из {files.length} файлов.
                    Перетаскивание отключено во время поиска.
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={filteredFiles.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                    disabled={isFiltered}
                >
                    <div className="space-y-2">
                        {filteredFiles.map((file) => (
                            <FileRowItem
                                key={file.id}
                                file={file}
                                hasError={validation.errorFileIds.has(file.id)}
                                isDuplicate={validation.duplicateFileIds.has(
                                    file.id,
                                )}
                                onEdit={onEditFile}
                                onDelete={onDeleteFile}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};
