import React from 'react';
import { Sparkles, FileText } from 'lucide-react';
import { AutoCollectNamingMode } from '../../types';

interface AutoCollectModeBarProps {
  namingMode: AutoCollectNamingMode;
  onChangeNamingMode: (mode: AutoCollectNamingMode) => void;
  isAutoCollectEnabled: boolean;
  onToggleAutoCollect: () => void;
}

export const AutoCollectModeBar: React.FC<AutoCollectModeBarProps> = ({
  namingMode,
  onChangeNamingMode,
  isAutoCollectEnabled,
  onToggleAutoCollect,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs transition-all animate-fade-in">
      {/* Status & Label (clickable to toggle auto-collect) */}
      <button
        type="button"
        onClick={onToggleAutoCollect}
        title={
          isAutoCollectEnabled
            ? 'Автосбор ВКЛЮЧЕН. Нажмите для паузы'
            : 'Автосбор ВЫКЛЮЧЕН. Нажмите для включения'
        }
        className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer min-w-0 flex-1 text-left"
      >
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
            isAutoCollectEnabled
              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.8)] animate-pulse'
              : 'bg-slate-300'
          }`}
        />
        <span className="font-bold text-[11px] text-slate-800 whitespace-nowrap flex-shrink-0">
          Автосбор .guf:
        </span>
        <span className="text-[10px] truncate min-w-0">
          {isAutoCollectEnabled ? (
            <span className="text-emerald-600 font-semibold">активен</span>
          ) : (
            <span className="text-slate-400">на паузе</span>
          )}
        </span>
      </button>

      {/* Segmented Switcher */}
      <div className="flex items-center p-0.5 bg-slate-100/90 border border-slate-200/90 rounded-xl text-[11px] font-medium shadow-2xs flex-shrink-0">
        <button
          type="button"
          onClick={() => onChangeNamingMode('pageName')}
          title="Режим: брать название со страницы / алгоритма GreenData"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            namingMode === 'pageName'
              ? 'bg-white text-emerald-700 font-bold shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
          <span className="whitespace-nowrap">Из алгоритма</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeNamingMode('original')}
          title="Режим: обычное название файла без изменения со страницы"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            namingMode === 'original'
              ? 'bg-white text-slate-800 font-bold shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="whitespace-nowrap">Обычное</span>
        </button>
      </div>
    </div>
  );
};
