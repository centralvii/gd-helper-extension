import React, { useRef } from 'react';
import {
    UploadCloud,
    FileArchive,
    FileCode,
    Plus,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface FileUploaderProps {
    onLoadZip?: (file: File) => Promise<void>;
    onLoadGufFiles?: (files: File[]) => void;
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
        if (e.target.files && e.target.files[0] && onLoadZip) {
            onLoadZip(e.target.files[0]);
            e.target.value = '';
        }
    };

    const handleGufChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && onLoadGufFiles) {
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
                    variant="outline"
                    size="sm"
                    className="!h-[34px]"
                    leftIcon={<Plus className="w-4 h-4" strokeWidth={2.5} />}
                    onClick={() => addGufInputRef.current?.click()}
                    title="Добавить .guf файлы в пакет"
                >
                    .guf
                </Button>
            </div>
        );
    }

    return (
        <div className="gd-group relative px-5 py-8 text-center animate-pop-in">
            <input ref={zipInputRef} type="file" accept=".zip" className="hidden" onChange={handleZipChange} />
            <input ref={gufInputRef} type="file" accept=".guf" multiple className="hidden" onChange={handleGufChange} />

            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[18px] bg-gd-green text-white shadow-gd-green">
                <UploadCloud className="h-8 w-8" />
            </div>
            <h4 className="text-[17px] font-semibold tracking-[-0.02em] text-slate-900">Перетащите файлы пакета</h4>
            <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-snug text-gd-muted">
                ZIP-архив или отдельные файлы <span className="font-mono text-slate-700">.guf</span> — в любое место окна
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Button
                    variant="primary"
                    size="md"
                    leftIcon={<FileArchive className="h-4 w-4" />}
                    onClick={() => zipInputRef.current?.click()}
                >
                    Выбрать ZIP
                </Button>
                <Button
                    variant="secondary"
                    size="md"
                    leftIcon={<FileCode className="h-4 w-4" />}
                    onClick={() => gufInputRef.current?.click()}
                >
                    Файлы .guf
                </Button>
            </div>
        </div>
    );
};
