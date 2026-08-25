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
  files: FileRow[];
  template: string;
  startNumber: number;
  archiveName: string;
  readmeContent: string;
  variableValues: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface StoredPackageMeta {
  id: string;
  name: string;
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

export type ActiveTool = 'packer' | 'implementation' | 'extra' | 'ai';

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

export interface AiSettings {
  baseUrl: string;
  apiKey: string;
  authType?: AiAuthType;
  model: string;
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
}

export interface ImplementationTask {
  id: string;
  taskNumber: string;
  title: string;
  summary: string;
  sections?: ImplementationSection[];
  items: ImplementationChangeItem[];
  createdAt: number;
  updatedAt: number;
}

export type ExtraSubTool = 'alg_generator' | 'site_css';

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

export interface SiteCssRule {
  id: string;
  name: string;
  urlPattern: string;
  css: string;
  isEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

