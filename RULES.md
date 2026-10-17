# RULES.md — Правила разработки проекта GDHelper Extension

> **ОБЯЗАТЕЛЬНО**: Любой AI-агент или человек, работающий с этим проектом, **ДОЛЖЕН прочитать и соблюдать** все правила ниже. Нарушение приводит к визуальной и структурной несогласованности, которую сложно исправить.

---

## 1. Дизайн-система «Aurora Glass»

Светлое «жидкое стекло» поверх мягкой авроры, **один индиго-акцент**, плотная вёрстка для узкой боковой панели. Шрифты — Geist / Geist Mono (пакеты `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`, работают офлайн).

### 1.1 Цвета

Единый источник токенов — CSS-переменные в `src/index.css` (`:root`). Tailwind ссылается на них: `gd-*` — токены, `accent-*` — индиго-шкала акцента (`accent-600` = `#4f5bd5`), `slate-*` — холодная нейтральная шкала (переопределена в `tailwind.config.js`).

| Токен | Значение | Назначение |
|---|---|---|
| `--gd-bg` | `#eef1fa` | Фон под авророй |
| `--gd-aurora-1/2/3` | `#c7cdfe`, `#b7f0de`, `#fbd3e6` | Пятна авроры (лаванда, мята, персик) — фон `#root` |
| `--gd-glass` | `rgba(255,255,255,.56)` + `--gd-glass-blur` | Стеклянные группы и карточки |
| `--gd-accent` / `gd-accent`, `accent-600` | `#4f5bd5` | **Единственный** акцент: основные кнопки, ссылки, активный раздел, переключатели |
| `--gd-accent-light` | `rgba(91,103,241,.14)` | Тонированные кнопки и бейджи |
| `--gd-text` | `#1b1f3b` | Основной текст |
| `--gd-muted` | `#5e6582` | Вторичный текст |
| `--gd-faint` | `#8a90aa` | Плейсхолдеры, номера, шевроны |
| `--gd-success` / `--gd-orange` / `--gd-red` | `#22b58a` / `#f59e3b` / `#e5484d` | Статусы: готово / внимание / ошибка и удаление |

**Правила цвета:** акцент — только `gd-accent` / `accent-*`; нейтральные — только `slate-*`; зелёный — только статус «готово/в задаче», оранжевый — предупреждения, красный — ошибки и удаление. `emerald-*`, `teal-*`, `gray-*` не используются.

### 1.2 Типографика

- Заголовок раздела: `text-[24px] font-bold tracking-[-0.03em]` (`Header`), при прокрутке — 16px.
- Текст строк: `text-[13–13.5px]`; метаданные: `text-[11.5–12px] text-gd-muted`.
- Подпись секции: `.gd-section-title` / `.gd-label` (10.5px, uppercase, `tracking 0.06em`).
- Имена файлов, ID, шаблоны, клавиши — `font-mono` (Geist Mono).

### 1.3 Стекло и формы

- Группы и карточки — `.gd-group` / `.gd-card`: стекло, радиус **20px**, белая рамка и внутренний блик. Рамок `border-slate-*` и теней у карточек вручную не добавлять.
- Плавающие панели (док, шапка при прокрутке, тосты, палитра) — `.gd-glass`.
- Кнопки — **капсулы** (`rounded-full`); поля — `rounded-xl` (12px); чипы — `.gd-chip`; меню — `.gd-menu`.
- Шторка (`Modal`) — плавающая стеклянная панель `rounded-[28px]` с отступом от краёв.
- Вложенный `backdrop-filter` создаёт контекст наложения: группа с открытым `.gd-menu` поднимается правилом `:has(.gd-menu)` в `index.css` — меню внутри групп делайте классом `.gd-menu`.

### 1.4 ЗАПРЕЩЁННЫЕ стили

- Тёмные фоны (кроме затемнения под шторкой и палитрой) и градиенты на кнопках/карточках (аврора — только фон `#root`).
- Второй акцентный цвет, `emerald-*`/`teal-*`/`gray-*`.
- Классы Tailwind v4 (`py-0.2`, `pl-8.5`, `animate-in`) и `/opacity` у цветов-переменных (`ring-gd-accent/40` не работает — используйте `accent-500/40`, для hex — `/[0.12]`).
- Прямые hex в `style={{}}` (исключение — вычисляемые значения, например кольцо прогресса).

---

## 2. Компоненты — стандарты и переиспользование

### 2.1 UI-примитивы (`src/components/ui/`, barrel `index.ts`)

