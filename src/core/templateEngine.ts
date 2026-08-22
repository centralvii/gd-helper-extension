import { FileRow } from '../types';

export const DEFAULT_TEMPLATE = '{indexPad6}_{cleanName}';

/**
 * Applies template to a single FileRow
 */
export function applyTemplate(
  template: string,
  row: FileRow,
  globalVariables: Record<string, string> = {}
): string {
  let result = template;

  const indexStr = String(row.order);
  const indexPad6Str = String(row.order).padStart(6, '0');

  // Built-in tags
  const builtInTags: Record<string, string> = {
    '{index}': indexStr,
    '{indexPad6}': indexPad6Str,
    '{originalName}': row.originalName,
    '{extension}': row.extension,
    '{date}': row.detectedDate || '',
    '{time}': row.detectedTime || '',
    '{cleanName}': row.cleanName || '',
  };

  // Replace built-in tags
  for (const [tag, value] of Object.entries(builtInTags)) {
    result = result.replaceAll(tag, value);
  }

  // Merge custom variables: globalVariables override or fallback to row.variables
  const mergedVariables: Record<string, string> = {
    ...(row.variables || {}),
    ...globalVariables,
  };

  // Replace custom variables {varName}
  for (const [key, value] of Object.entries(mergedVariables)) {
    if (value !== undefined && value !== null) {
      result = result.replaceAll(`{${key}}`, String(value));
    }
  }

  // Also replace any remaining unresolved {custom} if row has it
  if (row.variables) {
    for (const [key, value] of Object.entries(row.variables)) {
      if (value !== undefined && value !== null) {
        result = result.replaceAll(`{${key}}`, String(value));
      }
    }
  }

  // Sanitize trailing/leading separators or spaces from name before extension
  result = result.trim();

  // Append extension automatically
  if (row.extension) {
    return `${result}.${row.extension}`;
  }

  return result;
}

/**
 * Recalculates orders and new names for an array of files
 */
export function recalculateAllNames(
  files: FileRow[],
  template: string,
  startNumber: number = 1,
  globalVariables: Record<string, string> = {}
): FileRow[] {
  return files.map((file, index) => {
    const order = startNumber + index;
    const updatedRow: FileRow = {
      ...file,
      order,
    };
    const newName = applyTemplate(template, updatedRow, globalVariables);
    return {
      ...updatedRow,
      newName,
    };
  });
}
