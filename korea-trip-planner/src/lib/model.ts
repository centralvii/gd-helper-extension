import { CITIES } from '../data/cities';
import { PLACES } from '../data/places';
import type { Place, PlaceCategory } from '../data/types';

export interface CustomPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface TripItem {
  uid: string;
  placeId?: string;
  custom?: CustomPlace;
  note: string;
}

export interface Day {
  id: string;
  items: TripItem[];
}

export interface Trip {
  name: string;
  days: Day[];
}

/** Единое представление места (из каталога или найденного онлайн). */
export interface ResolvedPlace {
  key: string;
  placeId?: string;
  custom?: CustomPlace;
  nameRu: string;
  nameEn: string;
  nameKo: string;
  cityId?: string;
  cityName: string;
  category?: PlaceCategory;
  description: string;
  addressEn: string;
  addressKo: string;
  lat: number;
  lng: number;
  website?: string;
}

const placeMap = new Map<string, Place>(PLACES.map((p) => [p.id, p]));
const cityMap = new Map(CITIES.map((c) => [c.id, c]));

export function cityName(id: string | undefined): string {
  return (id && cityMap.get(id)?.nameRu) || '';
}

export function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function customKey(c: CustomPlace): string {
  return `c:${c.lat.toFixed(5)},${c.lng.toFixed(5)}`;
}

export function resolvePlace(p: Place): ResolvedPlace {
  return {
    key: p.id,
    placeId: p.id,
    nameRu: p.nameRu,
    nameEn: p.nameEn,
    nameKo: p.nameKo,
    cityId: p.cityId,
    cityName: cityName(p.cityId),
    category: p.category,
    description: p.description,
    addressEn: p.addressEn,
    addressKo: p.addressKo,
    lat: p.lat,
    lng: p.lng,
    website: p.website,
  };
}

export function resolveCustom(c: CustomPlace): ResolvedPlace {
  return {
    key: customKey(c),
    custom: c,
    nameRu: c.name,
    nameEn: '',
    nameKo: '',
    cityName: '',
    description: 'Место найдено на карте OpenStreetMap.',
    addressEn: c.address,
    addressKo: '',
    lat: c.lat,
    lng: c.lng,
  };
}

export function resolveItem(item: TripItem): ResolvedPlace | null {
  if (item.placeId) {
    const p = placeMap.get(item.placeId);
    return p ? resolvePlace(p) : null;
  }
  return item.custom ? resolveCustom(item.custom) : null;
}

export function itemKey(item: TripItem): string {
  return item.placeId ?? (item.custom ? customKey(item.custom) : item.uid);
}

export function newItem(rp: ResolvedPlace): TripItem {
  return rp.placeId
    ? { uid: uid(), placeId: rp.placeId, note: '' }
    : { uid: uid(), custom: rp.custom, note: '' };
}

export function emptyTrip(): Trip {
  return { name: 'Моя поездка в Корею', days: [{ id: uid(), items: [] }] };
}
