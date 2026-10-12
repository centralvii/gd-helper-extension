import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Tag,
  User,
  Clock,
  FileText,
  ArrowRightCircle,
  ArrowDownToLine,
  Share2,
} from 'lucide-react';
import { YouTrackIssue } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { extractTfsNumberFromSummary } from '../../utils/greenDataTaskFormInjector';

interface YouTrackIssueDetailProps {
  issue: YouTrackIssue;
  onBack: () => void;
  onTransferToImplementation?: (issue: YouTrackIssue) => void;
  isGreenDataModalActive?: boolean;
  onTransferToGreenData?: (issue: YouTrackIssue) => void;
}

export const YouTrackIssueDetail: React.FC<YouTrackIssueDetailProps> = ({
  issue,
  onBack,
  onTransferToImplementation,
  isGreenDataModalActive = false,
  onTransferToGreenData,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [justTransferred, setJustTransferred] = useState(false);

  const tfsNumber = extractTfsNumberFromSummary(issue.summary);

  const handleTransferToGreenData = () => {
    if (!isGreenDataModalActive) return;
    onTransferToGreenData?.(issue);
    setJustTransferred(true);
    setTimeout(() => setJustTransferred(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(issue.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(issue.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyMd = () => {
    const targetUrl = issue.url || `https://youtrack.greendatasoft.ru/issue/${issue.id}`;
    const md = `[${issue.id}](${targetUrl}) ${issue.summary}`;
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleOpenExternal = () => {
    const targetUrl = issue.url || `https://youtrack.greendatasoft.ru/issue/${issue.id}`;
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: targetUrl });
    } else {
      window.open(targetUrl, '_blank');
    }
  };

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
      return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap bg-white p-1.5 border border-slate-200 rounded-xl shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap select-none"
          title="Вернуться к списку задач"
        >
          <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
          <span>К списку</span>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
          {onTransferToGreenData && (
            <Button
              size="xs"
              variant={isGreenDataModalActive ? 'primary' : 'secondary'}
              disabled={!isGreenDataModalActive}
              onClick={handleTransferToGreenData}
              leftIcon={
                justTransferred ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                )
              }
              title={
                isGreenDataModalActive
                  ? 'Заполнить TFS (US/BP), YT/Git и Наименование задачи в активном модальном окне GreenData'
                  : 'Откройте модальное окно создания задачи в GreenData для переноса'
              }
            >
              {justTransferred ? 'Перенесено!' : 'Перенести'}
            </Button>
          )}

          {onTransferToImplementation && (
            <Button
              size="xs"
              variant="secondary"
              onClick={() => onTransferToImplementation(issue)}
              leftIcon={<ArrowRightCircle className="w-3.5 h-3.5 text-slate-500" />}
              title="Создать задачу в Реализации с этим ID и названием"
            >
              В реализацию
            </Button>
          )}

          <IconButton
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            size="xs"
            variant="secondary"
            title="Открыть задачу в YouTrack (в новой вкладке)"
            onClick={handleOpenExternal}
          />
        </div>
      </div>

      {/* Main Issue Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-3">
        {/* Issue ID and Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs select-all">
              {issue.id}
            </span>

            {tfsNumber && (
              <span
                className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 select-all"
                title={`Номер TFS (US/BP): ${tfsNumber}`}
              >
                TFS: {tfsNumber}
              </span>
            )}

            {issue.state && (
              <Badge variant={getStateVariant(issue.state)} size="sm">
                {issue.state}
              </Badge>
            )}

            {issue.priority && (
              <Badge variant={getPriorityVariant(issue.priority)} size="sm">
                {issue.priority}
              </Badge>
            )}

            {issue.type && (
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                {issue.type}
              </span>
            )}
          </div>

          {/* Copy actions pill */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyId}
              title="Скопировать ID"
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span>ID</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              title="Скопировать название задачи"
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
            >
              {copiedSummary ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span>Название</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMd}
              title="Скопировать Markdown ссылку"
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
            >
              {copiedMd ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-slate-400" />}
              <span>MD</span>
            </button>
          </div>
        </div>

        {/* Issue Title / Summary */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-snug">
            {issue.summary || 'Без названия'}
          </h2>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" /> Проект
            </span>
            <div className="text-slate-800 font-medium truncate">
              {issue.project || 'РЭЦ_Fin'}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <User className="w-2.5 h-2.5" /> Исполнитель
            </span>
            <div className="text-slate-800 font-medium truncate" title={issue.assignee}>
              {issue.assignee || 'Кучин Владимир Валерьевич'}
            </div>
          </div>

          {issue.updatedAt && (
            <div className="space-y-0.5 col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Обновлено
              </span>
              <div className="text-slate-700 font-mono text-[11px]">
                {formatDate(issue.updatedAt)}
              </div>
            </div>
          )}
        </div>

        {/* GreenData Transfer Block */}
        <div className="p-3 bg-emerald-50/30 border border-emerald-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
              <span>Перенос в задачу GreenData</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                isGreenDataModalActive
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isGreenDataModalActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {isGreenDataModalActive ? 'Форма активна' : 'Окно не активно'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
            <div className="bg-white p-2 rounded-lg border border-emerald-100/90 space-y-0.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">TFS (US/BP) *</span>
              <div className="font-mono font-bold text-emerald-800 truncate">
                {tfsNumber || <span className="text-slate-400 font-normal italic">не найден в названии</span>}
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-emerald-100/90 space-y-0.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">YT/Git</span>
              <div className="font-mono font-bold text-emerald-800 truncate">{issue.id}</div>
            </div>
            <div className="col-span-2 bg-white p-2 rounded-lg border border-emerald-100/90 space-y-0.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Наименование задачи *</span>
              <div className="font-medium text-slate-800 text-[11px] line-clamp-2">{issue.summary}</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-100">
            <span className="text-[10px] text-slate-500">
              Поля GUF, Направление и Модуль остаются для ручного ввода
            </span>
            {onTransferToGreenData && (
              <Button
                size="xs"
                variant={isGreenDataModalActive ? 'primary' : 'secondary'}
                disabled={!isGreenDataModalActive}
                onClick={handleTransferToGreenData}
                leftIcon={
                  justTransferred ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : (
                    <ArrowDownToLine className="w-3 h-3" />
                  )
                }
              >
                {justTransferred ? 'Перенесено!' : 'Перенести в GD'}
              </Button>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Описание задачи</span>
          </div>

          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words max-h-[360px] overflow-y-auto font-sans select-text">
            {issue.description ? (
              issue.description
            ) : (
              <span className="text-slate-400 italic">Описание в YouTrack не заполнено.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
