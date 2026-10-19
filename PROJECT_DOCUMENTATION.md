# GD Helper (Chrome Extension) — Полная проектная документация

> **Версия документа:** 2.1.0  
> **Дата формирования:** 12.10.2026  
> **Целевая аудитория:** LLM-модели, AI-агенты, разработчики, релиз-инженеры GreenData  
> **Назначение документа:** Комплексный контекст для AI-агентов и разработчиков. Позволяет сразу работать с кодом без анализа 60+ файлов репозитория.

---

## 1. Обзор проекта и назначение

**GD Helper** (в исходных версиях — **guf-packer-extension**) — многофункциональное расширение для браузера Google Chrome (Manifest V3), интегрированное в боковую панель (**Side Panel API**).

Расширение создано для автоматизации рутинных операций инженеров, аналитиков и разработчиков low-code/no-code платформы **GreenData**:

1. **Упаковка обновлений (`.guf` файлов)**: загрузка, очистка имён от мусорных служебных префиксов платформы, стандартизированное переименование по настраиваемым шаблонам, сортировка Drag-and-Drop, проверка на ошибки и генерация готового к деплою ZIP-архива с файлом `README.txt`.
2. **Фиксация и оформление реализации (Implementation Tracker)**: ведение задач по доработкам платформы GreenData, разбивка изменений по категориям (Алгоритмы, Типы объектов, Визуалы/Экранные формы, Бизнес-процессы, Отчёты), автоматический захват метаданных из активной вкладки Chrome, инъекция комментариев-шапок прямо в редактор MathQuill платформы.
3. **Чеклист сбора доработок**: интерактивный трекер сбора объектов по задаче с возможностью открыть объект в один клик и зафиксировать его сборку.
4. **Интеграция с YouTrack (РЭЦ_Fin)**: автоматический парсинг персонального списка задач исполнителя (Кучин Владимир Валерьевич, проект РЭЦ_Fin) по прямой ссылке в корпоративном контуре с кэшированием (IndexedDB / LocalStorage / chrome.storage), отображением в виде плиток, детальным просмотром информации внутри виджета и созданием задачи реализации в 1 клик.
5. **Генератор системных идентификаторов алгоритмов GreenData**: локальный семантико-морфологический движок генерации кодов в формате `UPPERCASE_SNAKE_CASE` (с учетом предметной области GreenData — ЮЛ, ФЛ, ИП, ЖЦ, НПП, ЗИ) + генерация через OpenAI-совместимый LLM (настройки подключения — в «Утилитах»).

---

## 2. Технологический стек

| Категория              | Технологии и библиотеки                                                                     | Назначение                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Платформа**          | Chrome Extension Manifest V3, Side Panel API                                                | Интеграция в правую боковую панель браузера                                                           |
| **Фреймворк**          | React 18.3.1, TypeScript 5.7.2                                                              | Реактивный UI со строгой типизацией                                                                   |
| **Сборщик**            | Vite 6.2.0, Rollup, PostCSS, Autoprefixer                                                   | Сборка расширения с разделением на чанки (`vendor-react`, `vendor-dnd`, `vendor-zip`, `vendor-icons`) |
| **Стилизация**         | Tailwind CSS 3.4.17, `clsx`, `tailwind-merge`, `@fontsource-variable/geist`, `geist-mono`   | Дизайн-система «Aurora Glass»: стекло, аврора, индиго-акцент; шрифты Geist офлайн                     |
| **Drag & Drop**        | `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0, `@dnd-kit/utilities` 3.2.2               | Сортировка файлов и задач                                                                             |
| **Работа с архивами**  | `jszip` 3.10.1, `file-saver` 2.0.5                                                          | Распаковка, чтение Blobs, сжатие DEFLATE lvl 6, скачивание                                            |
| **Иконки**             | `lucide-react` 1.16.0                                                                       | Библиотека UI-иконок                                                                                  |
| **Анимация & Эффекты** | `canvas-confetti` 1.9.4, кастомные CSS-анимации                                             | Салют при сборке/чеклисте, микроанимации кнопок                                                       |
| **Хранилище данных**   | IndexedDB (`guf-renamer`, stores: `meta`, `blobs`), `chrome.storage.local`, `localStorage`  | Кэширование бинарников, сохранение задач, пресетов и настроек                                         |
| **Браузерные API**     | `chrome.sidePanel`, `chrome.downloads`, `chrome.tabs`, `chrome.scripting`, `chrome.storage` | Взаимодействие с вкладками, DOM страниц и загрузками                                                  |

---

## 3. Архитектура проекта и структура директорий

```
gd-helper-extension/
├── docs/
│   └── guf-packer.md       # Детальное описание упаковщика GUF (поток данных, шаблоны, экспорт)
├── public/                 # Статические ресурсы: manifest.json и иконки 16, 48, 128 px
├── scripts/                # Утилиты генерации и конвертации иконок
│   ├── convert-logo.ts
│   └── generate-icons.ts
├── src/
│   ├── background/         # Chrome Service Worker
│   │   └── index.ts        # Перехват загрузок GUF, инспекция DOM GreenData, связь с SidePanel
│   ├── checklist/          # Отдельная страница чеклиста сбора (checklist.html)
│   │   ├── main.tsx        # Точка входа React
│   │   └── ChecklistPage.tsx # Интерактивный чеклист сбора с открытием вкладок
│   ├── components/
│   │   ├── extra/          # Вкладка «Утилиты»
│   │   │   ├── AiSettingsModal.tsx      # Настройки подключения к OpenAI-совместимому API (для генерации ID)
│   │   │   ├── AlgorithmIdGenerator.tsx # Локальный + ИИ генератор ID алгоритмов
│   │   │   └── ExtraContainer.tsx       # Контейнер дополнительных утилит
│   │   ├── implementation/ # Вкладка «Реализация»
│   │   │   ├── AddChangeItemModal.tsx   # Модалка добавления изменения с автоподбором раздела
│   │   │   ├── AlgorithmHeaderSettingsModal.tsx # Настройки комментария-шапки
│   │   │   ├── ChangeItemRow.tsx        # Карточка отдельного изменения в списке
│   │   │   ├── ImplementationTool.tsx   # Корневой контейнер инструмента реализации
│   │   │   ├── TaskEditor.tsx           # Детальный редактор задачи (шапка, разделы, изменения)
│   │   │   ├── TaskExportPreviewModal.tsx # Экспорт задачи в Markdown / Текст / JSON
│   │   │   ├── TaskImportExportModal.tsx  # Импорт/экспорт/бэкап всех задач
│   │   │   ├── TaskChecklistModal.tsx   # Модалка чеклиста сбора объектов
│   │   │   ├── TaskSelector.tsx         # Селектор активной задачи (поиск, создание, удаление)
│   │   │   └── TaskSettingsModal.tsx    # Настройки метаданных задачи
│   │   ├── layout/         # Каркас приложения
│   │   │   ├── Header.tsx  # Шапка раздела: заголовок, ⌘K, «Во весь экран»; при прокрутке — капсула
│   │   │   ├── TabBar.tsx  # Плавающий стеклянный док (Упаковка, Реализация, YouTrack, Утилиты)
│   │   │   ├── Toast.tsx   # Всплывающее уведомление-капсула
│   │   │   ├── CommandPalette.tsx # Командная палитра (Ctrl/⌘ + K)
│   │   │   └── Footer.tsx  # Капсула экспорта над доком
│   │   ├── readme/         # Работа с сопроводительным файлом
│   │   │   └── ReadmeEditorModal.tsx # Редактор и предпросмотр README.txt
│   │   ├── table/          # Таблица файлов пакета
│   │   │   ├── FileEditModal.tsx # Модалка редактирования метаданных отдельного файла
│   │   │   ├── FileRowItem.tsx   # Строка файла (DnD-ручка, ошибки, дубликаты, ссылка GD)
│   │   │   └── FileTable.tsx     # Контейнер списка файлов с @dnd-kit и поиском
│   │   ├── template/       # Шаблонизация и пакеты
│   │   │   ├── AutoCollectModeBar.tsx     # Индикатор автосбора и выбор режима именования
│   │   │   ├── DuplicateAutoCollectModal.tsx # Разрешение дубликатов при автосборе
│   │   │   ├── MassActionsModal.tsx       # Массовые переменные и вставка тегов
│   │   │   ├── PackageSelector.tsx        # Выбор пакета сборки и тумблер автосбора
│   │   │   ├── PresetManagerModal.tsx     # Библиотека пресетов шаблонов
│   │   │   └── TemplateEditor.tsx         # Редактор маски шаблона и стартового номера
│   │   ├── ui/             # Переиспользуемые UI-примитивы (Design System)
│   │   │   ├── Badge.tsx         # Статусные плашки с цветными индикаторами-точками
│   │   │   ├── Button.tsx        # Кнопки всех типов с поддержкой spinner-загрузки
│   │   │   ├── Card.tsx          # Карточки-островки (Card.Header, Card.Body, Card.Footer)
│   │   │   ├── IconButton.tsx    # Квадратные кнопки-иконки
│   │   │   ├── Input.tsx         # Поля ввода с поддержкой иконок слева/справа
│   │   │   ├── Modal.tsx         # Модалки в стиле Bottom Sheet с анимациями
│   │   │   ├── SegmentedControl.tsx # Таб-переключатели с generics
│   │   │   ├── Select.tsx        # Выпадающие списки с поддержкой action-items
│   │   │   ├── Textarea.tsx      # Многострочные поля ввода с быстрой очисткой
│   │   │   ├── Toolbar.tsx       # Тулбары (Toolbar.Title, Toolbar.Actions, Toolbar.Button)
│   │   │   ├── ToolRow.tsx       # Строка-переход группированного списка (иконка, подпись, значение, шеврон)
│   │   │   ├── ProgressRing.tsx  # Кольцо прогресса сбора
│   │   │   └── index.ts          # Barrel-файл экспорта всех UI-компонентов
│   │   ├── upload/         # Загрузка файлов
│   │   │   └── FileUploader.tsx  # Зона загрузки ZIP и GUF (полная и компактная)
│   │   ├── validation/     # Валидация
│   │   │   └── ValidationPanel.tsx # Модалка со списком ошибок и предупреждений
│   │   └── youtrack/       # Вкладка «YouTrack»
│   │       ├── YouTrackIssueDetail.tsx # Детальный просмотр задачи внутри виджета
│   │       ├── YouTrackIssueTile.tsx   # Интерактивная плитка задачи
│   │       └── YouTrackTool.tsx        # Главный экран (поиск, фильтрация, синхронизация)
│   ├── constants/
│   │   ├── algorithmHeader.ts    # Настройки и формат комментария-шапки алгоритма
│   │   └── theme.ts              # Цвета салюта в палитре Aurora Glass
│   ├── core/               # Чистая бизнес-логика (без React-зависимостей)
│   │   ├── nameCleaner.ts        # Очистка имен GD (удаление дат, времени, ДО./ПОСЛЕ.)
│   │   ├── templateEngine.ts     # Шаблонизатор ({indexPad6}, {cleanName}, переменные)
│   │   ├── validation.ts         # Валидация имен (символы Windows, дубли, расширения)
│   │   └── zipHandler.ts         # JSZip распаковка, сборка и генерация README.txt
│   ├── hooks/              # Кастомные React-хуки управления состоянием
│   │   ├── useAiSettings.ts      # Подключение к LLM: настройки, заголовки, проверка соединения
│   │   ├── useAppState.ts        # Главный стейт пакера, пакеты, файлы, экспорт, IndexedDB
│   │   ├── useAutoCollector.ts   # Автосбор файлов из Chrome Downloads API
│   │   ├── useGlobalFileDrop.ts  # Глобальный Drag-and-Drop оверлей
│   │   ├── usePaletteShortcuts.ts # Ctrl/⌘+K — палитра, Alt+1…4 — разделы
│   │   └── useImplementationTasks.ts # Стейт задач реализации, разделы, пункты, бэкап
│   ├── services/
│   │   └── aiAlgorithmGenerator.ts # Запрос к LLM для генерации ID алгоритма
│   ├── sidepanel/          # Точка входа в боковую панель
│   │   ├── App.tsx               # Корневой контейнер расширения
│   │   └── main.tsx              # Рендеринг React в DOM
│   ├── types/
│   │   └── index.ts              # Центральные типы и интерфейсы всего приложения
│   ├── utils/              # Вспомогательные функции
│   │   ├── algorithmCommentInjector.ts # Инъекция комментария в редактор MathQuill
│   │   ├── algorithmIdGenerator.ts     # Локальный морфологический генератор ID (UPPER_SNAKE)
│   │   ├── errorUtils.ts               # getErrorMessage / isAbortError для catch (unknown)
│   │   ├── greenDataTaskFormInjector.ts # Автозаполнение формы задачи GreenData из YouTrack
│   │   ├── iconTapAnimation.ts         # Глобальная анимация иконок при нажатии (по имени lucide-иконки)
│   │   ├── indexedDB.ts                # Двухуровневое хранилище (meta + blobs)
│   │   ├── pluralize.ts                # Русское склонение числительных (pluralizeRu)
│   │   ├── shortcuts.ts                # Модификатор клавиш по платформе (⌘ / Ctrl)
│   │   ├── tabUtils.ts                 # Работа с вкладками Chrome, парсинг DOM GreenData
│   │   └── youtrackParser.ts           # Многоуровневый парсер YouTrack (API/DOM/Кэш)
│   └── index.css           # Базовые стили Tailwind, переменные, кастомные анимации
├── dist/                   # Результат сборки расширения (загружается в Chrome)
├── sidepanel.html / index.html / checklist.html # HTML-точки входа (боковая панель, полный экран, чеклист)
├── package.json            # Зависимости и скрипты
├── tailwind.config.js      # Палитра GreenData, шрифты, тени, keyframes
├── tsconfig.json           # Настройки TypeScript
└── vite.config.ts          # Конфигурация сборки с Rollup многостраничным билдом
```

---

## 4. Модель данных и типы (`src/types/index.ts`)

Вся система типизирована в одном файле `src/types/index.ts`. Основные сущности:

### 4.1 Модели упаковщика файлов (`FileRow`, `BuildPackage`)

```typescript
export interface FileRow {
    id: string; // UUID строки (crypto.randomUUID())
    order: number; // Порядковый номер файла в пакете (начиная со startNumber)
    originalPath: string; // Исходный путь в архиве или имя загруженного файла
    originalName: string; // Имя файла без директорий
    extension: string; // Расширение в нижнем регистре без точки ('guf')
    file: Blob | File; // Бинарное содержимое файла (в памяти)
    detectedDate: string; // Извлеченная дата (YYYY-MM-DD) или ''
    detectedTime: string; // Извлеченное время (HH-MM-SS) или ''
    cleanName: string; // Очищенная часть имени (без дат, префиксов и расширения)
    variables: Record<string, string>; // Индивидуальные переменные строки
    newName: string; // Итоговое вычисленное имя файла с расширением
    description: string; // Описание для реестра README.txt
    sourceUrl?: string; // URL страницы GreenData, откуда скачан файл (только валидные /card/*)
    cardId?: string; // ID объекта из URL карточки GreenData (/card/{cardId})
}

