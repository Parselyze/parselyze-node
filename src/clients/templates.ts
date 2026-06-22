import { ParselyzeError } from '../errors';
import { CreateTemplateFromDocumentOptions, CreateTemplateOptions, Template, TemplateFromDocument, TemplateListItem, UpdateTemplateOptions } from '../types';
import { createFileFromPath } from '../utils';

export class TemplatesClient {
  constructor(
    private apiKey: string,
    private baseUrl: string,
    private timeout: number,
  ) {}

  /**
   * List all templates belonging to your account
   *
   * @returns Array of templates with id and name
   *
   * @throws {ParselyzeError} When API errors occur
   *
   * @example
   * ```typescript
   * const templates = await parselyze.templates.list();
   * // [{ id: 'tpl_123', name: 'Invoice' }, ...]
   * ```
   */
  async list(): Promise<TemplateListItem[]> {
    return this.#request<TemplateListItem[]>('/v1/templates', { method: 'GET' });
  }

  /**
   * Create a new template
   *
   * @param options - Template configuration
   * @param options.name - Template name
   * @param options.description - Optional description
   * @param options.schema - Extraction schema (field definitions)
   * @param options.category - Template category
   *
   * @returns The created template
   *
   * @throws {ParselyzeError} When validation fails or API errors occur
   *
   * @example
   * ```typescript
   * const template = await parselyze.templates.create({
   *   name: 'Invoice',
   *   category: 'INVOICE',
   *   schema: { invoice: { number: 'string', total: 'number' } }
   * });
   * ```
   */
  async create(options: CreateTemplateOptions): Promise<Template> {
    if (!options.name) {
      throw new ParselyzeError('Template name is required');
    }
    if (!options.category) {
      throw new ParselyzeError('Template category is required');
    }
    if (!options.schema) {
      throw new ParselyzeError('Template schema is required');
    }

    return this.#request<Template>('/v1/templates', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Create a new template by analyzing a sample document
   *
   * @param options - Configuration for template creation from document
   * @param options.file - The document file to analyze (File, Blob, Buffer, or string path)
   * @param options.name - Name for the generated template
   * @param options.description - Optional description for the template
   *
   * @returns The created template based on document analysis
   *
   * @throws {ParselyzeError} When file is missing, invalid, or API errors occur
   *
   * @example
   * ```typescript
   * const fileBuffer = fs.readFileSync('./sample-invoice.pdf');
   * const template = await parselyze.templates.createFromDocument({ file: fileBuffer, name: 'Invoice Template' });
   * ```
   */
  async createFromDocument(options: CreateTemplateFromDocumentOptions): Promise<TemplateFromDocument> {
    const { file, name, description } = options;
    if (!file) {
      throw new ParselyzeError('File buffer is required');
    }
    if (!name) {
      throw new ParselyzeError('Template name is required');
    }

    const formData = new FormData();
    formData.append('name', name);
    this.#appendFile(formData, 'file', file);
    if (description) {
      formData.append('description', description);
    }

    return this.#request<TemplateFromDocument>('/v1/templates/fromDocument', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Update an existing template
   *
   * @param templateId - The ID of the template to update
   * @param options - Updated template configuration
   *
   * @returns The updated template
   *
   * @throws {ParselyzeError} When template not found, not authorized, or API errors occur
   *
   * @example
   * ```typescript
   * const updated = await parselyze.templates.update('tpl_123', {
   *   name: 'Invoice v2',
   *   category: 'INVOICE',
   *   schema: { invoice: { number: 'string', total: 'number', tax: 'number' } }
   * });
   * ```
   */
  async update(templateId: string, options: UpdateTemplateOptions): Promise<Template> {
    if (!templateId) {
      throw new ParselyzeError('Template ID is required');
    }
    if (!options.name) {
      throw new ParselyzeError('Template name is required');
    }
    if (!options.category) {
      throw new ParselyzeError('Template category is required');
    }
    if (!options.schema) {
      throw new ParselyzeError('Template schema is required');
    }

    return this.#request<Template>(`/v1/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(options),
    });
  }

  /**
   * Delete a template
   *
   * @param templateId - The ID of the template to delete
   *
   * @throws {ParselyzeError} When template not found, not authorized, or API errors occur
   *
   * @example
   * ```typescript
   * await parselyze.templates.delete('tpl_123');
   * ```
   */
  async delete(templateId: string): Promise<void> {
    if (!templateId) {
      throw new ParselyzeError('Template ID is required');
    }

    await this.#request<void>(`/v1/templates/${templateId}`, { method: 'DELETE' }, true);
  }

  async #request<T>(path: string, init: RequestInit, expectEmpty = false): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const isFormData = init.body instanceof FormData;

      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'x-api-key': this.apiKey,
          ...(!isFormData && { 'Content-Type': 'application/json' }),
          ...(init.headers as Record<string, string>),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = (await response.json()) as any;
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {}
        throw new ParselyzeError(errorMessage, response.status);
      }

      if (expectEmpty || response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ParselyzeError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new ParselyzeError(`Request timed out after ${this.timeout}ms`);
      }
      throw new ParselyzeError(`Network error: ${(error as Error).message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  #appendFile(formData: FormData, fieldName: string, file: File | Blob | Buffer | string): void {
    if (file instanceof File) {
      formData.append(fieldName, file, file.name);
    } else if (file instanceof Blob) {
      formData.append(fieldName, file, 'document');
    } else if (Buffer.isBuffer(file)) {
      formData.append(fieldName, file as any, 'document.pdf');
    } else if (typeof file === 'string') {
      try {
        const fileObj = createFileFromPath(file);
        formData.append(fieldName, fileObj, fileObj.name);
      } catch (error: any) {
        throw new ParselyzeError(`Failed to load file from path "${file}": ${error.message}`);
      }
    } else {
      throw new ParselyzeError('Invalid file type. Expected File, Blob, Buffer, or string path');
    }
  }
}
