import { FileRow, ValidationError, ValidationSummary } from '../types';

// Characters forbidden in Windows & standard file systems: \ / : * ? " < > |
const INVALID_CHARS_REGEX = /[\\/:*?"<>|]/;

export function validateFiles(files: FileRow[]): ValidationSummary {
  const errors: ValidationError[] = [];
  const errorFileIds = new Set<string>();
  const duplicateFileIds = new Set<string>();

  // Map to track duplicate names (lowercase newName -> array of FileRow ids)
  const nameOccurrences = new Map<string, string[]>();

  for (const file of files) {
    let hasErrorForThisFile = false;
    const trimmedName = (file.newName || '').trim();

    // 1. Check for empty name
    if (!trimmedName || trimmedName === `.${file.extension}`) {
      errors.push({
        fileId: file.id,
        fileName: file.originalName,
        type: 'empty',
        message: 'Имя файла не может быть пустым',
      });
      hasErrorForThisFile = true;
    }

    // 2. Check for invalid characters in filename
    if (INVALID_CHARS_REGEX.test(file.newName)) {
      errors.push({
        fileId: file.id,
        fileName: file.newName || file.originalName,
        type: 'invalid_chars',
        message: 'Имя содержит недопустимые символы (\\ / : * ? " < > |)',
      });
      hasErrorForThisFile = true;
    }

    // 3. Check for lost extension
    if (file.extension && !file.newName.toLowerCase().endsWith(`.${file.extension.toLowerCase()}`)) {
      errors.push({
        fileId: file.id,
        fileName: file.newName,
        type: 'missing_ext',
        message: `Потеряно исходное расширение (.${file.extension})`,
      });
      hasErrorForThisFile = true;
    }

    // Track for duplicates check
    const normalizedKey = trimmedName.toLowerCase();
    if (normalizedKey) {
      const existing = nameOccurrences.get(normalizedKey) || [];
      existing.push(file.id);
      nameOccurrences.set(normalizedKey, existing);
    }

    if (hasErrorForThisFile) {
      errorFileIds.add(file.id);
    }
  }

  // 4. Check for duplicates (case-insensitive)
  for (const [lowerName, ids] of nameOccurrences.entries()) {
    if (ids.length > 1) {
      for (const id of ids) {
        duplicateFileIds.add(id);
        errorFileIds.add(id);
        const matchingFile = files.find((f) => f.id === id);
        errors.push({
          fileId: id,
          fileName: matchingFile?.newName || lowerName,
          type: 'duplicate',
          message: `Дубликат имени: "${matchingFile?.newName || lowerName}" совпадает с другим файлом`,
        });
      }
    }
  }

  return {
    errors,
    hasErrors: errors.length > 0,
    errorFileIds,
    duplicateFileIds,
  };
}
