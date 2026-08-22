/**
 * GreenData GUF Name Cleaner
 * Parses dates, times, and prefixes from GUF file names
 */

export function getBaseName(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1] || '';
}

export function getExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return '';
  }
  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

export function getNameWithoutExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return fileName;
  }
  return fileName.slice(0, lastDotIndex);
}

export interface ParsedFileName {
  detectedDate: string;
  detectedTime: string;
  cleanName: string;
}

export function parseFileName(fileNameWithOrWithoutExt: string): ParsedFileName {
  let name = getNameWithoutExtension(fileNameWithOrWithoutExt);
  let detectedDate = '';
  let detectedTime = '';

  // 1. Match date: YYYY-MM-DD or YYYY.MM.DD at the beginning
  const dateMatch = name.match(/^(\d{4}[-.]\d{2}[-.]\d{2})/);
  if (dateMatch) {
    detectedDate = dateMatch[1].replace(/\./g, '-');
    name = name.slice(dateMatch[0].length);
  }

  // Strip leading delimiters
  name = name.replace(/^[-_.\s]+/, '');

  // 2. Match time: HH-MM-SS or HH-MM (e.g. 16-16-17 or 16-16)
  const timeMatch = name.match(/^(\d{2}[-.]\d{2}(?:[-.]\d{2})?)/);
  if (timeMatch) {
    detectedTime = timeMatch[1].replace(/\./g, '-');
    name = name.slice(timeMatch[0].length);
  }

  // Strip leading delimiters again
  name = name.replace(/^[-_.\s]+/, '');

  // 3. Remove service prefixes: "ДО.", "ПОСЛЕ.", "ДО", "ПОСЛЕ" (case insensitive)
  name = name.replace(/^(?:ДО|ПОСЛЕ)\.?\s*/i, '');

  // 4. Remove leftover leading hyphens, underscores, dots, and spaces
  name = name.replace(/^[-_.\s]+/, '');

  // 5. Collapse duplicate spaces
  name = name.replace(/\s+/g, ' ');

  // 6. Final trim
  name = name.trim();

  // If cleanName ended up empty, fallback to original name without extension
  if (!name) {
    name = getNameWithoutExtension(fileNameWithOrWithoutExt);
  }

  return {
    detectedDate,
    detectedTime,
    cleanName: name,
  };
}
