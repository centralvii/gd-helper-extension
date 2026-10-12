# RULES.md — Правила разработки проекта GDHelper Extension

> **ОБЯЗАТЕЛЬНО**: Любой AI-агент или человек, работающий с этим проектом, **ДОЛЖЕН прочитать и соблюдать** все правила ниже. Нарушение приводит к визуальной и структурной несогласованности, которую сложно исправить.

---

## 1. Дизайн-система GreenData

### 1.1 Цветовая палитра

Проект использует **строго бело-зелёную** тему в стиле GreenData. **Запрещено** использовать тёмные фоны.

Единый источник токенов — CSS-переменные в `src/index.css` (`:root`). Tailwind-цвета `gd-*` в `tailwind.config.js` ссылаются на них (`gd-green` → `var(--gd-green)`), поэтому значения меняются в одном месте.

| CSS-переменная / Tailwind | Значение | Назначение |
|---|---|---|
| `--gd-bg` / `gd-bg` | `#f8faf9` | Фон страницы (+ мягкое зелёное свечение сверху в `body`) |
| `--gd-surface` / `gd-surface` | `#ffffff` | Фон карточек, модалок |
| `--gd-green` / `gd-green` | `#059669` (emerald-600) | Основной акцент |
| `--gd-green-dark` / `gd-green-dark` | `#047857` (emerald-700) | Активные состояния, hover |
| `--gd-green-light` / `gd-green-light` | `#ecfdf5` (emerald-50) | Фон подсветки, hover кнопок |
| `--gd-border` / `gd-border` | `#e5e9e6` | Границы |
| `--gd-border-green` / `gd-border-green` | `rgba(5,150,105,0.28)` | Зелёные границы акцента |
| `--gd-text` / `gd-text` | `#0f172a` (slate-900) | Основной текст |
| `--gd-muted` / `gd-muted` | `#64748b` (slate-500) | Вторичный текст |
| `--gd-faint` / `gd-faint` | `#94a3b8` (slate-400) | Placeholder, disabled |

**Шкалы Tailwind:**
- Нейтральная шкала — **только `slate-*`** (не `gray-*`, не `zinc-*`).
- Акцент — `emerald-*`; статусы — `amber-*` (предупреждение), `rose-*` (ошибка), `sky-*` (инфо), `purple-*`.

**Tailwind-классы для фонов:**
- Страница: фон задаёт `body` — корневые контейнеры **не** перекрывают его своим `bg-*`
- Карточки: `bg-white`
- Hover строк: `hover:bg-emerald-50/30`
- Заголовки карточек: `bg-slate-50/70`
- Акцент бейджи/подсветки: `bg-emerald-50`, `bg-emerald-100`
- Светлые нейтральные подложки (`bg-slate-50`, `bg-slate-100`) допустимы

### 1.2 Типографика

- Основной шрифт: системный стек (`-apple-system, Segoe UI, Roboto`) с `Inter` в цепочке (`font-sans`); веб-шрифты не подгружаются — расширение работает офлайн
- Моноширинный: **JetBrains Mono** → Consolas (`font-mono`)
- Базовый размер текста: `13px` (body), `text-xs` (12px) для карточек
- Заголовки секций: `text-xs font-bold text-slate-900`
- Подписи: `.gd-label` или `text-[10px] font-semibold uppercase tracking-wider text-slate-500`
- Mono-контент (имена файлов, шаблоны): `font-mono text-xs font-bold`

### 1.3 ЗАПРЕЩЁННЫЕ стили

