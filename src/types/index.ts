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

export interface StoredAppState {
  filesMeta: Array<Omit<FileRow, 'file'>>;
  template: string;
  primaryTemplate?: string;
  startNumber: number;
  archiveName: string;
  readmeContent: string;
  variables: VariableDefinition[];
  variableValues: Record<string, string>;
  updatedAt: number;
}
