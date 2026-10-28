import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ExternalLink, Trash2, CalendarDays } from 'lucide-react';
import type { Day, ResolvedPlace } from '../lib/model';
import { resolveItem } from '../lib/model';
import { legDistances, formatKm, totalKm, placesWord } from '../lib/geo';
import { googleDirectionsUrl, MAX_WAYPOINTS } from '../lib/links';
import { RouteItem } from './RouteItem';
import { cn } from '../lib/cn';

interface Props {
  day: Day;
  dayIndex: number;
  dayCount: number;
  active: boolean;
  onActivate: (id: string) => void;
  onRemoveDay: (id: string) => void;
  onOpen: (p: ResolvedPlace) => void;
  onRemove: (uid: string) => void;
  onNote: (uid: string, note: string) => void;
  onMoveToDay: (uid: string, dayIdx: number) => void;
}

export function DayBlock({ day, dayIndex, dayCount, active, onActivate, onRemoveDay, onOpen, onRemove, onNote, onMoveToDay }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day.id}` });
  const rows = day.items.flatMap((item) => {
    const place = resolveItem(item);
    return place ? [{ item, place }] : [];
  });
  const points = rows.map((r) => r.place);
  const legs = legDistances(points);
  const dirUrl = googleDirectionsUrl(points);

  return (
    <section
      ref={setNodeRef}
      aria-label={`День ${dayIndex + 1}`}
      className={cn('gd-card p-3', active && 'ring-2 ring-accent-600/60', isOver && 'bg-white/80')}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onActivate(day.id)}
          aria-pressed={active}
          aria-label={active ? `День ${dayIndex + 1} — сюда добавляются новые места` : `Сделать День ${dayIndex + 1} активным`}
          className={cn(
            'inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 text-[15px] font-bold tracking-[-0.02em]',
            active ? 'bg-accent-600 text-white' : 'bg-white/70 text-slate-900 hover:text-accent-700',
          )}
        >
          <CalendarDays size={16} aria-hidden="true" />
          День {dayIndex + 1}
        </button>
        <span className="min-w-0 flex-1 truncate text-[12px] text-slate-600">
          {rows.length > 0 ? placesWord(rows.length) : ''}
          {rows.length > 1 && ` · ≈ ${formatKm(totalKm(points))}`}
        </span>
        <button
          type="button"
          onClick={() => onRemoveDay(day.id)}
          aria-label={dayCount > 1 ? `Удалить День ${dayIndex + 1}` : 'Очистить день'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-red-50 hover:text-[var(--gd-red-ink)]"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <SortableContext items={day.items.map((i) => i.uid)} strategy={verticalListSortingStrategy}>
        {rows.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-[13px] text-slate-600">
            В этом дне пока пусто. Найдите место и нажмите «+», либо перетащите сюда место из другого дня.
          </p>
        ) : (
          <ol className="mt-2 list-none p-0">
            {rows.map(({ item, place }, i) => (
              <RouteItem
                key={item.uid}
                item={item}
                place={place}
                index={i}
                legKm={i > 0 ? legs[i - 1] : null}
                dayCount={dayCount}
                dayIndex={dayIndex}
                onOpen={onOpen}
                onRemove={onRemove}
                onNote={onNote}
                onMoveToDay={onMoveToDay}
              />
            ))}
          </ol>
        )}
      </SortableContext>

      {dirUrl && (
        <div className="mt-3">
          <a
            href={dirUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[var(--gd-accent-light)] px-4 text-[13.5px] font-semibold text-accent-700 hover:bg-accent-200/60 sm:w-auto"
          >
            <ExternalLink size={15} aria-hidden="true" />
            Маршрут дня в Google Maps
          </a>
          {points.length > MAX_WAYPOINTS + 2 && (
            <p className="mt-1 text-[11.5px] text-slate-600">Google Maps принимает до {MAX_WAYPOINTS} промежуточных точек — лишние не попадут в ссылку.</p>
          )}
        </div>
      )}
    </section>
  );
}
