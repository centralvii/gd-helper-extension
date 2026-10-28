import type { ResolvedPlace } from './model';

const searchName = (p: ResolvedPlace) => p.nameKo || p.nameEn || p.nameRu;

export const naverUrl = (p: ResolvedPlace) =>
  `https://map.naver.com/p/search/${encodeURIComponent(searchName(p))}`;

export const kakaoUrl = (p: ResolvedPlace) =>
  `https://map.kakao.com/link/map/${encodeURIComponent(searchName(p))},${p.lat},${p.lng}`;

export const googleUrl = (p: ResolvedPlace) =>
  `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;

export const MAX_WAYPOINTS = 9;

/** Маршрут дня в Google Maps: первая точка — старт, последняя — финиш, остальные — остановки. */
export function googleDirectionsUrl(points: ResolvedPlace[]): string | null {
  if (points.length === 0) return null;
  const ll = (p: ResolvedPlace) => `${p.lat},${p.lng}`;
  if (points.length === 1) return `https://www.google.com/maps/dir/?api=1&destination=${ll(points[0])}`;
  const mid = points.slice(1, -1).slice(0, MAX_WAYPOINTS);
  let url = `https://www.google.com/maps/dir/?api=1&origin=${ll(points[0])}&destination=${ll(points[points.length - 1])}`;
  if (mid.length) url += `&waypoints=${mid.map(ll).join('|')}`;
  return url;
}
