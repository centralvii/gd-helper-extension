import type { Trip, TripItem, CustomPlace } from './model';
import { resolveItem, uid } from './model';
import { formatKm, totalKm } from './geo';
import { googleUrl, naverUrl, googleDirectionsUrl } from './links';

/* ── Проверка и нормализация загруженных данных ── */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const str = (v: unknown, max = 500): string => (typeof v === 'string' ? v.slice(0, max) : '');

function sanitizeItem(raw: unknown): TripItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const note = str(r.note, 1000);
  if (typeof r.placeId === 'string') return { uid: uid(), placeId: r.placeId, note };
  const c = r.custom as Record<string, unknown> | undefined;
  if (c && isNum(c.lat) && isNum(c.lng)) {
    const custom: CustomPlace = { name: str(c.name, 200), address: str(c.address, 400), lat: c.lat, lng: c.lng };
    return { uid: uid(), custom, note };
  }
  return null;
}

export function sanitizeTrip(raw: unknown): Trip | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.days)) return null;
  const days = r.days.slice(0, 60).map((d) => {
    const items = Array.isArray((d as { items?: unknown })?.items) ? (d as { items: unknown[] }).items : [];
    return {
      id: uid(),
      items: items.map(sanitizeItem).filter((x): x is TripItem => x !== null).filter((x) => resolveItem(x)),
    };
  });
  if (!days.length) days.push({ id: uid(), items: [] });
  return { name: str(r.name, 120) || 'Моя поездка в Корею', days };
}

/* ── Ссылка с состоянием в hash ── */

function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function buildShareUrl(trip: Trip): string {
  const slim = {
    name: trip.name,
    days: trip.days.map((d) => ({
      items: d.items.map((i) => ({ placeId: i.placeId, custom: i.custom, note: i.note || undefined })),
    })),
  };
  return `${location.origin}${location.pathname}#trip=${toB64Url(JSON.stringify(slim))}`;
}

export function readTripFromHash(): Trip | null {
  try {
    const m = /^#trip=([\w-]+)$/.exec(location.hash);
    if (!m) return null;
    return sanitizeTrip(JSON.parse(fromB64Url(m[1])));
  } catch {
    return null;
  }
}

export function clearHash(): void {
  history.replaceState(null, '', location.pathname + location.search);
}

/* ── Текст, файлы, Web Share ── */

export function tripToText(trip: Trip): string {
  const lines: string[] = [trip.name, ''];
  trip.days.forEach((day, di) => {
    const places = day.items.map((i) => ({ i, p: resolveItem(i) })).filter((x) => x.p);
    const km = totalKm(places.map((x) => x.p!));
    lines.push(`День ${di + 1}${places.length > 1 ? ` (≈ ${formatKm(km)} по прямой)` : ''}`);
    if (!places.length) lines.push('  (пока пусто)');
    places.forEach(({ i, p }, n) => {
      const pl = p!;
      const names = [pl.nameEn, pl.nameKo].filter(Boolean).join(' / ');
      lines.push(`${n + 1}. ${pl.nameRu}${names ? ` (${names})` : ''}`);
      if (pl.addressEn) lines.push(`   Адрес: ${pl.addressEn}`);
      if (pl.addressKo) lines.push(`   Адрес по-корейски: ${pl.addressKo}`);
      if (i.note) lines.push(`   Заметка: ${i.note}`);
      lines.push(`   Google Maps: ${googleUrl(pl)}`);
      lines.push(`   Naver Map: ${naverUrl(pl)}`);
    });
    const dir = googleDirectionsUrl(places.map((x) => x.p!));
    if (dir) lines.push(`Маршрут дня: ${dir}`);
    lines.push('');
  });
  return lines.join('\n').trim() + '\n';
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadFile(name: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const canWebShare = (): boolean => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export async function webShare(trip: Trip): Promise<boolean> {
  try {
    await navigator.share({ title: trip.name, text: tripToText(trip).slice(0, 1500), url: buildShareUrl(trip) });
    return true;
  } catch {
    return false;
  }
}