export interface BuildPackage {
    id: string; // UUID пакета
    name: string; // Название пакета (например, "Пакет 1")
    files: FileRow[]; // Файлы пакета в памяти
    template: string; // Шаблон именования для этого пакета
    startNumber: number; // Начальный номер для нумерации (по умолчанию 1)
    releasePackageUrl?: string; // URL релизного пакета GreenData для автопарсинга №
    archiveName?: string; // Пользовательское имя архива
    readmeContent?: string; // Текст описания для README.txt
    variables?: Record<string, string>; // Значения переменных этого пакета
    taskId?: string; // ID связанной задачи реализации (ImplementationTask)
    createdAt: number;
}
```

### 4.2 Персистентные структуры данных для IndexedDB (`StoredAppState`)

Для того чтобы не сериализовать тяжелые бинарники вместе с метаданными:

```typescript
export interface StoredPackageMeta {
    id: string;
    name: string;
    template: string;
    startNumber: number;
    archiveName?: string;
    readmeContent?: string;
    variables?: Record<string, string>;
    taskId?: string;
    createdAt: number;
    filesMeta: Array<Omit<FileRow, 'file'>>; // Метаданные файлов без Blob
}

export interface StoredAppState {
    packagesMeta: StoredPackageMeta[];
    activePackageId: string;
    variables: VariableDefinition[];
    savedAt: number;
}
```

### 4.3 Модели задач реализации (`ImplementationTask`, `ImplementationChangeItem`)

```typescript
export interface ImplementationSection {
    id: string; // Идентификатор раздела
    name: string; // Название ('Алгоритмы', 'Типы объекта', 'Визуалы', 'Бизнес-процессы' и т.д.)
    order: number;
}

export interface ImplementationChangeItem {
    id: string; // UUID изменения
    description: string; // Текст описания выполненной доработки
    sectionId?: string; // ID раздела (если undefined — без раздела)
    linkUrl?: string; // Прямой URL на объект/карточку в платформе GreenData
    linkTitle?: string; // Название объекта в GreenData для текста ссылки
    isCollected?: boolean; // Флаг отметки сбора (для чеклиста)
    collectedAt?: number; // Таймстемп отметки сбора
    isUpdatePackage?: boolean; // Флаг релизного пакета GreenData (защищен от редактирования)
    lastFileNumber?: number; // Последний номер .guf файла пакета, спарсенный из GreenData
    lastFileName?: string; // Имя последнего .guf файла пакета из таблицы
}

export interface ImplementationTask {
    id: string; // UUID задачи
    taskNumber: string; // Номер задачи (например, "FINAPP-5638" или "GD-102")
    title: string; // Название задачи
    createdAt: number;
    summary?: string; // Дополнительное примечание к задаче
    sections?: ImplementationSection[]; // Разделы задачи
    items: ImplementationChangeItem[]; // Список изменений
    packageId?: string; // Привязка к пакету файлов упаковщика
    releasePackageUrl?: string; // URL прикрепленного релизного пакета GreenData
    lastFileNumber?: number; // Последний номер файла прикрепленного релизного пакета
}

export interface GreenDataParsedPackageNumber {
    number: number; // Распарсенное число (например, 380 из 000380)
    fileName: string; // Исходное имя файла .guf
    rawPrefix: string; // Лидирующая цифровая строка
}
```

### 4.4 Подключение к LLM (`AiSettings`)

```typescript
export type AiAuthType = 'bearer' | 'api-key' | 'x-api-key' | 'none';

export interface AiSettings {
    baseUrl: string; // URL эндпоинта (например, https://api.openai.com/v1)
    apiKey: string; // Ключ доступа
    authType?: AiAuthType; // Тип заголовка авторизации
    model: string; // Идентификатор модели (gpt-4o-mini, deepseek-coder…)
    customHeadersJson?: string; // Дополнительные HTTP-заголовки в JSON
}
```

Используется только генератором ID алгоритмов (вкладка «Утилиты»).

---

## 5. Бизнес-логика Core (`src/core/`)

Модули ядра не содержат привязки к React и UI-компонентам, являясь чистыми функциями обработки данных.

### 5.1 Очистка и разбор имен файлов (`src/core/nameCleaner.ts`)

Выгруженные из GreenData файлы часто содержат автоматические префиксы выгрузки, даты и служебные маркеры (например, `2026-04-17_16-16-17-ДО. Описание документа.guf`).

**Функции:**

- `getBaseName(filePath: string): string` — извлекает имя файла из пути (унифицирует `/` и `\`).
- `getExtension(fileName: string): string` — возвращает расширение в нижнем регистре без точки (`guf`).
- `getNameWithoutExtension(fileName: string): string` — имя без финального `.ext`.
- `parseFileName(fileName: string): ParsedFileName` — производит пошаговую очистку:
    1. Извлекает дату вида `YYYY-MM-DD` или `YYYY.MM.DD` в начале имени (точки заменяются на дефисы).
    2. Зачищает разделители `[-_.\s]+`.
    3. Извлекает время вида `HH-MM-SS` или `HH-MM`.
    4. Удаляет служебные префиксы платформы GreenData: `ДО.`, `ПОСЛЕ.`, `ДО`, `ПОСЛЕ` (case-insensitive).
    5. Зачищает оставшиеся тире/подчеркивания, схлопывает множественные пробелы и делает `trim()`.
    6. Если имя оказалось пустым, делает фоллбэк на исходное имя без расширения.

### 5.2 Движок шаблонизации (`src/core/templateEngine.ts`)

Генерирует финальные имена файлов согласно заданной маске.

- Шаблон по умолчанию: `DEFAULT_TEMPLATE = '{indexPad6}_{type}_{module}_{task}_{cleanName}'`.
- Поддерживаемые системные теги:
    - `{index}` — порядковый номер без дополнения нулями (`1`, `2`, `10`).
    - `{indexPad6}` — номер с дополнением лидирующими нулями до 6 знаков (`000001`, `000002`).
    - `{cleanName}` — очищенная часть исходного имени.
    - `{date}` — обнаруженная дата выгрузки (`2026-04-17`) или пустая строка.
    - `{time}` — обнаруженное время выгрузки (`16-16-17`) или пустая строка.
    - `{originalName}` — исходное имя файла до очистки.
    - `{extension}` — расширение файла (`guf`).
- Пользовательские переменные: любые токены вида `{varName}` (например, `{module}`, `{type}`, `{task}`). Значения берутся сначала из глобального набора переменных пакета, затем из локальных переопределений файла `row.variables`.
- `applyTemplate(template, row, globalVariables)`: заменяет системные теги, затем пользовательские, и гарантированно прикрепляет точку и расширение (`${result}.${row.extension}`).
- `recalculateAllNames(files, template, startNumber, globalVariables)`: пересчитывает порядок (`order`), подставляет вычисленный `{index}` и возвращает обновленный массив `FileRow[]`.

### 5.3 Валидация перед экспортом (`src/core/validation.ts`)

Проверяет массив файлов перед сборкой архива и блокирует экспорт при наличии критических ошибок.

- `validateFiles(files: FileRow[]): ValidationSummary`
- Типы выявляемых ошибок:
    1. `empty` — имя файла пустое или содержит только расширение.
    2. `invalid_chars` — имя содержит запрещенные символы Windows/Linux (`/ \ : * ? " < > |`).
    3. `missing_ext` — потеряно расширение файла.
    4. `duplicate` — обнаружены коллизии имен (проверка регистронезависимая, с учетом полного имени с расширением).
