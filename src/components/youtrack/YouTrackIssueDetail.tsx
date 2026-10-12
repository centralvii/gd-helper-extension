import React, { useState } from 'react';
import {
  ChevronLeft,
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

  const copyIcon = (done: boolean) =>
    done ? <Check className="w-3.5 h-3.5 text-gd-green animate-pop-in" strokeWidth={2.75} /> : <Copy className="w-3.5 h-3.5" />;

  return (
    <div className="space-y-5 animate-screen-in">
      {/* Навигация: назад + внешняя ссылка */}
      <div className="flex items-center justify-between gap-2 -mt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-0.5 -ml-1.5 pl-0.5 pr-2 h-8 rounded-full text-[15px] font-medium text-gd-green hover:bg-gd-green-light cursor-pointer"
          title="Вернуться к списку задач"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          Задачи
        </button>
        <button
          type="button"
          onClick={handleOpenExternal}
          title="Открыть задачу в YouTrack (в новой вкладке)"
          className="icon-btn"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Заголовок задачи */}
      <div className="px-1 space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[13px] font-semibold text-gd-green select-all">{issue.id}</span>
          {tfsNumber && (
            <span className="font-mono text-[12px] text-gd-muted select-all" title={`Номер TFS (US/BP): ${tfsNumber}`}>
              · {tfsNumber}
            </span>
          )}
          <span className="flex-1" />
          {issue.priority && (
            <Badge variant={getPriorityVariant(issue.priority)} size="sm">
              {issue.priority}
            </Badge>
          )}
          {issue.state && (
            <Badge variant={getStateVariant(issue.state)} size="sm">
              {issue.state}
            </Badge>
          )}
        </div>
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-slate-900 leading-tight">
          {issue.summary || 'Без названия'}
        </h2>
      </div>

      {/* Главные действия */}
      <div className="flex items-center gap-2">
        {onTransferToGreenData && (
          <Button
            size="md"
            variant="primary"
            className="flex-1"
            disabled={!isGreenDataModalActive}
            onClick={handleTransferToGreenData}
            leftIcon={
              justTransferred ? (
                <Check className="w-4 h-4 animate-pop-in" strokeWidth={2.75} />
              ) : (
                <ArrowDownToLine className="w-4 h-4" />
              )
            }
            title={
              isGreenDataModalActive
                ? 'Заполнить TFS (US/BP), YT/Git и Наименование задачи в активном модальном окне GreenData'
                : 'Откройте модальное окно создания задачи в GreenData для переноса'
            }
          >
            {justTransferred ? 'Перенесено' : 'Перенести в GD'}
          </Button>
        )}
        {onTransferToImplementation && (
          <Button
            size="md"
            variant="outline"
            className="flex-1"
            onClick={() => onTransferToImplementation(issue)}
            leftIcon={<ArrowRightCircle className="w-4 h-4" />}
            title="Создать задачу в Реализации с этим ID и названием"
          >
            В реализацию
          </Button>
        )}
      </div>

      {/* Сведения */}
      <div className="gd-group gd-group--icons">
        <div className="gd-row">
          <span className="gd-row-icon"><Tag /></span>
          <span className="flex-1 text-[14px] text-slate-900">Проект</span>
          <span className="text-[13.5px] text-gd-muted truncate">{issue.project || 'РЭЦ_Fin'}</span>
        </div>
        <div className="gd-row">
          <span className="gd-row-icon"><User /></span>
          <span className="flex-1 text-[14px] text-slate-900">Исполнитель</span>
          <span className="text-[13.5px] text-gd-muted truncate max-w-[55%]" title={issue.assignee}>
            {issue.assignee || 'Кучин Владимир Валерьевич'}
          </span>
        </div>
        {issue.type && (
          <div className="gd-row">
            <span className="gd-row-icon"><FileText /></span>
            <span className="flex-1 text-[14px] text-slate-900">Тип</span>
            <span className="text-[13.5px] text-gd-muted truncate">{issue.type}</span>
          </div>
        )}
        {issue.updatedAt && (
          <div className="gd-row">
            <span className="gd-row-icon"><Clock /></span>
            <span className="flex-1 text-[14px] text-slate-900">Обновлено</span>
            <span className="text-[13.5px] text-gd-muted tabular-nums">{formatDate(issue.updatedAt)}</span>
          </div>
        )}
      </div>

      {/* Копирование */}
      <div className="gd-group">
        <button type="button" onClick={handleCopyId} title="Скопировать ID" className="gd-row gd-row--tap w-full text-left">
          <span className="flex-1 text-[14px] text-slate-900">Скопировать ID</span>
          <span className="text-gd-muted">{copyIcon(copiedId)}</span>
        </button>
        <button type="button" onClick={handleCopySummary} title="Скопировать название задачи" className="gd-row gd-row--tap w-full text-left">
          <span className="flex-1 text-[14px] text-slate-900">Скопировать название</span>
          <span className="text-gd-muted">{copyIcon(copiedSummary)}</span>
        </button>
        <button type="button" onClick={handleCopyMd} title="Скопировать Markdown ссылку" className="gd-row gd-row--tap w-full text-left">
          <span className="flex-1 text-[14px] text-slate-900">Ссылка Markdown</span>
          <span className="text-gd-muted">
            {copiedMd ? <Check className="w-3.5 h-3.5 text-gd-green animate-pop-in" strokeWidth={2.75} /> : <Share2 className="w-3.5 h-3.5" />}
          </span>
        </button>
      </div>

      {/* Перенос в задачу GreenData */}
      <div>
        <div className="gd-section-title">
          <span>Перенос в задачу GreenData</span>
          <span className={`inline-flex items-center gap-1.5 normal-case tracking-normal text-[12px] font-medium ${isGreenDataModalActive ? 'text-gd-green' : ''}`}>
            <span className={`w-2 h-2 rounded-full ${isGreenDataModalActive ? 'bg-[#34c759] animate-pulse' : 'bg-slate-300'}`} />
            {isGreenDataModalActive ? 'Форма открыта' : 'Форма не открыта'}
          </span>
        </div>
        <div className="gd-group">
          <div className="gd-row">
            <span className="flex-1 text-[14px] text-slate-900">TFS (US/BP)</span>
            <span className="font-mono text-[12.5px] text-slate-700 truncate">
              {tfsNumber || <span className="font-sans italic text-gd-faint">не найден</span>}
            </span>
          </div>
          <div className="gd-row">
            <span className="flex-1 text-[14px] text-slate-900">YT/Git</span>
            <span className="font-mono text-[12.5px] text-slate-700 truncate">{issue.id}</span>
          </div>
          <div className="gd-row !items-start !py-2.5">
            <span className="text-[14px] text-slate-900 flex-shrink-0">Наименование</span>
            <span className="flex-1 text-right text-[12.5px] text-slate-700 line-clamp-2">{issue.summary}</span>
          </div>
        </div>
        <p className="px-3.5 pt-1.5 text-[11.5px] text-gd-muted">
          Поля GUF, Направление и Модуль остаются для ручного ввода.
        </p>
      </div>

      {/* Описание */}
      <div>
        <div className="gd-section-title">
          <span>Описание</span>
        </div>
        <div className="gd-group p-3.5 text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap break-words max-h-[360px] overflow-y-auto select-text">
          {issue.description ? issue.description : <span className="text-gd-faint italic">Описание в YouTrack не заполнено.</span>}
        </div>
      </div>
    </div>
  );
};
