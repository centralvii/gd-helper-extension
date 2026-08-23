import React, { useState, useEffect } from 'react';
import { Globe, Code2, Sparkles, Check, BookmarkPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SiteCssRule } from '../../types';

interface CssRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, urlPattern: string, css: string) => void;
  initialRule?: SiteCssRule | null;
  onGetCurrentUrl: () => Promise<string | null>;
}

const SNIPPETS = [
  {
    name: 'Скрыть элемент',
    code: '/* Скрыть элемент */\n.banner, #ads {\n  display: none !important;\n}',
  },
  {
    name: 'Моноширинный шрифт',
    code: '/* Моноширинный шрифт кодовых блоков и сумм */\npre, code, .amount {\n  font-family: "JetBrains Mono", Consolas, monospace !important;\n}',
  },
  {
    name: 'Акцент GreenData',
    code: '/* Зеленый акцент GreenData */\n:root {\n  --primary: #22c55e !important;\n}\n.active, .selected {\n  border-color: #22c55e !important;\n}',
  },
  {
    name: 'Компактные таблицы',
    code: '/* Уменьшенные отступы в строках таблиц */\ntable td, table th {\n  padding: 4px 8px !important;\n  font-size: 12px !important;\n}',
  },
];

export const CssRuleModal: React.FC<CssRuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRule,
  onGetCurrentUrl,
}) => {
  const [name, setName] = useState('');
  const [urlPattern, setUrlPattern] = useState('');
  const [css, setCss] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRule) {
      setName(initialRule.name);
      setUrlPattern(initialRule.urlPattern);
      setCss(initialRule.css);
    } else {
      setName('');
      setUrlPattern('');
      setCss('');
    }
    setError(null);
  }, [initialRule, isOpen]);

  const handlePasteCurrentUrl = async () => {
    const url = await onGetCurrentUrl();
    if (url) {
      try {
        const parsed = new URL(url);
        setUrlPattern(`*://${parsed.hostname}/*`);
      } catch {
        setUrlPattern(url);
      }
    }
  };

  const handleApplySnippet = (snippetCode: string) => {
    if (!css.trim()) {
      setCss(snippetCode);
    } else {
      setCss((prev) => `${prev}\n\n${snippetCode}`);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Укажите название правила');
      return;
    }
    if (!urlPattern.trim()) {
      setError('Укажите шаблон URL или домен сайта');
      return;
    }
    if (!css.trim()) {
      setError('Введите хотя бы одно правило CSS');
      return;
    }

    onSave(name.trim(), urlPattern.trim(), css);
    onClose();
  };

  const handleAddImportant = () => {
    if (!css.trim()) return;
    const fixed = css.replace(/([^;{}]+?)(;|\s*(?=}))/g, (match, propVal, terminator) => {
      if (propVal.includes('{') || propVal.includes('/*') || propVal.includes('*/') || propVal.includes('@') || !propVal.includes(':')) {
        return match;
      }
      if (propVal.toLowerCase().includes('!important')) {
        return match;
      }
      return `${propVal.trimEnd()} !important${terminator || ';'}`;
    });
    setCss(fixed);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRule ? 'Редактирование правила CSS' : 'Новое правило CSS для сайта'}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Check className="w-3.5 h-3.5" />}
            onClick={() => handleSubmit()}
          >
            {initialRule ? 'Сохранить изменения' : 'Создать правило'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Название правила
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: GreenData Portal — размер редактора формул"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              Шаблон URL / Домен
            </label>
            <button
              type="button"
              onClick={handlePasteCurrentUrl}
              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
            >
              <BookmarkPlus className="w-3 h-3" />
              Вставить текущий сайт
            </button>
          </div>
          <Input
            value={urlPattern}
            onChange={(e) => setUrlPattern(e.target.value)}
            placeholder="*://expo.greendatasoft.ru/*, expo.greendatasoft.ru или * для всех"
          />
          <p className="mt-1 text-[10px] text-gray-500">
            Поддерживаются маски (*://*.domain.com/*), домены (expo.greendatasoft.ru) или * для всех сайтов.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-emerald-600" />
              CSS стили
            </label>
            <button
              type="button"
              onClick={handleAddImportant}
              title="Добавить !important ко всем свойствам для гарантированного переопределения стилей сайта"
              className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              + Добавить !important
            </button>
          </div>

          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="text-[10px] font-medium text-gray-500 py-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Сниппеты:
            </span>
            {SNIPPETS.map((snip) => (
              <button
                key={snip.name}
                type="button"
                onClick={() => handleApplySnippet(snip.code)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800"
              >
                + {snip.name}
              </button>
            ))}
          </div>

          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            placeholder={`.formula-editor-box {\n  height: 1000px !important;\n}`}
            rows={8}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/60 p-2.5 font-mono text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />

          <p className="mt-1 text-[10px] text-gray-500 leading-tight">
            💡 <strong>Важно:</strong> Для гарантированного переопределения встроенных стилей сайта добавляйте <code className="font-mono text-emerald-700 bg-gray-100 px-1 py-0.5 rounded font-bold">!important</code> (например, <code className="font-mono text-gray-700">height: 1000px !important;</code>).
          </p>
        </div>
      </form>
    </Modal>
  );
};