- Возвращает структурированный отчет `ValidationSummary` с множествами `errorFileIds` и `duplicateFileIds` для подсветки проблемных строк в UI.

### 5.4 Работа с архивами и файлами (`src/core/zipHandler.ts`)

- `extractZip(zipFile, originalFileName?): Promise<ExtractResult>`: распаковывает ZIP с помощью `JSZip`, отфильтровывает папки, сортирует файлы натуральным порядком (`localeCompare` с `numeric: true`), фильтрует файлы по расширению `.guf` и превращает их в `FileRow[]`.
- `gufFilesToRows(files, startIndex?): FileRow[]`: конвертирует нативно выбранные браузером файлы `File[]` в объекты `FileRow`.
- `buildReadmeContent(files, customReadme): string`: формирует итоговый файл описания релиза. Если у файлов заполнено поле `description`, автоматически создает структурированный блок `--- Описание файлов ---` вида `новое_имя.guf: Описание файла`, после чего добавляет пользовательские примечания.
- `generateZip(files, template, readmeContent, archiveName, globalVariables): Promise<Blob>`: создает новый ZIP-архив с компрессией `DEFLATE` (уровень 6), пакует все `.guf` файлы под новыми именами, добавляет файл `README.txt` (если есть контент) и запускает скачивание через `file-saver` (`saveAs`).

---

## 6. Кастомные хуки React (`src/hooks/`)

### 6.1 `useAppState` (`src/hooks/useAppState.ts`)

Центральный хук состояния упаковщика файлов:

- **Управляет состоянием:** список пакетов `packages: BuildPackage[]`, активный пакет `activePackage`, список файлов `files`, шаблон, переменные, пресеты, статус экспорта и валидации.
- **Персистентность в IndexedDB:**
    - Сохранение метаданных с дебаунсом 300 мс через `saveMetadataToDB`.
    - Раздельное кэширование Blobs через `saveBlobsToDB`.
    - Автоматическая миграция старых форматов состояния.
- **Управление файлами:**
    - `loadZip(file)` — загрузка ZIP архива.
    - `loadGufFiles(files, cleanNameOverrides)` — загрузка отдельных файлов.
    - `addFiles(newFiles, cleanNameOverrides, extraMeta)` — добавление файлов к существующим.
    - `replaceFile(oldId, newFile, meta)` — замена файла с сохранением позиции.
    - `reorderFiles(fromIndex, toIndex)` — переупорядочивание после Drag-and-Drop с мгновенным пересчетом `{index}` и `{indexPad6}`.
    - `removeFile(id)`, `removeFiles(ids)`, `clearFiles()` — удаление с очисткой Blobs из БД.
- **Именование архива:** `getFormattedArchiveName` строит имя вида `{taskNumber}_{DD.MM.YYYY}.zip` или `{taskNumber}-{count}_{DD.MM.YYYY}.zip` при наличии связанной задачи реализации.

### 6.2 `useAutoCollector` (`src/hooks/useAutoCollector.ts`)

- Слушает фоновые сообщения `GUF_DOWNLOAD_COMPLETE` и очередь `gd_pending_guf_downloads` из `chrome.storage.local`.
- Скачивает бинарный файл по локальному blob/file URL через `fetch()`.
- Поддерживает два режима именования (`namingMode`):
    - `'pageName'` — извлекает человекопонятное имя объекта прямо со страницы GreenData (через DOM-инспектор background script).
    - `'original'` — оставляет имя файла, выданное платформой.
- Детектирует дубликаты по `sourceUrl` открытой страницы. При совпадении вызывает модалку `DuplicateAutoCollectModal` («Заменить» или «Добавить копию»).

### 6.3 `useGlobalFileDrop` (`src/hooks/useGlobalFileDrop.ts`)

- Перехватывает перетаскивание файлов на уровне окна (`window`).
- Защищен от ложных срабатываний при перемещении между вложенными элементами.
- Исключает конфликты с внутренним Drag-and-Drop таблицы файлов (`@dnd-kit`).
- Показывает красивый полноэкранный оверлей при перетаскивании.

### 6.4 `useImplementationTasks` (`src/hooks/useImplementationTasks.ts`)

Управляет базой задач реализации:

- Сохраняет задачи в `localStorage` (`gd-helper-implementation-tasks`).
- **Синхронизация между вкладками:** реактивный слушатель `window.addEventListener('storage')` обеспечивает мгновенную синхронизацию состояния задач между боковой панелью и автономным окном чеклиста (`checklist.html`).
- Операции с задачами: `createTask`, `updateTask`, `deleteTask`, `duplicateTask`, `selectTask`.
- Операции с разделами: `addSection`, `updateSection`, `deleteSection` (пункты перемещаются в категорию без раздела), `reorderSections`.
- Операции с пунктами: `addChangeItem`, `updateChangeItem`, `deleteChangeItem`, `reorderChangeItems`, `moveChangeItem`.
- **Чеклист и статус сбора объектов:**
    - `toggleChangeItemCollected(taskId, itemId)`: переключает статус сбора объекта (`isCollected`) и фиксирует таймстемп `collectedAt`.
    - `setAllChangeItemsCollected(taskId, isCollected)`: пакетная установка статуса сбора для всех пунктов текущей задачи.
- Импорт и экспорт: `exportAllTasksJSON`, `exportTaskJSON`, `importTasks` (режимы: полная замена `replace`, слияние `merge` с генерацией новых UUID, обновление текущей `update_active`).

### 6.5 `useAiSettings` (`src/hooks/useAiSettings.ts`)

- Хранит подключение к OpenAI-совместимому API (`localStorage` и `chrome.storage.local`, ключ `gd_ai_settings`).
- `resolveApiEndpoint`, `buildRequestHeaders` — адрес `/chat/completions` и заголовки авторизации; используются `services/aiAlgorithmGenerator.ts`.
- `testConnection` — тестовый запрос с измерением задержки.
- При первом запуске удаляет историю удалённого ИИ-чата (`gd_ai_chat_history`).

---

## 7. Сервисы и утилиты (`src/utils/`, `src/services/`)

### 7.1 Инъекция комментариев в GreenData (`src/utils/algorithmCommentInjector.ts`)

Позволяет в один клик вставить стандартизированный комментарий-шапку прямо в редактор алгоритмов платформы.

- Копирует текст в буфер обмена (`navigator.clipboard.writeText`).
- Находит редактор MathQuill на активной вкладке через `chrome.scripting.executeScript`:
    - Селекторы: `.formula-editor-box .mq-editable-field`, `.mq_containeer`, `.mq-math-mode`.
- Позиционирует курсор в самое начало (вызов `moveToLeftEnd()`, клик по левому краю или `Ctrl+Home`).
- Использует 3 стратегии вставки:
    1. Синтетическое событие `ClipboardEvent('paste')` на внутреннем textarea MathQuill.
    2. Команда `document.execCommand('insertText')`.
    3. Нативный JS API MathQuill (`typedText` или `write`).
- Фоллбэк на стандартные `<textarea>` и `<input>` элементы страницы.

### 7.2 Локальный генератор системных ID алгоритмов (`src/utils/algorithmIdGenerator.ts`)

Интеллектуальный генератор системных идентификаторов вида `UPPERCASE_SNAKE_CASE` без вызова внешних нейросетей.

- **Встроенный корпоративный словарь терминов GreenData:**
    - Сокращения: ЮЛ -> `LE`, ФЛ -> `IE`, ИП -> `IP`, ЖЦ -> `LC`, ЗИ -> `CR`, НПП -> `NPP`, КИБ -> `CIB`, СППР -> `DSS`, НДС -> `VAT`, ИНН -> `TIN`, ЭДО -> `EDO`, АМЛ -> `AML`.
    - Событийные паттерны: «до сохранения» -> `BEFORE_SAVE`, «после сохранения» -> `AFTER_SAVE`, «при удалении» -> `ON_DELETE`.
- **Словарь корней (`STEM_DICTIONARY`):** свыше 800 морфологических корней русского языка с переводами, отсортированных по длине префикса.
- **Распознавание категорий алгоритмов:**
    - `filter_condition` («фильтрация X по Y на основании Z») -> `FILTER_<X>_BY_<Y>_BASED_ON_<Z>_ALG`.
    - `calculation` (расчетные глаголы) -> суффикс/токен `CALC`.
    - `validation` (проверки, контроль) -> токен `CHECK` / `_VALID_ALG`.
    - `card_action` (действия карточки) -> инфинитивы.
- **Результат:** формирует 4 варианта (`primaryId`, `scopeFirstId`, `fullId`, `compactId`) и проверяет наличие префикса функционального блока.

### 7.3 Взаимодействие с вкладками Chrome (`src/utils/tabUtils.ts`)

