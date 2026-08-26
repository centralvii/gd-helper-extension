import React, { useState } from 'react';
import {
    Archive,
    Download,
    AlertTriangle,
    CheckCircle2,
    PenLine,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ValidationSummary } from '../../types';

interface FooterProps {
    fileCount: number;
    validation: ValidationSummary;
    archiveName: string;
    isExporting: boolean;
    onSetArchiveName: (name: string) => void;
    onExportZip: () => Promise<void>;
    onOpenValidation: () => void;
}

export const Footer: React.FC<FooterProps> = ({
    fileCount,
    validation,
    archiveName,
    isExporting,
    onSetArchiveName,
    onExportZip,
    onOpenValidation,
}) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(archiveName);

    const handleExport = async () => {
        if (validation.hasErrors || fileCount === 0 || isExporting) return;
        try {
            await onExportZip();
            confetti({
                particleCount: 90,
                spread: 70,
                origin: { y: 0.9 },
                colors: ['#059669', '#10b981', '#34d399', '#6ee7b7'],
            });
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const handleSaveArchiveName = () => {
        let name = tempName.trim();
        if (!name) name = 'renamed_files.zip';
        if (!name.endsWith('.zip')) name += '.zip';
        onSetArchiveName(name);
        setIsEditingName(false);
    };

    if (fileCount === 0) return null;

    return (
        <footer className="sticky bottom-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            {/* Archive name + validation status bar */}
            <div className="flex items-center gap-2 mb-2.5 px-3 py-2 rounded-xl bg-slate-50/90 border border-slate-200/80 shadow-2xs">
                {/* Archive icon */}
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-2xs font-bold">
                    <Archive className="w-3.5 h-3.5" />
                </div>

                {isEditingName ? (
                    <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={handleSaveArchiveName}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveArchiveName();
                            if (e.key === 'Escape') setIsEditingName(false);
                        }}
                        autoFocus
                        className="flex-1 bg-white border border-emerald-400 rounded-lg px-2 py-0.5 text-xs outline-none font-bold text-slate-900 shadow-2xs"
                    />
                ) : (
                    <button
                        onClick={() => { setTempName(archiveName); setIsEditingName(true); }}
                        className="group flex flex-1 items-center gap-1.5 text-left truncate cursor-pointer"
                        title="Нажмите для изменения имени архива"
                    >
                        <span className="text-xs font-bold truncate text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {archiveName}
                        </span>
                        <PenLine className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                )}

                <span className="text-[10.5px] font-semibold text-slate-500 hidden xs:inline">
                    {fileCount} {fileCount === 1 ? 'файл' : 'файлов'}
                </span>

                {/* Validation Status Badge */}
                <div className="ml-auto flex-shrink-0">
                    {validation.hasErrors ? (
                        <button
                            onClick={onOpenValidation}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <Badge variant="danger" size="xs" dot className="gap-1 shadow-2xs">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {validation.errors.length} {validation.errors.length === 1 ? 'ошибка' : 'ошибок'}
                            </Badge>
                        </button>
                    ) : (
                        <Badge variant="success" size="xs" dot className="gap-1 shadow-2xs">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Готово к экспорту
                        </Badge>
                    )}
                </div>
            </div>

            {/* Export ZIP Button */}
            <Button
                variant="emerald"
                size="md"
                className="w-full font-bold shadow-md shadow-emerald-600/20"
                isLoading={isExporting}
                disabled={validation.hasErrors || fileCount === 0}
                onClick={handleExport}
                leftIcon={<Download className="w-4 h-4" />}
            >
                {isExporting ? 'Создание архива...' : `Экспорт ZIP (${fileCount} ${fileCount === 1 ? 'файл' : 'файлов'})`}
            </Button>
        </footer>
    );
};
