import { useRef } from 'react';
import { ClipboardCopy, FileText, FileJson, Link2, Share2, Upload, Trash2 } from 'lucide-react';
import type { Trip } from '../lib/model';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { buildShareUrl, canWebShare, copyText, downloadFile, sanitizeTrip, tripToText, webShare } from '../lib/share';

interface Props {
  open: boolean;
  trip: Trip;
  onClose: () => void;
  notify: (text: string, error?: boolean) => void;
  onImport: (t: Trip) => void;
  onClear: () => void;
}

export function ExportMenu({ open, trip, onClose, notify, onImport, onClear }: Props) {
  const file = useRef<HTMLInputElement>(null);
  const slug = (trip.name || 'korea-trip').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() || 'korea-trip';

  const run = async (fn: () => Promise<boolean> | boolean, ok: string) => {
    const res = await fn();
    notify(res ? ok : 'Не получилось. Попробуйте ещё раз.', !res);
  };

  const readFile = async (f: File) => {
    try {
      const t = sanitizeTrip(JSON.parse(await f.text()));
      if (!t) throw new Error('bad');
      onImport(t);
      onClose();
    } catch {
      notify('Файл не похож на маршрут (нужен .json из этого приложения).', true);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Поделиться и сохранить" compact>
      <div className="grid gap-2">
        <Button variant="ghost" className="justify-start" onClick={() => run(() => copyText(tripToText(trip)), 'Маршрут скопирован текстом')}>
          <ClipboardCopy size={16} /> Копировать маршрут текстом
        </Button>
        <Button variant="ghost" className="justify-start" onClick={() => run(() => copyText(buildShareUrl(trip)), 'Ссылка скопирована')}>
          <Link2 size={16} /> Копировать ссылку на маршрут
        </Button>
        {canWebShare() && (
          <Button variant="tint" className="justify-start" onClick={() => run(() => webShare(trip), 'Готово')}>
            <Share2 size={16} /> Отправить через…
          </Button>
        )}
        <Button variant="ghost" className="justify-start" onClick={() => { downloadFile(`${slug}.txt`, tripToText(trip), 'text/plain'); notify('Файл .txt сохранён'); }}>
          <FileText size={16} /> Скачать .txt
        </Button>
        <Button variant="ghost" className="justify-start" onClick={() => { downloadFile(`${slug}.json`, JSON.stringify(trip, null, 2), 'application/json'); notify('Файл .json сохранён'); }}>
          <FileJson size={16} /> Скачать .json
        </Button>
        <Button variant="ghost" className="justify-start" onClick={() => file.current?.click()}>
          <Upload size={16} /> Импортировать .json
        </Button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Выбрать файл маршрута .json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void readFile(f);
          }}
        />
        <Button variant="danger-ghost" className="mt-2 justify-start" onClick={() => { onClose(); onClear(); }}>
          <Trash2 size={16} /> Очистить маршрут
        </Button>
      </div>
    </Modal>
  );
}