- `getActiveTabInfo()`: инспектирует открытую вкладку через `chrome.scripting.executeScript`, извлекает URL, заголовки и DOM-селекторы.
- `cleanTabTitle(rawTitle)`: удаляет служебные хвосты систем («GreenData», «Jira», «GitLab»).
- `trimGreenDataUrl(rawUrl)`: обрезает URL карточки GreenData до чистого маршрута (`#/card/<id>`).
- `matchSectionForType(input, sections)`: интеллектуальный алгоритм распределения объектов по разделам реализации:
- `formatChangeItemMarkdown(description, linkTitle?, linkUrl?, isCollected?)`: формирует строку Markdown для пункта изменения. Если `isCollected: true`, добавляет суффикс `— *(Собран)*`.
- `formatTaskToMarkdown(task)`: генерация структурированного Markdown-отчета с группировкой по разделам и чекбоксами `[x]` / `[ ]`:
    - Отслеживает статус сбора каждого пункта: чекбокс `[x]` для собранных и `[ ]` для несобранных.
    - Динамический заголовок секции изменений: `### Внесённые изменения (Все объекты собраны ✅ X/X)` или `### Внесённые изменения (Собрано: X/Y)`.
    - Автоматическая фиксация сбора пакетов обновления `.guf`: при 100% сборе объектов пакет помечается как `— ✅ **Все файлы собраны**`, а каждый файл пакета получает отметку `— *(Собран)*`.
    - При отсутствии прикрепленных пакетов добавляет блок `### Статус готовности\n✅ **Все объекты реализации собраны** (готов к упаковке/релизу)`.

### 7.4 Двухуровневое хранилище IndexedDB (`src/utils/indexedDB.ts`)

База данных `guf-renamer` (v1):

- Хранилище `meta`: снимок состояния приложения по ключу `current_state` (легковесные метаданные без бинарных данных).
- Хранилище `blobs`: бинарные объекты `Blob`/`File` по уникальным ключам `id`.
- Разделение предотвращает замораживание браузера при сериализации сотен мегабайт GUF-файлов.

### 7.5 Background Service Worker (`src/background/index.ts`)

- Открывает Side Panel при клике на иконку расширения:
  `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`.
- Двухфазный перехват скачивания:
    1. В момент `chrome.downloads.onCreated` инспектирует вкладку и запоминает имя открытого объекта GreenData.
    2. В момент `chrome.downloads.onChanged` (завершение скачивания) проверяет расширение `.guf` и отправляет событие `GUF_DOWNLOAD_COMPLETE` в боковую панель.
    3. Если боковая панель была закрыта, сохраняет выгрузку в очередь `gd_pending_guf_downloads` в `chrome.storage.local`.

---

## 8. Дизайн-система и библиотека UI-компонентов

### 8.1 Правила дизайна (Design Rules)

Дизайн-система «Aurora Glass» (полные правила — `RULES.md`, макеты — дизайн-холст Claude «GD Helper — редизайн «Aurora Glass»»).

1. **Цвет**: фон `#eef1fa` с мягкой авророй (пятна лаванды `#c7cdfe`, мяты `#b7f0de`, персика `#fbd3e6` — радиальные градиенты на `#root`, неподвижные при прокрутке). Единственный акцент — индиго `#4f5bd5` (`gd-accent`, шкала `accent-*`). Нейтральные — холодная шкала `slate-*` (переопределена в `tailwind.config.js`). Статусы: `#22b58a` готово, `#f59e3b` внимание, `#e5484d` ошибка.
2. **Стекло**: группы и карточки (`.gd-group`, `.gd-card`) — полупрозрачный белый 56% + `backdrop-filter: blur(26px) saturate(180%)`, белая рамка и внутренний блик, радиус 20px. Плавающие панели — `.gd-glass`.
3. **Оболочка**: шапка раздела (`Header`: заголовок 24px, подзаголовок, кнопки ⌘K и «Во весь экран»; при прокрутке — плавающая капсула), плавающий стеклянный док из 4 разделов (`TabBar`), капсула экспорта над доком (`Footer`), мягкое затухание контента под доком.
4. **Компактность**: строки файлов 40px в одну строку (номер, при наведении — ручка; имя; значки карточки и «в задаче»; вторая строка только при ошибке); пакет и автосбор — две строки одной группы; шаблон с чипами «№», «Теги», «README» и ссылкой «Пресеты» в заголовке; быстрое добавление пункта реализации по Enter.
5. **Командная палитра**: Ctrl/⌘ + K — поиск по разделам, действиям (добавить .guf/ZIP, экспорт, теги, пресеты, README, новый пакет/задача), задачам и пакетам; Alt + 1…4 — разделы.
6. **Типографика**: Geist / Geist Mono (`@fontsource-variable/geist`, `geist-mono`), офлайн.
7. **Движение**: глобальное «вдавливание» кнопок и анимация иконок при нажатии, переходы экранов, каскад списков, кольцо прогресса; учитывается `prefers-reduced-motion`.

### 8.2 UI-компоненты (`src/components/ui/`)

Все компоненты реэкспортируются из `src/components/ui/index.ts`. Создание альтернативных инлайн-кнопок или модалок строго запрещено регламентом проекта.

| Компонент          | Файл                   | Описание и особенности                                                                                                                                                   |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`           | `Button.tsx`           | Капсулы: `primary`/`emerald` (индиго со свечением), `secondary`/`toolbar` (стекло), `outline` (тонированная), `ghost` (текстовая), `danger`. `isLoading`, `leftIcon`, `rightIcon`. |
| `Badge`            | `Badge.tsx`            | Компактная плашка статуса/счетчика (`default`, `success`, `warning`, `danger`, `info`, `purple`). Поддерживает цветную точку `dot`.                                      |
| `Input`            | `Input.tsx`            | Поле ввода на базе `.input-gd` с поддержкой `forwardRef`, подписей `label`, ошибок `error`, слотов `leftElement` и `rightElement`.                                       |
| `Modal`            | `Modal.tsx`            | Плавающая стеклянная шторка через React Portal: пружинное появление, уменьшение страницы под ней (`body.gd-sheet-open`), закрытие свайпом вниз за шапку, `Esc`, крестиком или тапом по фону. Кэширует контент на время закрытия (260 мс). |
| `Card`             | `Card.tsx`             | Контейнер со структурой compound components: `<Card.Header>`, `<Card.Body>`, `<Card.Footer>`.                                                                            |
| `IconButton`       | `IconButton.tsx`       | Квадратная кнопка для иконок с hover-микроанимацией увеличения `scale(1.12)` и сжатием при клике.                                                                        |
| `SegmentedControl` | `SegmentedControl.tsx` | Капсульный переключатель со скользящим белым ползунком (измеряется через `ResizeObserver`), generics `<T extends string>`.                                                    |
| `ToolRow`          | `ToolRow.tsx`          | Строка-переход группированного списка: иконка, подпись, значение справа и шеврон.                                                                                       |
| `Select`           | `Select.tsx`           | Выпадающий список с поддержкой action-items (например, «+ Создать раздел...»), поиском и закрытием по клику вне области.                                                 |
| `Textarea`         | `Textarea.tsx`         | Многострочное поле с кнопкой быстрой очистки содержимого (`onClear`).                                                                                                    |
| `Toolbar`          | `Toolbar.tsx`          | Панель инструментов: `Toolbar.Title`, `Toolbar.Actions`, `Toolbar.Button`, `Toolbar.IconButton`.                                                                         |

---

## 9. Вкладки и экраны приложения

### 9.0 Навигация

Разделы переключаются плавающим стеклянным доком (`TabBar`): Упаковка (со счётчиком файлов), Реализация, YouTrack, Утилиты — или Alt + 1…4 и командной палитрой (Ctrl/⌘ + K). Ранее сохранённая вкладка «ИИ» открывается как «Упаковка». Над содержимым — крупный заголовок вкладки с подзаголовком (пакет и задача, активная задача и т.д.) и кнопкой «Во весь экран». Активная вкладка запоминается в `localStorage` (`gd-helper-active-tool`).

### 9.1 Вкладка «Упаковка» (`packer`)

- **Группа «Пакет» (`PackageSelector` + `AutoCollectModeBar`)**: строка активного пакета (тап — меню пакетов: выбор, дублирование, редактирование, удаление, «Новый пакет»), переключатель автосбора скачиваний и выбор имени файла («Со страницы» / «Исходное»).
- **Группа инструментов**: строки «Теги», «Пресеты шаблонов», «README.txt» открывают соответствующие шторки.
- **Шаблон имени (`TemplateEditor`)**: строка маски с кнопкой сброса, «Сделать основным», начальный номер, ссылка на релизный пакет («Из вкладки», парсинг номера).
- **Панель массовых действий (`MassActionsModal`)**: список переменных `{type}`, `{module}`, `{task}` с массовым применением ко всем строкам.
- **Библиотека пресетов (`PresetManagerModal`)**: сохранение, удаление и применение именованных шаблонов.
- **Файлы (`FileTable`, `FileRowItem`)**: поиск, «+ .guf», «Очистить» в заголовке секции; строки с номером и ручкой перетаскивания (`@dnd-kit`), тап по строке открывает редактирование (`FileEditModal`), кнопки скачивания и удаления файла.
- **Панель экспорта (`Footer`)**: валидация имен, инлайн-редактирование имени архива, сборка ZIP и праздничный салют (`canvas-confetti`).

### 9.2 Вкладка «Реализация» (`implementation`)

- **Экран «‹ Задачи» (`TaskSelector`, `view='list'`)**: поиск, список задач с прогрессом сбора, дублирование, переименование, удаление, «Новая задача», «Импорт и экспорт». Над открытой задачей — кнопка «‹ Задачи» и действия (создать, переименовать, удалить). Выбор или создание задачи открывает её экран.
- **Сводка задачи**: строка «Чеклист сбора» с полосой прогресса, «Параметры задачи» (релиз, точка при наличии заметки), «Бэкап и импорт JSON».
- **Редактор шапки алгоритма**: автоматическое формирование строки комментария `// ДД.ММ.ГГГГ. Автор. Задача. Релиз.` и кнопка «Вставить в алгоритм» для прямой инъекции в редактор активной вкладки Chrome.
- **Категории изменений**: аккордеоны разделов (Алгоритмы, Типы объекта, Визуалы и т.д.) с кнопкой захвата объекта с открытой страницы (`AddChangeItemModal`), кнопкой открытия чеклиста сбора и карточками пунктов изменений.
- **Карточка изменения (`ChangeItemRow`)**: отображение описания, кликабельная ссылка на объект, индикатор и тумблер статуса сбора («Собран» / «Не собран»).
- **Модальное окно чеклиста сбора (`TaskChecklistModal`)**:
    - Индикатор прогресса в процентах со статусными бейджами.
    - Кнопки пакетных действий («Отметить все собранными», «Сбросить», «Копировать MD», «В отдельном окне»).
    - Кнопка **«Открыть и собрать»** для каждого объекта со ссылкой (открывает вкладку объекта в браузере и мгновенно помечает его собранным).
    - Праздничный салют (`canvas-confetti`) при 100% готовности сбора.
- **Экспорт и резервное копирование**: выгрузка в Markdown с чекбоксами, чистый текст или JSON.

