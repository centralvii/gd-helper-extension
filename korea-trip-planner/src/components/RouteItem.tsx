import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, NotebookPen, Trash2, ArrowRightLeft } from 'lucide-react';
import type { ResolvedPlace, TripItem } from '../lib/model';
import { formatKm } from '../lib/geo';
import { cn } from '../lib/cn';

interface Props {
  item: TripItem;
  place: ResolvedPlace;
  index: number;
  legKm: number | null;
  dayCount: number;
  dayIndex: number;
  onOpen: (p: ResolvedPlace) => void;
  onRemove: (uid: string) => void;
  onNote: (uid: string, note: string) => void;
  onMoveToDay: (uid: string, dayIdx: number) => void;
}

export function RouteItem({ item, place, index, legKm, dayCount, dayIndex, onOpen, onRemove, onNote, onMoveToDay }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.uid,
  });
  const [noteOpen, setNoteOpen] = useState(false);
  const showNote = noteOpen || !!item.note;

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn(isDragging && 'opacity-40')}>
      {legKm !== null && (
        <p className="py-1 pl-[26px] text-[11.5px] text-slate-600" aria-label={`Расстояние по прямой ${formatKm(legKm)}`}>
          ↓ ≈ {formatKm(legKm)} по прямой
        </p>
      )}
      <div className={cn('gd-card p-2', isDragging && 'border-dashed border-accent-600')}>
        <div className="flex items-center gap-1">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            type="button"
            aria-label={`Перетащить: ${place.nameRu}. Пробел, затем стрелки для перемещения`}
            className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-slate-600 hover:text-accent-700 active:cursor-grabbing"
          >
            <GripVertical size={18} />
          </button>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-600 text-[12px] font-bold text-white" aria-hidden="true">
            {index + 1}
          </span>
          <button type="button" onClick={() => onOpen(place)} className="min-h-[44px] min-w-0 flex-1 px-2 text-left" aria-label={`Подробнее: ${place.nameRu}`}>
            <span className="block truncate text-[14px] font-semibold">{place.nameRu}</span>
            <span className="block truncate text-[12px] text-slate-600">
              {[place.nameKo, place.cityName].filter(Boolean).join(' · ') || place.addressEn}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setNoteOpen((v) => !v)}
            aria-label={showNote ? 'Скрыть заметку' : 'Добавить заметку'}
            aria-expanded={showNote}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-white/70 hover:text-accent-700"
          >
            <NotebookPen size={17} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.uid)}
            aria-label={`Убрать из маршрута: ${place.nameRu}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-red-50 hover:text-[var(--gd-red-ink)]"
          >
            <Trash2 size={17} />
          </button>
        </div>
        {showNote && (
          <textarea
            value={item.note}
            onChange={(e) => onNote(item.uid, e.target.value)}
            placeholder="Заметка: время, билеты, что взять с собой"
            aria-label={`Заметка к месту ${place.nameRu}`}
            rows={2}
            maxLength={1000}
            className="mt-1 w-full resize-y rounded-xl bg-white/70 px-3 py-2 text-[13.5px] outline-none placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-accent-600"
          />
        )}
        {dayCount > 1 && (
          <label className="mt-1 flex items-center gap-2 pl-2 text-[12px] text-slate-600">
            <ArrowRightLeft size={13} aria-hidden="true" />
            Перенести в
            <select
              value={dayIndex}
              onChange={(e) => onMoveToDay(item.uid, Number(e.target.value))}
              aria-label={`Перенести ${place.nameRu} в другой день`}
              className="min-h-[36px] rounded-full bg-white/80 px-2 text-[13px] text-slate-900"
            >
              {Array.from({ length: dayCount }, (_, i) => (
                <option key={i} value={i}>День {i + 1}</option>
              ))}
            </select>
          </label>
        )}
      </div>
    </li>
  );
}
