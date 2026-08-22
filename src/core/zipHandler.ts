import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FileRow } from '../types';
import { getBaseName, getExtension, parseFileName } from './nameCleaner';
import { applyTemplate } from './templateEngine';

export interface ExtractResult {
  files: FileRow[];
  archiveName: string;
}

/**
 * Extracts .guf files from a ZIP archive
 */
export async function extractZip(zipFile: File | Blob, originalFileName?: string): Promise<ExtractResult> {
  const zip = await JSZip.loadAsync(zipFile);
  const rows: FileRow[] = [];

  // Filter entries: only files (not directories)
  const entries: JSZip.JSZipObject[] = [];
  zip.forEach((_, zipEntry) => {
    if (!zipEntry.dir) {
      entries.push(zipEntry);
    }
  });

  // Sort entries by relative path localeCompare
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  let orderCounter = 1;
  for (const entry of entries) {
    const originalPath = entry.name;
    const originalName = getBaseName(originalPath);
    const ext = getExtension(originalName);

    // Only process .guf files by default
    if (ext !== 'guf') {
      continue;
    }

    const blob = await entry.async('blob');
    const { detectedDate, detectedTime, cleanName } = parseFileName(originalName);

    rows.push({
      id: crypto.randomUUID(),
      order: orderCounter++,
      originalPath,
      originalName,
      extension: ext,
      file: blob,
      detectedDate,
      detectedTime,
      cleanName,
      variables: {},
      newName: '',
      description: '',
    });
  }

  // Derive suggested archive name
  let archiveName = 'renamed_files.zip';
  if (originalFileName) {
    const base = originalFileName.replace(/\.zip$/i, '');
    archiveName = `${base}_renamed.zip`;
  }

  return {
    files: rows,
    archiveName,
  };
}

/**
 * Converts selected File objects (.guf files) into FileRow array
 */
export function gufFilesToRows(files: File[], startIndex: number = 1): FileRow[] {
  // Sort files by name naturally
  const sortedFiles = [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  return sortedFiles.map((file, idx) => {
    const originalName = file.name;
    const ext = getExtension(originalName);
    const { detectedDate, detectedTime, cleanName } = parseFileName(originalName);

    return {
      id: crypto.randomUUID(),
      order: startIndex + idx,
      originalPath: file.name,
      originalName,
      extension: ext,
      file,
      detectedDate,
      detectedTime,
      cleanName,
      variables: {},
      newName: '',
      description: '',
    };
  });
}

/**
 * Generates the README.txt content including file descriptions table
 */
export function buildReadmeContent(files: FileRow[], customReadme: string): string {
  const describedFiles = files.filter((f) => f.description && f.description.trim().length > 0);
  const parts: string[] = [];

  if (describedFiles.length > 0) {
    parts.push('--- Описание файлов ---');
    for (const f of describedFiles) {
      parts.push(`${f.newName || f.originalName}: ${f.description.trim()}`);
    }
    parts.push('');
  }

  if (customReadme && customReadme.trim().length > 0) {
    parts.push(customReadme.trim());
  }

  return parts.join('\r\n');
}

/**
 * Generates and downloads the renamed ZIP archive
 */
export async function generateZip(
  files: FileRow[],
  template: string,
  readmeContent: string,
  archiveName: string,
  globalVariables: Record<string, string> = {}
): Promise<Blob> {
  const zip = new JSZip();

  // Add each file under its newName
  for (const row of files) {
    const finalName = row.newName || applyTemplate(template, row, globalVariables);
    zip.file(finalName, row.file);
  }

  // Build and add README.txt if needed
  const fullReadme = buildReadmeContent(files, readmeContent);
  if (fullReadme.trim().length > 0) {
    zip.file('README.txt', fullReadme);
  }

  // Generate output blob with DEFLATE level 6
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const finalArchiveName = archiveName.trim().endsWith('.zip')
    ? archiveName.trim()
    : `${archiveName.trim() || 'renamed_files'}.zip`;

  // Trigger download in browser
  saveAs(zipBlob, finalArchiveName);

  return zipBlob;
}
