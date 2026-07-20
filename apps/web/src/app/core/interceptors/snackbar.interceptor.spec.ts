import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { SnackbarHttpStatusService } from '../services/snackbar-http-status.service';
import { ToastService } from '../services/toast.service';
import { snackbarInterceptor } from './snackbar.interceptor';

describe('snackbarInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let snackbarService: SnackbarHttpStatusService;
  let toast: jest.Mocked<Pick<ToastService, 'error'>>;

  beforeEach(() => {
    toast = { error: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([snackbarInterceptor])),
        provideHttpClientTesting(),
        SnackbarHttpStatusService,
        { provide: ToastService, useValue: toast },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    snackbarService = TestBed.inject(SnackbarHttpStatusService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls snackbar handleError for watched status', (done) => {
    jest.spyOn(snackbarService, 'handleError');

    httpClient.get('/test').subscribe({
      error: () => {
        expect(snackbarService.handleError).toHaveBeenCalledWith(
          expect.objectContaining({ status: 500 }),
        );
        expect(toast.error).toHaveBeenCalled();
        done();
      },
    });

    const req = httpMock.expectOne('/test');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('does not show a toast for unwatched status', (done) => {
    jest.spyOn(snackbarService, 'handleError');

    httpClient.get('/test').subscribe({
      error: () => {
        expect(snackbarService.handleError).toHaveBeenCalledWith(
          expect.objectContaining({ status: 418 }),
        );
        // handleError internally checks shouldTrigger, so for 418 it won't call toast.error
        expect(toast.error).not.toHaveBeenCalled();
        done();
      },
    });

    const req = httpMock.expectOne('/test');
    req.flush('Teapot', { status: 418, statusText: "I'm a Teapot" });
  });

  it('passes through successful requests without calling snackbar', (done) => {
    jest.spyOn(snackbarService, 'handleError');

    httpClient.get<{ ok: boolean }>('/test').subscribe({
      next: (body) => {
        expect(body).toEqual({ ok: true });
        expect(snackbarService.handleError).not.toHaveBeenCalled();
        done();
      },
    });

    const req = httpMock.expectOne('/test');
    req.flush({ ok: true });
  });
});
