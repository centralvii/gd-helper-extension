import React, { useState } from 'react';
import {
    Download,
    AlertTriangle,
    CheckCircle2,
    FileArchive,
    Edit2,
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
                particleCount: 80,
                spread: 60,
                origin: { y: 0.9 },
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
        <footer className="sticky bottom-0 z-30 border-t border-white/10 bg-slate-950/80 p-3 backdrop-blur-xl shadow-[0_-12px_30px_rgba(2,6,23,0.56)]">
            <div className="space-y-2.5 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900 to-slate-950/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-2.5 py-1.5">
                        <FileArchive className="h-3.5 w-3.5 flex-shrink-0 text-emerald-300" />

                        {isEditingName ? (
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleSaveArchiveName}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter')
                                        handleSaveArchiveName();
                                    if (e.key === 'Escape')
                                        setIsEditingName(false);
                                }}
                                autoFocus
                                className="w-full bg-transparent px-0 py-0 text-xs text-slate-100 outline-none"
                            />
                        ) : (
                            <button
                                onClick={() => {
                                    setTempName(archiveName);
                                    setIsEditingName(true);
                                }}
                                title="Нажмите для изменения имени архива"
                                className="group flex min-w-0 flex-1 items-center gap-1.5 text-left text-slate-300 transition-colors hover:text-emerald-300"
                            >
                                <span className="truncate font-medium">
                                    {archiveName}
                                </span>
                                <Edit2 className="h-2.5 w-2.5 shrink-0 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
                            </button>
                        )}
                    </div>

                    <div>
                        {validation.hasErrors ? (
                            <button
                                onClick={onOpenValidation}
                                className="hover:opacity-90 transition-opacity"
                            >
                                <Badge
                                    variant="danger"
                                    size="sm"
                                    className="cursor-pointer"
                                >
                                    <AlertTriangle className="h-3 w-3" />
                                    {validation.errors.length}{' '}
                                    {validation.errors.length === 1
                                        ? 'ошибка'
                                        : 'ошибок'}
                                </Badge>
                            </button>
                        ) : (
                            <Badge variant="success" size="sm">
                                <CheckCircle2 className="h-3 w-3" />
                                Готово
                            </Badge>
                        )}
                    </div>
                </div>

                <Button
                    variant="emerald"
                    size="md"
                    className="w-full font-semibold shadow-[0_18px_28px_rgba(16,185,129,0.22)]"
                    isLoading={isExporting}
                    disabled={validation.hasErrors || fileCount === 0}
                    onClick={handleExport}
                    leftIcon={<Download className="h-4 w-4" />}
                >
                    {isExporting
                        ? 'Сборка архива...'
                        : `Экспорт ZIP (${fileCount} файлов)`}
                </Button>
            </div>
        </footer>
    );
};
