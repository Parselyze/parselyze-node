export { ParselyzeError } from './errors';
export { Parselyze } from './parselyze';
export type {
    ApiError, DocumentResult, MultiDocumentResponse, ParseDocumentOptions,
    ParseDocumentResponse,
    SingleDocumentResponse
} from './types';

// Default export
import { Parselyze } from './parselyze';
export default Parselyze;
