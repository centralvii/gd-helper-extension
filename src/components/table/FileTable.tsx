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
    })
  );

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(
      (f) =>
        f.originalName.toLowerCase().includes(query) ||
        f.cleanName.toLowerCase().includes(query) ||
        f.newName.toLowerCase().includes(query)
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
    <div className="space-y-2.5">
      {/* Search & Actions Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Поиск по файлам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
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
        <div className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded-md px-2.5 py-1">
          Показано {filteredFiles.length} из {files.length} файлов. Перетаскивание отключено во время поиска.
        </div>
      )}

      {/* Sortable List */}
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
          <div className="space-y-1.5">
            {filteredFiles.map((file) => (
              <FileRowItem
                key={file.id}
                file={file}
                hasError={validation.errorFileIds.has(file.id)}
                isDuplicate={validation.duplicateFileIds.has(file.id)}
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
