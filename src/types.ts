export interface ParseDocumentOptions {
  files: (File | Blob | Buffer | string)[];
  templateId: string;
  language?: string;
}

export interface DocumentResult {
  filename: string;
  result: any;
}

export interface SingleDocumentResponse {
  result: any;
  pageCount: number;
  pageUsed: number;
  pageRemaining: number;
}

export interface MultiDocumentResponse {
  results: DocumentResult[];
  pageCount: number;
  pageUsed: number;
  pageRemaining: number;
  source?: 'zip';
}

export type ParseDocumentResponse = SingleDocumentResponse | MultiDocumentResponse;

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
  status: string;
  message: string;
  createdAt: string;
}

export interface JobDetailResponse {
  jobId: string;
  status: string;
  fileName: string;
  templateId: string;
  result: any;
  error: string | null;
  pageCount: number | null;
  attempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface WebhookPayload {
  eventId: string;
  eventType: 'document.completed' | 'document.failed';
  jobId: string;
  status: string;
  result?: any;
  error?: string;
  pageCount?: number;
  timestamp: string;
}
