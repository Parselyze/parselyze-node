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
