import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';

import { HomePage } from './home-page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let pocketBaseService: {
    getCurrentUserCvProfiles: jest.Mock;
    getCurrentUserAiTokens: jest.Mock;
    setTemplateForCurrentUserCvProfile: jest.Mock;
    setPublicForCurrentUserCvProfile: jest.Mock;
    deleteCurrentUserCvProfile: jest.Mock;
  };

  beforeEach(async () => {
    pocketBaseService = {
      getCurrentUserCvProfiles: jest.fn().mockResolvedValue([]),
      getCurrentUserAiTokens: jest.fn().mockResolvedValue([]),
      setTemplateForCurrentUserCvProfile: jest.fn().mockResolvedValue(undefined),
      setPublicForCurrentUserCvProfile: jest.fn().mockResolvedValue(undefined),
      deleteCurrentUserCvProfile: jest.fn().mockResolvedValue(undefined),
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

  it('should save template changes immediately', async () => {
    const profile = {
      id: 'profile-1',
      slug: 'frontend',
      profileName: 'Frontend',
      template: 'classic',
      public: true,
      user: 'user-1',
    };

    component.publicSelections.set({ [profile.id]: true });
    pocketBaseService.getCurrentUserCvProfiles.mockResolvedValue([{ ...profile, template: 'modern' }]);

    await component.changeTemplate(profile, 'modern');

    expect(component.templateSelections()[profile.id]).toBe('modern');
    expect(pocketBaseService.setTemplateForCurrentUserCvProfile).toHaveBeenCalledWith(profile.id, 'modern', true);
  });

  it('should delete a profile after confirmation', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const profile = {
      id: 'profile-1',
      slug: 'frontend',
      label: 'Frontend CV',
      profileName: 'Frontend',
      template: 'classic',
      public: true,
      user: 'user-1',
    };

    await component.deleteProfile(profile);

    expect(pocketBaseService.deleteCurrentUserCvProfile).toHaveBeenCalledWith(profile.id);
    expect(pocketBaseService.getCurrentUserCvProfiles).toHaveBeenCalled();
    expect(component.isDeleting()).toBeNull();
  });

  it('should not delete a profile when confirmation is cancelled', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    const profile = {
      id: 'profile-1',
      slug: 'frontend',
      label: 'Frontend CV',
      profileName: 'Frontend',
      template: 'classic',
      public: true,
      user: 'user-1',
    };

    await component.deleteProfile(profile);

    expect(pocketBaseService.deleteCurrentUserCvProfile).not.toHaveBeenCalled();
  });
});
