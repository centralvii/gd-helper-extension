import { useEffect, useRef, useState } from 'react';
import { Globe, Loader2, Plus, Check } from 'lucide-react';
import { searchOnline } from '../lib/nominatim';
import { resolveCustom, type ResolvedPlace } from '../lib/model';
import { Button } from './ui/Button';

interface Props {
  query: string;
  inRouteKeys: Set<string>;
  onOpen: (p: ResolvedPlace) => void;
  onToggle: (p: ResolvedPlace) => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function OnlineSearch({ query, inRouteKeys, onOpen, onToggle }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<ResolvedPlace[]>([]);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    abort.current?.abort();
    setStatus('idle');
    setResults([]);
  }, [query]);
  useEffect(() => () => abort.current?.abort(), []);

  const run = async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setStatus('loading');
    try {
      const found = await searchOnline(query.trim(), ctrl.signal);
      setResults(found.map(resolveCustom));
      setStatus('done');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setStatus('error');
    }
  };

  return (
    <section className="gd-card p-4" aria-label="Поиск на карте">
      <p className="text-[13px] text-slate-600">
        Не нашли в каталоге? Поищем по всей Корее в OpenStreetMap — найденное тоже можно добавить в маршрут.
      </p>
      <Button variant="tint" className="mt-3 w-full sm:w-auto" onClick={run} disabled={status === 'loading'}>
        {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
        Искать на карте (OpenStreetMap)
      </Button>
      {status === 'error' && (
        <p role="alert" className="mt-3 text-[13px] text-[var(--gd-red-ink)]">
          Не удалось связаться с картой. Проверьте интернет и попробуйте ещё раз.
        </p>
      )}
      {status === 'done' && results.length === 0 && (
        <p className="mt-3 text-[13px] text-slate-600">На карте ничего не найдено. Попробуйте другое написание.</p>
      )}
      {results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((r) => {
            const inRoute = inRouteKeys.has(r.key);
            return (
              <li key={r.key} className="flex items-center gap-2 rounded-2xl bg-white/60 p-2 pl-3">
                <button
                  type="button"
                  className="min-h-[44px] min-w-0 flex-1 text-left"
                  onClick={() => onOpen(r)}
                  aria-label={`Подробнее: ${r.nameRu}`}
                >
                  <span className="block truncate text-[14px] font-semibold">{r.nameRu}</span>
                  <span className="block truncate text-[12px] text-slate-500">{r.addressEn}</span>
                </button>
                <Button
                  variant={inRoute ? 'ghost' : 'primary'}
                  icon
                  onClick={() => onToggle(r)}
                  aria-label={inRoute ? `Убрать из маршрута: ${r.nameRu}` : `Добавить в маршрут: ${r.nameRu}`}
                >
                  {inRoute ? <Check size={18} className="text-[var(--gd-success-ink)]" /> : <Plus size={18} />}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
