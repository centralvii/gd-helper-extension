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
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.9 }, colors: ['#22c55e', '#16a34a', '#4ade80'] });
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
            className="sticky bottom-0 z-30 p-3"
            style={{
                background: 'rgba(8,13,8,0.95)',
                borderTop: '1px solid rgba(34,197,94,0.14)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
            }}
        >
            {/* Status bar row */}
            <div
                className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded-lg text-xs"
                style={{
                    background: 'rgba(13,21,13,0.8)',
                    border: '1px solid rgba(34,197,94,0.10)',
                    fontFamily: 'monospace',
                }}
            >
                <Icon24ArchiveOutline width={13} height={13} style={{ color: '#22c55e', flexShrink: 0 }} />

                <span style={{ color: '#6b9a6b' }}>ARCHIVE:</span>

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
                        className="flex-1 bg-transparent outline-none text-xs"
                        style={{ color: '#d4edda', fontFamily: 'monospace' }}
                    />
                ) : (
                    <button
                        onClick={() => { setTempName(archiveName); setIsEditingName(true); }}
                        className="group flex flex-1 items-center gap-1.5 text-left truncate"
                        style={{ color: '#d4edda' }}
                        title="Нажмите для изменения имени архива"
                    >
                        <span className="truncate">{archiveName}</span>
                        <Icon24PenOutline
                            width={11} height={11}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            style={{ color: '#6b9a6b' }}
                        />
                    </button>
                )}

                <span style={{ color: '#3d5c3d' }}>·</span>
                <span style={{ color: '#6b9a6b' }}>{fileCount} files</span>

                <div className="ml-auto">
                    {validation.hasErrors ? (
                        <button onClick={onOpenValidation} className="hover:opacity-90 transition-opacity">
                            <Badge variant="danger" size="sm" className="cursor-pointer gap-1">
                                <Icon16WarningTriangleOutline width={10} height={10} />
                                {validation.errors.length} {validation.errors.length === 1 ? 'ошибка' : 'ошибок'}
                            </Badge>
                        </button>
                    ) : (
                        <Badge variant="success" size="sm" className="gap-1">
                            <Icon16CheckCircleOutline width={10} height={10} />
                            READY
                        </Badge>
                    )}
                </div>
            </div>

            {/* Export button */}
            <Button
                variant="emerald"
                size="md"
                className="w-full font-bold tracking-wide"
                style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }}
                isLoading={isExporting}
                disabled={validation.hasErrors || fileCount === 0}
                onClick={handleExport}
                leftIcon={<Icon20DownloadOutline width={16} height={16} />}
            >
                {isExporting ? '[ УПАКОВКА... ]' : `[ ЭКСПОРТ ZIP · ${fileCount} файлов ]`}
            </Button>
        </footer>
    );
};