### 9.3 Вкладка «YouTrack» (РЭЦ_Fin) (`youtrack`)

Расположена непосредственно справа от раздела «Реализация» в верхнем навигационном меню. Предназначена для быстрого доступа к задачам YouTrack, назначенным на исполнителя Кучин Владимир Валерьевич по проекту РЭЦ_Fin, с возможностью работы без переключения между окнами браузера:

- **Целевой поисковый запрос**:
  `https://youtrack.greendatasoft.ru/issues?q=%D0%98%D1%81%D0%BF%D0%BE%D0%BB%D0%BD%D0%B8%D1%82%D0%B5%D0%BB%D1%8C:%20%D0%9A%D1%83%D1%87%D0%B8%D0%BD_%D0%92%D0%BB%D0%B0%D0%B4%D0%B8%D0%BC%D0%B8%D1%80_%D0%92%D0%B0%D0%BB%D0%B5%D1%80%D1%8C%D0%B5%D0%B2%D0%B8%D1%87%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82:%20%D0%A0%D0%AD%D0%A6_Fin&u=1`
- **Фоновый парсинг по ссылке (не активной вкладки)**:
  - Парсинг осуществляется строго по указанной ссылке, когда разработчик находится в корпоративном контуре (VPN).
  - Применяется многоуровневая стратегия извлечения (`src/utils/youtrackParser.ts`, `parseYouTrackIssues`):
    1. **Выполнение внутри вкладки YouTrack** (`executeInTabYouTrackExtraction` через `chrome.scripting.executeScript`): используется уже открытая вкладка `youtrack.greendatasoft.ru/issues`, иначе создаётся фоновая (`active: false`), которая гарантированно закрывается в `finally`. Внутри вкладки сначала вызывается REST API (`/api/issues`, same-origin — cookies сессии передаются автоматически), при неудаче — парсинг DOM страницы поиска.
    2. **Кэш (`localStorage` и `chrome.storage.local`, ключ `gd_youtrack_issues_cache`)**: все однажды полученные задачи сохраняются локально. Вне контура / без VPN интерфейс работает в офлайн-режиме на кэше.
    3. **Без синтетических данных**: демо-задачи не используются; при отсутствии авторизации и кэша выводится сообщение с кнопкой входа в YouTrack.
  - Сырые ответы API/DOM типизированы (`YouTrackApiIssue` в `src/types/index.ts`) и нормализуются в `YouTrackIssue` функцией `normalizeApiIssue`.
- **Представление задач в виде плиток (`YouTrackIssueTile`)**:
  - Каждая задача выводится в виде карточки в стиле GreenData (`bg-white`, `border-slate-200`, `rounded-xl`).
  - Моноширинный бейдж ID задачи (например, `REZ_FIN-8241`) с возможностью копирования в один клик.
  - Автоматически извлекаемый бейдж TFS (например, `FINAPP-8269`), если номер найден в названии.
  - Название задачи (Summary), статус («В работе», «Открыта», «На тестировании», «Решена»), уровень приоритета, тип, исполнитель и дата обновления.
  - **Кнопка «Перенести» в задачу GreenData**: отображается на каждой карточке; доступна (активна) строго тогда, когда на странице в браузере активно модальное окно создания данных задачи платформы GreenData (определяется автоматически с интервалом 1.5 с во всех фреймах). При клике вводит данные в поля формы как пользователь, выбирает модуль «Финансовый модуль» и подсвечивает заполненные поля. Если модальное окно не открыто, кнопка отключена с поясняющим тултипом.
  - Быстрые действия в строке: копирование ID, кнопка «Перенести», кнопка «В реализацию», открытие задачи в YouTrack.
- **Детальный просмотр задачи внутри виджета (`YouTrackIssueDetail`)**:
  - При клике на плитку открывается экран детальной информации без покидания виджета.
  - Отображение полного текста описания (`description`) задачи.
  - Кнопки быстрого копирования: ID, Название, Markdown-ссылка вида `[REZ_FIN-8241](url) Название`.
  - Кнопка в шапке и выделенный блок **«Перенос в задачу GreenData»**: наглядная карточка с предпросмотром заполняемых полей (`TFS (US/BP) *`, `YT/Git`, `Наименование задачи *`), статусом формы (активна / не открыта) и кнопкой переноса.
  - Кнопка **«В Реализацию»**: в 1 клик создает задачу в трекере реализации расширения (`useImplementationTasks`), копируя туда номер задачи, название и описание, после чего переключает пользователя во вкладку «Реализация».
- **Автозаполнение полей формы создания задачи GreenData (`src/utils/greenDataTaskFormInjector.ts`)**:
  - Поле **`TFS (US/BP) *`** (`data-ident="TFS_STR"`): заполняется номером TFS, извлеченным из названия задачи с помощью регулярных выражений `extractTfsNumberFromSummary` (например, из `"FINAPP-8269 - Ошибка при заполнении..."` извлекается `"FINAPP-8269"`).
  - Поле **`YT/Git`** (`data-ident="YT_STR"`): заполняется системным ID задачи YouTrack (например, `"REZ_Fin-5658"`).
  - Поле **`Наименование задачи *`** (`data-ident="NAME_TASK_STR"`): заполняется полным названием задачи.
  - Поле **`Модуль`** (`[data-ident*="MODUL"]` или подпись «Модуль»): автоматически выбирается **«Финансовый модуль»** (`GREENDATA_DEFAULT_MODULE`) — расширение открывает окно выбора кнопкой поля, при необходимости вводит поиск, кликает строку и подтверждает кнопкой «Выбрать»/«ОК»; совпадения, видимые на странице до открытия окна, игнорируются. Если значение уже выбрано — поле не трогается; если вариант не найден — окно закрывается и в уведомлении предлагается выбрать модуль вручную. Поля **`GUF`** и **`Направление задачи`** не затрагиваются.
  - **Ввод как пользователь**: посимвольный «ручной» ввод: фокус (с явной отправкой `focus`/`focusin`, т.к. фокус обычно в боковой панели) → очистка поля → для каждого символа `keydown`/`keypress` + `document.execCommand('insertText')` (браузер генерирует доверенные `beforeinput`/`input`; при неудаче — нативный сеттер `value` + `InputEvent`) + `keyup` → `change` → `blur`/`focusout`. Простая подмена значения в HTML не снимала красную подсветку обязательных полей — форма засчитывает только реальный ввод и потерю фокуса.
- **Поиск и фильтрация (`YouTrackTool`)**:
  - Быстрый поиск в реальном времени по ID, названию и описанию.
  - Интерактивные чип-фильтры по статусам («Все», «В работе», «Открыта» и др.) с подсчетом количества задач.
  - Индикатор статуса синхронизации и источника данных (Контур / API / Кэш) с точным временем обновления.
  - Индикатор активности формы GreenData на открытой странице браузера (`🟢 Окно GD активно` / `⚪ Окно GD не активно`).

### 9.4 Вкладка «Утилиты» (`extra`)

- **Генератор идентификаторов алгоритмов (`AlgorithmIdGenerator`)**: поле ввода названия алгоритма на русском языке, локальная генерация 4 вариантов ID (`UPPERCASE_SNAKE_CASE`), генерация через LLM, копирование в один клик.
- **Подключение ИИ (`AiSettingsModal`)**: адрес сервера, тип авторизации, ключ, модель, дополнительные заголовки, проверка соединения.

### 9.6 Автономное окно чеклиста сбора (`checklist.html`)

Полноэкранный автономный интерфейс чеклиста для удобной работы на отдельном мониторе или во вкладке браузера:
- **Точки входа:** `checklist.html`, `src/checklist/main.tsx`, `src/checklist/ChecklistPage.tsx`.
- **Маршрутизация:** поддержка URL-параметра `?taskId=<id>` и выпадающий селектор переключения между задачами.
- **Реактивная синхронизация:** двусторонняя синхронизация состояния с боковой панелью через `window.addEventListener('storage')`.
- **Сбор объектов:** открытие объектов в один клик кнопкой «Открыть и собрать» с моментальной фиксацией статуса `isCollected: true` и времени `collectedAt`.
- **Индикация и эффекты:** полоса прогресса, автоматическое обновление Markdown-описания задачи и запуск салюта при 100% сборе.

---

## 10. Сборка, деплой и руководство разработчика

### 10.1 Команды сборки и запуска

Проект управляется через npm:

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера Vite
npm run dev

# Полная production-сборка расширения
npm run build

# Непрерывная фоновая сборка при изменениях
npm run watch
```

> **ВАЖНО (Windows PowerShell)**: PowerShell не поддерживает оператор `&&`. Для цепочки команд используйте `;` (точка с запятой) либо выполняйте команды поочередно.

### 10.2 Конфигурация Vite (`vite.config.ts`)

Многостраничная сборка Rollup генерирует точку входа Service Worker (`background.js`) в корень `dist/`, а страницы интерфейса компилирует с разделением библиотек:

- `vendor-react`: `react`, `react-dom`, `scheduler`
- `vendor-dnd`: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `vendor-zip`: `jszip`, `file-saver`
- `vendor-icons`: `lucide-react`
- `vendor`: остальные сторонние пакеты

### 10.3 Установка расширения в Google Chrome

1. Выполнить `npm run build`. Сборщик сформирует папку `dist/`.
2. В Chrome открыть адрес: `chrome://extensions/`.
3. В правом верхнем углу включить переключатель **«Режим разработчика»** (Developer mode).
4. Нажать кнопку **«Загрузить распакованное расширение»** (Load unpacked).
5. Выбрать каталог `dist/` внутри папки проекта.
6. На панели расширений нажать на иконку **GD Helper** — в правой части браузера откроется боковая панель.

---

## 11. Руководство для AI-агентов и LLM при доработке проекта

Если вы — AI-модель или агент, работающий с данным репозиторием, соблюдайте строгие правила:

1. **Никаких темных тем**: фон задаётся токеном `--gd-bg` на `body`. Карточки строго `bg-white`, рамка `border-slate-200`, скругления только `rounded-xl`. Запрещено использовать `bg-slate-700+`, `bg-gray-*`, `bg-zinc-*`, `rounded-2xl`, `rounded-3xl` для обычных карточек и классы Tailwind v4.
2. **Переиспользование UI**: любые новые кнопки делать через `<Button>` или `<IconButton>`, модалки только через `<Modal>`, поля ввода через `<Input>` / `<Textarea>`. Не создавать инлайн-стилей вместо токенов GreenData.
3. **Разделение состояния**:
    - Вся логика работы с файлами и пакетами — внутри `useAppState.ts`.
    - Вся логика задач реализации — внутри `useImplementationTasks.ts`.
    - Подключение к LLM — внутри `useAiSettings.ts`.
    - Компоненты страниц должны быть презентационными и не содержать тяжелых алгоритмов очистки или парсинга.
