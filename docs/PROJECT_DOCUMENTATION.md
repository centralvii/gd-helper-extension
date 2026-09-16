# GD Helper (Chrome Extension) — Полная проектная документация

> **Версия документа:** 1.0.0  
> **Дата формирования:** 15.09.2026  
> **Целевая аудитория:** LLM-модели, AI-агенты, разработчики, релиз-инженеры GreenData  
> **Назначение документа:** Комплексный контекст для AI-агентов и разработчиков. Позволяет сразу работать с кодом без анализа 60+ файлов репозитория.

---

## 1. Обзор проекта и назначение

**GD Helper** (в исходных версиях — **guf-packer-extension**) — многофункциональное расширение для браузера Google Chrome (Manifest V3), интегрированное в боковую панель (**Side Panel API**).

Расширение создано для автоматизации рутинных операций инженеров, аналитиков и разработчиков low-code/no-code платформы **GreenData**:

1. **Упаковка обновлений (`.guf` файлов)**: загрузка, очистка имён от мусорных служебных префиксов платформы, стандартизированное переименование по настраиваемым шаблонам, сортировка Drag-and-Drop, проверка на ошибки и генерация готового к деплою ZIP-архива с файлом `README.txt`.
2. **Фиксация и оформление реализации (Implementation Tracker)**: ведение задач по доработкам платформы GreenData, разбивка изменений по категориям (Алгоритмы, Типы объектов, Визуалы/Экранные формы, Бизнес-процессы, Отчёты), автоматический захват метаданных из активной вкладки Chrome, инъекция комментариев-шапок прямо в редактор MathQuill платформы.
3. **Чеклист сбора доработок**: интерактивный трекер сбора объектов по задаче с возможностью открыть объект в один клик и зафиксировать его сборку.
4. **Генератор системных идентификаторов алгоритмов GreenData**: локальный семантико-морфологический движок генерации кодов в формате `UPPERCASE_SNAKE_CASE` (с учетом предметной области GreenData — ЮЛ, ФЛ, ИП, ЖЦ, НПП, ЗИ) + интеграция с LLM.
5. **Встроенный ИИ-ассистент**: специализированные агенты (GDSL/Groovy эксперт по разбору LaTeX-нотации GreenData, Архитектор GD, SQL/DB эксперт, GUF Релиз-инженер) с поддержкой SSE-стриминга, рассуждений (DeepSeek-R1 / OpenAI o1) и автозахвата контекста вкладки.

---

## 2. Технологический стек

