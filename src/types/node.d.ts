// Ensure fetch is available globally in Node.js 18+
declare global {
  const fetch: typeof globalThis.fetch;
  const FormData: typeof globalThis.FormData;
  const AbortController: typeof globalThis.AbortController;
}

export { };

