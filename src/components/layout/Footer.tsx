import React, { useState } from 'react';
import { Download, AlertTriangle, CheckCircle2, FileArchive, Edit2 } from 'lucide-react';
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
    <footer className="sticky bottom-0 z-30 bg-slate-900/95 border-t border-slate-800 p-3 backdrop-blur-md space-y-2.5">
      {/* Archive name & Validation Status */}
      <div className="flex items-center justify-between text-xs gap-2">
        {/* Archive Name Editor */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <FileArchive className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
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
              className="bg-slate-800 text-slate-100 text-xs px-1.5 py-0.5 rounded border border-emerald-500 focus:outline-none w-full"
            />
          ) : (
            <button
              onClick={() => {
                setTempName(archiveName);
                setIsEditingName(true);
              }}
              title="Нажмите для изменения имени архива"
              className="text-slate-300 hover:text-emerald-400 truncate flex items-center gap-1 group text-left"
            >
              <span className="truncate">{archiveName}</span>
              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-slate-400" />
            </button>
          )}
        </div>

        {/* Validation Status Chip */}
        <div>
          {validation.hasErrors ? (
            <button
              onClick={onOpenValidation}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <Badge variant="danger" size="sm" className="cursor-pointer">
                <AlertTriangle className="w-3 h-3" />
                {validation.errors.length} {validation.errors.length === 1 ? 'ошибка' : 'ошибок'}
              </Badge>
            </button>
          ) : (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3" />
              Готово
            </Badge>
          )}
        </div>
      </div>

      {/* Export Action Button */}
      <Button
        variant="emerald"
        size="md"
        className="w-full font-semibold shadow-lg shadow-emerald-950/60"
        isLoading={isExporting}
        disabled={validation.hasErrors || fileCount === 0}
        onClick={handleExport}
        leftIcon={<Download className="w-4 h-4" />}
      >
        {isExporting ? 'Сборка архива...' : `Экспорт ZIP (${fileCount} файлов)`}
      </Button>
    </footer>
  );
};
