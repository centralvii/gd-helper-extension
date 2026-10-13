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
import { pluralizeRu, FILE_FORMS, ERROR_FORMS } from '../../utils/pluralize';

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
        <footer
            className="sticky z-30 mt-3 px-4 pt-2.5 pb-3 gd-glass border-t border-gd-border"
            style={{ bottom: 'var(--tabbar-h)' }}
        >
            {/* Имя архива + статус валидации */}
            <div className="flex items-center gap-2 mb-2 px-1 min-h-[24px]">
                <Archive className="w-3.5 h-3.5 text-gd-muted flex-shrink-0" />

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
                        className="flex-1 min-w-0 bg-white rounded-lg px-2 py-0.5 text-[12.5px] outline-none font-semibold text-slate-900 ring-2 ring-emerald-500/40"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => { setTempName(archiveName); setIsEditingName(true); }}
                        className="group flex flex-1 min-w-0 items-center gap-1 text-left cursor-pointer"
                        title="Нажмите для изменения имени архива"
                    >
                        <span className="text-[12.5px] font-medium truncate text-gd-muted group-hover:text-gd-green transition-colors">
                            {archiveName}
                        </span>
                        <PenLine className="w-3 h-3 text-gd-faint group-hover:text-gd-green transition-colors flex-shrink-0" />
                    </button>
                )}

                {validation.hasErrors ? (
                    <button
                        type="button"
                        onClick={onOpenValidation}
                        className="flex-shrink-0 cursor-pointer"
                        data-icon-anim="shake"
                    >
                        <Badge variant="danger" size="sm" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {validation.errors.length} {pluralizeRu(validation.errors.length, ERROR_FORMS)}
                        </Badge>
                    </button>
                ) : (
                    <Badge variant="success" size="sm" className="gap-1 flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Готово
                    </Badge>
                )}
            </div>

            {/* Экспорт */}
            <Button
                variant="primary"
                size="lg"
                className="w-full shadow-gd-green"
                isLoading={isExporting}
                disabled={validation.hasErrors || fileCount === 0}
                onClick={handleExport}
                leftIcon={<Download className="w-[18px] h-[18px]" />}
            >
                {isExporting ? 'Создание архива…' : `Экспорт ZIP · ${fileCount} ${pluralizeRu(fileCount, FILE_FORMS)}`}
            </Button>
        </footer>
    );
};
