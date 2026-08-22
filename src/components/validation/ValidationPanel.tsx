import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ValidationSummary } from '../../types';

interface ValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  validation: ValidationSummary;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  isOpen,
  onClose,
  validation,
}) => {
  const getBadgeForType = (type: string) => {
    switch (type) {
      case 'duplicate':
        return <Badge variant="danger" size="sm">Дубликат</Badge>;
      case 'invalid_chars':
        return <Badge variant="warning" size="sm">Спецсимволы</Badge>;
      case 'empty':
        return <Badge variant="danger" size="sm">Пустое имя</Badge>;
      case 'missing_ext':
        return <Badge variant="warning" size="sm">Расширение</Badge>;
      default:
        return <Badge variant="danger" size="sm">Ошибка</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ошибки валидации имён"
      maxWidth="md"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Закрыть
        </Button>
      }
    >
      <div className="space-y-3">
        {validation.errors.length === 0 ? (
          <div className="text-center py-6 text-emerald-700 font-semibold">
            Все имена файлов корректны и готовы к экспорту!
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600">
              Перед экспортом архива необходимо исправить следующие конфликты в именах файлов:
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {validation.errors.map((err, idx) => (
                <div
                  key={`${err.fileId}-${idx}`}
                  className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900 truncate block">
                        {err.fileName}
                      </span>
                      {getBadgeForType(err.type)}
                    </div>
                    <p className="text-[11px] text-rose-700">{err.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