| Категория              | Технологии и библиотеки                                                                     | Назначение                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Платформа**          | Chrome Extension Manifest V3, Side Panel API                                                | Интеграция в правую боковую панель браузера                                                           |
| **Фреймворк**          | React 18.3.1, TypeScript 5.7.2                                                              | Реактивный UI со строгой типизацией                                                                   |
| **Сборщик**            | Vite 6.2.0, Rollup, PostCSS, Autoprefixer                                                   | Сборка расширения с разделением на чанки (`vendor-react`, `vendor-dnd`, `vendor-zip`, `vendor-icons`) |
| **Стилизация**         | Tailwind CSS 3.4.17, `clsx`, `tailwind-merge`                                               | Дизайн-система GreenData (бело-зелёная тема)                                                          |
| **Drag & Drop**        | `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0, `@dnd-kit/utilities` 3.2.2               | Сортировка файлов и задач                                                                             |
| **Работа с архивами**  | `jszip` 3.10.1, `file-saver` 2.0.5                                                          | Распаковка, чтение Blobs, сжатие DEFLATE lvl 6, скачивание                                            |
| **Иконки**             | `lucide-react` 1.16.0                                                                       | Библиотека UI-иконок                                                                                  |
| **Анимация & Эффекты** | `canvas-confetti` 1.9.4, кастомные CSS-анимации                                             | Салют при сборке/чеклисте, микроанимации кнопок                                                       |
| **Хранилище данных**   | IndexedDB (`guf-renamer`, stores: `meta`, `blobs`), `chrome.storage.local`, `localStorage`  | Кэширование бинарников, сохранение задач, пресетов и настроек                                         |
| **Браузерные API**     | `chrome.sidePanel`, `chrome.downloads`, `chrome.tabs`, `chrome.scripting`, `chrome.storage` | Взаимодействие с вкладками, DOM страниц и загрузками                                                  |

---

## 3. Архитектура проекта и структура директорий

```
d:\Code\Vibe\guf-packer-extension\
├── public/                 # Статические ресурсы (иконки расширения 16, 48, 128 px)
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
│   │   ├── ai/             # Компоненты ИИ-ассистента
│   │   │   ├── AiChatContainer.tsx    # Главный контейнер чата, стриминг, композер
│   │   │   ├── AiMessageItem.tsx      # Сообщение чата, парсер Markdown, подсветка кода, reasoning
│   │   │   └── AiSettingsModal.tsx    # Модалка настроек подключения к OpenAI/LLM API
│   │   ├── extra/          # Вкладка «Дополнительно»
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
│   │   │   ├── TaskSelector.tsx         # Селектор активной задачи (поиск, создание, удаление)
│   │   │   └── TaskSettingsModal.tsx    # Настройки метаданных задачи
│   │   ├── layout/         # Каркас приложения
│   │   │   ├── Header.tsx  # Верхняя панель (табы: Упаковка, Реализация, Экстра, ИИ)
│   │   │   └── Footer.tsx  # Нижняя плашка экспорта архива и статуса валидации
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
│   │   │   └── index.ts          # Barrel-файл экспорта всех UI-компонентов
│   │   ├── upload/         # Загрузка файлов
│   │   │   └── FileUploader.tsx  # Зона загрузки ZIP и GUF (полная и компактная)
│   │   └── validation/     # Валидация
│   │       └── ValidationPanel.tsx # Модалка со списком ошибок и предупреждений
│   ├── constants/
│   │   ├── aiAgents.ts           # Реестр AI-агентов (GDSL, Архитектор, SQL, GUF)
│   │   └── algorithmHeader.ts    # Настройки и формат комментария-шапки алгоритма
│   ├── core/               # Чистая бизнес-логика (без React-зависимостей)
│   │   ├── nameCleaner.ts        # Очистка имен GD (удаление дат, времени, ДО./ПОСЛЕ.)
│   │   ├── templateEngine.ts     # Шаблонизатор ({indexPad6}, {cleanName}, переменные)
│   │   ├── validation.ts         # Валидация имен (символы Windows, дубли, расширения)
│   │   └── zipHandler.ts         # JSZip распаковка, сборка и генерация README.txt
│   ├── hooks/              # Кастомные React-хуки управления состоянием
│   │   ├── useAiChat.ts          # Чат с LLM, SSE-стриминг, reasoning, автозаголовки
│   │   ├── useAppState.ts        # Главный стейт пакера, пакеты, файлы, экспорт, IndexedDB
│   │   ├── useAutoCollector.ts   # Автосбор файлов из Chrome Downloads API
│   │   ├── useGlobalFileDrop.ts  # Глобальный Drag-and-Drop оверлей
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
│   │   ├── indexedDB.ts                # Двухуровневое хранилище (meta + blobs)
│   │   └── tabUtils.ts                 # Работа с вкладками Chrome, парсинг DOM GreenData
│   └── index.css           # Базовые стили Tailwind, переменные, кастомные анимации
├── dist/                   # Результат сборки расширения (загружается в Chrome)
├── manifest.json           # В dist/ и корне: конфигурация Chrome Extension Manifest V3
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
    sourceUrl?: string; // URL страницы GreenData, откуда скачан файл
}

