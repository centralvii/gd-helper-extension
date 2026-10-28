// Vercel Function: прокси к Korea Tourism Organization TourAPI (data.go.kr).
// Формат: Web Standard `export default { fetch }` (поддерживается для не-Next проектов).
declare const process: { env: Record<string, string | undefined> };

type Category = 'sight' | 'palace' | 'museum' | 'nature' | 'food' | 'shopping' | 'nightlife' | 'viewpoint' | 'activity';

interface OnlinePlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  image?: string;
  category: Category;
  tel?: string;
  areacode?: string;
  source: 'tour';
}

// Коды contentTypeId: RusService/EngService (76, 78, 85, 75, 82, 79, 80) и корейские (12, 14, 15, 28, 39, 38, 32).
const CATEGORY: Record<string, Category | null> = {
  '76': 'sight', '12': 'sight',
  '78': 'museum', '14': 'museum',
  '82': 'food', '39': 'food',
  '79': 'shopping', '38': 'shopping',
  '75': 'activity', '28': 'activity',
  '85': 'activity', '15': 'activity',
  '80': null, '32': null, // отели пропускаем
  '77': null, '25': null, // транспорт, маршруты
};

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
}

function encodeKey(key: string): string {
  // Ключ с data.go.kr бывает уже URL-encoded: не кодируем повторно.
  return key.includes('%') ? key : encodeURIComponent(key);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
}

function toArray(items: unknown): Record<string, unknown>[] {
  if (!items || typeof items !== 'object') return []; // items === ''
  const item = (items as { item?: unknown }).item;
  if (!item) return [];
  return (Array.isArray(item) ? item : [item]) as Record<string, unknown>[];
}

function mapItem(it: Record<string, unknown>): OnlinePlace | null {
  const category = CATEGORY[str(it.contenttypeid)];
  if (!category) return null;
  const lat = parseFloat(str(it.mapy));
  const lng = parseFloat(str(it.mapx));
  const id = str(it.contentid);
  const name = str(it.title);
  if (!id || !name || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  const out: OnlinePlace = {
    id: 'tour-' + id,
    name,
    address: [str(it.addr1), str(it.addr2)].filter(Boolean).join(' '),
    lat,
    lng,
    category,
    source: 'tour',
  };
  const image = str(it.firstimage) || str(it.firstimage2);
  if (image) out.image = image.replace(/^http:\/\//, 'https://');
  const tel = str(it.tel);
  if (tel) out.tel = tel;
  const area = str(it.areacode);
  if (area) out.areacode = area;
  return out;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const key = process.env.TOUR_API_KEY;
    if (!key) return json({ error: 'TOUR_API_KEY not configured' }, 503);

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim();
    if (q.length < 2 || q.length > 80) return json({ error: 'q must be 2-80 characters' }, 400);
    const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'ru';
    const page = Math.min(Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1), 100);

    const v1 = process.env.TOUR_API_VERSION === '1';
    const service = (lang === 'en' ? 'EngService' : 'RusService') + (v1 ? '1' : '2');
    const op = v1 ? 'searchKeyword1' : 'searchKeyword2';
    const endpoint =
      `https://apis.data.go.kr/B551011/${service}/${op}` +
      `?serviceKey=${encodeKey(key)}&MobileOS=ETC&MobileApp=KoreaTripPlanner&_type=json` +
      `&keyword=${encodeURIComponent(q)}&numOfRows=20&pageNo=${page}&arrange=O`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(endpoint, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        // Ошибки шлюза приходят в XML (SERVICE_KEY_IS_NOT_REGISTERED_ERROR и т.п.)
        const msg = /<returnAuthMsg>([^<]*)</.exec(text)?.[1] ?? /<errMsg>([^<]*)</.exec(text)?.[1] ?? 'non-JSON response';
        return json({ error: 'upstream error', detail: msg.slice(0, 120) }, 502);
      }
      const header = data?.response?.header;
      const code = String(header?.resultCode ?? '');
      if (code !== '0000') {
        // 0003 "no data" — не ошибка
        if (code === '0003') return json({ items: [], total: 0 }, 200, cacheHeaders());
        return json({ error: 'upstream error', detail: `${code} ${String(header?.resultMsg ?? '')}`.trim() }, 502);
      }
      const body = data.response.body ?? {};
      const items = toArray(body.items).map(mapItem).filter((x): x is OnlinePlace => x !== null);
      return json({ items, total: Number(body.totalCount) || items.length }, 200, cacheHeaders());
    } catch (e) {
      const aborted = (e as { name?: string })?.name === 'AbortError';
      return json({ error: aborted ? 'upstream timeout' : 'upstream failure' }, aborted ? 504 : 502);
    } finally {
      clearTimeout(timer);
    }
  },
};

function cacheHeaders(): Record<string, string> {
  return { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800' };
}
