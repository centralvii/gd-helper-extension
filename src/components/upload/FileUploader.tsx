import React, { useRef } from 'react';
import { UploadCloud, FileArchive, FileCode, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface FileUploaderProps {
  onLoadZip: (file: File) => Promise<void>;
  onLoadGufFiles: (files: File[]) => void;
  onAddFiles?: (files: File[]) => void;
  isCompact?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onLoadZip,
  onLoadGufFiles,
  onAddFiles,
  isCompact = false,
}) => {
  const zipInputRef = useRef<HTMLInputElement>(null);
  const gufInputRef = useRef<HTMLInputElement>(null);
  const addGufInputRef = useRef<HTMLInputElement>(null);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLoadZip(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleGufChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onLoadGufFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleAddFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAddFiles) {
      onAddFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  if (isCompact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={addGufInputRef}
          type="file"
          accept=".guf"
          multiple
          className="hidden"
          onChange={handleAddFilesChange}
        />
        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => addGufInputRef.current?.click()}
        >
          Добавить .guf
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 transition-all duration-200 text-center group">
      {/* Hidden file inputs */}
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleZipChange}
      />
      <input
        ref={gufInputRef}
        type="file"
        accept=".guf"
        multiple
        className="hidden"
        onChange={handleGufChange}
      />

      <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform mb-3 shadow-inner">
        <UploadCloud className="w-6 h-6" />
      </div>

      <h4 className="text-sm font-semibold text-slate-200 mb-1">
        Перетащите файлы сюда
      </h4>
      <p className="text-xs text-slate-400 max-w-xs mb-4">
        Поддерживается загрузка одного ZIP-архива или нескольких отдельных файлов .guf
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<FileArchive className="w-3.5 h-3.5 text-emerald-400" />}
          onClick={() => zipInputRef.current?.click()}
        >
          Выбрать ZIP
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<FileCode className="w-3.5 h-3.5 text-teal-400" />}
          onClick={() => gufInputRef.current?.click()}
        >
          Выбрать .guf файлы
        </Button>
      </div>
    </div>
  );
};
