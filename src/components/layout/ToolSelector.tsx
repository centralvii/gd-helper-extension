import React from 'react';
import { Package, FileEdit } from 'lucide-react';
import { ActiveTool } from '../../types';

interface ToolSelectorProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  fileCount: number;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  activeTool,
  onSelectTool,
  fileCount,
}) => {
  return (
    <div className="px-3 pt-2 pb-1 bg-slate-900 border-b border-slate-800/80">
      <div className="flex items-center p-1 bg-slate-950/90 rounded-xl border border-slate-800/90 shadow-inner">
        {/* Tool 1: Упаковка (guf-packer) */}
        <button
          onClick={() => onSelectTool('packer')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTool === 'packer'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Package className={`w-3.5 h-3.5 ${activeTool === 'packer' ? 'text-emerald-200' : 'text-slate-400'}`} />
          <span>Упаковка</span>
          {fileCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTool === 'packer'
                  ? 'bg-emerald-800/80 text-emerald-100'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {fileCount}
            </span>
          )}
        </button>

        {/* Tool 2: Реализация */}
        <button
          onClick={() => onSelectTool('implementation')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTool === 'implementation'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileEdit className={`w-3.5 h-3.5 ${activeTool === 'implementation' ? 'text-emerald-200' : 'text-slate-400'}`} />
          <span>Реализация</span>
        </button>
      </div>
    </div>
  );
};
