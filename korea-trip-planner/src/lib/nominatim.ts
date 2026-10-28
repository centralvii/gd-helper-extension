import type { CustomPlace } from './model';
import { searchOnline as searchOnlineSources, type OnlineSource } from './onlineSearch';

/** Онлайн-поиск: TourAPI (через /api/search), запасной вариант — OpenStreetMap. */
export async function searchOnline(
  query: string,
  signal: AbortSignal,
): Promise<{ places: CustomPlace[]; source: OnlineSource }> {
  const { items, source } = await searchOnlineSources(query, signal);
  const places = items.map(({ name, address, lat, lng }) => ({ name, address, lat, lng }));
  return { places, source };
}
