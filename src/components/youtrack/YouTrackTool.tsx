import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import {
  RefreshCw,
  Search,
  ExternalLink,
  CheckSquare,
  Database,
  X,
  Sparkles,
  AlertTriangle,
  LogIn,
  Check,
} from 'lucide-react';
import { YouTrackIssue, YouTrackParsedResult } from '../../types';
import {
  DEFAULT_YOUTRACK_URL,
  loadYouTrackCache,
  parseYouTrackIssues,
} from '../../utils/youtrackParser';
import {
  checkGreenDataTaskModalActive,
  injectYouTrackIntoGreenDataTask,
} from '../../utils/greenDataTaskFormInjector';
import { YouTrackIssueTile } from './YouTrackIssueTile';
import { YouTrackIssueDetail } from './YouTrackIssueDetail';
import { Button } from '../ui/Button';
import { getErrorMessage } from '../../utils/errorUtils';
import { useToast } from '../../hooks/useToast';

interface YouTrackToolProps {
  onTransferToImplementation?: (issue: YouTrackIssue) => void;
  /** Раздел виден: только тогда опрашиваем вкладку на открытую форму GreenData */
  isActive?: boolean;
}

export const YouTrackTool: React.FC<YouTrackToolProps> = ({
  onTransferToImplementation,
  isActive = true,
}) => {
  const toast = useToast();
  const onShowToast = useCallback(
    (message: string, isError = false) =>
      toast.show({
        icon: isError ? <AlertTriangle /> : <Check />,
        tone: isError ? 'danger' : 'success',
        title: message,
      }),
    [toast]
  );
  const [issues, setIssues] = useState<YouTrackIssue[]>(() => {
    const cached = loadYouTrackCache();
    return cached?.issues || [];
  });

  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => {
    const cached = loadYouTrackCache();
    return cached ? cached.lastSyncedAt : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const cached = loadYouTrackCache();
    return !cached || cached.issues.length === 0;
  });

  const [selectedIssue, setSelectedIssue] = useState<YouTrackIssue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [lastSyncSource, setLastSyncSource] = useState<'api' | 'dom' | 'cache'>('api');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [hasSyncError, setHasSyncError] = useState(false);
  const [isGreenDataModalActive, setIsGreenDataModalActive] = useState<boolean>(false);

  // Monitor GreenData task creation modal state in active browser tab
  // (только пока раздел YouTrack открыт — скрипт во вкладке не запускается зря)
  useEffect(() => {
    if (!isActive) return;
    let isMounted = true;

    const checkModal = async () => {
      try {
        const active = await checkGreenDataTaskModalActive();
        if (isMounted) {
          setIsGreenDataModalActive(active);
        }
      } catch {
        if (isMounted) {
          setIsGreenDataModalActive(false);
        }
      }
    };

    checkModal();
    const intervalId = setInterval(checkModal, 1500);

    const onTabEvent = () => {
      checkModal();
    };

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.onActivated?.addListener(onTabEvent);
      chrome.tabs.onUpdated?.addListener(onTabEvent);
    }
    window.addEventListener('focus', onTabEvent);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.onActivated?.removeListener(onTabEvent);
        chrome.tabs.onUpdated?.removeListener(onTabEvent);
      }
      window.removeEventListener('focus', onTabEvent);
    };
  }, [isActive]);

  // Transfer issue fields directly into active GreenData task modal
  const handleTransferToGreenData = useCallback(
    async (issue: YouTrackIssue): Promise<boolean> => {
      try {
        const result = await injectYouTrackIntoGreenDataTask(issue);
        if (result.success) {
          setSyncNotice(result.message);
          setHasSyncError(false);
          onShowToast(result.message);
        } else {
          setSyncNotice(result.message);
          setHasSyncError(true);
          onShowToast(result.message, true);
        }
        return result.success;
      } catch (err) {
        const msg = getErrorMessage(err, 'Не удалось перенести данные в GreenData. Проверьте, что окно создания задачи открыто');
        setSyncNotice(msg);
        setHasSyncError(true);
        onShowToast(msg, true);
        return false;
      }
    },
    [onShowToast]
  );

  // Handler for parsing YouTrack link
  // manual — нажата кнопка: итог показывается тостом (автообновление при запуске — без тоста)
  const handleRefresh = useCallback(async (manual = false) => {
    setIsLoading(true);
    setSyncNotice(null);
    setHasSyncError(false);
    try {
      const result: YouTrackParsedResult = await parseYouTrackIssues(DEFAULT_YOUTRACK_URL);
      if (result.success && result.issues.length > 0) {
        setIssues(result.issues);
        setLastSyncedAt(result.syncedAt);
        setLastSyncSource(result.source === 'cache' ? 'cache' : result.source === 'dom' ? 'dom' : 'api');
        const sourceLabel =
          result.source === 'api'
            ? 'API'
            : result.source === 'dom'
            ? 'страница YouTrack'
            : 'кэш';
        const msg = `Загружено задач: ${result.issues.length} (${sourceLabel})`;
        setSyncNotice(msg);
        if (manual) onShowToast(msg);
      } else {
        const errorMsg =
          result.error ||
          'Не удалось получить задачи из YouTrack. Проверьте VPN и вход в YouTrack';
        setSyncNotice(errorMsg);
        setHasSyncError(true);
        if (manual) onShowToast(errorMsg, true);
      }
    } catch (e) {
      const errorMsg = getErrorMessage(e, 'Не удалось разобрать ответ YouTrack. Повторите позже');
      setSyncNotice(errorMsg);
      setHasSyncError(true);
      if (manual) onShowToast(errorMsg, true);
    } finally {
      setIsLoading(false);
    }
  }, [onShowToast]);

  // Automatically fetch real issues on mount
  useEffect(() => {
    const cached = loadYouTrackCache();
    if (cached && cached.issues.length > 0) {
      setIssues(cached.issues);
      setLastSyncedAt(cached.lastSyncedAt);
      setLastSyncSource('cache');
    }
    // Always trigger fresh real parse
    void handleRefresh();
  }, [handleRefresh]);

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

      const isStateMatching = () => {
        if (selectedStateFilter === 'all') return true;
        if (issue.state === selectedStateFilter) return true;
        const normFilter = selectedStateFilter.toLowerCase();
        const normState = (issue.state || '').toLowerCase();
        if (normFilter === 'открыта' || normFilter === 'open') {
          return normState === 'открыта' || normState === 'open' || normState === '#open';
        }
        return false;
      };

      return matchesSearch && isStateMatching();
    });
  }, [issues, searchQuery, selectedStateFilter]);

  // Format last synced time
  const formattedSyncTime = useMemo(() => {
    if (!lastSyncedAt) return 'Не синхронизировано';
    try {
      const d = new Date(lastSyncedAt);
      return (
        d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
      );
    } catch {
      return 'Недавно';
    }
  }, [lastSyncedAt]);

  // Детали задачи открываются сверху, а при возврате список остаётся на прежней позиции
  const listScrollRef = useRef(0);
  const handleOpenIssue = useCallback((issue: YouTrackIssue) => {
    listScrollRef.current = document.getElementById('root')?.scrollTop ?? 0;
    setSelectedIssue(issue);
  }, []);
  useLayoutEffect(() => {
    const scroller = document.getElementById('root');
    if (scroller) scroller.scrollTop = selectedIssue ? 0 : listScrollRef.current;
  }, [selectedIssue]);

  const isFiltered = Boolean(searchQuery.trim()) || selectedStateFilter !== 'all';
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStateFilter('all');
  };

  // Render detail view if a tile was selected
  if (selectedIssue) {
    return (
      <YouTrackIssueDetail
        issue={selectedIssue}
        onBack={() => setSelectedIssue(null)}
        onTransferToImplementation={onTransferToImplementation}
        isGreenDataModalActive={isGreenDataModalActive}
        onTransferToGreenData={handleTransferToGreenData}
      />
    );
  }

  const sourceLabel = lastSyncSource === 'api' ? 'API' : lastSyncSource === 'dom' ? 'Страница' : 'Кэш';

  return (
    <div className="space-y-4">
      {/* Статус синхронизации и формы GreenData */}
      <div className="gd-group gd-group--icons">
        <div className="gd-row">
          <span className="gd-row-icon">
            <Database />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] text-slate-900 truncate">
              {issues.length > 0 ? `Задач: ${filteredIssues.length}` : 'Задачи не загружены'}
            </span>
            <span className="block text-[12px] text-gd-muted truncate">
              {formattedSyncTime}
              {lastSyncedAt ? ` · ${sourceLabel}` : ''}
            </span>
          </span>
          <button
            type="button"
            onClick={handleOpenSearchUrl}
            title="Открыть фильтр задач в YouTrack"
            className="icon-btn"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void handleRefresh(true)}
            disabled={isLoading}
            title="Обновить задачи из YouTrack (нужен VPN)"
            data-icon-anim="spin"
            className="icon-btn !bg-gd-accent !text-white hover:!bg-gd-accent-dark disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div
          className="gd-row"
          title={
            isGreenDataModalActive
              ? 'Окно создания задачи GreenData открыто — перенос доступен'
              : 'Откройте в GreenData окно создания задачи, чтобы заполнить его из YouTrack'
          }
        >
          <span className={`gd-row-icon transition-colors duration-300 ${isGreenDataModalActive ? 'gd-row-icon--accent' : ''}`}>
            <CheckSquare />
          </span>
          <span className="min-w-0 flex-1 text-[14px] text-slate-900 truncate">Форма задачи GreenData</span>
          <span
            className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium flex-shrink-0 ${
              isGreenDataModalActive ? 'text-gd-accent' : 'text-gd-muted'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isGreenDataModalActive ? 'bg-[#34c759] animate-pulse' : 'bg-slate-300'}`}
            />
            {isGreenDataModalActive ? 'Открыта' : 'Не открыта'}
          </span>
        </div>

        {syncNotice && (
          <div
            className={`gd-row !min-h-0 !py-2 text-[12.5px] animate-fade-in ${
              hasSyncError ? 'text-[#c26a00]' : 'text-gd-accent'
            }`}
          >
            {hasSyncError ? (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 ml-1.5 mr-1.5" />
            ) : (
              <Sparkles className="w-4 h-4 flex-shrink-0 ml-1.5 mr-1.5" />
            )}
            <span className="flex-1 min-w-0 leading-snug">{syncNotice}</span>
            <button
              type="button"
              onClick={() => setSyncNotice(null)}
              className="icon-btn icon-btn--plain w-6 h-6"
              title="Скрыть"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Поиск и фильтры */}
      {issues.length > 0 && (
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gd-faint pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && searchQuery) {
                  e.preventDefault();
                  setSearchQuery('');
                }
              }}
              aria-label="Поиск задач YouTrack"
              placeholder="Поиск по ID или названию"
              className="gd-field !pl-8 !pr-8 !bg-[rgba(118,118,128,0.12)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-full cursor-pointer group/clear"
                title="Очистить (Esc)"
                aria-label="Очистить поиск"
              >
                <span className="w-5 h-5 grid place-items-center rounded-full bg-slate-400 group-hover/clear:bg-slate-500 text-white">
                  <X className="w-3 h-3" strokeWidth={3} />
                </span>
              </button>
            )}
          </div>

          {distinctStates.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto -mx-4 px-4 pb-0.5">
              {[{ key: 'all', label: 'Все', count: issues.length }, ...distinctStates.map((st) => ({
                key: st,
                label: st,
                count: issues.filter((i) => i.state === st).length,
              }))].map((chip) => {
                const isSelected = selectedStateFilter === chip.key;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setSelectedStateFilter(isSelected && chip.key !== 'all' ? 'all' : chip.key)}
                    className={`h-7 px-3 rounded-full text-[12.5px] font-medium whitespace-nowrap cursor-pointer select-none transition-colors ${
                      isSelected ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    {chip.label}
                    <span className={`ml-1 tabular-nums ${isSelected ? 'text-white/70' : 'text-gd-muted'}`}>{chip.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Загрузка */}
      {isLoading && issues.length === 0 ? (
        <div className="gd-group px-6 py-8 text-center space-y-3 animate-pop-in">
          <div className="w-12 h-12 rounded-full bg-gd-accent-light text-gd-accent grid place-items-center mx-auto">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 className="text-[15px] font-semibold text-slate-900">Загрузка задач…</h4>
            <p className="text-[12.5px] text-gd-muted max-w-xs mx-auto">
              Запрос к youtrack.greendatasoft.ru:
              <br />
              <span className="font-mono text-[11.5px] text-slate-700">Исполнитель: Кучин_В_В проект: РЭЦ_Fin</span>
            </p>
          </div>
        </div>
      ) : filteredIssues.length > 0 ? (
        <div className="space-y-2.5 gd-stagger">
          {filteredIssues.map((issue) => (
            <YouTrackIssueTile
              key={issue.id}
              issue={issue}
              onSelect={handleOpenIssue}
              onTransferToImplementation={onTransferToImplementation}
              isGreenDataModalActive={isGreenDataModalActive}
              onTransferToGreenData={handleTransferToGreenData}
            />
          ))}
        </div>
      ) : (
        <div className="gd-group px-6 py-8 text-center space-y-3 animate-pop-in">
          <div className="w-12 h-12 rounded-full bg-gd-fill text-gd-muted grid place-items-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-[15px] font-semibold text-slate-900">
              {issues.length > 0 && isFiltered ? 'Задачи не найдены' : 'Задачи не загружены'}
            </h4>
            <p className="text-[12.5px] text-gd-muted max-w-[280px] mx-auto leading-snug">
              {issues.length > 0 && isFiltered
                ? 'Измените запрос или сбросьте фильтр статуса.'
                : 'Подключитесь к корпоративной сети (VPN) и войдите в YouTrack в этом браузере.'}
            </p>
          </div>
          {issues.length > 0 && isFiltered ? (
            <div className="flex items-center justify-center pt-1">
              <Button size="md" variant="secondary" onClick={handleResetFilters} leftIcon={<X className="w-4 h-4" />}>
                Сбросить фильтры
              </Button>
            </div>
          ) : (
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <Button
              size="md"
              variant="primary"
              onClick={() => void handleRefresh(true)}
              isLoading={isLoading}
              leftIcon={!isLoading ? <RefreshCw className="w-4 h-4" /> : undefined}
            >
              Повторить
            </Button>
            <Button
              size="md"
              variant="secondary"
              onClick={handleOpenSearchUrl}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Войти в YouTrack
            </Button>
          </div>
          )}
        </div>
      )}
    </div>
  );
};
