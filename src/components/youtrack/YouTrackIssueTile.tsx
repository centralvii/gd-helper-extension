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
      role="button"
      className="group gd-group !overflow-visible p-3.5 cursor-pointer flex flex-col gap-2 transition-shadow hover:shadow-md"
    >
      {/* ID, статус, приоритет */}
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          type="button"
          onClick={handleCopyId}
          title="Нажмите, чтобы скопировать ID задачи"
          className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-gd-accent hover:underline cursor-pointer select-none flex-shrink-0"
        >
          {issue.id}
          {copied ? (
            <Check className="w-3 h-3 animate-pop-in" strokeWidth={2.75} />
          ) : (
            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
          )}
        </button>
        {tfsNumber && (
          <span
            className="font-mono text-[11px] text-gd-muted truncate"
            title={`Номер TFS (US/BP), извлечённый из названия задачи: ${tfsNumber}`}
          >
            · {tfsNumber}
          </span>
        )}
        <span className="flex-1" />
        {issue.priority && (
          <Badge variant={getPriorityVariant(issue.priority)} size="xs" className="flex-shrink-0">
            {issue.priority}
          </Badge>
        )}
        {issue.state && (
          <Badge variant={getStateVariant(issue.state)} size="xs" className="flex-shrink-0">
            {issue.state}
          </Badge>
        )}
      </div>

      {/* Название и описание */}
      <h4 className="text-[14.5px] font-semibold tracking-[-0.01em] text-slate-900 leading-snug line-clamp-2">
        {issue.summary || 'Без названия'}
      </h4>
      {issue.description && (
        <p className="text-[12.5px] text-gd-muted leading-snug line-clamp-2">{issue.description}</p>
      )}

      {/* Метаданные */}
      <div className="flex items-center gap-3 text-[11.5px] text-gd-muted min-w-0">
        {issue.type && (
          <span className="flex items-center gap-1 flex-shrink-0">
            <Tag className="w-3 h-3" />
            {issue.type}
          </span>
        )}
        {issue.assignee && (
          <span className="flex items-center gap-1 truncate" title={issue.assignee}>
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{issue.assignee}</span>
          </span>
        )}
        {issue.updatedAt && (
          <span className="ml-auto flex items-center gap-1 flex-shrink-0 tabular-nums">
            <Calendar className="w-3 h-3" />
            {formatDate(issue.updatedAt)}
          </span>
        )}
      </div>

      {/* Действия */}
      <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
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
            className={`h-8 px-3 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 select-none transition-colors ${
              justTransferred
                ? 'bg-gd-accent-dark text-white cursor-default'
                : isGreenDataModalActive
                ? 'bg-gd-accent hover:bg-gd-accent-dark text-white cursor-pointer animate-pop-in'
                : 'bg-gd-fill text-gd-faint cursor-not-allowed'
            }`}
          >
            {justTransferred ? (
              <>
                <Check className="w-3.5 h-3.5 animate-pop-in" strokeWidth={2.75} />
                Перенесено
              </>
            ) : (
              <>
                <ArrowDownToLine className="w-3.5 h-3.5" />
                Перенести
              </>
            )}
          </button>
        )}
        {onTransferToImplementation && (
          <button
            type="button"
            onClick={handleTransfer}
            title="Создать или привязать задачу в Реализации"
            className="h-8 px-3 rounded-full text-[12.5px] font-semibold bg-gd-accent-light text-gd-accent hover:bg-accent-500/20 flex items-center gap-1 cursor-pointer"
          >
            В реализацию
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="flex-1" />
        <IconButton
          icon={<ExternalLink className="w-3.5 h-3.5" />}
          size="sm"
          variant="ghost"
          title="Открыть задачу в YouTrack (новой вкладке)"
          onClick={handleOpenExternal}
        />
      </div>
    </div>
  );
};
