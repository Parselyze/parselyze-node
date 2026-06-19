export { ParselyzeError } from './errors';
export { Parselyze } from './parselyze';
export type {
  ApiError,
  AsyncJobResponse,
  CreateTemplateOptions,
  DocumentResult,
  JobDetailResponse,
  JobStatus,
  MultiDocumentResponse,
  ParseDocumentAsyncOptions,
  ParseDocumentOptions,
  ParseDocumentResponse,
  SingleDocumentResponse,
  Template,
  TemplateCategory,
  TemplateListItem,
  UpdateTemplateOptions,
  WebhookPayload,
} from './types';

// Default export
import { Parselyze } from './parselyze';
export default Parselyze;
