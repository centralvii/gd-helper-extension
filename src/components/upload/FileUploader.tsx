import React, { useRef } from 'react';
import {
    UploadCloud,
    FileArchive,
    FileCode,
    Plus,
    ArrowUpRight,
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
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => addGufInputRef.current?.click()}
                >
                    Добавить .guf
                </Button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.8)] ring-1 ring-inset ring-white/5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.12),_transparent_35%)]" />

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

                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/25 to-teal-500/15 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
                    <UploadCloud className="h-8 w-8" />
                </div>

                <div className="mb-2 space-y-1">
                    <h4 className="text-lg font-semibold text-slate-100">
                        Перетащите файлы сюда
                    </h4>
                    <p className="max-w-md text-xs leading-relaxed text-slate-400">
                        Поддерживается ZIP-архив или несколько отдельных файлов
                        .guf для пакетной обработки.
                    </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={
                            <FileArchive className="h-3.5 w-3.5 text-emerald-400" />
                        }
                        onClick={() => zipInputRef.current?.click()}
                    >
                        Выбрать ZIP
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={
                            <FileCode className="h-3.5 w-3.5 text-sky-400" />
                        }
                        onClick={() => gufInputRef.current?.click()}
                    >
                        Выбрать .guf
                    </Button>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-300">
                    <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                    Импорт пакета
                </div>
            </div>
        </div>
    );
};
