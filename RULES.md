# RULES.md — Правила разработки проекта GDHelper Extension

> **ОБЯЗАТЕЛЬНО**: Любой AI-агент или человек, работающий с этим проектом, **ДОЛЖЕН прочитать и соблюдать** все правила ниже. Нарушение приводит к визуальной и структурной несогласованности, которую сложно исправить.

---

## 1. Дизайн-система GreenData

### 1.1 Цветовая палитра

Проект использует **строго бело-зелёную** тему в стиле GreenData. **Запрещено** использовать тёмные/slate/dark фоны.

| Токен | Значение | Назначение |
|---|---|---|
| `--gd-bg` / `gd-bg` | `#f0f4f0` | Фон страницы |
| `--gd-surface` / `gd-surface` | `#ffffff` | Фон карточек, модалок |
| `--gd-green` / `gd-green` | `#22c55e` | Основной акцент |
| `--gd-green-dark` / `gd-green-dark` | `#16a34a` | Активные состояния, hover |
| `--gd-green-light` / `gd-green-light` | `#dcfce7` | Фон подсветки, hover кнопок |
| `--gd-border` / `gd-border` | `#e2e8e2` | Границы карточек |
| `--gd-border-green` | `rgba(34,197,94,0.35)` | Зелёные границы акцента |
| `--gd-text` / `gd-text` | `#111827` | Основной текст |
| `--gd-muted` / `gd-muted` | `#6b7280` | Вторичный текст |
| `--gd-faint` / `gd-faint` | `#d1d5db` | Placeholder, disabled |

**Tailwind-классы для фоновых цветов:**
- Страница: `bg-[#f0f4f0]`
- Карточки: `bg-white`
- Hover строк: `hover:bg-emerald-50/30`
- Заголовки карточек: `bg-gray-50/70`
- Акцент бейджи/подсветки: `bg-emerald-50`, `bg-emerald-100`

### 1.2 Типографика

- Основной шрифт: **Inter** (`font-sans`)
- Моноширинный: **JetBrains Mono** (`font-mono`)
- Базовый размер текста: `13px` (body), `text-xs` (12px) для карточек
- Заголовки секций: `text-xs font-bold text-gray-900`
- Подписи: `text-[10px] font-semibold uppercase tracking-wider text-gray-500`
- Mono-контент (имена файлов, шаблоны): `font-mono text-xs font-bold`

### 1.3 ЗАПРЕЩЁННЫЕ стили

Нельзя использовать:
- `bg-slate-*`, `bg-gray-800`, `bg-gray-900`, `bg-zinc-*` и любой тёмный фон
- `text-white` на тёмных карточках (белый текст допустим только на зелёных кнопках)
- `rounded-2xl`, `rounded-3xl` для карточек — **только `rounded-xl`**
- Тени `shadow-xl`, `shadow-2xl` для обычных карточек (допустимо только для модалок)
- Прямые hex-значения вместо токенов GreenData (кроме случаев inline-style, где это оправдано)

---

## 2. Компоненты — стандарты и переиспользование

### 2.1 Обязательное использование существующих UI-примитивов

В `src/components/ui/` определены базовые компоненты. **Запрещено** дублировать их логику inline.

| Компонент | Импорт | Когда использовать |
|---|---|---|
| `Button` | `from '../ui/Button'` | Любые кнопки с текстом. Варианты: `primary`, `secondary`, `danger`, `ghost`, `emerald`, `outline`. Размеры: `xs`, `sm`, `md`, `lg` |
| `Badge` | `from '../ui/Badge'` | Статусные метки, счётчики. Варианты: `default`, `success`, `warning`, `danger`, `info`, `purple` |
| `Input` | `from '../ui/Input'` | Текстовые поля с label, error, helperText. Поддержка leftElement/rightElement |
| `Modal` | `from '../ui/Modal'` | Все модальные окна. Пропсы: `title`, `footer`, `maxWidth` (`sm`/`md`/`lg`/`xl`) |
| `ConsoleCard` | `from '../ui/ConsoleCard'` | Карточки-обёртки с monospace-заголовком в стиле терминала |

### 2.2 Карточки-островки (Cards)

Каждая логическая секция обёрнута в «островок» с **единообразными классами**:

```
/* Карточка с содержимым */
className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 space-y-3"

/* Карточка с заголовком (header) */
className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
  → header: className="border-b border-gray-100 bg-gray-50/70 px-3 py-2.5"
  → body:   className="space-y-3 p-3"

/* Панель инструментов (toolbar) */
className="flex items-center justify-between gap-2 p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm"
```

