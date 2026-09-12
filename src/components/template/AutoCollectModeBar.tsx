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
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
      {/* Indicator & Label */}
      <button
        type="button"
        onClick={onToggleAutoCollect}
        title={
          isAutoCollectEnabled
            ? 'Автосбор активен. Нажмите для паузы'
            : 'Автосбор на паузе. Нажмите для включения'
        }
        className="flex items-center gap-1.5 text-left cursor-pointer group min-w-0"
      >
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
            isAutoCollectEnabled
              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.8)] animate-pulse'
              : 'bg-slate-300 group-hover:bg-slate-400'
          }`}
        />
        <span className="font-bold text-[11px] text-slate-700 whitespace-nowrap">
          Имя при автосборе:
        </span>
      </button>

      {/* Segmented Switcher — fixed weight and colors transition to prevent layout jitter */}
      <div className="inline-flex items-center p-0.5 bg-slate-100/90 border border-slate-200/90 rounded-xl shadow-2xs flex-shrink-0">
        <button
          type="button"
          onClick={() => onChangeNamingMode('pageName')}
          title="Называть файл по названию открытой страницы в GreenData"
          className={`inline-flex items-center justify-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-semibold leading-none select-none transition-colors duration-150 cursor-pointer ${
            namingMode === 'pageName'
              ? 'bg-white text-emerald-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 bg-transparent'
          }`}
        >
          <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
          <span className="whitespace-nowrap">Со страницы</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeNamingMode('original')}
          title="Сохранять исходное имя скачиваемого файла"
          className={`inline-flex items-center justify-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-semibold leading-none select-none transition-colors duration-150 cursor-pointer ${
            namingMode === 'original'
              ? 'bg-white text-slate-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 bg-transparent'
          }`}
        >
          <FileText className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="whitespace-nowrap">Исходное</span>
        </button>
      </div>
    </div>
  );
};
