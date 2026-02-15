import { ParselyzeError } from '../errors';
import { JobDetailResponse } from '../types';

export class JobsClient {
  constructor(
    private apiKey: string,
    private baseUrl: string,
    private timeout: number,
  ) {}

  /**
   * Get the status and result of an asynchronous job
   *
   * @param jobId - Job ID returned from parseAsync()
   *
   * @returns Job details including status, result, and error information
   *
   * @throws {ParselyzeError} When jobId is missing or job not found
   *
   * @example
   * ```typescript
   * const jobDetails = await parselyze.jobs.get('job_123');
   *
   * if (jobDetails.status === 'completed') {
   *   console.log(jobDetails.result); // Parsed data
   * } else if (jobDetails.status === 'failed') {
   *   console.error(jobDetails.error);
   * } else {
   *   console.log(`Status: ${jobDetails.status}`); // 'pending' or 'processing'
   * }
   * ```
   */
  async get(jobId: string): Promise<JobDetailResponse> {
    if (!jobId) {
      throw new ParselyzeError('Job ID is required');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseUrl}/v1/jobs/${jobId}`, {
          method: 'GET',
          headers: {
            'x-api-key': this.apiKey,
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

        return (await response.json()) as JobDetailResponse;
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

      throw new ParselyzeError(`Network error: ${error?.message || 'Unknown error'}`, undefined, 'NETWORK_ERROR');
    }
  }
}
