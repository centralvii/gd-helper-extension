export interface FileRow {
  id: string;
  order: number;
  originalPath: string;
  originalName: string;
  extension: string;
  file: Blob | File;
  detectedDate: string;
  detectedTime: string;
  cleanName: string;
  variables: Record<string, string>;
  newName: string;
  description: string;
  sourceUrl?: string; // URL вкладки/страницы GreenData, с которой скачан файл
  cardId?: string; // ID объекта из URL карточки GreenData (/card/{cardId})
}

export interface VariableDefinition {
  key: string;
  label?: string;
  defaultValue?: string;
}

export interface TemplatePreset {
  id: string;
  name: string;
  template: string;
  startNumber?: number;
  variables?: Record<string, string>;
  isDefault?: boolean;
  isPrimary?: boolean;
  createdAt?: number;
}

export interface ValidationError {
  fileId: string;
  fileName: string;
  type: 'empty' | 'invalid_chars' | 'duplicate' | 'missing_ext';
  message: string;
}

export interface ValidationSummary {
  errors: ValidationError[];
  hasErrors: boolean;
  errorFileIds: Set<string>;
  duplicateFileIds: Set<string>;
}

export interface BuildPackage {
  id: string;
  name: string;
  taskId?: string; // ID связанной задачи реализации (1 задача -> N пакетов)
  downloadCount?: number; // Количество скачиваний архива этого пакета
  files: FileRow[];
  template: string;
  startNumber: number;
  releasePackageUrl?: string; // URL релизного пакета GreenData
  archiveName: string;
  readmeContent: string;
  variableValues: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface StoredPackageMeta {
  id: string;
  name: string;
  taskId?: string;
  downloadCount?: number;
  filesMeta: Array<Omit<FileRow, 'file'>>;
  template: string;
  startNumber: number;
  archiveName: string;
  readmeContent: string;
  variableValues: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface StoredAppState {
  packages?: StoredPackageMeta[];
  activePackageId?: string;
  filesMeta?: Array<Omit<FileRow, 'file'>>;
  template?: string;
  primaryTemplate?: string;
  startNumber?: number;
  archiveName?: string;
  readmeContent?: string;
  variables?: VariableDefinition[];
  variableValues?: Record<string, string>;
  updatedAt?: number;
}

export type ActiveTool = 'packer' | 'implementation' | 'youtrack' | 'extra' | 'ai';

export interface YouTrackIssue {
  id: string; // e.g. "REZ_FIN-8241"
  summary: string; // Название задачи
  description?: string; // Описание задачи
  state?: string; // Статус (e.g. "В работе", "Открыта", "Решена")
  priority?: string; // Приоритет (e.g. "Обычный", "Критический")
  type?: string; // Тип (e.g. "Доработка", "Ошибка", "Задача")
  project?: string; // Проект (e.g. "РЭЦ_Fin")
  assignee?: string; // Исполнитель (e.g. "Кучин Владимир Валерьевич")
  url: string; // Ссылка на задачу
  updatedAt?: number;
  created?: number;
  rawFields?: Record<string, string>;
}

/** Значение кастомного поля задачи из REST API YouTrack */
export interface YouTrackApiCustomField {
  name?: string;
  value?: string | { name?: string; presentation?: string; text?: string } | null;
}

/** Сырая задача из REST API YouTrack или DOM-парсера страницы поиска */
export interface YouTrackApiIssue {
  id?: string;
  idReadable?: string;
  summary?: string;
  description?: string | null;
  resolved?: number | null;
  created?: number;
  updated?: number;
  state?: string; // Заполняется DOM-парсером (в REST API статус приходит в customFields)
  url?: string;
  project?: { name?: string; shortName?: string };
  customFields?: YouTrackApiCustomField[];
}

export interface YouTrackCacheData {
  issues: YouTrackIssue[];
  lastSyncedAt: number;
  targetUrl: string;
}

export interface YouTrackParsedResult {
  success: boolean;
  issues: YouTrackIssue[];
  count: number;
  source: 'api' | 'dom' | 'cache' | 'mock';
  error?: string;
  syncedAt: number;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  isStreaming?: boolean;
  error?: boolean;
  reasoningContent?: string;
}

export type AiAuthType = 'bearer' | 'api-key' | 'x-api-key' | 'none';

export interface AiStarterSuggestion {
  title: string;
  desc: string;
  prompt: string;
  icon?: string;
}

export interface AiAgent {
  id: string;
  name: string;
  shortName: string;
  role: string;
  avatarIcon: 'code' | 'bot' | 'database' | 'package' | 'sparkles';
  badgeColor: 'emerald' | 'indigo' | 'purple' | 'sky' | 'amber';
  description: string;
  systemPrompt: string;
  starterSuggestions: AiStarterSuggestion[];
}

export interface AiSettings {
  baseUrl: string;
  apiKey: string;
  authType?: AiAuthType;
  model: string;
  selectedAgentId?: string;
  systemPrompt: string;
  temperature: number;
  stream: boolean;
  maxTokens?: number;
  customHeadersJson?: string;
}


export interface ImplementationSection {
  id: string;
  name: string;
  order: number;
}

export interface ImplementationChangeItem {
  id: string;
  sectionId?: string; // ID of ImplementationSection, or undefined for unsectioned
  description: string;
  linkTitle?: string;
  linkUrl?: string;
  isCollected?: boolean; // Статус "Собран" для чеклиста сбора объектов
  collectedAt?: number; // Таймстемп момента сбора объекта
  isUpdatePackage?: boolean; // Является ли релизным пакетом обновления GreenData
  lastFileNumber?: number; // Спарсенный номер последнего файла пакета
  lastFileName?: string; // Спарсенное имя последнего файла пакета
}

export interface ImplementationTask {
  id: string;
  taskNumber: string;
  releaseNumber?: string; // Номер релиза (например: 11-2026)
  title: string;
  summary: string;
  packageId?: string; // ID связанного пакета сборки .guf
  sections?: ImplementationSection[];
  items: ImplementationChangeItem[];
  releasePackageUrl?: string; // URL релизного пакета GreenData для автопарсинга номера
  lastFileNumber?: number; // Последний спарсенный номер файла пакета
  lastFileName?: string; // Имя последнего спарсенного файла пакета
  isAutoParseNumberEnabled?: boolean; // Включен ли автопарсинг номера последнего файла
  createdAt: number;
  updatedAt: number;
}

export interface GreenDataParsedPackageNumber {
  success: boolean;
  lastNumber?: number; // Последующий номер для сборки пакета (+1 от максимального в таблице)
  lastNumberPadded?: string;
  nextNumber?: number; // Последующий номер для сборки пакета (+1)
  nextNumberPadded?: string;
  currentLastNumber?: number; // Исходный номер последнего файла, найденный в пакете
  currentLastNumberPadded?: string;
  lastFileName?: string;
  totalGufFiles?: number;
  allFileNames?: string[];
  error?: string;
  sourceUrl?: string;
}

export interface AlgorithmHeaderSettings {
  author: string; // Фамилия и инициалы разработчика (например: Кучин В.В.)
  defaultRelease?: string; // Номер релиза по умолчанию (если не указан в задаче)
  insertNewline: boolean; // Добавлять ли перенос строки после комментария
}

export type ExtraSubTool = 'alg_generator';

export type AlgorithmType =
  | 'general'
  | 'card_action'
  | 'filter_condition'
  | 'validation'
  | 'calculation';

export interface AlgorithmParseResult {
  rawInput: string;
  detectedType: AlgorithmType;
  block?: string;
  blockCode?: string;
  actionVerb?: string;
  actionCode?: string;
  targetObject?: string;
  targetObjectCode?: string;
  filterParams?: string;
  filterParamsCode?: string;
  baseObject?: string;
  baseObjectCode?: string;
  generatedId: string;
  warnings: string[];
  explanation: string;
}

export interface AlgorithmHistoryItem {
  id: string;
  russianName: string;
  generatedId: string;
  type: AlgorithmType;
  createdAt: number;
}

export type AutoCollectNamingMode = 'pageName' | 'original';

export interface AiAlgorithmVariant {
  id: string;
  desc: string;
}

export interface AiAlgorithmIdResult {
  primaryId: string;
  detectedType: AlgorithmType;
  explanation: string;
  variants: AiAlgorithmVariant[];
  source: 'ai' | 'local';
}


/** Сырой JSON-ответ LLM при генерации ID алгоритма (поля не гарантированы) */
export interface AiAlgorithmRawResponse {
  primaryId?: string;
  id?: string;
  detectedType?: string;
  explanation?: string;
  variants?: Array<{ id: string; desc?: string }>;
}

/** Минимальный интерфейс поля MathQuill на странице GreenData */
export interface MathQuillField {
  moveToLeftEnd?: () => void;
  typedText?: (text: string) => void;
  write?: (latex: string) => void;
}

type MathQuillFactory = (el: HTMLElement) => MathQuillField | null;

/** window страницы GreenData с глобальным MathQuill */
export interface MathQuillWindow {
  MathQuill?: MathQuillFactory & { getInterface?: (version: number) => MathQuillFactory };
}
