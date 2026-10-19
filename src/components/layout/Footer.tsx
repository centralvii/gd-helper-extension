import React, { useRef, useState } from 'react';
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
import { pluralizeRu, FILE_FORMS, ERROR_FORMS } from '../../utils/pluralize';
import { CELEBRATION_COLORS } from '../../constants/theme';

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
    // Esc отменяет переименование: blur после этого не должен сохранять
    const cancelEditRef = useRef(false);

    const handleExport = async () => {
        if (validation.hasErrors || fileCount === 0 || isExporting) return;
        try {
            await onExportZip();
            confetti({
                particleCount: 90,
                spread: 70,
                origin: { y: 0.9 },
                colors: CELEBRATION_COLORS,
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
        <footer className="sticky z-30 mt-2 px-3 pb-2" style={{ bottom: 'var(--tabbar-h)' }}>
            <div className="gd-glass flex items-center gap-2 rounded-[24px] py-1.5 pl-3.5 pr-1.5">
                {/* Имя архива (тап — переименовать) */}
                {isEditingName ? (
                    <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={() => {
                            if (cancelEditRef.current) {
                                cancelEditRef.current = false;
                                return;
                            }
                            handleSaveArchiveName();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveArchiveName();
                            }
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelEditRef.current = true;
                                setIsEditingName(false);
                            }
                        }}
                        onFocus={(e) => {
                            // Выделяем имя без расширения — сразу можно печатать новое
                            const dot = e.currentTarget.value.toLowerCase().lastIndexOf('.zip');
                            e.currentTarget.setSelectionRange(0, dot > 0 ? dot : e.currentTarget.value.length);
                        }}
                        autoFocus
                        aria-label="Имя архива"
                        className="min-w-0 flex-1 rounded-lg bg-white px-2 py-1 font-mono text-[11.5px] text-slate-900 outline-none ring-2 ring-accent-500/40"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => { setTempName(archiveName); setIsEditingName(true); }}
                        className="group flex min-w-0 flex-1 items-center gap-1.5 text-left cursor-pointer !scale-100"
                        title="Нажмите, чтобы переименовать архив"
                    >
                        <Archive className="h-3.5 w-3.5 flex-shrink-0 text-gd-muted" />
                        <span className="truncate font-mono text-[11.5px] text-gd-muted transition-colors group-hover:text-gd-accent">
                            {archiveName}
                        </span>
                        <PenLine className="h-3 w-3 flex-shrink-0 text-gd-faint opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                )}

                {/* Статус проверки */}
                {validation.hasErrors ? (
                    <button
                        type="button"
                        onClick={onOpenValidation}
                        className="flex-shrink-0 cursor-pointer"
                        data-icon-anim="shake"
                        title="Открыть список ошибок"
                    >
                        <Badge variant="danger" size="sm" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validation.errors.length} {pluralizeRu(validation.errors.length, ERROR_FORMS)}
                        </Badge>
                    </button>
                ) : (
                    <span className="flex-shrink-0 text-gd-success" title="Готово к экспорту">
                        <CheckCircle2 className="h-4 w-4" />
                    </span>
                )}

                {/* Экспорт */}
                <Button
                    variant="primary"
                    size="md"
                    className="h-[38px] flex-shrink-0"
                    isLoading={isExporting}
                    disabled={validation.hasErrors || fileCount === 0}
                    onClick={handleExport}
                    title={
                        validation.hasErrors
                            ? 'Экспорт недоступен: исправьте ошибки в именах файлов'
                            : `Экспорт ZIP · ${fileCount} ${pluralizeRu(fileCount, FILE_FORMS)}`
                    }
                    leftIcon={<Download className="h-4 w-4" />}
                >
                    {isExporting ? 'Сборка…' : 'Экспорт ZIP'}
                </Button>
            </div>
        </footer>
    );
};
