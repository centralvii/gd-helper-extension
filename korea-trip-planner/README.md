# Корея: маршрут

Мини-приложение для планирования поездки по Южной Корее: каталог мест (поиск на русском, английском и корейском), маршрут по дням с перетаскиванием, адреса на корейском для такси, ссылки на Naver / Kakao / Google Maps, экспорт и ссылка «поделиться». Работает на телефоне и компьютере, ставится на домашний экран как PWA.

Стек: Vite 6, React 18, TypeScript (strict), Tailwind CSS 3.4, lucide-react, @dnd-kit.

## Запуск

```bash
cd korea-trip-planner
npm install
npm run dev        # http://localhost:5173
npm run build      # проверка типов + production-сборка в dist/
npm run preview    # просмотр собранной версии
```

## Деплой на Vercel

1. Закоммитьте и запушьте репозиторий на GitHub.
2. На vercel.com нажмите **Add New… → Project** и выберите репозиторий.
3. В поле **Root Directory** нажмите **Edit** и укажите `korea-trip-planner`.
4. Framework Preset — **Vite** (определится сам). Build Command: `npm run build`, Output Directory: `dist` — значения по умолчанию подходят.
5. Нажмите **Deploy**. SPA-маршрутизация уже настроена в `vercel.json`.
6. На телефоне откройте сайт и выберите «Добавить на главный экран» — приложение установится как PWA.

## Данные

- `src/data/types.ts` — контракт данных (города и места).
- `src/data/cities.ts`, `src/data/places.ts` — каталог. Чтобы добавить место, дополните массив `PLACES`.

## Где хранится маршрут

В `localStorage` браузера (ключ `korea-trip-v1`). Для переноса между устройствами используйте «Поделиться» → ссылка или файл `.json`. Онлайн-поиск использует публичный сервис Nominatim (OpenStreetMap), без ключей.
