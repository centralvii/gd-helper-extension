import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Search, X, MapPinned } from 'lucide-react';
import { CITIES } from '../data/cities';
import { PLACES } from '../data/places';
import type { PlaceCategory } from '../data/types';
import { CATEGORIES } from '../lib/categories';
import { searchPlaces } from '../lib/search';
import { resolvePlace, type ResolvedPlace } from '../lib/model';
import { placesWord } from '../lib/geo';
import { PlaceCard } from './PlaceCard';
import { OnlineSearch } from './OnlineSearch';
import { Button } from './ui/Button';

interface Props {
  inRouteKeys: Set<string>;
  onOpen: (p: ResolvedPlace) => void;
  onToggle: (p: ResolvedPlace) => void;
}

const PAGE = 30;

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function SearchPanel({ inRouteKeys, onOpen, onToggle }: Props) {
  const [input, setInput] = useState('');
  const [cityId, setCityId] = useState<string | null>(null);
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const query = useDeferredValue(useDebounced(input, 180));

  useEffect(() => setLimit(PAGE), [query, cityId, category]);

  const results = useMemo(() => searchPlaces(query, { cityId, category }), [query, cityId, category]);
  const browsing = !query.trim() && !cityId && !category;
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    PLACES.forEach((p) => m.set(p.cityId, (m.get(p.cityId) ?? 0) + 1));
    return m;
  }, []);
  const reset = () => {
    setInput('');
    setCityId(null);
    setCategory(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 z-10 top-1/2 -translate-y-1/2 text-slate-600" aria-hidden="true" />
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Кёнбоккун, gyeongbok, 해운대…"
          aria-label="Поиск мест"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="gd-card h-12 w-full rounded-full pl-11 pr-12 text-[15px] text-slate-900 outline-none placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-accent-600 [&::-webkit-search-cancel-button]:hidden"
        />
        {input && (
          <button
            type="button"
            onClick={() => setInput('')}
            aria-label="Очистить поиск"
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 hover:text-accent-700"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div role="group" aria-label="Города" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
        <button type="button" className="gd-chip" aria-pressed={!cityId} onClick={() => setCityId(null)}>
          Все города
        </button>
        {CITIES.map((c) => (
          <button key={c.id} type="button" className="gd-chip" aria-pressed={cityId === c.id} onClick={() => setCityId(cityId === c.id ? null : c.id)}>
            {c.nameRu}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Категории" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="gd-chip" aria-pressed={category === c.id} onClick={() => setCategory(category === c.id ? null : c.id)}>
            <c.icon size={14} aria-hidden="true" />
            {c.label}
          </button>
        ))}
      </div>

      {browsing ? (
        <section aria-label="Города Кореи">
          <h2 className="gd-section-title mb-2 px-1">Выберите город</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {CITIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCityId(c.id)}
                className="gd-card flex min-h-[88px] flex-col items-start justify-between p-3.5 text-left hover:bg-white/80"
              >
                <span>
                  <span className="block text-[15px] font-bold tracking-[-0.02em]">{c.nameRu}</span>
                  <span className="block text-[12px] text-slate-600">{c.nameEn} · {c.nameKo}</span>
                </span>
                <span className="text-[12px] text-slate-600">{placesWord(counts.get(c.id) ?? 0)} · {c.region}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section aria-label="Результаты" className="space-y-2">
          <p className="px-1 text-[12.5px] text-slate-600" aria-live="polite">
            {results.length ? `Найдено мест: ${results.length}` : 'Ничего не найдено'}
          </p>
          {results.slice(0, limit).map(({ place }) => (
            <PlaceCard key={place.id} place={resolvePlace(place)} query={query} inRoute={inRouteKeys.has(place.id)} onOpen={onOpen} onToggle={onToggle} />
          ))}
          {results.length > limit && (
            <Button variant="ghost" className="w-full" onClick={() => setLimit(limit + PAGE)}>
              Показать ещё
            </Button>
          )}
          {results.length === 0 && (
            <div className="gd-card flex flex-col items-center gap-2 p-6 text-center">
              <MapPinned size={28} className="text-accent-600" aria-hidden="true" />
              <p className="text-[14px] font-semibold">Таких мест в каталоге нет</p>
              <p className="text-[13px] text-slate-600">Проверьте написание или сбросьте фильтры.</p>
              <Button variant="tint" onClick={reset}>Сбросить поиск и фильтры</Button>
            </div>
          )}
          {query.trim().length >= 2 && results.length < 3 && (
            <OnlineSearch query={query} inRouteKeys={inRouteKeys} onOpen={onOpen} onToggle={onToggle} />
          )}
        </section>
      )}
    </div>
  );
}
