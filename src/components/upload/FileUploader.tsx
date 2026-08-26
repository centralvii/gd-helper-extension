import React, { useRef } from 'react';
import {
    UploadCloud,
    FileArchive,
    FileCode,
    Plus,
    Sparkles,
} from 'lucide-react';
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
                    leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
                    onClick={() => addGufInputRef.current?.click()}
                >
                    Добавить .guf
                </Button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-emerald-300/80 bg-white p-7 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group">
            <div className="relative flex flex-col items-center justify-center text-center">
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

                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 transition-transform group-hover:scale-105">
                    <UploadCloud className="h-8 w-8" />
                </div>

                <div className="mb-2 space-y-1.5">
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">
                        Перетащите файлы пакета сюда
                    </h4>
                    <p className="max-w-md text-xs leading-relaxed text-slate-500">
                        Поддерживается ZIP-архив или отдельные файлы <code className="text-emerald-700 font-mono font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">.guf</code> для пакетного переименования.
                    </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={
                            <FileArchive className="h-3.5 w-3.5 text-emerald-600" />
                        }
                        onClick={() => zipInputRef.current?.click()}
                    >
                        Выбрать ZIP
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={
                            <FileCode className="h-3.5 w-3.5 text-sky-600" />
                        }
                        onClick={() => gufInputRef.current?.click()}
                    >
                        Выбрать .guf
                    </Button>
                </div>

                <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-emerald-800 shadow-2xs">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    Быстрый импорт
                </div>
            </div>
        </div>
    );
};
