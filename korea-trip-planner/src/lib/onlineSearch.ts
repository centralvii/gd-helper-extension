import type { Place, PlaceCategory } from '../data/types';

export interface OnlinePlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  image?: string;
  category: PlaceCategory;
  tel?: string;
  source: 'tour' | 'osm';
}

export type OnlineSource = 'tour' | 'osm';

export async function searchTourApi(q: string, lang: 'ru' | 'en', signal?: AbortSignal): Promise<OnlinePlace[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&lang=${lang}`, { signal });
  if (!res.ok) throw new Error(`tour api ${res.status}`);
  const data = (await res.json()) as { items?: Array<Omit<OnlinePlace, 'source'>> };
  return (data.items ?? []).map((p) => ({ ...p, source: 'tour' as const }));
}

interface NominatimItem {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  category?: string;
  type?: string;
}

function osmCategory(c?: string, t?: string): PlaceCategory {
  if (c === 'amenity' && /restaurant|cafe|fast_food|food_court|bar|pub/.test(t ?? '')) return t === 'bar' || t === 'pub' ? 'nightlife' : 'food';
  if (c === 'shop') return 'shopping';
  if (c === 'tourism' && t === 'museum') return 'museum';
  if (c === 'tourism' && t === 'viewpoint') return 'viewpoint';
  if (c === 'natural' || c === 'leisure') return 'nature';
  if (c === 'tourism' && /theme_park|zoo|aquarium|attraction/.test(t ?? '')) return t === 'attraction' ? 'sight' : 'activity';
  return 'sight';
}

export async function searchOsm(q: string, signal?: AbortSignal): Promise<OnlinePlace[]> {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=kr&accept-language=ru&addressdetails=1&limit=8&q=' +
    encodeURIComponent(q);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`osm ${res.status}`);
  const data = (await res.json()) as NominatimItem[];
  return data
    .map((d): OnlinePlace | null => {
      const lat = parseFloat(d.lat);
      const lng = parseFloat(d.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const name = d.name || d.display_name.split(',')[0].trim();
      return {
        id: `osm-${d.osm_type}-${d.osm_id}`,
        name,
        address: d.display_name,
        lat,
        lng,
        category: osmCategory(d.category, d.type),
        source: 'osm',
      };
    })
    .filter((x): x is OnlinePlace => x !== null);
}

export async function searchOnline(
  q: string,
  signal?: AbortSignal,
): Promise<{ items: OnlinePlace[]; source: OnlineSource }> {
  try {
    let items = await searchTourApi(q, 'ru', signal);
    if (items.length === 0) items = await searchTourApi(q, 'en', signal);
    return { items, source: 'tour' };
  } catch (e) {
    if (signal?.aborted) throw e;
    return { items: await searchOsm(q, signal), source: 'osm' };
  }
}

export function onlineToPlace(p: OnlinePlace): Place {
  return {
    id: p.id,
    cityId: 'custom',
    category: p.category,
    nameRu: p.name,
    nameEn: p.name,
    nameKo: p.name,
    addressEn: p.address,
    addressKo: p.address,
    lat: p.lat,
    lng: p.lng,
    description: '',
  };
}
