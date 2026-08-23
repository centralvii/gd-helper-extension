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
      {/* ── Sub-tool Switcher ── */}
      {/*
        Key design fix: BOTH buttons always have the same border (1.5px).
        Active  → border-emerald-300, bg-emerald-50, text-emerald-800
        Inactive → border-transparent, bg-transparent, text-gray-500
        This prevents any layout jump when switching tabs.
      */}
      <div
        className="flex items-stretch gap-1 p-1 rounded-xl"
        style={{ background: '#f0f4f0', border: '1px solid #e2e8e2' }}
      >
        {SUB_TOOLS.map((tool) => {
          const isActive = activeSubTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => handleSetSubTool(tool.id)}
              className={[
                'flex flex-1 items-center justify-center gap-1.5',
                'rounded-lg px-2 py-2',
                'text-xs font-semibold',
                'border',          // always 1px border — no layout shift
                'transition-colors duration-150',
                'min-w-0',         // allow text to shrink
                isActive
                  ? 'bg-white border-emerald-300 text-emerald-800 shadow-sm'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-800 hover:bg-white/60',
              ].join(' ')}
            >
              {/* Icon always visible */}
              <span className={`flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                {tool.icon}
              </span>
              {/* Label — truncates gracefully on very narrow panels */}
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
