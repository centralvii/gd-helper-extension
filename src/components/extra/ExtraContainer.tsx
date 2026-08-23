import React, { useState } from 'react';
import { Wand2, Palette } from 'lucide-react';
import { ExtraSubTool } from '../../types';
import { AlgorithmIdGenerator } from './AlgorithmIdGenerator';
import { SiteCssStyler } from './SiteCssStyler';

export const ExtraContainer: React.FC = () => {
  const [activeSubTool, setActiveSubTool] = useState<ExtraSubTool>('alg_generator');

  return (
    <div className="space-y-3">
      {/* ── Sub-tool Switcher Toolbar ── */}
      <div className="flex items-center justify-between gap-1.5 p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm">
        <button
          type="button"
          onClick={() => setActiveSubTool('alg_generator')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeSubTool === 'alg_generator'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Генератор ID алгоритмов</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTool('site_css')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeSubTool === 'site_css'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-emerald-600" />
          <span>CSS стили сайтов</span>
        </button>
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
