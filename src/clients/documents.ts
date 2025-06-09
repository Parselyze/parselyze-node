import { ParselyzeError } from '../errors';
import { ParseDocumentOptions, ParseDocumentResponse } from '../types';
import { createFileFromPath } from '../utils';

export class DocumentsClient {
  constructor(
    private apiKey: string,
    private baseUrl: string,
    private timeout: number
  ) {}

  /**
   * Parse documents using a template to extract structured data
   * 
   * @param options - Parsing configuration
   * @param options.files - Files to parse (paths, File objects, Blobs, or Buffers)
   * @param options.templateId - Template ID for data extraction
   * @param options.language - OCR language code (optional, language is auto-detected if not provided)
   * 
   * @returns Parsed document data with pageCount, pageUsed, and pageRemaining
   * 
   * @throws {ParselyzeError} When files are missing, template ID is invalid, or API errors occur
   * 
   * @example
   * ```typescript
   * const result = await parselyze.documents.parse({
   *   files: ['./invoice.pdf'],
   *   templateId: 'template-123'
   * });
   * ```
   */
  async parse(options: ParseDocumentOptions): Promise<ParseDocumentResponse> {
    if (!options.files || options.files.length === 0) {
      throw new ParselyzeError('At least one file is required');
    }

    if (!options.templateId) {
      throw new ParselyzeError('Template ID is required');
    }

    const formData = this.#createFormData(options);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseUrl}/documents/parse`, {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey
          },
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          try {
            const errorData = await response.json() as any;
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {}

          throw new ParselyzeError(errorMessage, response.status);
        }

        const result = await response.json() as any;
        
        // Transform totalPageCount to pageCount for consistency if present
        if (result.totalPageCount !== undefined) {
          const { totalPageCount, ...rest } = result;
          return { ...rest, pageCount: totalPageCount } as ParseDocumentResponse;
        }
        
        return result as ParseDocumentResponse;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      if (error instanceof ParselyzeError) {
        throw error;
      }

      if (error?.name === 'AbortError') {
        throw new ParselyzeError(`Request timeout after ${this.timeout}ms`);
      }

      throw new ParselyzeError(
        `Network error: ${error?.message || 'Unknown error'}`,
        undefined,
        'NETWORK_ERROR'
      );
    }
  }

  #createFormData(options: ParseDocumentOptions): FormData {
    const formData = new FormData();
    formData.append('templateId', options.templateId);
    
    if (options.language) {
      formData.append('language', options.language);
    }

    for (const file of options.files) {
      if (file instanceof File) {
        // File object
        formData.append('files', file, file.name);
      } else if (file instanceof Blob) {
        // Blob object
        formData.append('files', file, 'document');
      } else if (Buffer.isBuffer(file)) {
        // Buffer
        formData.append('files', file as any, 'document.pdf');
      } else if (typeof file === 'string') {
        // String path
        try {
          const fileObj = createFileFromPath(file);
          formData.append('files', fileObj, fileObj.name);
        } catch (error: any) {
          throw new ParselyzeError(`Failed to load file from path "${file}": ${error.message}`);
        }
      } else {
        throw new ParselyzeError('Invalid file type. Expected File, Blob, Buffer, or string path');
      }
    }

    return formData;
  }
}
