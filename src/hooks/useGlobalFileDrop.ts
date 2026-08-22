import { useState, useEffect, useCallback } from 'react';

interface UseGlobalFileDropOptions {
  onDropZip: (file: File) => void;
  onDropGufFiles: (files: File[]) => void;
}

export function useGlobalFileDrop({ onDropZip, onDropGufFiles }: UseGlobalFileDropOptions) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if dragging files
    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the window/document
    if (e.clientX === 0 || e.clientY === 0 || e.relatedTarget === null) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);

      if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) {
        return;
      }

      const droppedFiles = Array.from(e.dataTransfer.files);
      const zipFile = droppedFiles.find((f) => f.name.toLowerCase().endsWith('.zip'));

      if (zipFile) {
        onDropZip(zipFile);
      } else {
        const gufFiles = droppedFiles.filter((f) => f.name.toLowerCase().endsWith('.guf'));
        if (gufFiles.length > 0) {
          onDropGufFiles(gufFiles);
        }
      }
    },
    [onDropZip, onDropGufFiles]
  );

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);

  return { isDraggingOver };
}
