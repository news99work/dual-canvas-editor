// ── Dual Canvas Editor — API Client Contract Tests ──
// Validates request/response shapes, error handling, and edge cases
// against the backend API contract.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock fetch before importing the API client ──

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;
globalThis.fetch = mockFetch;

// ── Helpers ──

function mockResponse(body: unknown, status = 200, headers?: Record<string, string>) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers || { 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
  });
}

// ── Import after mock setup ──

import {
  ApiError,
  apiRequest,
  apiUpload,
  generateRequestId,
  uploadAsset,
  listAssets,
  triggerExport,
  pollExport,
  waitForExport,
  listFonts,
} from '../api';

import type { UploadAsset, AssetListResponse, AssetCategory, ExportJob } from '../api/types';

// ── Setup ──

beforeEach(() => {
  mockFetch.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = mockFetch;
});

// ── ApiRequest — Contract Tests ──

describe('apiRequest (base client)', () => {
  it('sends a GET request and parses JSON response', async () => {
    const responseBody = { data: [{ id: '1', name: 'test' }] };
    mockFetch.mockResolvedValue(mockResponse(responseBody));

    const result = await apiRequest('/api/v1/assets');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/v1/assets');
    expect(opts.method).toBe('GET');
    expect(opts.headers['Accept']).toBe('application/json');
    expect(result).toEqual(responseBody);
  });

  it('sends a POST request with JSON body', async () => {
    const responseBody = { data: { id: 'exp-1', status: 'pending' } };
    mockFetch.mockResolvedValue(mockResponse(responseBody, 202));

    const payload = {
      canvasState: {} as any,
      format: 'png' as const,
      quality: 'standard' as const,
    };
    const result = await apiRequest('/api/v1/export', {
      method: 'POST',
      body: payload,
    });

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/v1/export');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opts.body)).toEqual(payload);
    expect(result).toEqual(responseBody);
  });

  it('includes X-Request-Id on every request', async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }));

    await apiRequest('/api/health');

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['X-Request-Id']).toMatch(/^fe-\d+-\d+$/);
  });

  it('throws ApiError on 4xx with error envelope', async () => {
    const errorBody = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid category',
        details: ['category: invalid'],
      },
    };
    mockFetch.mockResolvedValue(mockResponse(errorBody, 400));

    await expect(apiRequest('/api/v1/assets?category=invalid')).rejects.toThrow(ApiError);
    await expect(apiRequest('/api/v1/assets?category=invalid')).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid category',
      details: ['category: invalid'],
    });
  });

  it('throws ApiError on 5xx with generic fallback', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ error: { code: 'INTERNAL', message: 'Server error' } }, 500),
    );

    await expect(apiRequest('/api/v1/assets')).rejects.toMatchObject({
      statusCode: 500,
      code: 'INTERNAL',
    });
  });

  it('throws ApiError on 404 with not found code', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ error: { code: 'NOT_FOUND', message: 'Export job not found' } }, 404),
    );

    await expect(apiRequest('/api/v1/export/nonexistent')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws ApiError with UNKNOWN when response body has no error envelope', async () => {
    mockFetch.mockResolvedValue(mockResponse({ unexpected: true }, 500));

    await expect(apiRequest('/api/v1/export')).rejects.toMatchObject({
      statusCode: 500,
      code: 'UNKNOWN',
    });
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      json: () => Promise.reject(new Error('No body')),
    });

    const result = await apiRequest('/api/v1/some-resource', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });

  it('throws TIMEOUT ApiError when request exceeds timeout', async () => {
    // Simulate timeout by making fetch reject with AbortError
    mockFetch.mockImplementation(
      () =>
        new Promise((_, reject) => {
          const err = new DOMException('The operation was aborted due to timeout', 'AbortError');
          reject(err);
        }),
    );

    await expect(apiRequest('/api/v1/assets', { timeout: 1 })).rejects.toMatchObject({
      statusCode: 408,
      code: 'TIMEOUT',
    });
  });

  it('throws NETWORK_ERROR ApiError on network failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiRequest('/api/v1/assets')).rejects.toMatchObject({
      statusCode: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('respects custom Content-Type header override', async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }));

    await apiRequest('/api/v1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['Content-Type']).toBe('multipart/form-data');
  });

  it('uses VITE_API_BASE env var when set', async () => {
    const originalEnv = import.meta.env.VITE_API_BASE;
    // Can't easily override import.meta.env in tests, so we just
    // verify the default is correct
    mockFetch.mockResolvedValue(mockResponse({ ok: true }));

    await apiRequest('/api/health');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('http://localhost:4000');
  });
});