4. **Типизация**: новые типы данных и интерфейсы **обязательно** вносить в `src/types/index.ts`. `any` не используется (в проекте 0 вхождений); ошибки из `catch` — через `getErrorMessage()` из `src/utils/errorUtils.ts`.
5. **Тестирование сборки**: перед завершением любой задачи выполнить сборку `npm run build` и убедиться в отсутствии ошибок компиляции TypeScript.
6. **Локализация**: все тексты пользовательского интерфейса, подсказки и сообщения об ошибках — на русском языке, числительные склоняются через `pluralizeRu()`. Идентификаторы, имена файлов и коммиты — на английском.
7. **Документация**: правила — `RULES.md`, роль агента — `AGENT.md`, шаблон задачи — `PROMT.md`, упаковщик подробно — `docs/guf-packer.md`. Этот файл — единственная копия проектной документации (в корне).

---

## 12. История изменений (Changelog)

### Версия 2.1.0 (19.10.2026)
- **Качество взаимодействия** (быстрее, удобнее, с обратной связью):
  - Added: общие уведомления `useToast` / `useToastController` (`src/hooks/useToast.ts`, типы `ToastOptions`, `ToastAction`, `ToastTone`); `Toast` получил оттенок (`tone`) и кнопку действия; уведомления собраны в общий контейнер сверху, таймер на паузе при наведении.
  - Added: отмена удаления тостом «Отменить» — файл и очистка пакета (`restoreFiles`), пресет (`restorePreset`), задача и пункт реализации (`restoreTask`, `restoreChangeItem`), сброс отметок «собрано», импорт задач JSON (`replaceAllTasks`), очистка истории и термины словаря генератора ID.
  - Added: `Modal` — фокус на первом поле при открытии (`initialFocus="sheet"` для подтверждений), Tab не уходит за шторку, фокус возвращается к кнопке-источнику; `onSubmit`: Ctrl/⌘ + Enter из любого поля и Enter в однострочном поле (в `<form>` отправляет именно эту форму); Esc закрывает только верхнюю шторку и не срабатывает, если его обработал выпадающий список или меню.
  - Added: `Select` — ↑↓ / Home / End, фокус на выбранном пункте, Esc закрывает только список; хук `useEscapeKey` закрывает меню «⋯» (пакеты, разделы, пункты).
  - Added: `copyToClipboard` (`utils/clipboard.ts`, запасной путь через execCommand) и хук `useCopyToClipboard` — все кнопки копирования показывают «Скопировано», при ошибке — тост.
  - Added: тосты результата — загрузка/ошибка ZIP, сборка архива, перенос из YouTrack, ручное обновление YouTrack (автообновление при запуске — без тоста).
  - Changed: импорт ZIP больше не подменяет весь интерфейс экраном загрузки (`isImporting` вместо `isLoading`).
  - Changed: «В реализацию» из YouTrack открывает существующую задачу с тем же номером вместо создания дубликата.
  - Changed: каждый раздел помнит позицию прокрутки; детали задачи YouTrack открываются сверху, при возврате список на прежнем месте; опрос формы GreenData идёт только при открытом разделе YouTrack.
  - Changed: клавиатура — строки пакетов, задач и плитки YouTrack доступны с Tab/Enter; Enter в поиске пакетов и задач открывает первый результат, Esc очищает поиск (файлы, задачи, YouTrack); Ctrl/⌘ + Enter в поле генератора ID — генерация с ИИ.
  - Changed: подсказки на недоступных кнопках («Экспорт недоступен: исправьте ошибки…», «Введите название пакета»), пустые состояния с действием («Добавить пункт», «С вкладки», «Сбросить фильтры»), увеличенные зоны нажатия (ссылки в подписях секций, очистка поиска, удаление термина, копирование в истории), кольцо фокуса для чекбоксов, меню и элементов с `tabIndex`.
  - Changed: «Сбросить» в настройках ИИ сбрасывает только поля формы — сохранённые настройки и ключ меняются после «Сохранить».
  - Fixed: «Выше/ниже» у пункта реализации перемещает его внутри своего раздела (раньше менялся местами с пунктом другого раздела и визуально не двигался).
  - Fixed: редактор README при каждом открытии показывает актуальный текст пакета; «Импорт и экспорт» открывается на запрошенной вкладке.
  - Fixed: Enter в поле нового раздела внутри шторки пункта создаёт раздел, а не сохраняет пункт; Esc в поле имени архива отменяет переименование.
  - Fixed: быстрое добавление пункта сохраняет раскрытие раздела; копирование из истории генератора сохраняет исходное название; «Перенесено» на плитке YouTrack — только при успешном переносе; страница чеклиста применяет `taskId` из адреса один раз.

### Версия 2.0.0 (17.10.2026)
- **Редизайн «Aurora Glass»** (по макетам дизайн-холста Claude; весь функционал сохранён):
  - Changed: палитра — индиго-акцент `#4f5bd5` вместо зелёного (Tailwind `emerald-*`/`teal-*` → `accent-*`, токены `gd-green*` → `gd-accent*`), холодная нейтральная шкала `slate-*`, фон с авророй, стеклянные группы (радиус 20px), кнопки-капсулы.
  - Changed: шрифты Geist / Geist Mono вместо Inter (`@fontsource-variable/geist`, `geist-mono`).
  - Changed: плавающий стеклянный док из 4 разделов и капсула экспорта над ним; шапка раздела с кнопками ⌘K и «Во весь экран», сжимающаяся при прокрутке.
  - Added: командная палитра `CommandPalette` (Ctrl/⌘ + K) и сочетания Alt + 1…4 (`usePaletteShortcuts`, `utils/shortcuts.ts`, тип `PaletteCommand`).
  - Changed: компактная «Упаковка» — однострочные строки файлов, автосбор в одной строке с режимом имени, шаблон с чипами (начальный номер, теги, README) и ссылкой «Пресеты», ссылка на релизный пакет в одну строку.
  - Added: быстрое добавление пункта реализации (строка ввода + раздел, Enter) и кольцо прогресса сбора (`ProgressRing`).
  - Changed: шторки — плавающие стеклянные панели; меню — плотное стекло; группа с открытым меню поднимается над соседними (`:has(.gd-menu)`).
  - Changed: цвета салюта вынесены в `constants/theme.ts`.
  - Docs: `RULES.md`, `AGENT.md`, `.cursorrules` описывают Aurora Glass.

### Версия 1.9.0 (17.10.2026)
- Removed: раздел «ИИ-ассистент» и весь функционал чата — вкладка в таб-баре, `AiChatContainer`, `AiMessageItem`, хук `useAiChat`, реестр агентов `constants/aiAgents.ts`, типы `AiChatMessage`, `AiAgent`, `AiStarterSuggestion`. История чата удаляется из хранилища при первом запуске.
- Changed: генерация ID алгоритмов через ИИ во вкладке «Утилиты» сохранена. Подключение вынесено в хук `useAiSettings` (тот же ключ хранения — сохранённые настройки не теряются), шторка `AiSettingsModal` перенесена в `components/extra/` и оставляет только параметры подключения (без агентов, системного промпта, температуры и потокового вывода — их использовал только чат).
- Changed: таб-бар из 4 разделов; режим `compact` у `Header` удалён.

### Версия 1.8.0 (12.10.2026)
- **Редизайн в стиле iOS** (весь функционал сохранён):
  - Changed: строгая монохромная база — шкала `slate-*` переопределена системными серыми iOS, фон `#f2f2f7`, один зелёный акцент GreenData; карточки — плоские белые группы без рамок и теней.
  - Added: нижний таб-бар (`TabBar`) вместо вкладок в шапке; навбар с крупным заголовком, сворачивающимся при прокрутке (`Header`); тост-капсула (`Toast`) вместо двух копий разметки уведомлений.
  - Added: группированные списки (`.gd-group`, `.gd-row`, `.gd-section-title`, `.gd-menu`, `.gd-field`, `.gd-switch`) и примитив `ToolRow`.
  - Changed: все модальные окна стали iOS-шторками — страница под ними уменьшается, закрытие свайпом вниз; поля на сером фоне шторки автоматически белые.
  - Changed: «Реализация» — выпадающий список задач заменён экраном «‹ Задачи»; разделы — свёртываемые группы с меню «⋯»; пункт изменения — строка с круглым чекбоксом «Собран», редкие действия (порядок, удаление) — в меню «⋯».
  - Changed: «Упаковка» — пакет, автосбор (переключатель iOS) и имя файла в одной группе; инструменты (теги, пресеты, README) — строки-переходы; файлы — список с номером и ручкой, тап по строке открывает редактирование; «Очистить» — в заголовке секции.
  - Changed: YouTrack — строка статуса синхронизации и формы GreenData вместо карточки-шапки, чипы фильтров, карточки задач и детальный экран в стиле iOS; Утилиты — справочники строками группы; ИИ-чат — «пузыри» сообщений как в iMessage, стеклянные панели.
  - Added: анимации — «вдавливание» любой кнопки с пружиной, анимация иконки при нажатии по её смыслу (`src/utils/iconTapAnimation.ts`, переопределение `data-icon-anim`), скользящий ползунок `SegmentedControl`, переходы экранов, каскадное появление списков, пружинные тосты и галочки; поддержка `prefers-reduced-motion`.
  - Added: шрифт Inter Variable в сборке (`@fontsource-variable/inter`), работает офлайн.
  - Changed: прокручивается `#root`, а не окно (нужно для эффекта шторки).
  - Fixed: невалидные классы `bg-[#…]/12` и `ring-gd-green/40` (не генерировались Tailwind).
  - Docs: `RULES.md`, `AGENT.md`, `.cursorrules` и этот документ описывают дизайн-систему iOS.

