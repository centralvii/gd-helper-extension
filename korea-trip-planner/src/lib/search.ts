import { CITIES } from '../data/cities';
import { PLACES } from '../data/places';
import type { Place, PlaceCategory } from '../data/types';

const TR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
const CYR = /[а-я]/;
const SKIP = /[\s\-_'’‘`´.,·/()]/;

/** Нижний регистр, ё→е, без пробелов, дефисов и апострофов. */
export function normalize(s: string): string {
  let out = '';
  for (const ch of s.normalize('NFC').toLowerCase()) {
    if (SKIP.test(ch)) continue;
    out += ch === 'ё' ? 'е' : ch;
  }
  return out;
}

function translit(s: string): string {
  let out = '';
  for (const ch of s) out += TR[ch] ?? ch;
  return out;
}

/** Упрощённый «скелет» латиницы: убирает различия корейской романизации. */
function skeleton(s: string): string {
  return s
    .replace(/eo/g, 'o').replace(/eu/g, 'u').replace(/ae/g, 'e').replace(/ou/g, 'u')
    .replace(/gyeong/g, 'kyon').replace(/[kg]/g, 'k').replace(/[dt]/g, 't').replace(/[bp]/g, 'p')
    .replace(/(.)\1+/g, '$1');
}

function variants(norm: string): string[] {
  const set = new Set<string>([norm]);
  if (CYR.test(norm)) {
    const t = translit(norm);
    set.add(t);
    set.add(skeleton(t));
  } else if (/^[a-z]+$/.test(norm)) {
    set.add(skeleton(norm));
  }
  return [...set];
}

function levenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

interface Field {
  keys: string[];
  weight: number;
}
interface Entry {
  place: Place;
  fields: Field[];
}

function makeField(text: string, weight: number): Field[] {
  const out: Field[] = [];
  const full = normalize(text);
  if (!full) return out;
  out.push({ keys: variants(full), weight });
  const words = text.split(/[\s\-–/]+/).map(normalize).filter((w) => w.length >= 3 && w !== full);
  for (const w of words) out.push({ keys: variants(w), weight: weight * 0.8 });
  return out;
}

let index: Entry[] | null = null;
function getIndex(): Entry[] {
  if (index) return index;
  const cities = new Map(CITIES.map((c) => [c.id, c]));
  index = PLACES.map((place) => {
    const city = cities.get(place.cityId);
    const fields: Field[] = [
      ...makeField(place.nameRu, 1),
      ...makeField(place.nameEn, 1),
      ...makeField(place.nameKo, 1),
      ...(place.aliases ?? []).flatMap((a) => makeField(a, 0.95)),
      ...(place.tags ?? []).flatMap((t) => makeField(t, 0.7)),
      ...(city ? [city.nameRu, city.nameEn, city.nameKo].flatMap((n) => makeField(n, 0.55)) : []),
    ];
    return { place, fields };
  });
  return index;
}

function scoreKey(q: string, k: string): number {
  if (q === k) return 100;
  if (k.startsWith(q)) return 80 + Math.min(10, (q.length / k.length) * 10);
  if (k.includes(q)) return 60;
  if (q.length < 4) return 0;
  const max = Math.floor(q.length / 3);
  let best = max + 1;
  for (const delta of [0, 1, -1]) {
    const len = q.length + delta;
    if (len > 0) best = Math.min(best, levenshtein(q, k.slice(0, len), max));
  }
  if (k.length <= q.length + max) best = Math.min(best, levenshtein(q, k, max));
  if (best > max) return 0;
  return 20 + 30 * (1 - best / q.length);
}

function scoreToken(token: string, entry: Entry): number {
  const qs = variants(token);
  let best = 0;
  for (const f of entry.fields) {
    for (const q of qs) {
      for (const k of f.keys) {
        const s = scoreKey(q, k) * f.weight;
        if (s > best) best = s;
      }
    }
  }
  return best;
}

export interface SearchFilters {
  cityId?: string | null;
  category?: PlaceCategory | null;
}

export interface SearchResult {
  place: Place;
  score: number;
}

export function searchPlaces(query: string, filters: SearchFilters = {}): SearchResult[] {
  const tokens = query.split(/\s+/).map(normalize).filter(Boolean);
  const whole = normalize(query);
  const cityOrder = new Map(CITIES.map((c, i) => [c.id, i]));
  const pool = getIndex().filter(
    (e) =>
      (!filters.cityId || e.place.cityId === filters.cityId) &&
      (!filters.category || e.place.category === filters.category),
  );
  if (!whole) {
    return pool
      .map((e) => ({ place: e.place, score: 0 }))
      .sort(
        (a, b) =>
          (cityOrder.get(a.place.cityId) ?? 99) - (cityOrder.get(b.place.cityId) ?? 99) ||
          a.place.nameRu.localeCompare(b.place.nameRu, 'ru'),
      );
  }
  const results: SearchResult[] = [];
  for (const e of pool) {
    let score = scoreToken(whole, e);
    if (tokens.length > 1) {
      const per = tokens.map((t) => scoreToken(t, e));
      if (per.every((s) => s > 0)) score = Math.max(score, Math.min(...per) * 0.9);
    }
    if (score > 0) results.push({ place: e.place, score });
  }
  // если есть точные совпадения, нечёткие (опечатки) не показываем
  const strong = results.some((r) => r.score >= 60);
  return results
    .filter((r) => !strong || r.score >= 55)
    .sort((a, b) => b.score - a.score || a.place.nameRu.localeCompare(b.place.nameRu, 'ru'));
}

export interface Segment {
  text: string;
  hit: boolean;
}

/** Разбивает текст на фрагменты для подсветки совпадения с запросом. */
export function highlight(text: string, query: string): Segment[] {
  const needles = [normalize(query), ...query.split(/\s+/).map(normalize)].filter((n) => n.length > 0);
  if (!needles.length) return [{ text, hit: false }];
  let norm = '';
  const map: number[] = [];
  let i = 0;
  for (const ch of text.normalize('NFC')) {
    const lower = ch.toLowerCase();
    if (!SKIP.test(lower)) {
      norm += lower === 'ё' ? 'е' : lower;
      map.push(i);
    }
    i += ch.length;
  }
  for (const n of needles) {
    const at = norm.indexOf(n);
    if (at >= 0) {
      const start = map[at];
      const end = map[at + n.length - 1] + 1;
      return [
        { text: text.slice(0, start), hit: false },
        { text: text.slice(start, end), hit: true },
        { text: text.slice(end), hit: false },
      ].filter((s) => s.text);
    }
  }
  return [{ text, hit: false }];
}