export interface BuildPackage {
    id: string; // UUID пакета
    name: string; // Название пакета (например, "Пакет 1")
    files: FileRow[]; // Файлы пакета в памяти
    template: string; // Шаблон именования для этого пакета
    startNumber: number; // Начальный номер для нумерации (по умолчанию 1)
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
}
```

### 4.4 Модели ИИ-ассистента (`AiAgent`, `AiSettings`, `AiChatMessage`)

```typescript
export type AiAuthType = 'bearer' | 'api-key' | 'x-api-key' | 'none';

export interface AiAgent {
    id: string; // 'gdsl_agent' | 'gd_general' | 'gd_sql' | 'gd_guf'
    name: string; // Имя агента
    role: string; // Специализация (например, "Эксперт по GDSL и Groovy")
    avatar: string; // Emoji или иконка
    systemPrompt: string; // Системный промпт со спецификой платформы GreenData
    starterSuggestions?: AiStarterSuggestion[]; // Быстрые подсказки-стартеры
}

export interface AiSettings {
    baseUrl: string; // URL эндпоинта (например, https://api.openai.com/v1)
    apiKey: string; // Ключ доступа
    model: string; // Идентификатор модели (gpt-4o, deepseek-chat, local)
    authType: AiAuthType; // Тип заголовка авторизации
    customHeaders?: string; // Кастомные HTTP-заголовки в JSON
    temperature: number; // Температура генерации (0.0 - 2.0)
    maxTokens?: number; // Лимит токенов ответа
    streaming: boolean; // Использовать SSE-стриминг
    customSystemPrompt?: string; // Пользовательская перегрузка системного промпта
    activeAgentId: string; // ID выбранного агента
}

export interface AiChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    reasoningContent?: string; // Блок рассуждений моделей типа DeepSeek-R1 / o1
    timestamp: number;
    error?: boolean;
}
```

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

### 6.5 `useAiChat` (`src/hooks/useAiChat.ts`)

- Интеграция с OpenAI-совместимыми API (OpenAI, OpenRouter, Azure, DeepSeek, локальные шлюзы GreenData).
- **SSE-стриминг с троттлингом:** чтение потока байт с батчингом обновления React-состояния не чаще 40 мс для исключения зависаний интерфейса.
- **Поддержка рассуждений (Reasoning):** извлечение поля `reasoning_content` (DeepSeek R1, OpenAI o1) в сворачиваемый аккордеон.
- **Прерывание генерации:** мгновенная остановка через `AbortController`.
- **Тестирование подключения:** встроенный метод `testConnection` с измерением задержки в миллисекундах.

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

1. **Цветовая схема — строго бело-зеленая тема GreenData**:
    - Фон страницы: `#f8faf9` / `#f0f4f0`
    - Поверхности карточек: `#ffffff`
    - Акцентный цвет: `#22c55e` (Emerald-500) / `#059669` (Emerald-600)
    - Подсветки и фон hover: `#ecfdf5` / `#dcfce7`
    - Границы: `#e2e8e2` / `#e5e9e6`
    - **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО**: темные темы (`bg-slate-900`, `bg-gray-800`), закругления `rounded-2xl` или `rounded-3xl` для стандартных карточек (только `rounded-xl`).
2. **Типографика**:
    - Основной шрифт: Inter / sans-serif.
    - Моноширинный шрифт: JetBrains Mono / font-mono (для имен файлов, тегов, шаблонов, кода).
    - Базовый размер текста: 13px (body), 12px (text-xs для элементов карточек).
3. **Отступы и сетка**:
    - Расстояние между карточками: строго `space-y-3` (12px).
    - Внутренний паддинг карточек: `p-3`.
    - Паддинг тулбаров: `p-1.5`.

### 8.2 UI-компоненты (`src/components/ui/`)

Все компоненты реэкспортируются из `src/components/ui/index.ts`. Создание альтернативных инлайн-кнопок или модалок строго запрещено регламентом проекта.

