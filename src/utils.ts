import { readFileSync } from 'fs';
import { basename, extname } from 'path';

/**
 * MIME type mappings for common file extensions
 */
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
};

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Get filename from file path
 */
function getFileName(filePath: string): string {
  return basename(filePath) || 'document';
}

/**
 * Read file and get its metadata
 */
function readFileWithMetadata(filePath: string): { buffer: Buffer; filename: string; mimeType: string } {
  try {
    const buffer = readFileSync(filePath);
    const filename = getFileName(filePath);
    const mimeType = getMimeType(filePath);
    
    return { buffer, filename, mimeType };
  } catch (error: any) {
    throw new Error(`Failed to read file from path "${filePath}": ${error.message}`);
  }
}

/**
 * Create a File object from a file path with proper name and MIME type
 * @param filePath - Path to the file
 * @returns File object with appropriate name and MIME type
 */
export function createFileFromPath(filePath: string): File {
  const { buffer, filename, mimeType } = readFileWithMetadata(filePath);
  return new File([buffer], filename, { type: mimeType });
}
