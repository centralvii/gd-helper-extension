# RULES.md — Правила разработки проекта GDHelper Extension

> **ОБЯЗАТЕЛЬНО**: Любой AI-агент или человек, работающий с этим проектом, **ДОЛЖЕН прочитать и соблюдать** все правила ниже. Нарушение приводит к визуальной и структурной несогласованности, которую сложно исправить.

---

## 1. Дизайн-система GreenData (стиль iOS)

Интерфейс оформлен как приложение iOS: **строгая монохромная база** (системные серые iOS) и **один акцент** GreenData. Крупные заголовки, группированные списки, нижний таб-бар, шторки, пружинные анимации.

### 1.1 Цвета

Единый источник токенов — CSS-переменные в `src/index.css` (`:root`). Tailwind-цвета `gd-*` ссылаются на них, а шкала `slate-*` в `tailwind.config.js` **переопределена системными серыми iOS** (`slate-500` = `#8e8e93`, `slate-900` = `#1c1c1e` и т.д.).

| CSS-переменная / Tailwind | Значение | Назначение |
|---|---|---|
| `--gd-bg` / `bg-gd-bg` | `#f2f2f7` | Фон экрана (systemGroupedBackground) |
| `--gd-surface` | `#ffffff` | Группы, карточки, шторки |
| `--gd-fill` / `bg-gd-fill` | `rgba(120,120,128,.12)` | Заливка полей, вторичных кнопок, кнопок-иконок |
| `--gd-fill-2` / `bg-gd-fill-2` | `rgba(120,120,128,.08)` | Hover строк, тихие подложки |
| `--gd-green` / `gd-green` | `#059669` | **Единственный** акцент: основные кнопки, ссылки, активный таб |
| `--gd-green-dark` | `#047857` | Hover основной кнопки |
| `--gd-green-light` / `gd-green-light` | `rgba(5,150,105,.12)` | Тонированные кнопки и бейджи |
| `--gd-text` / `gd-text` | `#1c1c1e` | Основной текст (label) |
| `--gd-muted` / `gd-muted` | `rgba(60,60,67,.62)` | Вторичный текст (secondaryLabel) |
| `--gd-faint` / `gd-faint` | `rgba(60,60,67,.32)` | Плейсхолдеры, шевроны (tertiaryLabel) |
| `--gd-border` / `gd-border` | `rgba(60,60,67,.14)` | Разделители (separator) |
| `--gd-red`, `--gd-orange`, `--gd-switch` | `#ff3b30`, `#ff9500`, `#34c759` | Системные цвета iOS: удаление, предупреждение, переключатель |

**Правила цвета:**
- Нейтральная шкала — **только `slate-*`** (это серые iOS).
- Акцент — только `gd-green` / `emerald-*`. Красный — только для удаления и ошибок, оранжевый — для предупреждений.
- Белый текст — только на залитых кнопках, бейджах-счётчиках и аватарах.

### 1.2 Типографика

- Шрифт: **Inter Variable** (пакет `@fontsource-variable/inter`, подключён в `main.tsx`, работает офлайн); моноширинный — JetBrains Mono → Consolas (`font-mono`).
- Крупный заголовок экрана: `text-[28px] font-bold tracking-[-0.025em]` (в `Header`).
- Текст строк: `text-[14px]`; подписи и метаданные: `text-[12px] text-gd-muted`.
- Заголовок секции над группой: класс `.gd-section-title` (11.5px, uppercase, `text-gd-muted`).

### 1.3 ЗАПРЕЩЁННЫЕ стили

