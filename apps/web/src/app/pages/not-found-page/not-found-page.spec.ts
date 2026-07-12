import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { NotFoundPage } from './not-found-page';

describe('NotFoundPage', () => {
  let fixture: ComponentFixture<NotFoundPage>;

  it('renders a 404 page with a plain login link', async () => {
    await configure();

    expect(fixture.nativeElement.textContent).toContain('Page introuvable');
    expect(loginLink().getAttribute('href')).toBe('/login');
  });

  it('preserves returnUrl on the login link', async () => {
    await configure('/private-slug');

    expect(loginLink().getAttribute('href')).toBe('/login?returnUrl=%2Fprivate-slug');
  });

  async function configure(returnUrl?: string): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();
  }

  function loginLink(): HTMLAnchorElement {
    return fixture.nativeElement.querySelector('.primary-action') as HTMLAnchorElement;
  }
});