| Компонент          | Файл                   | Описание и особенности                                                                                                                                                   |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`           | `Button.tsx`           | Кнопка с вариантами: `primary`, `secondary`, `danger`, `ghost`, `emerald`, `outline`, `toolbar`. Поддерживает `isLoading` (SVG спиннер), `leftIcon`, `rightIcon`.        |
| `Badge`            | `Badge.tsx`            | Компактная плашка статуса/счетчика (`default`, `success`, `warning`, `danger`, `info`, `purple`). Поддерживает цветную точку `dot`.                                      |
| `Input`            | `Input.tsx`            | Поле ввода на базе `.input-gd` с поддержкой `forwardRef`, подписей `label`, ошибок `error`, слотов `leftElement` и `rightElement`.                                       |
| `Modal`            | `Modal.tsx`            | Выезжающая снизу шторка (Bottom Sheet) через React Portal. Кэширует контент на время закрытия (230 мс) для исключения дерганий, слушает `Escape`, блокирует скролл body. |
| `Card`             | `Card.tsx`             | Контейнер со структурой compound components: `<Card.Header>`, `<Card.Body>`, `<Card.Footer>`.                                                                            |
| `IconButton`       | `IconButton.tsx`       | Квадратная кнопка для иконок с hover-микроанимацией увеличения `scale(1.12)` и сжатием при клике.                                                                        |
| `SegmentedControl` | `SegmentedControl.tsx` | Переключатель сегментов с поддержкой TypeScript generics `<T extends string>`.                                                                                           |
| `Select`           | `Select.tsx`           | Выпадающий список с поддержкой action-items (например, «+ Создать раздел...»), поиском и закрытием по клику вне области.                                                 |
| `Textarea`         | `Textarea.tsx`         | Многострочное поле с кнопкой быстрой очистки содержимого (`onClear`).                                                                                                    |
| `Toolbar`          | `Toolbar.tsx`          | Панель инструментов: `Toolbar.Title`, `Toolbar.Actions`, `Toolbar.Button`, `Toolbar.IconButton`.                                                                         |

---

## 9. Вкладки и экраны приложения

### 9.1 Вкладка «Упаковка» (`packer`)

- **Шапка пакета (`PackageSelector`)**: переключение между пакетами сборки, создание, переименование, привязка к задаче, тумблер автосбора скачиваний.
- **Редактор шаблона (`TemplateEditor`)**: редактирование маски, назначение основного шаблона, установка стартового номера `#`.
- **Панель массовых действий (`MassActionsModal`)**: список переменных `{type}`, `{module}`, `{task}` с массовым применением ко всем строкам.
- **Библиотека пресетов (`PresetManagerModal`)**: сохранение, удаление и применение именованных шаблонов.
- **Таблица файлов (`FileTable`, `FileRowItem`)**: поиск, фильтрация, Drag-and-Drop перестановка строк с помощью `@dnd-kit`, скачивание отдельного бинарника `.guf` напрямую из строки (кнопка скачивания слева от ручки редактирования), вызов модалки редактирования файла (`FileEditModal`), удаление файла из пакета.
- **Панель экспорта (`Footer`)**: валидация имен, инлайн-редактирование имени архива, сборка ZIP и праздничный салют (`canvas-confetti`).

### 9.2 Вкладка «Реализация» (`implementation`)

