import type { CustomPlace } from './model';

interface NominatimItem {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
}

export async function searchOnline(query: string, signal: AbortSignal): Promise<CustomPlace[]> {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=kr&accept-language=ru' +
    `&addressdetails=1&limit=8&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as NominatimItem[];
  return data
    .map((r) => ({
      name: r.name || r.display_name.split(',')[0].trim(),
      address: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}
