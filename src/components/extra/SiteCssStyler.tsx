import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Globe,
  Code2,
  Trash2,
  Edit2,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { useSiteCssRules } from '../../hooks/useSiteCssRules';
import { SiteCssRule } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CssRuleModal } from './CssRuleModal';

export const SiteCssStyler: React.FC = () => {
  const {
    rules,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    getCurrentTabUrl,
    syncAllTabs,
  } = useSiteCssRules();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SiteCssRule | null>(null);
  const [expandedRuleIds, setExpandedRuleIds] = useState<Set<string>>(new Set());

  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return rules;
    const q = searchQuery.toLowerCase();
    return rules.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.urlPattern.toLowerCase().includes(q) ||
        r.css.toLowerCase().includes(q)
    );
  }, [rules, searchQuery]);

  const activeCount = useMemo(
    () => rules.filter((r) => r.isEnabled).length,
    [rules]
  );

  const handleOpenCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: SiteCssRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleSaveRule = (name: string, urlPattern: string, css: string) => {
    if (editingRule) {
      updateRule(editingRule.id, { name, urlPattern, css });
    } else {
      addRule(name, urlPattern, css);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    await syncAllTabs();
    setTimeout(() => {
      setIsSyncing(false);
      setSyncToast(true);
      setTimeout(() => setSyncToast(false), 2500);
    }, 400);
  };

  return (
    <div className="space-y-3">
      {/* ── Toolbar: Search & Create Button ── */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по стилям и сайтам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleOpenCreate}
          className="flex-shrink-0"
        >
          Добавить стиль
        </Button>
      </div>

      {/* ── Summary & Status Card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">
              Пользовательские стили для сайтов
            </div>
            <div className="text-[10px] text-gray-500">
              {syncToast ? (
                <span className="font-semibold text-emerald-600 animate-fade-in">
                  ✓ Стили успешно синхронизированы с открытыми вкладками
                </span>
              ) : (
                'Мгновенно внедряются в страницы браузера'
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleSyncAll}
            title="Применить / Синхронизировать стили со всеми открытыми вкладками"
            className="icon-btn p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <Badge
            variant={activeCount > 0 ? 'success' : 'default'}
            size="sm"
            className="flex-shrink-0"
          >
            {activeCount > 0 ? `Активно: ${activeCount}` : 'Все отключены'}
          </Badge>
        </div>
      </div>

      {/* ── List of Rules ── */}
      {filteredRules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <Code2 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <div className="text-xs font-bold text-gray-900 mb-1">
            {searchQuery ? 'Стили не найдены' : 'Нет созданных правил стилей'}
          </div>
          <p className="text-[11px] text-gray-500 max-w-xs mx-auto mb-3">
            {searchQuery
              ? 'Попробуйте изменить поисковый запрос'
              : 'Создайте свои CSS правила для сайтов GreenData, Jira или любых других веб-ресурсов.'}
          </p>
          {!searchQuery && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={handleOpenCreate}
            >
              Создать первое правило
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRules.map((rule) => {
            const isExpanded = expandedRuleIds.has(rule.id);
            return (
              <div
                key={rule.id}
                className={`group relative rounded-xl border p-3 transition-all duration-150 ${
                  rule.isEnabled
                    ? 'border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-sm'
                    : 'border-gray-200 bg-gray-50/70 hover:border-gray-300'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2.5">
                  {/* Left Toggle Switch */}
                  <div className="pt-0.5 flex-shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rule.isEnabled}
                      onClick={() => toggleRule(rule.id)}
                      title={rule.isEnabled ? 'Отключить стиль' : 'Включить стиль'}
                      className="gd-toggle focus:outline-none"
                    >
                      <span className="gd-toggle__thumb" />
                    </button>
                  </div>

                  {/* Main info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-semibold text-xs truncate ${
                          rule.isEnabled ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {rule.name}
                      </span>

                      {rule.isEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Вкл
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-gray-400">
                          Выкл
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-600 max-w-full truncate"
                        title={rule.urlPattern}
                      >
                        <Globe className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{rule.urlPattern}</span>
                      </span>

                      <span className="text-[10px] text-gray-400">
                        • {rule.css.split('\n').length} строк CSS
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => toggleExpand(rule.id)}
                      title={isExpanded ? 'Скрыть CSS' : 'Показать CSS'}
                      className="icon-btn p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(rule)}
                      title="Редактировать стиль"
                      className="icon-btn p-1 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deleteRule(rule.id)}
                      title="Удалить правило"
                      className="icon-btn icon-btn--danger p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded CSS viewer */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100">
                    <div className="relative rounded-lg bg-gray-50 border border-gray-200 p-2 overflow-x-auto max-h-48">
                      <pre className="font-mono text-[11px] leading-relaxed text-gray-800 whitespace-pre-wrap">
                        {rule.css}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal for create/edit ── */}
      <CssRuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRule}
        initialRule={editingRule}
        onGetCurrentUrl={getCurrentTabUrl}
      />
    </div>
  );
};