- Тёмные фоны (`bg-slate-700+` и т.п.), в том числе для блоков кода. Исключения: затемнение под шторкой `bg-black/30` и активный чип фильтра `bg-slate-900`.
- Рамки и тени у карточек на сером фоне: группы iOS — **плоские белые блоки** (`.gd-group`, `rounded-xl`), без `border` и `shadow`.
- `rounded-2xl`/`rounded-3xl` для карточек. Исключения: верх шторки (`rounded-t-2xl`), «пузыри» чата и тост (`rounded-[18–22px]`), круглые кнопки (`rounded-full`).
- Градиенты на кнопках и карточках.
- Прямые hex-значения в `style={{}}`.
- Классы Tailwind v4 (`py-0.2`, `pl-8.5`, `animate-in`, `rounded-*-xs`) и модификатор прозрачности у цветов-переменных (`ring-gd-green/40` не работает — используйте `emerald-500/40`, для hex — `/[0.12]`).

---

## 2. Компоненты — стандарты и переиспользование

### 2.1 UI-примитивы (`src/components/ui/`, barrel `index.ts`)

| Компонент | Когда использовать |
|---|---|
| `Button` | Кнопки с текстом. `primary`/`emerald` — залитая акцентом; `secondary`/`toolbar` — серая заливка; `outline` — тонированная зелёная; `ghost` — текстовая зелёная; `danger` — красная. Размеры: `xs`/`sm` — капсулы, `md`/`lg` — `rounded-[10px]`/`rounded-xl` |
| `IconButton` | Круглые кнопки-иконки (`ghost`, `secondary`, `danger`, `emerald`, `sky`) |
| `ToolRow` | Строка-переход группы: иконка, подпись, значение, шеврон (Теги, Пресеты, Параметры задачи…) |
| `Badge` | Плоские тонированные «пилюли» без рамок |
| `Input`, `Textarea`, `Select` | Поля с серой заливкой; при фокусе — белые с зелёным кольцом |
| `SegmentedControl` | Переключатель iOS со скользящим белым ползунком |
| `Card` | Группа с шапкой (`Card.Header/Body/Footer`) — для сложных блоков; для списков предпочтительнее `.gd-group` |
| `Toolbar` | Белая панель с круглыми/капсульными кнопками |
| `Modal` | **Все** модальные окна (iOS-шторка, см. раздел 5) |

Компоненты оболочки (`src/components/layout/`): `Header` (крупный заголовок), `TabBar` (нижний таб-бар), `Toast` (уведомление-капсула), `Footer` (экспорт над таб-баром).

### 2.2 Группированные списки (inset grouped)

Основной строительный блок экрана — CSS-классы из `src/index.css`:

```tsx
<div className="gd-section-title"><span>Шаблон имени</span><button>Действие</button></div>
<div className="gd-group gd-group--icons">         {/* белая группа, разделители с отступом под иконку */}
  <div className="gd-row">                          {/* строка 44px; соседние строки разделены волосяной линией */}
    <span className="gd-row-icon gd-row-icon--accent"><Wand2 /></span>
    <span className="flex-1 text-[14px]">Подпись</span>
    <span className="text-gd-muted">Значение</span>
  </div>
  <ToolRow icon={<Tag />} label="Теги" value={3} onClick={...} />   {/* строка-переход */}
</div>
```

- Между группами — `space-y-3`…`space-y-5`; внутри экрана отступ по бокам `px-4` задаёт `App`.
- Нажимаемая строка — `.gd-row--tap`; поле — `.gd-field`; меню — `.gd-menu`; переключатель — `.gd-switch` (`role="switch"` + `aria-checked`).
- Выпадающие меню группы открываются внутри группы с `!overflow-visible`.

### 2.3 Кнопки-иконки

`.icon-btn` — круглая серая кнопка 30px; `.icon-btn--plain` — без заливки; `.icon-btn--danger` — красная при наведении. Либо компонент `IconButton`.

---

## 3. Иконки и анимации

### 3.1 Библиотека иконок

`lucide-react` — все иконки.

### 3.2 Движение

Все анимации — на пружине (`--ease-spring`) или с замедлением (`--ease-out`), keyframes — в `src/index.css`.

