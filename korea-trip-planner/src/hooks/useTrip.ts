import { useEffect, useReducer } from 'react';
import type { Trip, TripItem } from '../lib/model';
import { uid } from '../lib/model';
import { loadTrip, saveTrip } from '../lib/storage';

export interface TripState {
  trip: Trip;
  activeDayId: string;
}

type Action =
  | { type: 'rename'; name: string }
  | { type: 'addItem'; item: TripItem; dayId?: string }
  | { type: 'removeItem'; uid: string }
  | { type: 'setNote'; uid: string; note: string }
  | { type: 'moveItem'; uid: string; toDayId: string; index?: number }
  | { type: 'addDay' }
  | { type: 'removeDay'; dayId: string }
  | { type: 'setActive'; dayId: string }
  | { type: 'replace'; trip: Trip }
  | { type: 'clear' };

function withDays(s: TripState, days: Trip['days']): TripState {
  const active = days.some((d) => d.id === s.activeDayId) ? s.activeDayId : days[days.length - 1].id;
  return { trip: { ...s.trip, days }, activeDayId: active };
}

function reducer(s: TripState, a: Action): TripState {
  const days = s.trip.days;
  switch (a.type) {
    case 'rename':
      return { ...s, trip: { ...s.trip, name: a.name } };
    case 'addItem': {
      const target = a.dayId ?? s.activeDayId;
      return withDays(s, days.map((d) => (d.id === target ? { ...d, items: [...d.items, a.item] } : d)));
    }
    case 'removeItem':
      return withDays(s, days.map((d) => ({ ...d, items: d.items.filter((i) => i.uid !== a.uid) })));
    case 'setNote':
      return withDays(
        s,
        days.map((d) => ({ ...d, items: d.items.map((i) => (i.uid === a.uid ? { ...i, note: a.note } : i)) })),
      );
    case 'moveItem': {
      const item = days.flatMap((d) => d.items).find((i) => i.uid === a.uid);
      if (!item) return s;
      const stripped = days.map((d) => ({ ...d, items: d.items.filter((i) => i.uid !== a.uid) }));
      return withDays(
        s,
        stripped.map((d) => {
          if (d.id !== a.toDayId) return d;
          const items = [...d.items];
          items.splice(a.index ?? items.length, 0, item);
          return { ...d, items };
        }),
      );
    }
    case 'addDay': {
      const day = { id: uid(), items: [] };
      return { trip: { ...s.trip, days: [...days, day] }, activeDayId: day.id };
    }
    case 'removeDay': {
      if (days.length <= 1) return withDays(s, days.map((d) => (d.id === a.dayId ? { ...d, items: [] } : d)));
      return withDays(s, days.filter((d) => d.id !== a.dayId));
    }
    case 'setActive':
      return { ...s, activeDayId: a.dayId };
    case 'replace':
      return { trip: a.trip, activeDayId: a.trip.days[0].id };
    case 'clear':
      return { trip: { ...s.trip, days: [{ id: uid(), items: [] }] }, activeDayId: '' };
  }
}

function init(): TripState {
  const trip = loadTrip();
  return { trip, activeDayId: trip.days[0].id };
}

export function useTrip() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  useEffect(() => saveTrip(state.trip), [state.trip]);
  // после очистки activeDayId пуст — нормализуем на первый день
  const activeDayId = state.trip.days.some((d) => d.id === state.activeDayId)
    ? state.activeDayId
    : state.trip.days[0].id;
  return { trip: state.trip, activeDayId, dispatch };
}

export type TripDispatch = ReturnType<typeof useTrip>['dispatch'];