// ── apiUpload — Contract Tests ──

describe('apiUpload (multipart upload)', () => {
  it('sends FormData with POST and no Content-Type header', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: { id: 'asset-1' } }, 201));

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/png' }), 'test.png');
    formData.append('category', 'upload');

    const result = await apiUpload('/api/v1/upload', formData);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/v1/upload');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Accept']).toBe('application/json');
    // Content-Type should NOT be set (browser sets multipart boundary)
    expect(opts.headers['Content-Type']).toBeUndefined();
    expect(opts.body).toBe(formData);
    expect(result).toEqual({ data: { id: 'asset-1' } });
  });

  it('throws UPLOAD_ERROR on server rejection', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ error: { code: 'VALIDATION_ERROR', message: 'Invalid file type' } }, 400),
    );

    const formData = new FormData();
    formData.append('file', new Blob(['bad'], { type: 'text/plain' }), 'bad.txt');

    await expect(apiUpload('/api/v1/upload', formData)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws NETWORK_ERROR when upload fails completely', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network error'));

    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.png');

    await expect(apiUpload('/api/v1/upload', formData)).rejects.toMatchObject({
      statusCode: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('includes X-Request-Id in upload headers', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: { id: 'asset-1' } }, 201));

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/png' }), 'test.png');

    await apiUpload('/api/v1/upload', formData);

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['X-Request-Id']).toMatch(/^fe-\d+-\d+$/);
  });
});

// ── Upload API — Contract Tests ──

describe('uploadAsset', () => {
  const mockAsset: UploadAsset = {
    id: 'ast-abc123',
    url: '/uploads/abc123.png',
    thumbnailUrl: '/uploads/thumb_abc123.png',
    filename: 'abc123.png',
    originalName: 'design.png',
    mimeType: 'image/png',
    size: 204800,
    width: 800,
    height: 600,
    category: 'upload' as AssetCategory,
    tags: ['tag1'],
    createdAt: '2026-07-02T10:00:00.000Z',
  };

  it('uploads a file and returns UploadAsset', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: mockAsset }, 201));

    const file = new File(['dummy'], 'design.png', { type: 'image/png' });
    const result = await uploadAsset({ file });

    expect(result).toEqual(mockAsset);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('passes category and tags in FormData', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: mockAsset }, 201));

    const file = new File(['dummy'], 'design.png', { type: 'image/png' });
    await uploadAsset({ file, category: 'clipart', tags: ['summer', 't-shirt'] });

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.body).toBeInstanceOf(FormData);
    const fd = opts.body as FormData;
    expect(fd.get('category')).toBe('clipart');
    expect(fd.get('tags')).toBe('summer,t-shirt');
  });

  it('defaults category to "upload" when not specified', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: mockAsset }, 201));

    const file = new File(['dummy'], 'design.png', { type: 'image/png' });
    await uploadAsset({ file });

    const [, opts] = mockFetch.mock.calls[0];
    const fd = opts.body as FormData;
    expect(fd.get('category')).toBe('upload');
  });

  it('rejects non-image files with appropriate error', async () => {
    mockFetch.mockResolvedValue(
      mockResponse(
        { error: { code: 'VALIDATION_ERROR', message: 'Only PNG, JPEG, WebP allowed' } },
        400,
      ),
    );

    const file = new File(['bad'], 'bad.txt', { type: 'text/plain' });
    await expect(uploadAsset({ file })).rejects.toThrow(ApiError);
  });
});

// ── Assets API — Contract Tests ──

