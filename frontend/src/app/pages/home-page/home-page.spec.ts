import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';

import { HomePage } from './home-page';

const mockProfile = {
  id: 'profile-1',
  slug: 'frontend',
  label: 'Frontend CV',
  profileName: 'Frontend',
  template: 'classic' as string | undefined,
  public: true,
  user: 'user-1',
  status: 'unsent' as const,
};

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let pocketBaseService: {
    getCurrentUserCvProfiles: jest.Mock;
    getCurrentUserAiTokens: jest.Mock;
    setTemplateForCurrentUserCvProfile: jest.Mock;
    setPublicForCurrentUserCvProfile: jest.Mock;
    deleteCurrentUserCvProfile: jest.Mock;
    createCurrentUserCvProfile: jest.Mock;
    setStatusForCvProfile: jest.Mock;
  };

  beforeEach(async () => {
    pocketBaseService = {
      getCurrentUserCvProfiles: jest.fn().mockResolvedValue([]),
      getCurrentUserAiTokens: jest.fn().mockResolvedValue([]),
      setTemplateForCurrentUserCvProfile: jest.fn().mockResolvedValue({ ...mockProfile }),
      setPublicForCurrentUserCvProfile: jest.fn().mockResolvedValue({ ...mockProfile }),
      deleteCurrentUserCvProfile: jest.fn().mockResolvedValue(undefined),
      createCurrentUserCvProfile: jest.fn().mockResolvedValue({ ...mockProfile, id: 'new-profile' }),
      setStatusForCvProfile: jest.fn().mockResolvedValue({ ...mockProfile }),
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1', firstName: 'Jane', lastName: 'Doe' }),
            logout: jest.fn(),
          },
        },
        {
          provide: PocketBaseService,
          useValue: pocketBaseService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Template labels ---
  it('returns template label for known template', () => {
    expect(component.getTemplateLabel('classic')).toBe('Classic');
  });

  it('returns fallback for unknown template', () => {
    expect(component.getTemplateLabel('unknown')).toBe('unknown');
  });

  it('returns template required when undefined', () => {
    expect(component.getTemplateLabel()).toBe('Template requis');
    expect(component.getTemplateLabel(undefined)).toBe('Template requis');
  });

  // --- Visibility labels ---
  it('returns visibility label for private profile', () => {
    expect(component.getVisibilityLabel({ ...mockProfile, template: 'classic', public: false })).toBe('Prive');
  });

  it('returns visibility label for public profile', () => {
    expect(component.getVisibilityLabel({ ...mockProfile, template: 'classic', public: true })).toBe('Public');
  });

  it('returns unavailable when no template', () => {
    expect(component.getVisibilityLabel({ ...mockProfile, template: undefined })).toBe('Indisponible');
  });

  it('returns visibility tone for all states', () => {
    expect(component.getVisibilityTone({ ...mockProfile, template: undefined })).toBe('missing');
    expect(component.getVisibilityTone({ ...mockProfile, template: 'classic', public: false })).toBe('private');
    expect(component.getVisibilityTone({ ...mockProfile, template: 'classic', public: true })).toBe('live');
  });

  // --- Status helpers ---
  it('returns status label for known and unknown statuses', () => {
    expect(component.getStatusLabel({ ...mockProfile, status: 'unsent' })).toBeDefined();
    expect(component.getStatusLabel({ ...mockProfile, status: 'sent' })).toBeDefined();
    const unknown = component.getStatusLabel({ ...mockProfile, status: undefined });
    expect(unknown).toBeDefined();
  });

  it('returns status tone for known and unknown statuses', () => {
    expect(component.getStatusTone({ ...mockProfile, status: 'unsent' })).toBeDefined();
    expect(component.getStatusTone({ ...mockProfile, status: undefined })).toBe('gray');
  });

  // --- Template change ---
  it('should save template changes immediately', async () => {
    component.profiles.set([{ ...mockProfile }]);
    pocketBaseService.setTemplateForCurrentUserCvProfile.mockResolvedValue({
      ...mockProfile,
      slug: 'modern--profile-1',
      template: 'modern',
    });

    await component.changeTemplate(mockProfile, 'modern');

    expect(component.templateSelections()[mockProfile.id]).toBe('modern');
    expect(component.profiles().find((profile) => profile.id === mockProfile.id)?.slug).toBe('modern--profile-1');
    expect(pocketBaseService.setTemplateForCurrentUserCvProfile).toHaveBeenCalledWith(mockProfile.id, 'modern', true);
    expect(pocketBaseService.getCurrentUserCvProfiles).toHaveBeenCalledTimes(1);
  });

  it('rejects template change with empty template', async () => {
    await component.changeTemplate(mockProfile, '');
    expect(component.errorMessage()).toBe('Select a template first.');
  });

  it('handles template change error', async () => {
    pocketBaseService.setTemplateForCurrentUserCvProfile.mockRejectedValue(new Error('Save failed'));
    await component.changeTemplate(mockProfile, 'modern');
    expect(component.errorMessage()).toBe('Save failed');
    expect(component.isSaving()).toBeNull();
  });

  // --- Profile creation ---
  it('creates a profile and navigates to editor', async () => {
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.newProfileLabel.set('My CV');
    component.newProfileName.set('Frontend Dev');
    component.newProfileTemplate.set('classic');

    await component.createProfile();

    expect(pocketBaseService.createCurrentUserCvProfile).toHaveBeenCalledWith('My CV', 'Frontend Dev', 'classic');
    expect(router.navigate).toHaveBeenCalledWith(['/home/profiles', 'new-profile', 'edit']);
    expect(component.newProfileLabel()).toBe('');
    expect(component.newProfileName()).toBe('');
  });

  it('validates required profile creation fields', async () => {
    await component.createProfile();
    expect(component.errorMessage()).toBe('Le label est obligatoire.');

    component.newProfileLabel.set('Label');
    await component.createProfile();
    expect(component.errorMessage()).toBe('Le nom du profil est obligatoire.');

    component.newProfileName.set('Name');
    component.newProfileTemplate.set('');
    await component.createProfile();
    expect(component.errorMessage()).toBe('Le template est obligatoire.');
  });

  it('handles profile creation error', async () => {
    pocketBaseService.createCurrentUserCvProfile.mockRejectedValue(new Error('Create failed'));
    component.newProfileLabel.set('CV');
    component.newProfileName.set('Dev');
    component.newProfileTemplate.set('classic');

    await component.createProfile();

    expect(component.errorMessage()).toBe('Create failed');
    expect(component.isCreating()).toBe(false);
  });

  // --- Profile deletion ---
  it('should delete a profile after confirmation', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    await component.deleteProfile(mockProfile);

    expect(pocketBaseService.deleteCurrentUserCvProfile).toHaveBeenCalledWith(mockProfile.id);
    expect(component.isDeleting()).toBeNull();
  });

  it('should not delete a profile when confirmation is cancelled', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    await component.deleteProfile(mockProfile);

    expect(pocketBaseService.deleteCurrentUserCvProfile).not.toHaveBeenCalled();
  });

  it('handles delete profile error', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    pocketBaseService.deleteCurrentUserCvProfile.mockRejectedValue(new Error('Delete failed'));

    await component.deleteProfile(mockProfile);

    expect(component.errorMessage()).toBe('Delete failed');
    expect(component.isDeleting()).toBeNull();
  });

  // --- Toggle public ---
  it('toggles public state successfully', async () => {
    component.profiles.set([{ ...mockProfile }]);
    pocketBaseService.setPublicForCurrentUserCvProfile.mockResolvedValue({ ...mockProfile, public: false });
    component.publicSelections.set({ [mockProfile.id]: true });

    await component.togglePublic(mockProfile);

    expect(pocketBaseService.setPublicForCurrentUserCvProfile).toHaveBeenCalledWith(mockProfile.id, false);
    expect(component.publicSelections()[mockProfile.id]).toBe(false);
    expect(component.profiles().find((profile) => profile.id === mockProfile.id)?.public).toBe(false);
    expect(pocketBaseService.getCurrentUserCvProfiles).toHaveBeenCalledTimes(1);
  });

  it('skips toggle public when no template', async () => {
    await component.togglePublic({ ...mockProfile, template: undefined });
    expect(pocketBaseService.setPublicForCurrentUserCvProfile).not.toHaveBeenCalled();
  });

  it('handles toggle public error', async () => {
    pocketBaseService.setPublicForCurrentUserCvProfile.mockRejectedValue(new Error('Toggle failed'));
    await component.togglePublic(mockProfile);
    expect(component.errorMessage()).toBe('Toggle failed');
    expect(component.isSaving()).toBeNull();
  });

  // --- Change status ---
  it('changes profile status successfully', async () => {
    component.profiles.set([{ ...mockProfile }]);
    pocketBaseService.setStatusForCvProfile.mockResolvedValue({ ...mockProfile, status: 'sent' });

    await component.changeStatus(mockProfile, 'sent');

    expect(pocketBaseService.setStatusForCvProfile).toHaveBeenCalledWith(mockProfile.id, 'sent');
    expect(component.profiles().find((profile) => profile.id === mockProfile.id)?.status).toBe('sent');
    expect(pocketBaseService.getCurrentUserCvProfiles).toHaveBeenCalledTimes(1);
  });

  it('handles change status error', async () => {
    pocketBaseService.setStatusForCvProfile.mockRejectedValue(new Error('Status failed'));
    await component.changeStatus(mockProfile, 'responded');
    expect(component.errorMessage()).toBe('Status failed');
    expect(component.isSaving()).toBeNull();
  });

  // --- Load error paths ---
  it('handles loadProfiles error', async () => {
    pocketBaseService.getCurrentUserCvProfiles.mockRejectedValue(new Error('Load error'));
    await component['loadProfiles']();
    expect(component.errorMessage()).toBe('Load error');
    expect(component.isLoading()).toBe(false);
  });

  it('handles loadAiTokens error gracefully', async () => {
    pocketBaseService.getCurrentUserAiTokens.mockRejectedValue(new Error('Token load error'));
    await component['loadAiTokens']();
    expect(component.aiTokens()).toEqual([]);
    expect(component.isLoadingAiTokens()).toBe(false);
  });

  // --- Computed properties ---
  it('computes profile counts', () => {
    component.profiles.set([
      { ...mockProfile, template: 'classic', public: true },
      { ...mockProfile, id: '2', template: 'modern', public: false },
    ]);
    expect(component.totalProfileCount()).toBe(2);
    expect(component.publicProfileCount()).toBe(1);
    expect(component.privateProfileCount()).toBe(1);
  });

  it('computes active AI token count', () => {
    component.aiTokens.set([
      { id: 't1', status: 'active' } as never,
      { id: 't2', status: 'revoked' } as never,
    ]);
    expect(component.activeAiTokenCount()).toBe(1);
  });

  it('computes currentUserName with null user', () => {
    const auth = TestBed.inject(AuthService) as unknown as { currentUser: ReturnType<typeof signal> };
    const orig = auth.currentUser();
    auth.currentUser.set(null as never);
    expect(component.currentUserName()).toBe('Utilisateur authentifie');
    auth.currentUser.set(orig);
  });
});
