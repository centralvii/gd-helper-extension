import { Check, MapPin, Plus } from 'lucide-react';
import type { ResolvedPlace } from '../lib/model';
import { categoryMeta } from '../lib/categories';
import { Button } from './ui/Button';
import { Highlight } from './ui/Highlight';
import { cn } from '../lib/cn';

interface Props {
  place: ResolvedPlace;
  query?: string;
  inRoute: boolean;
  onOpen: (p: ResolvedPlace) => void;
  onToggle: (p: ResolvedPlace) => void;
}

export function PlaceCard({ place, query = '', inRoute, onOpen, onToggle }: Props) {
  const cat = categoryMeta(place.category);
  const Icon = cat?.icon;
  const sub = [place.nameEn, place.nameKo].filter(Boolean).join(' · ');
  return (
    <div className="gd-card flex items-center gap-1 p-2 pr-2">
      <button
        type="button"
        onClick={() => onOpen(place)}
        aria-label={`Подробнее: ${place.nameRu}`}
        className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-2xl p-1 text-left hover:bg-white/50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--gd-accent-light)] text-accent-700">
          {Icon ? <Icon size={20} aria-hidden="true" /> : <MapPin size={20} aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold tracking-[-0.01em]">
            <Highlight text={place.nameRu} query={query} />
          </span>
          {sub && (
            <span className="block truncate text-[12.5px] text-slate-600">
              <Highlight text={sub} query={query} />
            </span>
          )}
          <span className="block truncate text-[12px] text-slate-600">
            {[place.cityName, cat?.label ?? 'Найдено на карте'].filter(Boolean).join(' · ')}
          </span>
        </span>
      </button>
      <Button
        variant={inRoute ? 'ghost' : 'primary'}
        icon
        onClick={() => onToggle(place)}
        aria-label={inRoute ? `Убрать из маршрута: ${place.nameRu}` : `Добавить в маршрут: ${place.nameRu}`}
        aria-pressed={inRoute}
        className={cn(inRoute && 'text-[var(--gd-success-ink)]')}
      >
        {inRoute ? <Check size={18} /> : <Plus size={18} />}
      </Button>
    </div>
  );
}