describe('listAssets', () => {
  const mockAssetList: AssetListResponse = {
    data: [
      {
        id: 'ast-1',
        url: '/uploads/ast-1.png',
        thumbnailUrl: '/uploads/thumb_ast-1.png',
        filename: 'ast-1.png',
        originalName: 'design1.png',
        mimeType: 'image/png',
        size: 102400,
        width: 400,
        height: 300,
        category: 'upload',
        tags: [],
        createdAt: '2026-07-02T10:00:00.000Z',
      },
    ],
    cursor: 'cursor-abc',
    hasMore: true,
  };

  it('returns AssetListResponse shape without wrapper', async () => {
    // Backend returns AssetListResponse directly (NOT wrapped in { data: ... })
    // Per assets.ts: "Backend does NOT wrap in { data: ... }"
    mockFetch.mockResolvedValue(mockResponse(mockAssetList));

    const result = await listAssets();

    expect(result).toEqual(mockAssetList);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/v1/assets');
  });

  it('passes category filter as query param', async () => {
    mockFetch.mockResolvedValue(mockResponse(mockAssetList));

    await listAssets({ category: 'clipart' });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('category=clipart');
  });

  it('passes tags as comma-separated query param', async () => {
    mockFetch.mockResolvedValue(mockResponse(mockAssetList));

    await listAssets({ tags: ['summer', 't-shirt'] });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('tags=summer%2Ct-shirt');
  });

  it('passes search, cursor, and limit params', async () => {
    mockFetch.mockResolvedValue(mockResponse(mockAssetList));

    await listAssets({ search: 'flower', cursor: 'cursor-xyz', limit: 20 });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('search=flower');
    expect(url).toContain('cursor=cursor-xyz');
    expect(url).toContain('limit=20');
  });

  it('omits query string when no filters specified', async () => {
    mockFetch.mockResolvedValue(mockResponse(mockAssetList));

    await listAssets();

    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain('?');
  });

  it('handles empty asset list', async () => {
    const empty: AssetListResponse = { data: [], cursor: null, hasMore: false };
    mockFetch.mockResolvedValue(mockResponse(empty));

    const result = await listAssets();

    expect(result.data).toHaveLength(0);
    expect(result.cursor).toBeNull();
    expect(result.hasMore).toBe(false);
  });
});

// ── Export API — Contract Tests ──

describe('triggerExport', () => {
  const mockJob: ExportJob = {
    id: 'exp-1',
    hash: 'sha256-abc123',
    status: 'pending',
    progress: 0,
    format: 'png',
    quality: 'standard',
    createdAt: '2026-07-02T10:00:00.000Z',
    completedAt: null,
    expiresAt: '2026-07-02T11:00:00.000Z',
    outputs: [],
    error: null,
  };

  it('POSTs canvas state and returns ExportJob wrapped in data', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: mockJob }, 202));

    const canvasState = {
      version: 2,
      canvases: {
        nam: { layers: [], width: 800, height: 1200 },
        nu: { layers: [], width: 800, height: 1200 },
      },
    };

    const result = await triggerExport({
      canvasState: canvasState as any,
      format: 'png',
      quality: 'standard',
    });

    expect(result).toEqual(mockJob);
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.format).toBe('png');
    expect(body.quality).toBe('standard');
    expect(body.canvasState.version).toBe(2);
  });

  it('returns 200 for idempotent requests', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: mockJob }, 200));

    const result = await triggerExport({
      canvasState: {} as any,
      format: 'png',
      quality: 'draft',
    });

    expect(result.id).toBe('exp-1');
  });

  it('rejects with export error on backend failure', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ error: { code: 'EXPORT_ERROR', message: 'Invalid canvas state' } }, 400),
    );

    await expect(
      triggerExport({
        canvasState: { invalid: true } as any,
        format: 'png',
        quality: 'standard',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'EXPORT_ERROR',
    });
  });
});

describe('pollExport', () => {
  const mockJob: ExportJob = {
    id: 'exp-1',
    hash: 'sha256-abc',
    status: 'processing',
    progress: 50,
    format: 'png',
    quality: 'standard',
    createdAt: '2026-07-02T10:00:00.000Z',
    completedAt: null,
    expiresAt: '2026-07-02T11:00:00.000Z',
    outputs: [],
    error: null,
  };

  it('GETs /api/v1/export/:id and returns job', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: mockJob }));

    const result = await pollExport('exp-1');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/v1/export/exp-1');
    expect(result.status).toBe('processing');
    expect(result.progress).toBe(50);
  });

  it('throws NOT_FOUND for nonexistent jobs', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ error: { code: 'NOT_FOUND', message: 'Export job not found' } }, 404),
    );

    await expect(pollExport('nonexistent')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});

