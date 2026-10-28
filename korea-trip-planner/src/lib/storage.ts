import type { Trip } from './model';
import { emptyTrip } from './model';
import { sanitizeTrip } from './share';

const KEY = 'korea-trip-v1';

export function loadTrip(): Trip {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const t = sanitizeTrip(JSON.parse(raw));
      if (t) return t;
    }
  } catch {
    /* хранилище недоступно или данные повреждены */
  }
  return emptyTrip();
}

export function saveTrip(trip: Trip): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(trip));
  } catch {
    /* переполнение или приватный режим — молча пропускаем */
  }
}
