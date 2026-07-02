// ── Dual Canvas Editor — Error Handling UI Components ──
// Reusable loading, empty, and error state components for API-driven views.

import { ApiError } from './client';

// ── Error Display ──

export interface ErrorDisplayProps {
  error: ApiError | Error | null;
  onRetry?: () => void;
  title?: string;
}

/**
 * Renders a structured error message from an ApiError or generic Error.
 * If onRetry is provided, shows a retry button.
 * Returns null when error is null.
 */
export function ErrorDisplay({ error, onRetry, title }: ErrorDisplayProps): JSX.Element | null {
  if (!error) return null;

  const isApiError = error instanceof ApiError;
  const displayTitle = title || (isApiError ? error.code : 'Error');
  const displayMessage = error.message || 'An unexpected error occurred.';

  return (
    <div className="error-display" role="alert">
      <div className="error-display__icon">⚠️</div>
      <div className="error-display__content">
        <h3 className="error-display__title">{displayTitle}</h3>
        <p className="error-display__message">{displayMessage}</p>
        {isApiError && error.details && error.details.length > 0 && (
          <ul className="error-display__details">
            {error.details.map((detail, i) => (
              <li key={i}>{String(detail)}</li>
            ))}
          </ul>
        )}
      </div>
      {onRetry && (
        <button className="error-display__retry" onClick={onRetry} type="button">
          Retry
        </button>
      )}
    </div>
  );
}

// ── Loading Spinner ──

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  label?: string;
}

/**
 * Simple loading spinner with optional text label.
 */
export function LoadingSpinner({ size = 'medium', label }: LoadingSpinnerProps): JSX.Element {
  return (
    <div className={`loading-spinner loading-spinner--${size}`} role="status">
      <div className="loading-spinner__circle" />
      {label && <p className="loading-spinner__label">{label}</p>}
    </div>
  );
}

// ── Empty State ──

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state placeholder — shown when a list or view has no data.
 */
export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: EmptyStateProps): JSX.Element {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && (
        <button className="empty-state__action" onClick={action.onClick} type="button">
          {action.label}
        </button>
      )}
    </div>
  );
}

// ── Upload Progress ──

export interface UploadProgressProps {
  /** 0–100 */
  percent: number;
  fileName: string;
  status?: 'uploading' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  onCancel?: () => void;
}

/**
 * Upload progress bar with status feedback.
 */
export function UploadProgress({
  percent,
  fileName,
  status = 'uploading',
  errorMessage,
  onCancel,
}: UploadProgressProps): JSX.Element {
  const isComplete = status === 'done';
  const hasError = status === 'error';

  return (
    <div
      className={`upload-progress ${hasError ? 'upload-progress--error' : ''} ${isComplete ? 'upload-progress--done' : ''}`}
    >
      <div className="upload-progress__header">
        <span className="upload-progress__file-name">{fileName}</span>
        <span className="upload-progress__status">
          {status === 'uploading' && `${Math.round(percent)}%`}
          {status === 'processing' && 'Processing...'}
          {status === 'done' && '✅ Complete'}
          {status === 'error' && '❌ Failed'}
        </span>
      </div>
      {!isComplete && !hasError && (
        <div className="upload-progress__bar-track">
          <div
            className="upload-progress__bar-fill"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
      {hasError && errorMessage && <p className="upload-progress__error">{errorMessage}</p>}
      {status === 'uploading' && onCancel && (
        <button className="upload-progress__cancel" onClick={onCancel} type="button">
          Cancel
        </button>
      )}
    </div>
  );
}

// ── Export Polling Progress ──

export interface ExportProgressProps {
  job: {
    status: string;
    progress: number;
    error?: string | null;
  } | null;
}

/**
 * Shows export job progress with status mapping.
 */
export function ExportProgress({ job }: ExportProgressProps): JSX.Element {
  if (!job) {
    return <div className="export-progress export-progress--idle">No active export</div>;
  }

  const statusLabels: Record<string, string> = {
    pending: 'Queued',
    processing: 'Exporting...',
    done: '✅ Export complete',
    failed: '❌ Export failed',
  };

  const label = statusLabels[job.status] || job.status;

  return (
    <div className={`export-progress export-progress--${job.status}`}>
      <div className="export-progress__label">{label}</div>
      {(job.status === 'pending' || job.status === 'processing') && (
        <div className="export-progress__bar-track">
          <div
            className="export-progress__bar-fill"
            style={{ width: `${Math.min(job.progress, 100)}%` }}
          />
        </div>
      )}
      {job.status === 'failed' && job.error && (
        <p className="export-progress__error">{job.error}</p>
      )}
    </div>
  );
}