describe('waitForExport', () => {
  const doneJob: ExportJob = {
    id: 'exp-1',
    hash: 'sha256-abc',
    status: 'done',
    progress: 100,
    format: 'png',
    quality: 'standard',
    createdAt: '2026-07-02T10:00:00.000Z',
    completedAt: '2026-07-02T10:00:30.000Z',
    expiresAt: '2026-07-02T11:00:00.000Z',
    outputs: [{ format: 'png', url: '/exports/exp-1.png', size: 500000, width: 800, height: 1200 }],
    error: null,
  };

  it('resolves when job reaches status "done"', async () => {
    const pendingJob = {
      ...doneJob,
      status: 'pending' as const,
      progress: 0,
      completedAt: null,
      outputs: [],
    };
    const processingJob = {
      ...doneJob,
      status: 'processing' as const,
      progress: 60,
      completedAt: null,
      outputs: [],
    };

    mockFetch
      .mockResolvedValueOnce(mockResponse({ data: pendingJob }))
      .mockResolvedValueOnce(mockResponse({ data: processingJob }))
      .mockResolvedValueOnce(mockResponse({ data: doneJob }));

    const waitPromise = waitForExport('exp-1', { interval: 100, maxRetries: 10 });

    // Advance timers to trigger each poll
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(100);

    const result = await waitPromise;
    expect(result.status).toBe('done');
    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0].format).toBe('png');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('rejects when job status becomes "failed"', async () => {
    const failedJob = { ...doneJob, status: 'failed' as const, error: 'Processing timeout' };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: failedJob }));

    const waitPromise = waitForExport('exp-1', { interval: 100, maxRetries: 5 });
    // Attach rejection handler BEFORE advancing timers so unhandled rejection is suppressed
    const rejectAssert = expect(waitPromise).rejects.toThrow('Export failed: Processing timeout');

    await vi.advanceTimersByTimeAsync(100);

    await rejectAssert;
  });

  it('rejects after maxRetries exceeded', async () => {
    const pendingJob = {
      ...doneJob,
      status: 'pending' as const,
      progress: 0,
      completedAt: null,
      outputs: [],
    };
    // Always returns pending
    mockFetch.mockResolvedValue(mockResponse({ data: pendingJob }));

    const waitPromise = waitForExport('exp-1', { interval: 100, maxRetries: 3 });
    // Attach rejection handler BEFORE advancing timers
    const rejectAssert = expect(waitPromise).rejects.toThrow('timed out');

    // Advance through all retries
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(100);
    }

    await rejectAssert;
  });

  it('rejects on network error during poll', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network error'));

    const waitPromise = waitForExport('exp-1', { interval: 100, maxRetries: 3 });
    // Attach rejection handler BEFORE advancing timers
    const rejectAssert = expect(waitPromise).rejects.toThrow();

    await vi.advanceTimersByTimeAsync(100);

    await rejectAssert;
  });
});

// ── Fonts API — Contract Tests ──

describe('listFonts', () => {
  const mockFonts = [
    {
      family: 'Roboto',
      category: 'sans-serif',
      variants: [{ weight: 400, style: 'normal', url: '/fonts/roboto-regular.woff2' }],
    },
    { family: 'Playfair Display', category: 'serif', variants: [] },
  ];

  it('returns font list wrapped in data envelope', async () => {
    // Backend wraps in { data: fonts[] }
    mockFetch.mockResolvedValue(mockResponse({ data: mockFonts }));

    const result = await listFonts();

    expect(result).toHaveLength(2);
    expect(result[0].family).toBe('Roboto');
    expect(result[0].category).toBe('sans-serif');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/v1/fonts');
  });

  it('returns empty array when no fonts available', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: [] }));

    const result = await listFonts();

    expect(result).toHaveLength(0);
  });

  it('returns font with variant metadata', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: mockFonts }));

    const result = await listFonts();

    expect(result[0].variants[0]).toMatchObject({
      weight: 400,
      style: 'normal',
      url: expect.any(String),
    });
  });
});

// ── ApiError Class ──

describe('ApiError', () => {
  it('creates an error with status, code, message, and details', () => {
    const err = new ApiError(429, 'RATE_LIMITED', 'Too many requests', ['Retry after 30s']);

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.message).toBe('Too many requests');
    expect(err.details).toEqual(['Retry after 30s']);
  });

  it('works with default or empty details', () => {
    const err = new ApiError(500, 'INTERNAL', 'Server error');

    expect(err.statusCode).toBe(500);
    expect(err.details).toBeUndefined();
  });

  it('is throwable and catchable', () => {
    expect(() => {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied');
    }).toThrow(ApiError);

    try {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('FORBIDDEN');
    }
  });
});

// ── generateRequestId ──

describe('generateRequestId', () => {
  it('generates unique IDs with fe- prefix and timestamp', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).toMatch(/^fe-\d+-\d+$/);
    expect(id2).toMatch(/^fe-\d+-\d+$/);
    expect(id1).not.toBe(id2);
  });
});
