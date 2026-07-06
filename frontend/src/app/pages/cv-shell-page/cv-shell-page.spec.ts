import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { CvShellPage } from './cv-shell-page';

describe('CvShellPage', () => {
  let component: CvShellPage;
  let fixture: ComponentFixture<CvShellPage>;
  let pocketBaseService: { getCvDataBySlug: jest.Mock; getCvDataByProfileId: jest.Mock };
  let currentUserId = 'user-1';

  beforeEach(async () => {
    currentUserId = 'user-1';
    pocketBaseService = {
      getCvDataBySlug: jest.fn().mockResolvedValue({
        profile: {
          id: 'profile-1',
          slug: 'classic--profile-1',
          profileName: 'Jane Doe',
          template: 'unknown-template',
          public: true,
          user: 'user-1',
        },
        user: { id: 'user-1', firstName: 'Jane', lastName: 'Doe' },
        jobs: [],
        projects: [],
        skills: [],
        degrees: [],
        achievements: [],
        hobbies: [],
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

  it('loads CV data by slug', () => {
    expect(pocketBaseService.getCvDataBySlug).toHaveBeenCalledWith('classic--profile-1');
    expect(component.profile()?.id).toBe('profile-1');
    expect(component.cvData()?.profile.id).toBe('profile-1');
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
    expect(adminBar.textContent).toContain('Imprimer');
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
    trigger.click();
    fixture.detectChanges();

    const updatedButtons = Array.from(fixture.nativeElement.querySelectorAll('.speed-dial-action')) as HTMLElement[];
    const updatedPreviewButton = updatedButtons.find((button) => button.textContent?.includes('Quitter apercu'));
    expect(updatedPreviewButton).toBeTruthy();
  });

  it('calls window.print when clicking print', () => {
    const trigger = fixture.nativeElement.querySelector('.speed-dial-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => undefined);
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.speed-dial-action')) as HTMLButtonElement[];
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

  it('dismisses admin bar', () => {
    component['closeAdminBar']();
    component['dismissAdminBar']();
    expect(component.isAdminBarOpen()).toBe(false);
    expect(component.isAdminBarDismissed()).toBe(true);
    expect(component.statusMessage()).toBeNull();
  });

  it('handles loadProfile error', async () => {
    pocketBaseService.getCvDataBySlug.mockRejectedValue(new Error('Not found'));

    fixture = TestBed.createComponent(CvShellPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slug', 'missing-slug');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.profile()).toBeNull();
    expect(component.cvData()).toBeNull();
  });

  it('passes loaded CV data to known templates without refetching by profile id', async () => {
    pocketBaseService.getCvDataBySlug.mockResolvedValue({
      profile: {
        id: 'profile-1',
        slug: 'minimal--profile-1',
        profileName: 'Jane Doe',
        template: 'minimal',
        public: true,
        user: 'user-1',
      },
      user: { id: 'user-1', firstName: 'Jane', lastName: 'Doe' },
      jobs: [],
      projects: [],
      skills: [],
      degrees: [],
      achievements: [],
      hobbies: [],
    });

    fixture = TestBed.createComponent(CvShellPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slug', 'minimal--profile-1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Jane Doe');
    expect(pocketBaseService.getCvDataByProfileId).not.toHaveBeenCalled();
  });

  it('computes templateLabel for unknown template', () => {
    component.profile.set({ id: 'p', profileName: 'Test', user: 'u1', template: 'nonexistent' } as never);
    fixture.detectChanges();
    expect(component.templateLabel()).toBe('nonexistent');
  });

  it('computes templateComponent for unknown template as null', () => {
    component.profile.set({ id: 'p', profileName: 'Test', user: 'u1', template: 'nonexistent' } as never);
    fixture.detectChanges();
    expect(component.templateComponent()).toBeNull();
  });

  it('computes isOwner when profile is null', () => {
    component.profile.set(null);
    currentUserId = 'user-1';
    fixture.detectChanges();
    expect(component.isOwner()).toBe(false);
  });

  it('toggles preview mode and shows status', () => {
    component['togglePreviewMode']();
    expect(component.isPreviewMode()).toBe(true);
    expect(component.statusMessage()).toContain('Preview mode enabled');

    component['togglePreviewMode']();
    expect(component.isPreviewMode()).toBe(false);
    expect(component.statusMessage()).toContain('Preview mode disabled');
  });
});
