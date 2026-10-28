import type { ResolvedPlace } from './model';

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 10) * 100} м`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} км`;
}

export function legDistances(points: ResolvedPlace[]): number[] {
  return points.slice(1).map((p, i) => haversineKm(points[i], p));
}

export function totalKm(points: ResolvedPlace[]): number {
  return legDistances(points).reduce((s, d) => s + d, 0);
}