Нельзя использовать:
- Тёмные фоны: `bg-slate-700`…`bg-slate-950`, `bg-gray-800+`, `bg-zinc-*`, `bg-[#0d1117]` и т.п. (в том числе для блоков кода — они светлые: `bg-slate-50/80 border-slate-200`). Исключение — полупрозрачное затемнение под модалкой `bg-slate-900/40`
- `text-white` на тёмных карточках (белый текст допустим только на зелёных/красных кнопках и бейджах)
- `rounded-2xl`, `rounded-3xl` для карточек — **только `rounded-xl`**. Единственное исключение — верх шторки `Modal` (`rounded-t-2xl`)
- Тени `shadow-xl`, `shadow-2xl` для обычных карточек (допустимо для модалок и выпадающих меню)
- Прямые hex-значения в `style={{}}` вместо токенов/Tailwind-классов
- Классы Tailwind v4, которых нет в v3: дробные шаги вроде `py-0.2`, `pl-8.5`, `bottom-22`, `rounded-*-xs`, `animate-in fade-in`. Они молча не генерируются. Тени `shadow-xs` / `shadow-2xs` добавлены в `tailwind.config.js` и разрешены
- Атрибут `class="dark"` на `<html>` — тёмной темы в проекте нет

---

## 2. Компоненты — стандарты и переиспользование

### 2.1 Обязательное использование существующих UI-примитивов

В `src/components/ui/` определены базовые компоненты (barrel-экспорт — `src/components/ui/index.ts`). **Запрещено** дублировать их логику inline.

| Компонент | Импорт | Когда использовать |
|---|---|---|
| `Button` | `from '../ui/Button'` | Любые кнопки с текстом. Варианты: `primary`, `secondary`, `danger`, `ghost`, `emerald`, `outline`, `toolbar`. Размеры: `xs`, `sm`, `md`, `lg`. `isLoading`, `leftIcon`, `rightIcon` |
| `IconButton` | `from '../ui/IconButton'` | Квадратные кнопки-иконки с вариантами (`ghost`, `secondary`, `danger`, `emerald`, `sky`). Для простых случаев — CSS-класс `.icon-btn` |
| `Badge` | `from '../ui/Badge'` | Статусные метки, счётчики. Варианты: `default`, `success`, `warning`, `danger`, `info`, `purple`. `dot`, `title` |
| `Input` | `from '../ui/Input'` | Текстовые поля с label, error, helperText. Поддержка leftElement/rightElement |
| `Textarea` | `from '../ui/Textarea'` | Многострочные поля, кнопка очистки (`showClear` + `onClear`) |
| `Select` | `from '../ui/Select'` | Выпадающий список с action-items |
| `SegmentedControl` | `from '../ui/SegmentedControl'` | Переключатель сегментов (generic `<T extends string>`) |
| `Card` | `from '../ui/Card'` | Карточка-островок: `Card.Header`, `Card.Body`, `Card.Footer`; варианты `default`, `gradient`, `muted`, `danger`, `bordered` |
| `Toolbar` | `from '../ui/Toolbar'` | Панель инструментов: `Toolbar.Title`, `Toolbar.Actions`, `Toolbar.Button`, `Toolbar.IconButton` |
| `Modal` | `from '../ui/Modal'` | Все модальные окна (шторка снизу). Пропсы: `title`, `footer`, `maxWidth` (`sm`/`md`/`lg`/`xl`) |

### 2.2 Карточки-островки (Cards)

Каждая логическая секция обёрнута в «островок» с **единообразными классами**:

```
/* Карточка с содержимым */
className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 space-y-3"

/* Карточка с заголовком (header) — предпочтительно <Card> + <Card.Header> + <Card.Body> */
className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
  → header: className="border-b border-slate-100 bg-slate-50/70 px-3 py-2.5"
  → body:   className="space-y-3 p-3"

/* Панель инструментов (toolbar) — предпочтительно <Toolbar> */
className="flex items-center justify-between gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm"
```

**Правила:**
- Все карточки — `rounded-xl` (12px). Не `rounded-2xl`, не `rounded-lg`
- Границы — `border border-slate-200` (без прозрачности `/80`, `/90`)
- Тень — `shadow-sm` для островков; `shadow-xs` / `shadow-2xs` для вложенных элементов
- Внутренние отступы — `p-3` для карточек, `p-1.5` для тулбаров
- Расстояние между карточками — `space-y-3` (строго одинаковое везде)

### 2.3 Строки элементов (Row items)

