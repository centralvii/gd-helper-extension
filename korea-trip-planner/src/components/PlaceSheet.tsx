import { Check, Copy, ExternalLink, Globe, Map as MapIcon, Navigation, Plus, Trash2 } from 'lucide-react';
import type { ResolvedPlace } from '../lib/model';
import { categoryMeta } from '../lib/categories';
import { googleUrl, kakaoUrl, naverUrl } from '../lib/links';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface Props {
  place: ResolvedPlace | null;
  inRoute: boolean;
  activeDayLabel: string;
  onClose: () => void;
  onToggle: (p: ResolvedPlace) => void;
  onCopy: (text: string, label: string) => void;
}

function LinkBtn({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white/80 px-4 text-[13.5px] font-semibold text-slate-900 hover:bg-white hover:text-accent-700"
    >
      {icon}
      {children}
      <ExternalLink size={13} className="text-slate-600" aria-hidden="true" />
    </a>
  );
}

export function PlaceSheet({ place, inRoute, activeDayLabel, onClose, onToggle, onCopy }: Props) {
  const cat = categoryMeta(place?.category);
  return (
    <Modal open={!!place} onClose={onClose} title={place?.nameRu ?? ''}>
      {place && (
        <div className="space-y-4">
          <div>
            <p className="text-[13.5px] text-slate-600">
              {[place.nameEn, place.nameKo].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {place.cityName && <span className="rounded-full bg-white/80 px-3 py-1 text-[12px] font-medium">{place.cityName}</span>}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gd-accent-light)] px-3 py-1 text-[12px] font-medium text-accent-700">
                {cat && <cat.icon size={13} aria-hidden="true" />}
                {cat?.label ?? 'Найдено на карте'}
              </span>
            </div>
          </div>

          <p className="text-[14px] leading-relaxed text-slate-800">{place.description}</p>

          <section className="gd-card space-y-3 p-4" aria-label="Адрес">
            {place.addressEn && (
              <div>
                <h3 className="gd-section-title">Адрес</h3>
                <p className="mt-1 text-[13.5px]">{place.addressEn}</p>
              </div>
            )}
            {place.addressKo && (
              <div>
                <h3 className="gd-section-title">Адрес по-корейски (для таксиста)</h3>
                <p lang="ko" className="mt-1 text-[15px] font-medium">{place.addressKo}</p>
                <Button variant="tint" className="mt-2" onClick={() => onCopy(place.addressKo, 'Адрес скопирован')}>
                  <Copy size={15} /> Скопировать адрес по-корейски
                </Button>
              </div>
            )}
            {!place.addressEn && !place.addressKo && <p className="text-[13px] text-slate-600">Адрес не указан.</p>}
          </section>

          <section aria-label="Карты" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <LinkBtn href={naverUrl(place)} icon={<Navigation size={15} />}>Naver Map</LinkBtn>
            <LinkBtn href={kakaoUrl(place)} icon={<MapIcon size={15} />}>Kakao Map</LinkBtn>
            <LinkBtn href={googleUrl(place)} icon={<MapIcon size={15} />}>Google Maps</LinkBtn>
            {place.website && <LinkBtn href={place.website} icon={<Globe size={15} />}>Сайт</LinkBtn>}
          </section>

          <Button
            variant={inRoute ? 'danger-ghost' : 'primary'}
            className="w-full"
            onClick={() => {
              onToggle(place);
              if (!inRoute) onClose();
            }}
          >
            {inRoute ? <Trash2 size={16} /> : <Plus size={16} />}
            {inRoute ? 'Убрать из маршрута' : `Добавить в маршрут (${activeDayLabel})`}
          </Button>
          {inRoute && (
            <p className="flex items-center justify-center gap-1.5 text-[12.5px] text-[var(--gd-success-ink)]">
              <Check size={14} /> Это место уже в маршруте
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
