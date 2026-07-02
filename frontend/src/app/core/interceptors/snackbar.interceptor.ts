import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SnackbarHttpStatusService } from '../services/snackbar-http-status.service';

export const snackbarInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbarService = inject(SnackbarHttpStatusService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        snackbarService.handleError(error);
      }
      // Re-throw so downstream handlers still see the error
      return throwError(() => error);
    }),
  );
};
