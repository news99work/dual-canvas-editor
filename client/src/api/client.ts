// ── Dual Canvas Editor — Base API Client ──

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let requestCounter = 0;

export function generateRequestId(): string {
  requestCounter++;
  return `fe-${Date.now()}-${requestCounter}`;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Timeout in ms (default: 15000) */
  timeout?: number;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal, timeout = 15000 } = options;

  const url = `${API_BASE}${path}`;
  const requestId = generateRequestId();

  // Timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': body ? 'application/json' : 'application/json',
        Accept: 'application/json',
        'X-Request-Id': requestId,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    const json = await response.json();

    if (!response.ok) {
      const err = json?.error || { code: 'UNKNOWN', message: `HTTP ${response.status}` };
      throw new ApiError(response.status, err.code, err.message, err.details);
    }

    return json as T;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) throw err;

    // AbortError = timeout or user cancellation
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(408, 'TIMEOUT', 'Request timed out');
    }

    // Network error (fetch failed entirely)
    throw new ApiError(0, 'NETWORK_ERROR', 'Network request failed. Check your connection.');
  }
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { signal?: AbortSignal; timeout?: number; onProgress?: (pct: number) => void } = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const requestId = generateRequestId();
  const { timeout = 30000, signal } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Request-Id': requestId,
        // No Content-Type — browser sets multipart boundary automatically
      },
      body: formData,
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    const json = await response.json();

    if (!response.ok) {
      const err = json?.error || { code: 'UPLOAD_ERROR', message: `HTTP ${response.status}` };
      throw new ApiError(response.status, err.code, err.message, err.details);
    }

    return json as T;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) throw err;

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(408, 'TIMEOUT', 'Upload timed out');
    }

    throw new ApiError(0, 'NETWORK_ERROR', 'Upload failed. Check your connection.');
  }
}

/** Combine two AbortSignals into one */
function combineAbortSignals(s1: AbortSignal, s2: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  s1.addEventListener('abort', onAbort);
  s2.addEventListener('abort', onAbort);
  if (s1.aborted || s2.aborted) controller.abort();
  return controller.signal;
}
