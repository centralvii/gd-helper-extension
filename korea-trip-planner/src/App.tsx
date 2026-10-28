import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPinned } from 'lucide-react';
import { useTrip } from './hooks/useTrip';
import { itemKey, newItem, type ResolvedPlace, type Trip } from './lib/model';
import { clearHash, copyText, readTripFromHash } from './lib/share';
import { SearchPanel } from './components/SearchPanel';
import { RoutePanel } from './components/RoutePanel';
import { PlaceSheet } from './components/PlaceSheet';
import { ExportMenu } from './components/ExportMenu';
import { BottomNav, type Tab } from './components/BottomNav';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { Toasts, type ToastMsg } from './components/ui/Toast';

const countItems = (t: Trip) => t.days.reduce((n, d) => n + d.items.length, 0);

export default function App() {
  const { trip, activeDayId, dispatch } = useTrip();
  const [tab, setTab] = useState<Tab>('search');
  const [selected, setSelected] = useState<ResolvedPlace | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [pending, setPending] = useState<Trip | null>(() => readTripFromHash());
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const notify = useCallback((text: string, error?: boolean) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, error }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  useEffect(() => {
    const onHash = () => {
      const t = readTripFromHash();
      if (t) setPending(t);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const total = countItems(trip);
  const keyToUid = useMemo(() => {
    const m = new Map<string, string>();
    trip.days.forEach((d) => d.items.forEach((i) => m.set(itemKey(i), i.uid)));
    return m;
  }, [trip]);
  const inRouteKeys = useMemo(() => new Set(keyToUid.keys()), [keyToUid]);
  const activeIdx = Math.max(0, trip.days.findIndex((d) => d.id === activeDayId));

  const toggle = useCallback(
    (p: ResolvedPlace) => {
      const uid = keyToUid.get(p.key);
      if (uid) {
        dispatch({ type: 'removeItem', uid });
        notify('Убрано из маршрута');
      } else {
        dispatch({ type: 'addItem', item: newItem(p) });
        notify(`Добавлено в День ${activeIdx + 1}`);
      }
    },
    [keyToUid, dispatch, notify, activeIdx],
  );

  const copy = useCallback(
    async (text: string, label: string) => notify(label, !(await copyText(text))),
    [notify],
  );

  const requestImport = (t: Trip) => {
    if (total === 0) {
      dispatch({ type: 'replace', trip: t });
      notify('Маршрут загружен');
      setTab('route');
    } else setPending(t);
  };
  const closePending = () => {
    setPending(null);
    clearHash();
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[1280px] px-4 pb-[calc(var(--tabbar-h)+var(--sab)+16px)] pt-[calc(var(--sat)+16px)] lg:pb-8">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-600 text-white" aria-hidden="true">
          <MapPinned size={22} />
        </span>
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-[-0.03em] lg:text-[24px]">Корея: маршрут</h1>
          <p className="text-[12.5px] text-slate-600">Места, дни и адреса для такси — в одном плане</p>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start lg:gap-6">
        <main className={tab === 'search' ? 'block' : 'hidden lg:block'} aria-label="Поиск мест">
          <SearchPanel inRouteKeys={inRouteKeys} onOpen={setSelected} onToggle={toggle} />
        </main>
        <aside
          className={`${tab === 'route' ? 'block' : 'hidden lg:block'} scroll-y lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:pr-1`}
          aria-label="Мой маршрут"
        >
          <RoutePanel trip={trip} activeDayId={activeDayId} dispatch={dispatch} onOpen={setSelected} onShare={() => setShareOpen(true)} onGoSearch={() => setTab('search')} />
        </aside>
      </div>

      <BottomNav tab={tab} onTab={setTab} count={total} />

      <PlaceSheet
        place={selected}
        inRoute={!!selected && inRouteKeys.has(selected.key)}
        activeDayLabel={`День ${activeIdx + 1}`}
        onClose={() => setSelected(null)}
        onToggle={toggle}
        onCopy={copy}
      />
      <ExportMenu open={shareOpen} trip={trip} onClose={() => setShareOpen(false)} notify={notify} onImport={requestImport} onClear={() => setClearOpen(true)} />
      <ConfirmDialog
        open={clearOpen}
        title="Очистить маршрут?"
        text="Все дни и места будут удалены. Это действие нельзя отменить."
        confirmLabel="Очистить"
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          dispatch({ type: 'clear' });
          setClearOpen(false);
          notify('Маршрут очищен');
        }}
      />
      <ConfirmDialog
        open={!!pending}
        danger={false}
        title="Открыть присланный маршрут?"
        text={pending ? `«${pending.name}»: ${pending.days.length} дн., ${countItems(pending)} мест.${total ? ' Ваш текущий маршрут будет заменён.' : ''}` : ''}
        confirmLabel="Открыть"
        onCancel={closePending}
        onConfirm={() => {
          if (pending) dispatch({ type: 'replace', trip: pending });
          closePending();
          setTab('route');
          notify('Маршрут загружен');
        }}
      />
      <Toasts items={toasts} />
    </div>
  );
}
