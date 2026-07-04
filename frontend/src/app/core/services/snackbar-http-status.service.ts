import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';

/**
 * Default HTTP status codes that trigger a global snackbar when intercepted.
 * Extend or replace this list at runtime via the service methods.
 */
const DEFAULT_WATCHED_STATUS_CODES: number[] = [401, 403, 404, 409, 422, 429, 500, 502, 503];

/**
 * Maps an HTTP status code to a human-readable label used in snackbar messages.
 */
function statusLabel(code: number): string {
  const labels: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return labels[code] ?? `Error ${code}`;
}

@Injectable({ providedIn: 'root' })
export class SnackbarHttpStatusService {
  private readonly watchedStatusCodes = signal<number[]>(DEFAULT_WATCHED_STATUS_CODES);

  constructor(private readonly toast: ToastService) {}

  /** Returns a copy of the current list of watched status codes. */
  getWatchedStatusCodes(): number[] {
    return [...this.watchedStatusCodes()];
  }

  /** Replaces the entire watched status code list. */
  setWatchedStatusCodes(codes: number[]): void {
    this.watchedStatusCodes.set([...codes]);
  }

  /** Adds one or more status codes to the watch list (no duplicates). */
  addWatchedStatusCodes(...codes: number[]): void {
    this.watchedStatusCodes.update((current) => {
      const set = new Set(current);
      codes.forEach((c) => set.add(c));
      return [...set];
    });
  }

  /** Removes one or more status codes from the watch list. */
  removeWatchedStatusCodes(...codes: number[]): void {
    this.watchedStatusCodes.update((current) =>
      current.filter((c) => !codes.includes(c)),
    );
  }

  /** Returns true if the given status code should trigger a snackbar. */
  shouldTrigger(code: number): boolean {
    return this.watchedStatusCodes().includes(code);
  }

  /** Formats a user-facing message from an HttpErrorResponse. */
  formatMessage(error: HttpErrorResponse): string {
    const label = statusLabel(error.status);
    const detail = error.error?.message ?? error.statusText ?? '';
    return detail ? `${label}: ${detail}` : label;
  }

  /** Displays a snackbar for the given error if its status is watched. */
  handleError(error: HttpErrorResponse): void {
    if (this.shouldTrigger(error.status)) {
      this.toast.error(this.formatMessage(error));
    }
  }
}