| Компонент | Когда использовать |
|---|---|
| `Button` | Капсулы: `primary` (индиго со свечением; `emerald` — устаревший псевдоним), `secondary`/`toolbar` (стекло), `outline` (тонированная), `ghost` (текстовая), `danger` |
| `IconButton` | Круглые кнопки-иконки; для простых случаев — класс `.icon-btn` (стеклянный круг) / `.icon-btn--plain` |
| `ToolRow` | Строка-переход группы: иконка, подпись, значение, шеврон |
| `ProgressRing` | Кольцо прогресса (сбор объектов) |
| `Badge` | Пилюли: `success` (мята), `warning`, `danger`, `info` (индиго), `default`, `purple` |
| `Input`, `Textarea`, `Select` | Поля с заливкой; фокус — белый фон и индиго-кольцо |
| `SegmentedControl` | Капсульный переключатель со скользящим белым ползунком |
| `Card`, `Toolbar` | Стеклянные контейнеры |
| `Modal` | **Все** модальные окна (стеклянная шторка, свайп вниз) |

Оболочка (`src/components/layout/`): `Header` (заголовок раздела + ⌘K + «Во весь экран»), `TabBar` (плавающий стеклянный док из 4 разделов), `Footer` (капсула экспорта над доком), `Toast`, `CommandPalette`.

### 2.2 Группы и строки

```tsx
<div className="gd-section-title"><span>Шаблон имени</span><button>Пресеты</button></div>
<div className="gd-group gd-group--icons">
  <div className="gd-row">
    <span className="gd-row-icon gd-row-icon--accent"><Wand2 /></span>
    <span className="flex-1 text-[13.5px]">Подпись</span>
  </div>
  <ToolRow icon={<Tag />} label="Теги" value={3} onClick={...} />
</div>
```

- Строки 40–42px; второстепенная информация — в `title`/иконках, вторая строка только для ошибок.
- Частые параметры — чипами (`.gd-chip`), редкие действия — в меню «⋯» (`.gd-menu`).
- Переключатель — `.gd-switch` (`role="switch"` + `aria-checked`).

### 2.3 Командная палитра

Ctrl/⌘ + K — `CommandPalette`; команды собираются в `App.tsx` (`PaletteCommand` в `src/types`): разделы, действия, задачи, пакеты. Alt + 1…4 — разделы (`usePaletteShortcuts`). Новое частое действие — добавляйте и в палитру.

---

## 3. Иконки и анимации

### 3.1 Библиотека иконок

`lucide-react` — все иконки.

### 3.2 Движение

| Что | Как | Где |
|---|---|---|
| Нажатие | Любая кнопка «вдавливается» до `scale: 0.96` и возвращается пружиной | Глобально, `src/index.css` |
| Иконка при нажатии | По имени lucide-иконки: обновить/настройки — вращение, удалить/закрыть — тряска, добавить/скачать — прыжок, молния/искры — покачивание; переопределение `data-icon-anim` | `src/utils/iconTapAnimation.ts` |
| Экраны | `animate-screen-in` / `animate-screen-back` | Разделы, «‹ Задачи», детали YouTrack |
| Списки | `gd-stagger` (fill-mode `backwards`) | Файлы, задачи, меню |
| Появление | `animate-pop-in`, `animate-fade-in`, `animate-toast-in` | Галочки, палитра, тосты |
| Прогресс | `ProgressRing` — плавное заполнение дуги | Сводка задачи |

При `prefers-reduced-motion` анимации отключаются.

---

## 4. Архитектура и структура кода

### 4.1 Структура директорий

```
src/
├── background/          # Service Worker расширения
├── checklist/           # Отдельная страница чеклиста сбора (checklist.html)
├── components/
│   ├── ui/              # Переиспользуемые примитивы (Button, IconButton, Badge, Input, Textarea, Select, SegmentedControl, Card, Toolbar, Modal)
│   ├── layout/          # Header, TabBar, Footer, Toast, CommandPalette
│   ├── template/        # Шаблон имени, пакеты, автосбор (PackageSelector, TemplateEditor, ...)
│   ├── table/           # Таблица файлов (FileTable, FileRowItem, FileEditModal)
│   ├── upload/          # Импорт файлов (FileUploader)
│   ├── validation/      # Панель валидации
│   ├── readme/          # Редактор README
│   ├── implementation/  # Вкладка «Реализация» (TaskSelector, TaskEditor, ChangeItemRow, ...)
│   ├── youtrack/        # Вкладка «YouTrack»
│   └── extra/           # Вкладка «Утилиты» (генератор ID алгоритмов, подключение ИИ)
├── constants/           # Реестры и константы (AI-агенты, шапка алгоритма)
├── core/                # Чистая бизнес-логика без React (парсеры, шаблоны, валидация, ZIP)
├── hooks/               # Кастомные React-хуки (useAppState, useImplementationTasks, ...)
├── services/            # Внешние вызовы (LLM-генерация ID)
├── types/               # TypeScript интерфейсы
├── utils/               # Утилиты (tabUtils, indexedDB, errorUtils, pluralize, ...)
└── sidepanel/           # Точка входа (App.tsx)
```

### 4.2 Правила именования

- Компоненты: `PascalCase` — `FileRowItem.tsx`, `TemplateEditor.tsx`
- Хуки: `camelCase` с префиксом `use` — `useAppState.ts`
- Утилиты: `camelCase` — `tabUtils.ts`
- Типы: `PascalCase` для интерфейсов — `FileRow`, `BuildPackage`
- CSS-классы: `kebab-case` — `.icon-btn`, `.header-tab`, `.gd-card`
- Компонент-файлы: один экспортируемый компонент на файл

