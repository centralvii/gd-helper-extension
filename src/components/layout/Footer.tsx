import React, { useState } from 'react';
import {
    Icon24ArchiveOutline,
    Icon20DownloadOutline,
    Icon16WarningTriangleOutline,
    Icon16CheckCircleOutline,
    Icon24PenOutline,
} from '@vkontakte/icons';
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
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.9 }, colors: ['#22c55e', '#16a34a', '#86efac'] });
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
            className="sticky bottom-0 z-30 p-2.5"
            style={{
                background: '#ffffff',
                borderTop: '1px solid #e2e8e2',
                boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
            }}
        >
            {/* Имя архива + статус */}
            <div
                className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg"
                style={{ background: '#f0f4f0', border: '1px solid #e2e8e2' }}
            >
                {/* Иконка архива с bounce-анимацией */}
                <span className="icon-btn p-0" style={{ color: '#22c55e', pointerEvents: 'none' }}>
                    <Icon24ArchiveOutline width={15} height={15} />
                </span>

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
                        className="flex-1 bg-transparent text-xs outline-none font-medium"
                        style={{ color: '#111827' }}
                    />
                ) : (
                    <button
                        onClick={() => { setTempName(archiveName); setIsEditingName(true); }}
                        className="group flex flex-1 items-center gap-1.5 text-left truncate"
                        title="Нажмите для изменения имени архива"
                    >
                        <span className="text-xs font-semibold truncate" style={{ color: '#111827' }}>
                            {archiveName}
                        </span>
                        {/* Pen icon с pop-анимацией */}
                        <span className="icon-btn p-0 opacity-0 group-hover:opacity-100">
                            <Icon24PenOutline width={13} height={13} />
                        </span>
                    </button>
                )}

                <span className="text-[10px] font-medium" style={{ color: '#6b7280' }}>
                    {fileCount} файлов
                </span>

                {/* Статус */}
                <div className="ml-auto flex-shrink-0">
                    {validation.hasErrors ? (
                        <button onClick={onOpenValidation} className="hover:opacity-80 transition-opacity">
                            <Badge variant="danger" size="sm" className="cursor-pointer gap-1">
                                <Icon16WarningTriangleOutline width={10} height={10} />
                                {validation.errors.length} ошибок
                            </Badge>
                        </button>
                    ) : (
                        <Badge variant="success" size="sm" className="gap-1">
                            <Icon16CheckCircleOutline width={10} height={10} />
                            Готово
                        </Badge>
                    )}
                </div>
            </div>

            {/* Кнопка экспорта */}
            <Button
                variant="emerald"
                size="md"
                className="w-full font-bold"
                isLoading={isExporting}
                disabled={validation.hasErrors || fileCount === 0}
                onClick={handleExport}
                leftIcon={<Icon20DownloadOutline width={16} height={16} />}
            >
                {isExporting ? 'Создание архива...' : `Экспорт ZIP (${fileCount} файлов)`}
            </Button>
        </footer>
    );
};
