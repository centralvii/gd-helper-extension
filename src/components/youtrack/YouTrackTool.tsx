import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Search,
  ExternalLink,
  CheckSquare,
  Database,
  X,
  Sparkles,
} from 'lucide-react';
import { YouTrackIssue, YouTrackParsedResult } from '../../types';
import {
  DEFAULT_YOUTRACK_URL,
  loadYouTrackCache,
  parseYouTrackIssues,
  MOCK_YOUTRACK_ISSUES,
} from '../../utils/youtrackParser';
import { YouTrackIssueTile } from './YouTrackIssueTile';
import { YouTrackIssueDetail } from './YouTrackIssueDetail';
import { Button } from '../ui/Button';

interface YouTrackToolProps {
  onTransferToImplementation?: (issue: YouTrackIssue) => void;
  onShowToast?: (message: string) => void;
}

export const YouTrackTool: React.FC<YouTrackToolProps> = ({
  onTransferToImplementation,
  onShowToast,
}) => {
  const [issues, setIssues] = useState<YouTrackIssue[]>(() => {
    const cached = loadYouTrackCache();
    if (cached && cached.issues.length > 0) {
      return cached.issues;
    }
    return MOCK_YOUTRACK_ISSUES;
  });

  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => {
    const cached = loadYouTrackCache();
    return cached ? cached.lastSyncedAt : null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<YouTrackIssue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [lastSyncSource, setLastSyncSource] = useState<'api' | 'dom' | 'cache' | 'mock'>('cache');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Load from cache on mount
  useEffect(() => {
    const cached = loadYouTrackCache();
    if (cached && cached.issues.length > 0) {
      setIssues(cached.issues);
      setLastSyncedAt(cached.lastSyncedAt);
    }
  }, []);

  // Handler for parsing YouTrack link
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setSyncNotice(null);
    try {
      const result: YouTrackParsedResult = await parseYouTrackIssues(DEFAULT_YOUTRACK_URL);
      if (result.success && result.issues.length > 0) {
        setIssues(result.issues);
        setLastSyncedAt(result.syncedAt);
        setLastSyncSource(result.source);
        const sourceLabel =
          result.source === 'api'
            ? 'REST API'
            : result.source === 'dom'
            ? 'Контур YouTrack'
            : result.source === 'cache'
            ? 'Кэш'
            : 'Демо-данные';
        const msg = `Загружено ${result.issues.length} задач (${sourceLabel})`;
        setSyncNotice(msg);
        onShowToast?.(msg);
      } else {
        const errorMsg = result.error || 'Не удалось получить данные с сервера YouTrack';
        setSyncNotice(errorMsg);
        onShowToast?.(errorMsg);
      }
    } catch (e: any) {
      const errorMsg = e?.message || 'Ошибка парсинга YouTrack';
      setSyncNotice(errorMsg);
      onShowToast?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [onShowToast]);

  const handleOpenSearchUrl = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: DEFAULT_YOUTRACK_URL });
    } else {
      window.open(DEFAULT_YOUTRACK_URL, '_blank');
    }
  };

  // Distinct states for filter chips
  const distinctStates = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => {
      if (i.state) set.add(i.state);
    });
    return Array.from(set);
  }, [issues]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return issues.filter((issue) => {
      const matchesSearch =
        !q ||
        issue.id.toLowerCase().includes(q) ||
        issue.summary.toLowerCase().includes(q) ||
        (issue.description && issue.description.toLowerCase().includes(q));

      const matchesState =
        selectedStateFilter === 'all' || issue.state === selectedStateFilter;

      return matchesSearch && matchesState;
    });
  }, [issues, searchQuery, selectedStateFilter]);

  // Format last synced time
  const formattedSyncTime = useMemo(() => {
    if (!lastSyncedAt) return 'Не синхронизировано';
    try {
      const d = new Date(lastSyncedAt);
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'Недавно';
    }
  }, [lastSyncedAt]);

  // Render detail view if a tile was selected
  if (selectedIssue) {
    return (
      <YouTrackIssueDetail
        issue={selectedIssue}
        onBack={() => setSelectedIssue(null)}
        onTransferToImplementation={onTransferToImplementation}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold shadow-2xs">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-slate-900 truncate">
                  Задачи YouTrack (РЭЦ_Fin)
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {filteredIssues.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Database className="w-2.5 h-2.5 text-slate-400" />
                <span>Кэш: {formattedSyncTime}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {lastSyncSource === 'api' ? 'API' : lastSyncSource === 'dom' ? 'Контур' : lastSyncSource === 'cache' ? 'Кэш' : 'Демо'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              size="xs"
              variant="primary"
              onClick={handleRefresh}
              isLoading={isLoading}
              leftIcon={<RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />}
              title="Спарсить задачи из YouTrack (в корпоративном контуре)"
            >
              Обновить
            </Button>

            <Button
              size="xs"
              variant="secondary"
              onClick={handleOpenSearchUrl}
              leftIcon={<ExternalLink className="w-3 h-3" />}
              title="Открыть фильтр задач в YouTrack"
            >
              В YouTrack
            </Button>
          </div>
        </div>

        {/* Sync message banner if any */}
        {syncNotice && (
          <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 animate-in fade-in">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span className="truncate">{syncNotice}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-emerald-600 hover:text-emerald-900 cursor-pointer ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Search bar and Filters */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ID (rez-fin...) или названию..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick filter chips */}
          {distinctStates.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedStateFilter('all')}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-colors cursor-pointer select-none whitespace-nowrap ${
                  selectedStateFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Все ({issues.length})
              </button>

              {distinctStates.map((st) => {
                const count = issues.filter((i) => i.state === st).length;
                const isSelected = selectedStateFilter === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStateFilter(isSelected ? 'all' : st)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-colors cursor-pointer select-none whitespace-nowrap ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Issues Tiles Grid */}
      {filteredIssues.length > 0 ? (
        <div className="space-y-2">
          {filteredIssues.map((issue) => (
            <YouTrackIssueTile
              key={issue.id}
              issue={issue}
              onSelect={setSelectedIssue}
              onTransferToImplementation={onTransferToImplementation}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-center space-y-2.5 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800">
              {searchQuery ? 'Задачи не найдены' : 'Список задач пуст'}
            </h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              {searchQuery
                ? 'Попробуйте изменить поисковый запрос или сбросить фильтры статуса.'
                : 'Находясь в корпоративном контуре GreenData (VPN), нажмите "Обновить", чтобы автоматически спарсить задачи из YouTrack.'}
            </p>
          </div>
          {searchQuery && (
            <Button
              size="xs"
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedStateFilter('all');
              }}
            >
              Сбросить поиск
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
