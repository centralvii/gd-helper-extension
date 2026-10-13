/**
 * Русское склонение по числу: pluralizeRu(3, ['файл', 'файла', 'файлов']) → 'файла'.
 */
export function pluralizeRu(count: number, forms: [one: string, few: string, many: string]): string {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

export const FILE_FORMS: [string, string, string] = ['файл', 'файла', 'файлов'];
export const ERROR_FORMS: [string, string, string] = ['ошибка', 'ошибки', 'ошибок'];
export const CHANGE_FORMS: [string, string, string] = ['изменение', 'изменения', 'изменений'];
