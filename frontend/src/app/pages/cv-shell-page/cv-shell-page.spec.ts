import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { CvShellPage } from './cv-shell-page';

describe('CvShellPage', () => {
  let component: CvShellPage;
  let fixture: ComponentFixture<CvShellPage>;
  let pocketBaseService: { getCvProfileBySlug: jest.Mock; getCvDataByProfileId: jest.Mock };
  let currentUserId = 'user-1';

  beforeEach(async () => {
    currentUserId = 'user-1';
    pocketBaseService = {
      getCvProfileBySlug: jest.fn().mockResolvedValue({
        id: 'profile-1',
        slug: 'classic--profile-1',
        profileName: 'Jane Doe',
        template: 'unknown-template',
        public: true,
        user: 'user-1',
      }),
      getCvDataByProfileId: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CvShellPage],
      providers: [
        provideRouter([]),
        {
          provide: PocketBaseService,
          useValue: pocketBaseService,
        },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(true),
            getCurrentUserId: () => currentUserId,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CvShellPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slug', 'classic--profile-1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the admin bar for the profile owner', () => {
    const adminBar = fixture.nativeElement.querySelector('.admin-bar');

    expect(adminBar).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.speed-dial-trigger')).not.toBeNull();
  });

  it('opens speed dial actions from the admin trigger', () => {
    const trigger = fixture.nativeElement.querySelector('.speed-dial-trigger') as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();

    const adminBar = fixture.nativeElement.querySelector('.admin-bar');

    expect(adminBar.textContent).toContain('Accueil');
    expect(adminBar.textContent).toContain('Preview');
    expect(adminBar.textContent).toContain('Download PDF');
    expect(adminBar.textContent).toContain('Fermer');
  });

  it('hides the admin bar when the authenticated user does not own the profile', async () => {
    currentUserId = 'another-user';
    fixture = TestBed.createComponent(CvShellPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slug', 'classic--profile-1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.admin-bar')).toBeNull();
  });

  it('toggles preview mode from the admin bar', async () => {
    const trigger = fixture.nativeElement.querySelector('.speed-dial-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.speed-dial-action')) as HTMLElement[];
    const previewButton = buttons.find((button) => button.textContent?.includes('Preview')) as HTMLButtonElement;

    previewButton.click();
    fixture.detectChanges();

    expect(component['isPreviewMode']()).toBe(true);
    expect(previewButton.textContent).toContain('Exit Preview');
  });

  it('calls window.print when clicking print', () => {
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => undefined);
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.secondary-button')) as HTMLButtonElement[];
    const printButton = buttons.find((button) => button.textContent?.includes('Imprimer')) as HTMLButtonElement;

    printButton.click();

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('routes manage action to the current profile editor', () => {
    const trigger = fixture.nativeElement.querySelector('.speed-dial-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const manageLinks = Array.from(
      fixture.nativeElement.querySelectorAll('a.speed-dial-action'),
    ) as HTMLAnchorElement[];
    const manageLink = manageLinks.find((link) => link.textContent?.includes('Gerer')) as HTMLAnchorElement;

    expect(manageLink.getAttribute('href')).toBe('/home/profiles/profile-1/edit');
  });
});
