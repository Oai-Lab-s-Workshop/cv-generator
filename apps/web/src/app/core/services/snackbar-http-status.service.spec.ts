import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { SnackbarHttpStatusService } from './snackbar-http-status.service';
import { ToastService } from './toast.service';

describe('SnackbarHttpStatusService', () => {
  let service: SnackbarHttpStatusService;
  let toast: jest.Mocked<Pick<ToastService, 'error'>>;

  beforeEach(() => {
    toast = { error: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        SnackbarHttpStatusService,
        { provide: ToastService, useValue: toast },
      ],
    });

    service = TestBed.inject(SnackbarHttpStatusService);
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  describe('default watched codes', () => {
    it('includes common error statuses', () => {
      const codes = service.getWatchedStatusCodes();
      expect(codes).toContain(401);
      expect(codes).toContain(403);
      expect(codes).toContain(404);
      expect(codes).toContain(500);
    });

    it('does not include informational or redirect codes', () => {
      const codes = service.getWatchedStatusCodes();
      expect(codes).not.toContain(200);
      expect(codes).not.toContain(302);
      expect(codes).not.toContain(418);
    });

    it('returns a defensive copy that cannot mutate service state', () => {
      const codes = service.getWatchedStatusCodes();
      codes.push(200);
      codes.length = 0;
      expect(service.getWatchedStatusCodes()).not.toContain(200);
      expect(service.getWatchedStatusCodes()).toContain(401);
      expect(service.shouldTrigger(200)).toBe(false);
    });
  });

  describe('shouldTrigger', () => {
    it('returns true for watched codes', () => {
      expect(service.shouldTrigger(401)).toBe(true);
      expect(service.shouldTrigger(500)).toBe(true);
    });

    it('returns false for unwatched codes', () => {
      expect(service.shouldTrigger(200)).toBe(false);
      expect(service.shouldTrigger(418)).toBe(false);
    });
  });

  describe('setWatchedStatusCodes', () => {
    it('replaces the entire list', () => {
      service.setWatchedStatusCodes([418, 429]);
      expect(service.getWatchedStatusCodes()).toEqual([418, 429]);
      expect(service.shouldTrigger(401)).toBe(false);
      expect(service.shouldTrigger(418)).toBe(true);
    });
  });

  describe('addWatchedStatusCodes', () => {
    it('adds codes without duplicates', () => {
      service.addWatchedStatusCodes(418, 500);
      const codes = service.getWatchedStatusCodes();
      expect(codes.filter((c) => c === 500).length).toBe(1);
      expect(codes).toContain(418);
    });
  });

  describe('removeWatchedStatusCodes', () => {
    it('removes codes from the list', () => {
      service.removeWatchedStatusCodes(401, 403);
      expect(service.shouldTrigger(401)).toBe(false);
      expect(service.shouldTrigger(403)).toBe(false);
      expect(service.shouldTrigger(404)).toBe(true);
    });
  });

  describe('formatMessage', () => {
    it('uses label with error body message when available', () => {
      const err = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { message: 'User not found' },
      });
      expect(service.formatMessage(err)).toBe('Not Found: User not found');
    });

    it('falls back to statusText when no error body message', () => {
      const err = new HttpErrorResponse({
        status: 500,
        statusText: 'Whoops',
      });
      expect(service.formatMessage(err)).toBe('Internal Server Error: Whoops');
    });

    it('uses the generic "Error <code>" label for unknown status codes', () => {
      const err = new HttpErrorResponse({
        status: 418,
        statusText: "I'm a Teapot",
      });
      expect(service.formatMessage(err)).toBe("Error 418: I'm a Teapot");
    });
  });

  describe('handleError', () => {
    it('shows toast.error for watched status codes', () => {
      const err = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      service.handleError(err);
      expect(toast.error).toHaveBeenCalledWith('Internal Server Error: Server Error');
    });

    it('does nothing for unwatched status codes', () => {
      const err = new HttpErrorResponse({ status: 200 });
      service.handleError(err);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
});
