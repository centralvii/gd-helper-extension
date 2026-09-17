import React from 'react';
import { Sparkles, FileText } from 'lucide-react';
import { AutoCollectNamingMode } from '../../types';
import { SegmentedControl } from '../ui/SegmentedControl';

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
    <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs min-w-0">
      {/* Indicator & Label */}
      <button
        type="button"
        onClick={onToggleAutoCollect}
        title={
          isAutoCollectEnabled
            ? 'Автосбор активен. Нажмите для паузы'
            : 'Автосбор на паузе. Нажмите для включения'
        }
        className="flex items-center gap-1.5 text-left cursor-pointer group min-w-0 flex-shrink-0"
      >
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
            isAutoCollectEnabled
              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.8)] animate-pulse'
              : 'bg-slate-300 group-hover:bg-slate-400'
          }`}
        />
        <span className="font-bold text-[11px] text-slate-700 whitespace-nowrap">
          <span className="hidden sm:inline">Имя при автосборе:</span>
          <span className="sm:hidden">Автосбор:</span>
        </span>
      </button>

      {/* Segmented Switcher */}
      <SegmentedControl<AutoCollectNamingMode>
        value={namingMode}
        onChange={onChangeNamingMode}
        size="xs"
        options={[
          {
            value: 'pageName',
            label: 'Со страницы',
            icon: <Sparkles className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />,
            title: 'Называть файл по названию открытой страницы в GreenData',
          },
          {
            value: 'original',
            label: 'Исходное',
            icon: <FileText className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />,
            title: 'Сохранять исходное имя скачиваемого файла',
          },
        ]}
      />
    </div>
  );
};