### 4.3 Технологический стек

| Технология | Версия / пакет | Назначение |
|---|---|---|
| React | `^18.3` | UI-фреймворк |
| TypeScript | `~5.7` | Типизация |
| Tailwind CSS | `^3.4` | Утилитарные стили |
| Vite | `^6.2` | Сборка |
| `clsx` + `tailwind-merge` | — | Слияние классов без конфликтов |
| `lucide-react` | `^1.16` | Иконки компонентов и навигации |
| `@dnd-kit` | — | Drag & Drop сортировка |
| `jszip` | — | Работа с ZIP |

### 4.4 Правила TypeScript

- **Строгая типизация**: все пропсы компонентов должны иметь явный интерфейс
- **Типы** из `src/types/index.ts` — всегда импортировать оттуда, не дублировать
- Новые типы добавлять в `src/types/index.ts`
- Использовать `React.FC<Props>` для компонентов
- Не использовать `any` — всегда указывать конкретный тип. В `catch` ошибка имеет тип `unknown`; текст извлекать через `getErrorMessage(err, 'Фоллбэк')` из `src/utils/errorUtils.ts`

---

## 5. Модальные окна (стеклянные шторки)

Все модалки — `<Modal>` (`src/components/ui/Modal.tsx`): плавающая стеклянная шторка, страница под ней уменьшается (`body.gd-sheet-open`, прокручивается `#root`), закрытие крестиком, `Esc`, тапом по фону или свайпом вниз за шапку. Поля на фоне шторки автоматически белые (`.gd-sheet-body`).

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Заголовок" maxWidth="md"
  footer={<>
    <Button variant="secondary" size="sm" onClick={onClose}>Отмена</Button>
    <Button variant="primary" size="sm" onClick={onSave}>Сохранить</Button>
  </>}>
  {/* Содержимое */}
</Modal>
```

**Не допускается** создавать кастомные модалки с нуля.

---

## 6. Состояние и логика

### 6.1 Хуки

- Вся логика работы с состоянием вынесена в кастомные хуки (`src/hooks/`)
- `useAppState` — основное состояние пакера (файлы, шаблон, пакеты, переменные)
- `useImplementationTasks` — управление задачами реализации
- `useAutoCollector` — автосбор .guf файлов из браузера
- `useGlobalFileDrop` — глобальный drag-and-drop файлов

Новая логика должна быть оформлена как отдельный хук в `src/hooks/`.

### 6.2 Хранилище

- Состояние сохраняется через `chrome.storage.local`
- Файлы (Blob/File) **НЕ** сериализуются в хранилище — хранятся только метаданные (`StoredPackageMeta`)

---

## 7. Сборка и команды

```bash
# Разработка (hot-reload)
npm run dev

# Production-сборка
npm run build      # → tsc && vite build → dist/

# Непрерывная пересборка
npm run watch
```

**ВАЖНО для Windows PowerShell**: команды не поддерживают `&&`. Разделять через `;` или запускать поочерёдно.

### 7.1 Перед коммитом ОБЯЗАТЕЛЬНО

1. Запустить `npm run build` — убедиться, что сборка проходит без ошибок
2. Проверить, что нет TypeScript ошибок
3. Описание коммита — на английском, формат: `type: description` (например `style: standardize card spacing`)

---

## 8. Локализация

- **Весь UI** — на **русском языке**
- Числительные склонять через `pluralizeRu(n, FILE_FORMS)` из `src/utils/pluralize.ts` (не `n === 1 ? 'файл' : 'файлов'`)
- Комментарии в коде — на русском или английском (предпочтительно русский)
- Названия переменных, функций, компонентов — на **английском**
- Коммиты — на **английском**

---

## 9. Чеклист перед PR / коммитом

- [ ] Все новые компоненты переиспользуют примитивы из `ui/` (`Button`, `Badge`, `Input`, `Textarea`, `Card`, `Toolbar`, `Modal`, ...)
- [ ] Экран собран из стеклянных групп (`.gd-group`, `.gd-row`, `.gd-chip`, `ToolRow`), без ручных рамок и теней
- [ ] Один акцент (`gd-accent` / `accent-*`), нейтральные — только `slate-*`; кнопки — капсулы; нет классов Tailwind v4
- [ ] Частое действие доступно в командной палитре
- [ ] Кнопки-иконки круглые (`.icon-btn` / `IconButton`)
- [ ] Новые кнопки не ломают глобальные анимации нажатия и иконок (при необходимости — `data-icon-anim`)
- [ ] Нет `any`; ошибки из `catch` — через `getErrorMessage`
- [ ] `PROJECT_DOCUMENTATION.md` обновлён (раздел Changelog)
- [ ] Типы определены в `src/types/index.ts`
- [ ] `npm run build` проходит без ошибок
- [ ] UI-текст на русском языке