Файлы (`FileRowItem`) и пункты изменений (`ChangeItemRow`) стилизуются одинаково:

```
className="group relative flex items-start gap-2.5 p-2.5 bg-slate-50/70 hover:bg-emerald-50/30 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all"
```

### 2.4 Кнопки-иконки

Для кнопок-иконок используется CSS-класс `.icon-btn`:

```html
<button className="icon-btn" title="Описание действия">
  <Icon className="w-4 h-4" />
</button>

<!-- Опасное действие -->
<button className="icon-btn icon-btn--danger" title="Удалить">
  <Trash2 className="w-3.5 h-3.5" />
</button>
```

**НЕ** создавать inline-стили для иконок-кнопок — использовать `.icon-btn`.

### 2.5 Выпадающие списки (Selectors)

`PackageSelector` и `TaskSelector` **идентичны по структуре**:
- Тулбар с кнопкой-триггером, бейджем счётчика, кнопками действий
- Dropdown с поиском (при >2 элементах), списком элементов, кнопкой создания
- Активный элемент выделен `bg-emerald-50 border-emerald-300`

При создании новых выпадашек — копировать структуру из `TaskSelector.tsx` / `PackageSelector.tsx`.

---

## 3. Иконки и анимации

### 3.1 Библиотека иконок

- **Основная**: `lucide-react` — для всех иконок интерфейса, табов, шапки и компонентов.

### 3.2 Анимации иконок (VK-style micro-interactions)

Все кнопки-иконки ДОЛЖНЫ иметь анимацию при наведении. Классы определены в `src/index.css` и анимируют вложенный `<svg>`:

| Класс | Эффект | Когда применять |
|---|---|---|
| `.icon-btn` | Плавное увеличение иконки `scale(1.12)`, зелёная подложка | По умолчанию для всех |
| `.vk-icon-pop` | Упругое увеличение | Добавить, сохранить, развернуть |
| `.vk-icon-shake` | Тряска | Удаление, предупреждения |
| `.vk-icon-spin` | Поворот | Настройки, обновление, закрытие |
| `.vk-icon-bounce` | Прыжок | Загрузка, добавление |

Анимации `animate-icon-*` (Tailwind) используют те же keyframes из `src/index.css`.

Всегда использовать `transition-all` или `transition-colors` на интерактивных элементах. Фокус с клавиатуры подсвечивается глобально (`:focus-visible` в `src/index.css`), у `Button` — `focus-visible:ring-*`. При `prefers-reduced-motion` анимации отключаются глобально.

### 3.3 Прочие общие CSS-классы

`.gd-card`, `.gd-label`, `.header-tab`, `.input-gd`, `.gd-toggle`, `.modal-*`, `.animate-fade-in` / `.animate-slide-up` / `.animate-slide-down` — см. `src/index.css`. Новые повторяющиеся стили добавлять туда же, а не копировать строки классов.

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

## 5. Модальные окна

Все модалки используют компонент `<Modal>` из `src/components/ui/Modal.tsx`:

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Заголовок"
  maxWidth="md"        // sm | md | lg | xl
  footer={
    <>
      <Button variant="secondary" size="sm" onClick={onClose}>
        Отмена
      </Button>
      <Button variant="primary" size="sm" onClick={onSave}>
        Сохранить
      </Button>
    </>
  }
>
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
- [ ] Карточки имеют `rounded-xl border border-slate-200 bg-white shadow-sm`
- [ ] Между карточками одинаковые отступы `space-y-3`
- [ ] Нет тёмных фонов (`bg-slate-700+`, `bg-gray-*`, `bg-zinc-*`) и классов Tailwind v4
- [ ] Кнопки-иконки используют `.icon-btn`
- [ ] Все иконки анимируются при hover
- [ ] Нет `any`; ошибки из `catch` — через `getErrorMessage`
- [ ] `PROJECT_DOCUMENTATION.md` обновлён (раздел Changelog)
- [ ] Типы определены в `src/types/index.ts`
- [ ] `npm run build` проходит без ошибок
- [ ] UI-текст на русском языке
