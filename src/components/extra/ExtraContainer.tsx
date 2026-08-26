import React, { useState } from 'react';
import { Wand2, Palette } from 'lucide-react';
import { ExtraSubTool } from '../../types';
import { AlgorithmIdGenerator } from './AlgorithmIdGenerator';
import { SiteCssStyler } from './SiteCssStyler';

const SUB_TOOLS: { id: ExtraSubTool; label: string; icon: React.ReactNode }[] = [
  { id: 'alg_generator', label: 'Генератор ID алгоритмов', icon: <Wand2 className="w-3.5 h-3.5 flex-shrink-0" /> },
  { id: 'site_css',      label: 'CSS стили сайтов',        icon: <Palette className="w-3.5 h-3.5 flex-shrink-0" /> },
];

const SUBTOOL_KEY = 'gd-helper-extra-subtool';

export const ExtraContainer: React.FC = () => {
  const [activeSubTool, setActiveSubTool] = useState<ExtraSubTool>(() => {
    try {
      const saved = localStorage.getItem(SUBTOOL_KEY);
      if (saved === 'alg_generator' || saved === 'site_css') return saved as ExtraSubTool;
    } catch { /* ignore */ }
    return 'alg_generator';
  });

  const handleSetSubTool = (id: ExtraSubTool) => {
    setActiveSubTool(id);
    try { localStorage.setItem(SUBTOOL_KEY, id); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-3">
      {/* ── Sub-tool Switcher (Segmented Control) ── */}
      <div className="flex items-stretch gap-1 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-2xs">
        {SUB_TOOLS.map((tool) => {
          const isActive = activeSubTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => handleSetSubTool(tool.id)}
              className={[
                'flex flex-1 items-center justify-center gap-2',
                'rounded-xl px-3 py-2',
                'text-xs font-bold',
                'border',
                'transition-all duration-150 cursor-pointer',
                'min-w-0',
                isActive
                  ? 'bg-white border-emerald-300 text-emerald-900 shadow-xs'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/60',
              ].join(' ')}
            >
              <span className={`flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {tool.icon}
              </span>
              <span className="truncate leading-tight text-center">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Sub-tool View ── */}
      {activeSubTool === 'alg_generator' ? (
        <AlgorithmIdGenerator />
      ) : (
        <SiteCssStyler />
      )}
    </div>
  );
};