### Версия 1.7.0 (12.10.2026)
- **Дизайн-система — единый источник и исправление «немых» классов**:
  - Fixed: классы Tailwind v4 (`shadow-xs`, `shadow-2xs` — ~200 мест; `py-0.2`, `pl-8.5`/`pr-8.5`, `bottom-22`, `rounded-tr-xs`, `animate-in fade-in`, `animate-pulse-subtle`) не генерировались в Tailwind v3 и не давали эффекта. Тени `xs`/`2xs` и анимация `pulse-subtle` добавлены в `tailwind.config.js`, остальные классы заменены на валидные (`py-px`, `pl-8`, `bottom-[88px]`, `rounded-tr-sm`, `animate-fade-in`). Отступ иконки в `Input` (`leftElement`) теперь работает.
  - Fixed: `sidepanel.html` и `index.html` имели `class="dark"` и тёмный `body` (`bg-slate-950`) — удалено.
  - Changed: цвета `gd-*` в `tailwind.config.js` ссылаются на CSS-переменные `--gd-*` (раньше были две разные палитры: `#22c55e` в Tailwind и `#059669` в CSS). Дублирующиеся keyframes (`fadeIn`, `slideUp`, `slideDown`, `icon*`) оставлены только в `src/index.css`.
  - Changed: нейтральная шкала сведена к `slate-*` (все `gray-*` заменены), рамки карточек — `border-slate-200` без прозрачности, все `rounded-2xl` → `rounded-xl`, островки и тулбары — `shadow-sm`.
  - Changed: убраны тёмные элементы — блоки кода в ИИ-чате и предпросмотр JSON стали светлыми, тёмные чипы (выбор агента, фильтр «Все» в YouTrack, кнопка отправки) — зелёными.
  - Added: классы `.vk-icon-pop` / `.vk-icon-spin` / `.vk-icon-shake` / `.vk-icon-bounce` (были описаны в правилах, но не существовали) и `.gd-label`.
- **Улучшение дизайна**:
  - Фирменная зелёная градиентная полоса в шапке, полупрозрачная шапка и футер с размытием, мягкое зелёное свечение фона.
  - Шапка на узкой панели (≤ 480 px) показывает подпись только у активной вкладки — кнопка «Во весь экран» больше не обрезается.
  - Плавное появление содержимого при переключении вкладок (`animate-fade-in`).
  - Модалки: размытие фона, зелёный акцент у заголовка, анимированная кнопка закрытия; выпадающие списки `Select` — со скруглёнными пунктами.
  - Кнопки: фокус-кольца только при клавиатурной навигации (`focus-visible`), лёгкий подъём primary при hover, градиент у `danger`, зелёный hover у `secondary`.
  - Оверлей перетаскивания файлов, индикаторы тулбаров и архива — в едином стиле; глобальный `:focus-visible`, `::selection` и поддержка `prefers-reduced-motion`.
- **Исправления**:
  - Fixed: русское склонение («2 файла», «5 ошибок», «3 изменения») через новую утилиту `pluralizeRu` (`src/utils/pluralize.ts`) — в футере, селекторах пакетов/задач и Markdown-экспорте.
  - Fixed: статус задачи YouTrack, извлечённый из DOM, терялся при нормализации (`normalizeApiIssue` игнорировал `item.state`) — такие задачи всегда показывались как «Открыта». Также сохраняется URL задачи из DOM.
  - Fixed: лишняя полоса тени под `Textarea` (обёртка была выше поля).
  - Changed: удалены все `any` (16 мест): добавлены типы `YouTrackApiIssue`, `YouTrackApiCustomField`, `AiAlgorithmRawResponse`, `MathQuillField`, `MathQuillWindow` и утилита `getErrorMessage` / `isAbortError` (`src/utils/errorUtils.ts`).
- **Docs**:
  - Удалён дубликат `docs/PROJECT_DOCUMENTATION.md` (единственная копия — в корне).
  - `guf-packer.md` перенесён в `docs/guf-packer.md`, исправлены устаревшие пути (`src/pages`, `src/utils/persistence.ts` и др.).
  - `RULES.md`, `AGENT.md`, `.cursorrules` приведены к фактической дизайн-системе: удалён несуществующий `ConsoleCard`, описаны все UI-примитивы, токены, запрет классов Tailwind v4, полная структура `src/`.
  - Исправлено описание стратегии парсинга YouTrack (без демо-данных и прямого fetch из панели).

### Версия 1.6.0 (12.10.2026)
- **Автоматический перенос данных из YouTrack в форму создания задачи GreenData**:
  - **Кнопка «Перенести» в карточках задач YouTrack (`YouTrackIssueTile`)**:
    - На каждой плитке задачи YouTrack добавлена кнопка «Перенести».
    - **Автодетекция активного модального окна**: кнопка доступна (активна) строго тогда, когда на открытой странице в браузере активно модальное окно создания задачи платформы GreenData.
    - При отсутствии открытой формы создания задачи кнопка отключается (`disabled`) с подсказкой «Откройте модальное окно создания задачи в GreenData, чтобы перенести данные».
    - При успешном переносе кнопка моментально анимирует зелёный статус «Перенесено!» с иконкой галочки.
  - **Автозаполнение полей задачи в GreenData (`src/utils/greenDataTaskFormInjector.ts`)**:
    - **TFS (US/BP) \*** (`[data-ident="TFS_STR"] input`): автоматически извлекается номер TFS/US/BP из названия задачи с помощью регулярного выражения `extractTfsNumberFromSummary` (например, из `"FINAPP-8269 - Ошибка при заполнении..."` извлекается `"FINAPP-8269"`). На плитке и в детальном виде отображается моноширинный бейдж TFS.
    - **YT/Git** (`[data-ident="YT_STR"] input`): заполняется системным ID задачи YouTrack (например, `"REZ_Fin-5658"`).
    - **Наименование задачи \*** (`[data-ident="NAME_TASK_STR"] textarea/input`): заполняется полным названием задачи.
    - Поле **`Модуль`** (`[data-ident*="MODUL"]` или подпись «Модуль»): автоматически выбирается **«Финансовый модуль»** (`GREENDATA_DEFAULT_MODULE`) — расширение открывает окно выбора кнопкой поля, при необходимости вводит поиск, кликает строку и подтверждает кнопкой «Выбрать»/«ОК»; совпадения, видимые на странице до открытия окна, игнорируются. Если значение уже выбрано — поле не трогается; если вариант не найден — окно закрывается и в уведомлении предлагается выбрать модуль вручную. Поля **`GUF`** и **`Направление задачи`** не затрагиваются.
    - **Ввод как пользователь**: посимвольный «ручной» ввод: фокус (с явной отправкой `focus`/`focusin`, т.к. фокус обычно в боковой панели) → очистка поля → для каждого символа `keydown`/`keypress` + `document.execCommand('insertText')` (браузер генерирует доверенные `beforeinput`/`input`; при неудаче — нативный сеттер `value` + `InputEvent`) + `keyup` → `change` → `blur`/`focusout`. Простая подмена значения в HTML не снимала красную подсветку обязательных полей — форма засчитывает только реальный ввод и потерю фокуса.
    - Визуальная индикация: заполненные поля на 1.5 секунды подсвечиваются акцентным цветом расширения (`#eef0ff`, обводка `rgba(79,91,213,.35)`).
  - **Детальный экран задачи (`YouTrackIssueDetail`)**:
    - В верхней навигационной панели добавлена кнопка «Перенести в задачу».
    - Добавлен отдельный блок «Перенос в задачу GreenData» с предпросмотром заполняемых полей, статусом активности модального окна (`Форма активна` / `Окно не активно`) и кнопкой переноса.
  - **Мониторинг и статус формы (`YouTrackTool`)**:
    - В фоновом режиме каждые 1.5 с (а также при смене/активации вкладок) проверяется наличие модального окна создания задачи во всех фреймах (`allFrames: true`).
    - В шапке раздела отображается живой индикатор: `🟢 Окно GD активно` / `⚪ Окно GD не активно`.
    - При успешном переносе выводится информационное уведомление с перечислением перенесённых полей.
- **Автоинкремент спарсенного номера файла релизного пакета (`+1`)**:
  - Парсер последнего номера файла пакета (`parseLastPackageFileNumberFromGreenData`) теперь автоматически прибавляет `+ 1` к максимальному номеру файла, найденному в таблице «Прикрепленные файлы» (например, если последний файл в пакете имел номер `380`, парсер возвращает `381`).
  - Полученное последующее число сразу подставляется в качестве `startNumber` упаковщика, исключая дублирование номеров с уже существующими в пакете файлами.
  - В интерфейсе и всплывающем уведомлении отображается как следующий номер (`№ 381`), так и подсказка с текущим максимумом (`в пакете: 380`).

### Версия 1.5.0 (08.10.2026)
- **Интеграция с YouTrack (РЭЦ_Fin)**:
  - **Новый раздел верхнего меню**: справа от раздела «Реализация» добавлен таб «YouTrack» с иконкой `<CheckSquare />` и горячим переключением.
  - **Парсинг целевого поискового запроса**:
    - Интегрирован парсинг персональной ссылки:
      `https://youtrack.greendatasoft.ru/issues?q=%D0%98%D1%81%D0%BF%D0%BE%D0%BB%D0%BD%D0%B8%D1%82%D0%B5%D0%BB%D1%8C:%20%D0%9A%D1%83%D1%87%D0%B8%D0%BD_%D0%92%D0%BB%D0%B0%D0%B4%D0%B8%D0%BC%D0%B8%D1%80_%D0%92%D0%B0%D0%BB%D0%B5%D1%80%D1%8C%D0%B5%D0%B2%D0%B8%D1%87%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82:%20%D0%A0%D0%AD%D0%A6_Fin&u=1`
    - Парсинг работает строго по указанному URL (независимо от текущей активной вкладки Chrome), когда разработчик находится в корпоративном контуре (VPN).
  - **Многоуровневая архитектура извлечения только реальных данных (`src/utils/youtrackParser.ts`)**:
    - Уровень 1: Прямой запрос к REST API YouTrack (`/api/issues?...`) с сессионными cookie (`credentials: 'include'`).
    - Уровень 2: Внутривкладочное выполнение (`executeInTabYouTrackExtraction`) через `chrome.scripting.executeScript` в контексте вкладки `youtrack.greendatasoft.ru` (существующей или скрытой фоновой). Так как вызов `window.fetch` выполняется в том же источнике (same-origin), браузер автоматически передает все авторизационные cookies пользователя (`JSESSIONID` и др.), гарантируя получение реального списка задач без блокировок CORS.
    - Уровень 3: Локальное кэширование реальных данных (`localStorage` и `chrome.storage.local`) по ключу `gd_youtrack_issues_cache`. Задачи всегда доступны для работы вне контура (офлайн). При возвращении в контур данные обновляются нажатием кнопки «Обновить».
    - **Полное исключение синтетических/демо-данных**: отображаются только реальные задачи исполнителя из YouTrack. Если авторизация отсутствует, пользователю выводится понятное сообщение с кнопкой прямого входа.
    - Добавлено разрешение `"cookies"` в `manifest.json`.
  - **Плиточный интерфейс задач (`YouTrackIssueTile`)**:
    - Отображение задач в виде элегантных белых плиток GreenData с рамкой `border-slate-200` и скруглением `rounded-xl`.
    - Моноширинный бейдж с ID задачи (например, `REZ_FIN-8241`) с возможностью быстрого копирования по клику.
    - Полное наименование задачи (Summary), статус, приоритет, тип, исполнитель и дата обновления.
    - Быстрые действия: копирование ID, переход в YouTrack, кнопка «В реализацию».
  - **Детальный просмотр задачи внутри виджета (`YouTrackIssueDetail`)**:
    - Полноэкранный просмотр карточки задачи без перехода в браузер: полный текст описания, атрибуты, ссылки.
    - Быстрое копирование ID, Названия или Markdown-ссылки `[ID](url) Название`.
    - Прямой экспорт в Реализацию в 1 клик: создание задачи в трекере реализации с предзаполнением ID, названия и описания и моментальным переключением во вкладку «Реализация».
  - **Фильтрация и поиск (`YouTrackTool`)**:
    - Поле живого поиска по ID и названиям.
    - Фильтрация по статусам с подсчетом задач («Все», «В работе», «Открыта», «На тестировании», «Решена»).
    - Индикатор времени кэширования и источника данных (API / Контур / Кэш).
    - Автоматический старт загрузки реальных задач при открытии вкладки.