- **Селектор задач (`TaskSelector`)**: быстрый поиск по задачам, добавление, дублирование.
- **Инструменты задачи (`Toolbar`)**: быстрый доступ к параметрам задачи (номер, релиз, название, пакеты), бэкапу JSON и кнопке открытия интерактивного чеклиста сбора объектов с динамическим бейджем прогресса (`X/Y`).
- **Редактор шапки алгоритма**: автоматическое формирование строки комментария `// ДД.ММ.ГГГГ. Автор. Задача. Релиз.` и кнопка «Вставить в алгоритм» для прямой инъекции в редактор активной вкладки Chrome.
- **Категории изменений**: аккордеоны разделов (Алгоритмы, Типы объекта, Визуалы и т.д.) с кнопкой захвата объекта с открытой страницы (`AddChangeItemModal`), кнопкой открытия чеклиста сбора и карточками пунктов изменений.
- **Карточка изменения (`ChangeItemRow`)**: отображение описания, кликабельная ссылка на объект, индикатор и тумблер статуса сбора («Собран» / «Не собран»).
- **Модальное окно чеклиста сбора (`TaskChecklistModal`)**:
    - Индикатор прогресса в процентах со статусными бейджами.
    - Кнопки пакетных действий («Отметить все собранными», «Сбросить», «Копировать MD», «В отдельном окне»).
    - Кнопка **«Открыть и собрать»** для каждого объекта со ссылкой (открывает вкладку объекта в браузере и мгновенно помечает его собранным).
    - Праздничный салют (`canvas-confetti`) при 100% готовности сбора.
- **Экспорт и резервное копирование**: выгрузка в Markdown с чекбоксами, чистый текст или JSON.

### 9.3 Вкладка «Дополнительно» (`extra`)

- **Генератор идентификаторов алгоритмов (`AlgorithmIdGenerator`)**: поле ввода названия алгоритма на русском языке, локальная генерация 4 вариантов ID (`UPPERCASE_SNAKE_CASE`), генерация через LLM, копирование в один клик.

### 9.4 Вкладка «ИИ-ассистент» (`ai`)

- Чат с выбором специализированного агента GreenData (GDSL, Архитектор, SQL, GUF).
- Автоматический захват контекста открытой вкладки платформы (URL, ID объекта, заголовок).
- Вывод рассуждений reasoning-моделей в сворачиваемом блоке.
- Поддержка блоков кода с кнопками копирования и переноса строк.
- Настройки подключения: OpenAI API, локальные серверы, кастомные заголовки, проверка подключения.

### 9.5 Автономное окно чеклиста сбора (`checklist.html`)

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
5. Выбрать каталог: `d:\Code\Vibe\guf-packer-extension\dist`.
6. На панели расширений нажать на иконку **GD Helper** — в правой части браузера откроется боковая панель.

---

## 11. Руководство для AI-агентов и LLM при доработке проекта

Если вы — AI-модель или агент, работающий с данным репозиторием, соблюдайте строгие правила:

1. **Никаких темных тем**: цвет фона только `#f8faf9` или `#f0f4f0`. Карточки строго `bg-white`, рамка `border-gray-200`, скругления только `rounded-xl`. Запрещено использовать классы `bg-slate-800`, `bg-slate-900`, `rounded-2xl`, `rounded-3xl` для обычных карточек.
2. **Переиспользование UI**: любые новые кнопки делать через `<Button>` или `<IconButton>`, модалки только через `<Modal>`, поля ввода через `<Input>` / `<Textarea>`. Не создавать инлайн-стилей вместо токенов GreenData.
3. **Разделение состояния**:
    - Вся логика работы с файлами и пакетами — внутри `useAppState.ts`.
    - Вся логика задач реализации — внутри `useImplementationTasks.ts`.
    - Вся логика AI-чата — внутри `useAiChat.ts`.
    - Компоненты страниц должны быть презентационными и не содержать тяжелых алгоритмов очистки или парсинга.
4. **Типизация**: новые типы данных и интерфейсы **обязательно** вносить в `src/types/index.ts`. Избегать `any`.
5. **Тестирование сборки**: перед завершением любой задачи выполнить сборку `npm run build` и убедиться в отсутствии ошибок компиляции TypeScript.
6. **Локализация**: все тексты пользовательского интерфейса, подсказки и сообщения об ошибках — на русском языке. Идентификаторы, имена файлов и коммиты — на английском.

---

## 12. История изменений (Changelog)

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

