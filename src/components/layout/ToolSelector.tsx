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
    <div className="px-3 pt-2 pb-1 bg-white border-b border-gray-200">
      <div className="flex items-center p-1 bg-gray-50 rounded-xl border border-gray-200">
        {/* Tool 1: Упаковка (guf-packer) */}
        <button
          onClick={() => onSelectTool('packer')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTool === 'packer'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Package className={`w-3.5 h-3.5 ${activeTool === 'packer' ? 'text-white' : 'text-gray-500'}`} />
          <span>Упаковка</span>
          {fileCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTool === 'packer'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-gray-200 text-gray-700'
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
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FileEdit className={`w-3.5 h-3.5 ${activeTool === 'implementation' ? 'text-white' : 'text-gray-500'}`} />
          <span>Реализация</span>
        </button>
      </div>
    </div>
  );
};