**Правила:**
- Все карточки — `rounded-xl` (12px). Не `rounded-2xl`, не `rounded-lg`
- Границы — `border border-gray-200`
- Тень — `shadow-sm`
- Внутренние отступы — `p-3` для карточек, `p-1.5` для тулбаров
- Расстояние между карточками — `space-y-3` (строго одинаковое везде)

### 2.3 Строки элементов (Row items)

Файлы (`FileRowItem`) и пункты изменений (`ChangeItemRow`) стилизуются одинаково:

```
className="group relative flex items-start gap-2.5 p-2.5 bg-gray-50/70 hover:bg-emerald-50/30 border border-gray-200 hover:border-emerald-300 rounded-xl transition-all"
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

- **Основная**: `lucide-react` — для внутренних иконок компонентов
- **Навигация / Header**: `@vkontakte/icons` — для табов, кнопок шапки

**Правило**: если иконка используется в шапке или навигации — импорт из `@vkontakte/icons`. Для остального — `lucide-react`.

### 3.2 Анимации иконок (VK-style micro-interactions)

Все кнопки-иконки ДОЛЖНЫ иметь анимацию при наведении. Это обеспечивается через CSS-классы:

| Класс | Эффект | Когда применять |
|---|---|---|
| `.icon-btn` | Плавное увеличение `scale(1.18)` | По умолчанию для всех |
| `.vk-icon-pop` | Упругое увеличение | Добавить, сохранить |
| `.vk-icon-shake` | Тряска | Удаление, предупреждения |
| `.vk-icon-spin` | Поворот | Настройки, обновление |
| `.vk-icon-bounce` | Прыжок | Загрузка, добавление |

Всегда использовать `transition-all` или `transition-colors` на интерактивных элементах.

---

## 4. Архитектура и структура кода

### 4.1 Структура директорий

```
src/
├── background/          # Service Worker расширения
├── components/
│   ├── ui/              # Переиспользуемые примитивы (Button, Badge, Input, Modal, ConsoleCard)
│   ├── layout/          # Header и общий макет
│   ├── template/        # Шаблон имени, выбор пакета (PackageSelector, TemplateEditor)
│   ├── table/           # Таблица файлов (FileTable, FileRowItem)
│   ├── upload/          # Импорт файлов (FileUploader)
│   ├── validation/      # Панель валидации
│   ├── readme/          # Редактор README
│   └── implementation/  # Вкладка «Реализация» (TaskSelector, TaskEditor, ChangeItemRow, etc.)
├── core/                # Бизнес-логика (парсеры, генераторы)
├── hooks/               # Кастомные React-хуки (useAppState, useImplementationTasks, etc.)
├── types/               # TypeScript интерфейсы
├── utils/               # Утилиты и хелперы
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
| `lucide-react` | `^1.16` | Иконки компонентов |
| `@vkontakte/icons` | `^3.67` | Иконки навигации |
| `@dnd-kit` | — | Drag & Drop сортировка |
| `jszip` | — | Работа с ZIP |

### 4.4 Правила TypeScript

- **Строгая типизация**: все пропсы компонентов должны иметь явный интерфейс
- **Типы** из `src/types/index.ts` — всегда импортировать оттуда, не дублировать
- Новые типы добавлять в `src/types/index.ts`
- Использовать `React.FC<Props>` для компонентов
- Не использовать `any` — всегда указывать конкретный тип

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
- Комментарии в коде — на русском или английском (предпочтительно русский)
- Названия переменных, функций, компонентов — на **английском**
- Коммиты — на **английском**

---

## 9. Чеклист перед PR / коммитом

- [ ] Все новые компоненты переиспользуют `Button`, `Badge`, `Input`, `Modal` из `ui/`
- [ ] Карточки имеют `rounded-xl border border-gray-200 bg-white shadow-sm`
- [ ] Между карточками одинаковые отступы `space-y-3`
- [ ] Нет тёмных фонов (`bg-slate-*`, `bg-gray-800+`)
- [ ] Кнопки-иконки используют `.icon-btn`
- [ ] Все иконки анимируются при hover
- [ ] Типы определены в `src/types/index.ts`
- [ ] `npm run build` проходит без ошибок
- [ ] UI-текст на русском языке