| Что | Как | Где |
|---|---|---|
| Нажатие | Любая `button`/`[role=button]` «вдавливается» до `scale: 0.96` и возвращается пружиной | Глобально, `src/index.css` (свойство `scale`, не конфликтует с `translate`) |
| Анимация иконки при нажатии | По имени lucide-иконки: обновить/настройки — вращение, удалить/закрыть — тряска, добавить/скачать/отправить — прыжок, ИИ/молния — покачивание, остальные — пружинка. Переопределение: `data-icon-anim="spin\|shake\|bounce\|pop\|wiggle\|none"` | `src/utils/iconTapAnimation.ts` (глобальный слушатель) |
| Смена экрана | `animate-screen-in` (вперёд), `animate-screen-back` (назад) | Вкладки, «‹ Задачи», детали YouTrack |
| Списки | `gd-stagger` — каскадное появление (fill-mode `backwards`, не мешает dnd-kit) | Файлы, задачи, меню |
| Появление | `animate-pop-in`, `animate-fade-in`, `animate-slide-down`, `animate-toast-in` | Галочки, пустые состояния, тосты |
| Hover-эффекты | `.vk-icon-pop/spin/shake/bounce` | По желанию на отдельных кнопках |

При `prefers-reduced-motion` анимации и «вдавливание» отключаются.

### 3.3 Прочие общие CSS-классы

`.gd-glass` (стекло навбара/таб-бара), `.gd-label`, `.gd-card`, `.gd-sheet-body`, `.tabular-nums` — см. `src/index.css`.

---

## 4. Архитектура и структура кода

### 4.1 Структура директорий

```
src/
├── background/          # Service Worker расширения
├── checklist/           # Отдельная страница чеклиста сбора (checklist.html)
├── components/
│   ├── ui/              # Переиспользуемые примитивы (Button, IconButton, Badge, Input, Textarea, Select, SegmentedControl, Card, Toolbar, Modal)
│   ├── layout/          # Header, Footer
│   ├── template/        # Шаблон имени, пакеты, автосбор (PackageSelector, TemplateEditor, ...)
│   ├── table/           # Таблица файлов (FileTable, FileRowItem, FileEditModal)
│   ├── upload/          # Импорт файлов (FileUploader)
│   ├── validation/      # Панель валидации
│   ├── readme/          # Редактор README
│   ├── implementation/  # Вкладка «Реализация» (TaskSelector, TaskEditor, ChangeItemRow, ...)
│   ├── youtrack/        # Вкладка «YouTrack»
│   ├── extra/           # Вкладка «Дополнительно» (генератор ID алгоритмов)
│   └── ai/              # Вкладка «ИИ-ассистент»
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

## 5. Модальные окна (iOS-шторки)

Все модалки — компонент `<Modal>` (`src/components/ui/Modal.tsx`). Он рисует iOS-шторку:
- выезжает снизу на пружине; страница под ней уменьшается и затемняется (класс `body.gd-sheet-open`, поэтому прокручивается `#root`, а не окно);
- закрывается крестиком, по `Esc`, тапом по фону или **свайпом вниз за шапку**;
- тело шторки серое (`.gd-sheet-body`): белые карточки внутри выглядят как группы, поля на сером фоне автоматически белые.

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
- [ ] Списки и настройки собраны из `.gd-group` / `.gd-row` / `ToolRow`, карточки без рамок и теней
- [ ] Один акцент (`gd-green`), нейтральные — только `slate-*`; нет тёмных фонов и классов Tailwind v4
- [ ] Кнопки-иконки круглые (`.icon-btn` / `IconButton`)
- [ ] Новые кнопки не ломают глобальные анимации нажатия и иконок (при необходимости — `data-icon-anim`)
- [ ] Нет `any`; ошибки из `catch` — через `getErrorMessage`
- [ ] `PROJECT_DOCUMENTATION.md` обновлён (раздел Changelog)
- [ ] Типы определены в `src/types/index.ts`
- [ ] `npm run build` проходит без ошибок
- [ ] UI-текст на русском языке
