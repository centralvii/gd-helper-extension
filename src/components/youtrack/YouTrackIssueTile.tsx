import React, { useState } from 'react';
import { Copy, Check, ExternalLink, ArrowRight, ArrowDownToLine, User, Calendar, Tag } from 'lucide-react';
import { YouTrackIssue } from '../../types';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';
import { extractTfsNumberFromSummary } from '../../utils/greenDataTaskFormInjector';

interface YouTrackIssueTileProps {
  issue: YouTrackIssue;
  onSelect: (issue: YouTrackIssue) => void;
  onTransferToImplementation?: (issue: YouTrackIssue) => void;
  isGreenDataModalActive?: boolean;
  onTransferToGreenData?: (issue: YouTrackIssue) => void;
}

export const YouTrackIssueTile: React.FC<YouTrackIssueTileProps> = ({
  issue,
  onSelect,
  onTransferToImplementation,
  isGreenDataModalActive = false,
  onTransferToGreenData,
}) => {
  const [copied, setCopied] = useState(false);
  const [justTransferred, setJustTransferred] = useState(false);

  const tfsNumber = extractTfsNumberFromSummary(issue.summary);

  const handleTransferToGreenData = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isGreenDataModalActive) return;
    onTransferToGreenData?.(issue);
    setJustTransferred(true);
    setTimeout(() => setJustTransferred(false), 2000);
  };

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(issue.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetUrl = issue.url || `https://youtrack.greendatasoft.ru/issue/${issue.id}`;
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: targetUrl });
    } else {
      window.open(targetUrl, '_blank');
    }
  };

  const handleTransfer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTransferToImplementation?.(issue);
  };

  // State badge variant mapping
  const getStateVariant = (state?: string): 'default' | 'success' | 'warning' | 'info' | 'purple' => {
    if (!state) return 'default';
    const s = state.toLowerCase();
    if (s.includes('решен') || s.includes('готов') || s.includes('закрыт') || s.includes('fixed')) return 'success';
    if (s.includes('работ') || s.includes('progress')) return 'info';
    if (s.includes('открыт') || s.includes('open')) return 'warning';
    if (s.includes('тест') || s.includes('test') || s.includes('проверк')) return 'warning';
    if (s.includes('пакет') || s.includes('ревью') || s.includes('review')) return 'purple';
    return 'default';
  };

  const getPriorityVariant = (priority?: string): 'default' | 'danger' | 'warning' | 'info' => {
    if (!priority) return 'default';
    const p = priority.toLowerCase();
    if (p.includes('критич') || p.includes('блок') || p.includes('critical') || p.includes('blocker')) return 'danger';
    if (p.includes('высок') || p.includes('high') || p.includes('срочн')) return 'warning';
    return 'default';
  };

  const formatDate = (ts?: number) => {
    if (!ts) return null;
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    } catch {
      return null;
    }
  };

  return (
    <div
      onClick={() => onSelect(issue)}
      className="group relative bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-emerald-400/80 rounded-xl p-3 shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col gap-2"
    >
      {/* Top row: ID, Badges, and Quick Actions */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Issue ID badge */}
          <button
            type="button"
            onClick={handleCopyId}
            title="Нажмите, чтобы скопировать ID задачи"
            className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs cursor-pointer select-none"
          >
            <span>{issue.id}</span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-600 animate-in fade-in" />
            ) : (
              <Copy className="w-2.5 h-2.5 text-emerald-500 opacity-60 group-hover:opacity-100" />
            )}
          </button>

          {/* State badge */}
          {issue.state && (
            <Badge variant={getStateVariant(issue.state)} size="xs">
              {issue.state}
            </Badge>
          )}

          {/* Priority badge */}
          {issue.priority && (
            <Badge variant={getPriorityVariant(issue.priority)} size="xs">
              {issue.priority}
            </Badge>
          )}

          {/* Type badge */}
          {issue.type && (
            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/80">
              {issue.type}
            </span>
          )}

          {/* TFS Number badge if extracted from title */}
          {tfsNumber && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] font-bold rounded-lg bg-sky-50 text-sky-800 border border-sky-200/90 shadow-2xs select-none"
              title={`Номер TFS (US/BP), извлечённый из названия задачи: ${tfsNumber}`}
            >
              TFS: {tfsNumber}
            </span>
          )}
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onTransferToGreenData && (
            <button
              type="button"
              disabled={!isGreenDataModalActive}
              onClick={handleTransferToGreenData}
              title={
                isGreenDataModalActive
                  ? `Перенести в форму создания задачи GreenData:\n• TFS: ${tfsNumber || '—'}\n• YT: ${issue.id}\n• Название: ${issue.summary}`
                  : 'Откройте модальное окно создания задачи в GreenData, чтобы перенести данные'
              }
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all shadow-2xs flex items-center gap-1 select-none ${
                justTransferred
                  ? 'bg-emerald-700 text-white border border-emerald-700 scale-95 cursor-default'
                  : isGreenDataModalActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 hover:border-emerald-700 active:scale-95 animate-in fade-in cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              {justTransferred ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  <span>Перенесено!</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-3 h-3" />
                  <span>Перенести</span>
                </>
              )}
            </button>
          )}

          {onTransferToImplementation && (
            <button
              type="button"
              onClick={handleTransfer}
              title="Создать или привязать задачу в Реализации"
              className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span className="hidden sm:inline">В реализацию</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}

          <IconButton
            icon={<ExternalLink className="w-3 h-3" />}
            size="xs"
            variant="ghost"
            title="Открыть задачу в YouTrack (новой вкладке)"
            onClick={handleOpenExternal}
          />
        </div>
      </div>

      {/* Summary (Название задачи) */}
      <div className="min-w-0">
        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-950 leading-snug line-clamp-2">
          {issue.summary || 'Без названия'}
        </h4>
      </div>

      {/* Description preview if exists */}
      {issue.description && (
        <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
          {issue.description}
        </p>
      )}

      {/* Bottom meta row */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 mt-0.5">
        <div className="flex items-center gap-2 truncate">
          {issue.project && (
            <span className="flex items-center gap-0.5 font-medium text-slate-500">
              <Tag className="w-2.5 h-2.5 text-slate-400" />
              {issue.project}
            </span>
          )}
          {issue.assignee && (
            <span className="flex items-center gap-0.5 truncate text-slate-500" title={issue.assignee}>
              <User className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{issue.assignee}</span>
            </span>
          )}
        </div>

        {issue.updatedAt && (
          <span className="flex items-center gap-0.5 flex-shrink-0 text-slate-400 font-mono">
            <Calendar className="w-2.5 h-2.5" />
            {formatDate(issue.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
};