### Версия 1.4.0 (08.10.2026)
- **Вставка ссылки на релизный пакет и автопарсинг последнего номера**:
  - Реализована полноценная возможность вставлять произвольную ссылку на карточку релизного пакета GreenData (`https://expo.greendatasoft.ru/#/card/...` или просто ID карточки) и автоматически парсить последний номер прикрепленного файла:
    - **В упаковщике (`TemplateEditor`)**: добавлена выделенная строка с полем ввода URL релизного пакета, кнопкой быстрой подстановки «Из вкладки», сохранением в `localStorage` и кнопкой «Спарсить №». Если в активной задаче реализации уже прикреплен пакет, URL подтягивается автоматически. Спарсенный номер сразу устанавливается в качестве `startNumber` пакета.
    - **В строке изменения (`ChangeItemRow`)**: для релизного пакета добавлено поле ввода/редактирования URL ссылки прямо в строке с кнопкой «Спарсить №», позволяющее оперативно привязать ссылку и спарсить номер без открытия модальных окон.
    - **В модалке добавления пункта (`AddChangeItemModal`)**: под полем URL страницы отображается блок с кнопкой «Спарсить № из ссылки», позволяющий определить последний номер файла и имя файла еще до сохранения пункта.
    - **В параметрах задачи (`TaskSettingsModal`)**: добавлено поле «Ссылка на релизный пакет GreenData» с кнопкой «Спарсить №» и бейджем последнего номера.
- **Архитектура фонового парсинга страниц GreenData (`tabUtils.ts`)**:
  - `parseLastPackageFileNumberFromGreenData(targetUrl)` нормализует переданный URL (поддерживает ссылки с протоколом, без протокола или просто ID карточки).
  - Сначала проверяет все открытые вкладки Chrome на совпадение по `cardId` или URL (если вкладка открыта — парсинг производится без открытия новых вкладок).
  - Если вкладка не открыта — создает временную фоновую вкладку (`chrome.tabs.create({ url, active: false })`), ожидает событие `status === 'complete'`, производит опрос DOM таблицы `td[data-cell="Наименование"]` (до 16 попыток с интервалом 600 мс для ожидания загрузки данных в SPA GreenData), извлекает максимальный номер `.guf` файла и гарантированно закрывает временную фоновую вкладку в блоке `finally`.
- **Защита релизных пакетов GreenData от редактирования (Read-Only Lock)**:
  - Релизные пакеты платформы GreenData, прикрепляемые в реализацию, защищены от случайной правки через инструмент расширения.
  - В `ChangeItemRow` кнопка редактирования («карандаш») заблокирована и заменена на иконку `<Lock />` с тултипом `«Релизный пакет GreenData защищен от редактирования в расширении»`.
  - В карточке отображается отличительный статус-бейдж `Релизный пакет (read-only)`.
  - Модальное окно `AddChangeItemModal` автоматически определяет релизные пакеты по заголовку и ссылке вкладки (`isGreenDataUpdatePackage`), выставляя атрибут `isUpdatePackage: true`.
- **Всплывающее анимированное уведомление (Top Toast)**:
  - В `src/sidepanel/App.tsx` добавлен легкий анимированный поп-ап (`packageNumberNotification`) в верхней части экрана с анимацией появления, автоматическим скрытием через 4 секунды и кнопкой закрытия.

### Версия 1.3.0 (17.09.2026)
- **Сортировка и фильтрация не собранных объектов**:
  - Реализованы фильтры статуса («Все», «Не собранные», «Собранные») с интерактивными бейджами счетчиков в модальном окне `TaskChecklistModal` и на странице `ChecklistPage`.
  - Добавлен тумблер сортировки **«Сначала не собранные»**, поднимающий не собранные пункты вверх списка с сохранением исходного сквозного номера задачи `#{displayNum}`.
  - В шапку блока «Внесённые изменения» редактора задачи (`TaskEditor`) встроен быстрый фильтр по не собранным пунктам.
- **Связка с пакетом сборки и мгновенная отметка статуса «Собран»**:
  - **Автоматический сбор**: при захвате скачиваемого GUF-файла автосборщиком (`useAutoCollector`) или замене/добавлении дубликата в пакете соответствующий пункт реализации автоматически помечается как собранный (`autoMarkTaskItemCollected`).
  - **Пакетное действие**: добавлена кнопка **«Собрать из пакета ({count})»** в `TaskChecklistModal` и `ChecklistPage`, позволяющая в один клик перевести в статус «Собран» все пункты, чьи GUF уже найдены в привязанной сборке по `cardId`.
  - **Быстрое действие в строке пункта**: если файл уже есть в сборке (`matchingPackageFile`), в строке отображается прямая кнопка **«Собрать»** (вместо перехода по ссылке) в `ChangeItemRow`, `TaskChecklistModal` и `ChecklistPage`.
- **Строгое соблюдение дизайн-системы GreenData**:
  - Заменены все вхождения `rounded-2xl` на `rounded-xl` в карточках чеклистов, модалок и редакторов в соответствии с `RULES.md`.

### Версия 1.2.0 (16.09.2026)
- **Фильтрация ссылок объектов GreenData и строгая привязка к карточкам (`/card/`)**:
  - Ссылки, не содержащие `/card/` (например, служебные адреса создания обновлений `https://expo.greendatasoft.ru/#/CreateUpdate?_k=...` или страницы экспорта), больше не прикрепляются к файлам (`sourceUrl` не устанавливается, ссылка на такой файл не отображается).
  - Реализованы функции `isValidGreenDataCardUrl` и `trimGreenDataUrl`: возвращают пустую строку при отсутствии `/card/`, предотвращая прикрепление некорректных URL.
- **Идентификация объектов по ID карточки (`cardId`)**:
  - Реализована функция `extractCardIdFromUrl`, извлекающая числовой/символьный ID объекта непосредственно после `/card/{ID}` (например, `9555317`).
  - В модель `FileRow` добавлено поле `cardId?: string`.
  - В строке файла сборщика (`FileRowItem`) отображается моноширинный бейдж `ID: {cardId}`.
- **Сквозная перекрестная связь между файлами пакета и задачей реализации по ID**:
  - В таблице файлов сборки (`FileTable` / `FileRowItem`): если объект с таким `cardId` присутствует среди пунктов привязанной задачи реализации, отображается зелёный статус-бейдж `✓ В задаче`.
  - В задаче реализации (`ChangeItemRow`, `TaskEditor`, модальное окно чеклиста `TaskChecklistModal` и полноэкранный чеклист `ChecklistPage`):
    - Отображается бейдж `ID: {itemCardId}` рядом со ссылкой на карточку объекта.
    - Производится автоматическая проверка наличия объекта в привязанном пакете сборки по `cardId`.
    - Если объект найден в пакете, отображается информативный бейдж `📦 В пакете #{matchingFile.order}` с подсказкой имени и номера файла.
  - Поддержка `title` на компоненте `Badge` для отображения всплывающих подсказок.

### Версия 1.1.0 (15.09.2026)
- **Чеклист сбора объектов реализации**:
  - Реализовано модальное окно `TaskChecklistModal` в боковой панели (`Side Panel`) и автономная страница `checklist.html` (`ChecklistPage.tsx`) для полноэкранной работы.
  - Добавлена кнопка **«Открыть и собрать»**: открывает ссылку объекта GreenData в браузере и автоматически переключает статус на **«Собран»** (`isCollected: true`, `collectedAt: Date.now()`).
  - Добавлены интерактивные тумблеры и чекбоксы сбора на карточках списка и в `ChangeItemRow`.
  - Индикатор прогресса в процентах (`X из Y (Z%)`) и запуск праздничного салюта (`canvas-confetti`) при 100% сборе объектов.
  - Пакетные действия: «Отметить все собранными», «Сбросить», «Копировать MD», «В отдельном окне».
  - Двусторонняя реактивная синхронизация состояния между окнами через `window.addEventListener('storage')`.
- **Автоматическое обновление итогового Markdown (`tabUtils.ts:formatTaskToMarkdown`)**:
  - Чекбоксы `[x]` / `[ ]` и суффиксы `— *(Собран)*` для каждого пункта.
  - Динамический заголовок `### Внесённые изменения (Все объекты собраны ✅ X/X)`.
  - Отметка собранных файлов в блоке пакетов: ` — ✅ **Все файлы собраны**` и суффикс `— *(Собран)*` у файлов пакета.
  - Блок готовности к релизу `### Статус готовности\n✅ **Все объекты реализации собраны**` при отсутствии прикрепленных пакетов.
- **Интерфейс и тулбар**:
  - В `Toolbar.Actions` вкладки «Реализация» добавлена кнопка «Чеклист» с динамическим счетчиком-бейджем.
  - В шапку блока внесенных изменений добавлена кнопка быстрого перехода в чеклист.
  - В строках файлов таблицы упаковки (`FileRowItem`) добавлена кнопка скачивания отдельного GUF-файла слева от кнопки редактирования («ручки») с анимацией подтверждения скачивания.
- **Автоловщик скачиваний (`AutoCollector` / Service Worker)**:
  - Реализована эшелонированная фильтрация скачиваний: исключен самозахват файлов, скачиваемых из интерфейса самого расширения (`isInternalExtensionDownload`, проверка `byExtensionId`, `blob:chrome-extension://` и регистрация внутренних скачиваний).
  - Добавлено специальное правило для страницы **«Создание обновлений»**: файлы, скачанные со страницы создания обновлений платформы GreenData, автоматически именуются как **«Пакет обновления»**.

---

_Конец проектной документации GD Helper._

