export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ParseDocumentOptions {
  files: (File | Blob | Buffer | string)[];
  templateId: string;
  language?: string;
}

export interface DocumentResult<T = unknown> {
  filename: string;
  result: T;
}

export interface SingleDocumentResponse<T = unknown> {
  result: T;
  pageCount: number;
  pageUsed: number;
  pageRemaining: number;
}

export interface MultiDocumentResponse<T = unknown> {
  results: DocumentResult<T>[];
  pageCount: number;
  pageUsed: number;
  pageRemaining: number;
  source?: 'zip';
}

export type ParseDocumentResponse<T = unknown> = SingleDocumentResponse<T> | MultiDocumentResponse<T>;

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ParseDocumentAsyncOptions {
  file: File | Blob | Buffer | string;
  templateId: string;
  language?: string;
}

export interface AsyncJobResponse {
  jobId: string;
  status: JobStatus;
  message: string;
  createdAt: string;
}

export interface JobDetailResponse<T = unknown> {
  jobId: string;
  status: JobStatus;
  fileName: string;
  templateId: string;
  result: T;
  error: string | null;
  pageCount: number | null;
  attempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface WebhookPayload<T = unknown> {
  eventId: string;
  eventType: 'document.completed' | 'document.failed';
  jobId: string;
  status: JobStatus;
  result?: T;
  error?: string;
  pageCount?: number;
  timestamp: string;
}

export type TemplateCategory = 'INVOICE' | 'RECEIPT' | 'ID_DOCUMENT' | 'CONTRACT' | 'MEDICAL_RECORD' | 'RESUME' | 'CUSTOM';

export interface Template {
  id: string;
  name: string;
  description?: string | null;
  schema: Record<string, unknown>;
  category: TemplateCategory;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFromDocument {
  id: string;
  name: string;
  description?: string | null;
  category: TemplateCategory;
}

export interface TemplateListItem {
  id: string;
  name: string;
}

export interface CreateTemplateOptions {
  name: string;
  description?: string;
  schema: Record<string, unknown>;
  category: TemplateCategory;
}

export interface CreateTemplateFromDocumentOptions {
  file: File | Blob | Buffer | string;
  name: string;
  description?: string;
}

export type UpdateTemplateOptions = CreateTemplateOptions;
