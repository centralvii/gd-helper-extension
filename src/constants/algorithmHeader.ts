import { AlgorithmHeaderSettings } from '../types';

export const ALGORITHM_HEADER_SETTINGS_KEY = 'gd_algorithm_header_settings';

export const DEFAULT_ALGORITHM_HEADER_SETTINGS: AlgorithmHeaderSettings = {
  author: 'Кучин В.В.',
  defaultRelease: '',
  insertNewline: true,
};

/**
 * Clean up a token: trim whitespace and remove trailing dot(s)
 */
function cleanToken(value?: string): string {
  if (!value) return '';
  return value.trim().replace(/\.+$/, '');
}

/**
 * Format today's or provided date in DD.MM.YYYY format
 */
export function formatHeaderDate(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

/**
 * Formats the algorithm comment header according to GreenData conventions:
 * Example: "//07.09.2026. Кучин В.В. FINAPP-5638. 11-2026."
 */
export function formatAlgorithmHeaderComment({
  date = new Date(),
  author,
  taskNumber,
  releaseNumber,
  extraNote,
}: {
  date?: Date;
  author: string;
  taskNumber?: string;
  releaseNumber?: string;
  extraNote?: string;
}): string {
  const dateStr = formatHeaderDate(date);
  const cleanAuthor = cleanToken(author) || 'Кучин В.В.';
  const cleanTask = cleanToken(taskNumber);
  const cleanRelease = cleanToken(releaseNumber);
  const cleanNote = cleanToken(extraNote);

  const parts = [dateStr, cleanAuthor];

  if (cleanTask) {
    parts.push(cleanTask);
  }
  if (cleanRelease) {
    parts.push(cleanRelease);
  }
  if (cleanNote) {
    parts.push(cleanNote);
  }

  // Combine with dot-space and terminate with a dot: "//07.09.2026. Кучин В.В. FINAPP-5638. 11-2026."
  return `//${parts.join('. ')}.`;
}
