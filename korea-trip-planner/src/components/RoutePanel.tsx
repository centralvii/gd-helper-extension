import { Share2, Route } from 'lucide-react';
import type { ResolvedPlace, Trip } from '../lib/model';
import type { TripDispatch } from '../hooks/useTrip';
import { DayList } from './DayList';
import { Button } from './ui/Button';

interface Props {
  trip: Trip;
  activeDayId: string;
  dispatch: TripDispatch;
  onOpen: (p: ResolvedPlace) => void;
  onShare: () => void;
  onGoSearch: () => void;
}

export function RoutePanel({ trip, activeDayId, dispatch, onOpen, onShare, onGoSearch }: Props) {
  const total = trip.days.reduce((n, d) => n + d.items.length, 0);
  return (
    <div className="space-y-3">
      <div className="gd-card p-4">
        <label className="gd-section-title" htmlFor="trip-name">Название поездки</label>
        <input
          id="trip-name"
          value={trip.name}
          onChange={(e) => dispatch({ type: 'rename', name: e.target.value })}
          maxLength={120}
          className="mt-1 h-11 w-full rounded-xl bg-white/70 px-3 text-[16px] font-bold tracking-[-0.02em] outline-none focus-visible:ring-2 focus-visible:ring-accent-600"
        />
        <div className="mt-3 flex items-center gap-2">
          <p className="min-w-0 flex-1 text-[12.5px] text-slate-600">
            {trip.days.length} дн. · {total} мест
          </p>
          <Button variant="primary" onClick={onShare}>
            <Share2 size={16} /> Поделиться
          </Button>
        </div>
      </div>

      {total === 0 && (
        <div className="gd-card flex flex-col items-center gap-2 p-6 text-center">
          <Route size={28} className="text-accent-600" aria-hidden="true" />
          <p className="text-[14.5px] font-semibold">Маршрут пока пустой</p>
          <p className="text-[13px] text-slate-600">Найдите места во вкладке «Поиск» и нажмите «+» — они появятся здесь по дням.</p>
          <Button variant="tint" className="lg:hidden" onClick={onGoSearch}>Перейти к поиску</Button>
        </div>
      )}

      <DayList trip={trip} activeDayId={activeDayId} dispatch={dispatch} onOpen={onOpen} />
    </div>
  );
}
