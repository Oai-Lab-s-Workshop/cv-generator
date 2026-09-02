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

function mockWideScreen(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({ matches }),
  });
}

describe('HomePage', () => {
  const fixedNow = new Date('2026-06-03T15:00:00.000Z');
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
    await fixture.whenStable();
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

  // --- Row navigation ---
  it('opens the editor from row click on wide screens', () => {
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    mockWideScreen(true);

    component.openProfileFromRow(mockProfile);

    expect(router.navigate).toHaveBeenCalledWith(['/home/profiles', mockProfile.id, 'edit']);
  });

  it('does not open the editor from row click on narrow screens', () => {
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    mockWideScreen(false);

    component.openProfileFromRow(mockProfile);

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not open the editor when row click starts from an interactive control', () => {
    const router = TestBed.inject(Router);
    const button = document.createElement('button');
    const event = new MouseEvent('click');
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    mockWideScreen(true);
    Object.defineProperty(event, 'target', { value: button });

    component.openProfileFromRow(mockProfile, event);

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('reports whether the profile table is in wide mode', () => {
    mockWideScreen(true);
    expect(component.isWideTableMode()).toBe(true);

    mockWideScreen(false);
    expect(component.isWideTableMode()).toBe(false);
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

  it('selects a profile status from the compact menu', async () => {
    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.openStatusMenuFor.set(mockProfile.id);
    pocketBaseService.setStatusForCvProfile.mockResolvedValue({ ...mockProfile, status: 'responded' });

    await component.selectStatus(mockProfile, 'responded', event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.openStatusMenuFor()).toBeNull();
    expect(pocketBaseService.setStatusForCvProfile).toHaveBeenCalledWith(mockProfile.id, 'responded');
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

  // --- T8: Sortable table ---
  describe('T8 — Sortable table columns', () => {
    const profileA = { ...mockProfile, id: 'a', label: 'Alpha', template: 'classic', status: 'unsent' as const, updated_at: '2026-01-01 00:00:00.000Z' };
    const profileB = { ...mockProfile, id: 'b', label: 'Beta', template: 'modern', status: 'sent' as const, updated_at: '2026-02-01 00:00:00.000Z' };
    const profileC = { ...mockProfile, id: 'c', label: 'Gamma', template: 'classic', status: 'responded' as const, updated_at: '2026-03-01 00:00:00.000Z' };

    beforeEach(() => {
      component.profiles.set([profileA, profileB, profileC]);
    });

    it('defaults to sort by updated_at descending', () => {
      expect(component.sortColumn()).toBe('updated_at');
      expect(component.sortDirection()).toBe('desc');
      const ids = component.sortedProfiles().map((p) => p.id);
      expect(ids).toEqual(['c', 'b', 'a']);
    });

    it('toggles sort direction when clicking the same column', () => {
      component.toggleSort('label');
      expect(component.sortColumn()).toBe('label');
      expect(component.sortDirection()).toBe('asc');

      component.toggleSort('label');
      expect(component.sortDirection()).toBe('desc');
    });

    it('switches column and resets to asc when clicking a new column', () => {
      component.toggleSort('label');
      component.toggleSort('status');
      expect(component.sortColumn()).toBe('status');
      expect(component.sortDirection()).toBe('asc');
    });

    it('sets desc by default when switching to updated_at', () => {
      component.toggleSort('label');
      component.toggleSort('updated_at');
      expect(component.sortColumn()).toBe('updated_at');
      expect(component.sortDirection()).toBe('desc');
    });

    it('sorts by label ascending', () => {
      component.sortColumn.set('label');
      component.sortDirection.set('asc');
      const ids = component.sortedProfiles().map((p) => p.id);
      expect(ids).toEqual(['a', 'b', 'c']);
    });

    it('sorts by label descending', () => {
      component.sortColumn.set('label');
      component.sortDirection.set('desc');
      const ids = component.sortedProfiles().map((p) => p.id);
      expect(ids).toEqual(['c', 'b', 'a']);
    });

    it('sorts by template ascending', () => {
      component.sortColumn.set('template');
      component.sortDirection.set('asc');
      const ids = component.sortedProfiles().map((p) => p.id);
      // classic comes before modern alphabetically
      expect(ids[0]).toBe('a'); // classic
      expect(ids[1]).toBe('c'); // classic
      expect(ids[2]).toBe('b'); // modern
    });

    it('sorts by status using defined order', () => {
      component.sortColumn.set('status');
      component.sortDirection.set('asc');
      const ids = component.sortedProfiles().map((p) => p.id);
      // unsent (0) < sent (1) < responded (3)
      expect(ids[0]).toBe('a'); // unsent
      expect(ids[1]).toBe('b'); // sent
      expect(ids[2]).toBe('c'); // responded
    });

    it('sorts by status descending', () => {
      component.sortColumn.set('status');
      component.sortDirection.set('desc');
      const ids = component.sortedProfiles().map((p) => p.id);
      expect(ids[0]).toBe('c'); // responded
      expect(ids[1]).toBe('b'); // sent
      expect(ids[2]).toBe('a'); // unsent
    });

    it('handles profiles without updated_at by treating them as epoch 0', () => {
      const noDate = { ...mockProfile, id: 'nodate', label: 'NoDate', updated_at: undefined };
      component.profiles.set([profileC, noDate]);
      component.sortColumn.set('updated_at');
      component.sortDirection.set('desc');
      const ids = component.sortedProfiles().map((p) => p.id);
      expect(ids[0]).toBe('c'); // has date
      expect(ids[1]).toBe('nodate'); // no date, treated as 0
    });

    it('returns correct aria-sort values', () => {
      component.sortColumn.set('label');
      component.sortDirection.set('asc');
      expect(component.getSortAriaSort('label')).toBe('ascending');
      expect(component.getSortAriaSort('template')).toBe('none');
    });

    it('sortedProfiles returns a new array (does not mutate original)', () => {
      const original = component.profiles();
      const sorted = component.sortedProfiles();
      expect(sorted).not.toBe(original);
      expect(original.map((p) => p.id)).toEqual(['a', 'b', 'c']); // unchanged
    });
  });

  // --- T10: formatDate (updated_at abbreviated format) ---
  describe('formatDate', () => {
    const withFixedNow = (date: Date, assertion: () => void): void => {
      jest.useFakeTimers();
      jest.setSystemTime(date);

      try {
        assertion();
      } finally {
        jest.useRealTimers();
      }
    };

    // Helper to create an ISO date string for a specific year/month/day
    const isoFor = (year: number, month: number, day: number): string =>
      new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();

    it('returns "-" for undefined value', () => {
      withFixedNow(fixedNow, () => {
        expect(component.formatDate(undefined)).toBe('-');
      });
    });

    it('returns "-" for invalid date string', () => {
      withFixedNow(fixedNow, () => {
        expect(component.formatDate('not-a-date')).toBe('-');
      });
    });

    it('returns relative format for recent dates (≤ 1 month), then DD/MM', () => {
      withFixedNow(fixedNow, () => {
        // Same day → Auj.
        expect(component.formatDate(isoFor(2026, 6, 3))).toBe('Auj.');
        // 1 day ago
        expect(component.formatDate(isoFor(2026, 6, 2))).toBe('1j');
        // 3 days ago
        expect(component.formatDate(isoFor(2026, 5, 31))).toBe('3j');
        // 6 days ago
        expect(component.formatDate(isoFor(2026, 5, 28))).toBe('6j');
        // 1 week ago
        expect(component.formatDate(isoFor(2026, 5, 27))).toBe('1sem');
        // 2 weeks ago
        expect(component.formatDate(isoFor(2026, 5, 20))).toBe('2sem');
        // 4 weeks ago
        expect(component.formatDate(isoFor(2026, 5, 6))).toBe('4sem');
        // Older than 1 month → DD/MM
        expect(component.formatDate(isoFor(2026, 1, 15))).toBe('15/01');
        expect(component.formatDate(isoFor(2026, 12, 31))).toBe('31/12');
      });
    });

    it('returns DD mmm. for a date from the previous year', () => {
      withFixedNow(fixedNow, () => {
        expect(component.formatDate(isoFor(2025, 1, 5))).toBe('05 janv.');
        expect(component.formatDate(isoFor(2025, 4, 25))).toBe('25 avr.');
        expect(component.formatDate(isoFor(2025, 12, 31))).toBe('31 déc.');
      });
    });

    it('returns DD mmm. with correct month abbreviations', () => {
      withFixedNow(fixedNow, () => {
        const expected = [
          '15 janv.', '15 févr.', '15 mars', '15 avr.',
          '15 mai', '15 juin', '15 juil.', '15 août',
          '15 sept.', '15 oct.', '15 nov.', '15 déc.',
        ];
        for (let m = 0; m < 12; m++) {
          expect(component.formatDate(isoFor(2025, m + 1, 15))).toBe(expected[m]);
        }
      });
    });

    it('returns YYYY for a date 2+ years old', () => {
      withFixedNow(fixedNow, () => {
        expect(component.formatDate(isoFor(2024, 3, 10))).toBe('2024');
        expect(component.formatDate(isoFor(2023, 7, 1))).toBe('2023');
        expect(component.formatDate(isoFor(2020, 1, 1))).toBe('2020');
      });
    });

    it('handles ISO date format without T (PocketBase format)', () => {
      withFixedNow(fixedNow, () => {
        expect(component.formatDate('2026-02-20 10:30:00.000Z')).toBe('20/02');
        expect(component.formatDate('2025-11-05 10:30:00.000Z')).toBe('05 nov.');
        expect(component.formatDate('2024-08-15 10:30:00.000Z')).toBe('2024');
      });
    });

    it('handles null-like empty string', () => {
      withFixedNow(fixedNow, () => {
        expect(component.formatDate('')).toBe('-');
      });
    });
  });

  // --- T9: KPI status breakdown ---
  describe('T9 — Status breakdown KPI', () => {
    beforeEach(() => {
      component.profiles.set([
        { ...mockProfile, id: '1', status: 'unsent' },
        { ...mockProfile, id: '2', status: 'unsent' },
        { ...mockProfile, id: '3', status: 'sent' },
        { ...mockProfile, id: '4', status: 'rejected' },
        { ...mockProfile, id: '5', status: 'responded' },
        { ...mockProfile, id: '6', status: 'responded' },
        { ...mockProfile, id: '7', status: 'responded' },
        { ...mockProfile, id: '8', status: undefined }, // defaults to unsent
      ]);
    });

    it('computes status counts correctly', () => {
      expect(component.unsentProfileCount()).toBe(3); // 2 explicit + 1 undefined
      expect(component.sentProfileCount()).toBe(1);
      expect(component.rejectedProfileCount()).toBe(1);
      expect(component.respondedProfileCount()).toBe(3);
      expect(component.totalProfileCount()).toBe(8);
    });

    it('computes status percentages', () => {
      expect(component.unsentPercentage()).toBe(38); // 3/8 = 37.5 -> 38
      expect(component.sentPercentage()).toBe(13);   // 1/8 = 12.5 -> 13
      expect(component.rejectedPercentage()).toBe(13); // 1/8 = 12.5 -> 13
      expect(component.respondedPercentage()).toBe(38); // 3/8 = 37.5 -> 38
    });

    it('returns 0% when there are no profiles', () => {
      component.profiles.set([]);
      expect(component.unsentPercentage()).toBe(0);
      expect(component.sentPercentage()).toBe(0);
      expect(component.rejectedPercentage()).toBe(0);
      expect(component.respondedPercentage()).toBe(0);
    });

    it('returns 100% when all profiles have the same status', () => {
      component.profiles.set([
        { ...mockProfile, id: '1', status: 'sent' },
        { ...mockProfile, id: '2', status: 'sent' },
      ]);
      expect(component.sentPercentage()).toBe(100);
      expect(component.sentProfileCount()).toBe(2);
    });

    it('computes public and private percentages', () => {
      component.profiles.set([
        { ...mockProfile, id: '1', template: 'classic', public: true },
        { ...mockProfile, id: '2', template: 'modern', public: false },
        { ...mockProfile, id: '3', template: 'classic', public: true },
        { ...mockProfile, id: '4', template: undefined, public: false },
      ]);
      expect(component.publicProfileCount()).toBe(2);
      expect(component.privateProfileCount()).toBe(1);
      expect(component.publicPercentage()).toBe(50);  // 2/4 = 50
      expect(component.privatePercentage()).toBe(25); // 1/4 = 25
    });
  });

  describe('RESUMATE-32 — Status tile filtering', () => {
    const profiles = [
      { ...mockProfile, id: '1', status: 'unsent' as const, updated_at: '2026-01-01 00:00:00' },
      { ...mockProfile, id: '2', status: 'sent' as const, updated_at: '2026-01-02 00:00:00' },
      { ...mockProfile, id: '3', status: 'rejected' as const, updated_at: '2026-01-03 00:00:00' },
      { ...mockProfile, id: '4', status: 'responded' as const, updated_at: '2026-01-04 00:00:00' },
      { ...mockProfile, id: '5', status: undefined, updated_at: '2026-01-05 00:00:00' },
      { ...mockProfile, id: '6', status: 'unanswered' as const, updated_at: '2026-01-06 00:00:00' },
    ];

    beforeEach(() => {
      component.profiles.set(profiles);
    });

    it('starts with no active filter and shows all profiles', () => {
      expect(component.isFilterActive()).toBe(false);
      expect(component.filteredSortedProfiles().length).toBe(6);
    });

    it('filters unsent profiles and treats undefined status as unsent', () => {
      component.setActiveFilter('unsent');

      expect(component.isFilterActive()).toBe(true);
      expect(component.isFilterSelected('unsent')).toBe(true);
      expect(component.filteredSortedProfiles().map((profile) => profile.id).sort()).toEqual(['1', '5']);
    });

    it('filters each explicit status', () => {
      component.setActiveFilter('sent');
      expect(component.filteredSortedProfiles().map((profile) => profile.id)).toEqual(['2']);

      component.setActiveFilter('rejected');
      expect(component.filteredSortedProfiles().map((profile) => profile.id)).toEqual(['3']);

      component.setActiveFilter('responded');
      expect(component.filteredSortedProfiles().map((profile) => profile.id)).toEqual(['4']);

      component.setActiveFilter('unanswered');
      expect(component.filteredSortedProfiles().map((profile) => profile.id)).toEqual(['6']);
    });

    it('selecting the same filter twice clears it', () => {
      component.setActiveFilter('sent');
      component.setActiveFilter('sent');

      expect(component.isFilterActive()).toBe(false);
      expect(component.filteredSortedProfiles().length).toBe(6);
    });

    it('clearFilter restores all profiles', () => {
      component.setActiveFilter('sent');
      component.clearFilter();

      expect(component.isFilterActive()).toBe(false);
      expect(component.filteredSortedProfiles().length).toBe(6);
    });

    it('keeps status counts based on the full profile set while filtered', () => {
      component.setActiveFilter('sent');

      expect(component.filteredSortedProfiles().length).toBe(1);
      expect(component.unsentProfileCount()).toBe(2);
      expect(component.sentProfileCount()).toBe(1);
      expect(component.rejectedProfileCount()).toBe(1);
      expect(component.respondedProfileCount()).toBe(1);
      expect(component.unansweredProfileCount()).toBe(1);
    });

    it('exposes the active filter label', () => {
      expect(component.activeFilterLabel()).toBe('');

      component.setActiveFilter('sent');
      expect(component.activeFilterLabel()).toBe('Envoye');
    });
  });

  // ===== Selection =====

  it('toggles selection of a single profile', () => {
    component.profiles.set([mockProfile]);
    fixture.detectChanges();

    const event = new MouseEvent('click', { bubbles: true });
    jest.spyOn(event, 'stopPropagation');

    component.toggleSelection(mockProfile.id, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.selectedIds().has(mockProfile.id)).toBe(true);
    expect(component.selectedCount()).toBe(1);
    expect(component.isSelectionActive()).toBe(true);

    component.toggleSelection(mockProfile.id, event);

    expect(component.selectedIds().has(mockProfile.id)).toBe(false);
    expect(component.selectedCount()).toBe(0);
    expect(component.isSelectionActive()).toBe(false);
  });

  it('toggles select all and deselect all', () => {
    const profiles = [
      { ...mockProfile, id: 'p1' },
      { ...mockProfile, id: 'p2', label: 'CV 2', profileName: 'Dev' },
      { ...mockProfile, id: 'p3', label: 'CV 3', profileName: 'Backend' },
    ];
    component.profiles.set(profiles);
    fixture.detectChanges();

    component.toggleSelectAll();
    expect(component.isAllSelected()).toBe(true);
    expect(component.selectedIds().size).toBe(3);

    component.toggleSelectAll();
    expect(component.isAllSelected()).toBe(false);
    expect(component.selectedIds().size).toBe(0);
  });

  it('isAllSelected is false when there are no profiles', () => {
    component.profiles.set([]);
    fixture.detectChanges();
    expect(component.isAllSelected()).toBe(false);
  });

  it('clears selection', () => {
    component.profiles.set([mockProfile, { ...mockProfile, id: 'p2' }]);
    component.toggleSelectAll();
    expect(component.selectedCount()).toBe(2);

    component.clearSelection();
    expect(component.selectedCount()).toBe(0);
    expect(component.isSelectionActive()).toBe(false);
  });

  it('isAllSelected is false when only some profiles are selected', () => {
    const profiles = [
      { ...mockProfile, id: 'p1' },
      { ...mockProfile, id: 'p2', label: 'CV 2' },
    ];
    component.profiles.set(profiles);
    fixture.detectChanges();

    component.toggleSelection('p1', new MouseEvent('click'));
    expect(component.isAllSelected()).toBe(false);
  });

  // ===== Batch delete =====

  it('batch deletes selected profiles after confirmation', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const profiles = [
      { ...mockProfile, id: 'p1' },
      { ...mockProfile, id: 'p2', label: 'CV 2' },
    ];
    component.profiles.set(profiles);
    fixture.detectChanges();

    component.toggleSelectAll();

    await component.batchDelete();

    expect(pocketBaseService.deleteCurrentUserCvProfile).toHaveBeenCalledTimes(2);
    expect(pocketBaseService.deleteCurrentUserCvProfile).toHaveBeenCalledWith('p1');
    expect(pocketBaseService.deleteCurrentUserCvProfile).toHaveBeenCalledWith('p2');
    expect(component.selectedCount()).toBe(0);
  });

  it('cancels batch delete when confirmation is denied', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    component.profiles.set([mockProfile]);
    fixture.detectChanges();
    component.toggleSelection(mockProfile.id, new MouseEvent('click'));

    await component.batchDelete();

    expect(pocketBaseService.deleteCurrentUserCvProfile).not.toHaveBeenCalled();
    expect(component.selectedCount()).toBe(1);
  });

  it('handles partial batch delete failure', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const profiles = [
      { ...mockProfile, id: 'p1' },
      { ...mockProfile, id: 'p2', label: 'CV 2' },
    ];
    component.profiles.set(profiles);
    fixture.detectChanges();

    component.toggleSelectAll();
    pocketBaseService.deleteCurrentUserCvProfile
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Delete failed'));

    await component.batchDelete();

    expect(pocketBaseService.deleteCurrentUserCvProfile).toHaveBeenCalledTimes(2);
    expect(component.errorMessage()).toContain('1 profil(s) sur 2');
    expect(component.selectedIds().has('p2')).toBe(true);
  });

  it('does nothing when batch delete has no selection', async () => {
    await component.batchDelete();
    expect(pocketBaseService.deleteCurrentUserCvProfile).not.toHaveBeenCalled();
  });

  // ===== Batch visibility =====

  it('batch changes visibility to public', async () => {
    const profiles = [
      { ...mockProfile, id: 'p1', template: 'classic', public: false },
      { ...mockProfile, id: 'p2', template: 'classic', public: false, label: 'CV 2' },
    ];
    component.profiles.set(profiles);
    fixture.detectChanges();
    component.toggleSelectAll();

    pocketBaseService.setPublicForCurrentUserCvProfile.mockResolvedValue({ ...mockProfile, id: 'p1', public: true });

    await component.batchChangeVisibility(true);

    expect(pocketBaseService.setPublicForCurrentUserCvProfile).toHaveBeenCalledWith('p1', true);
    expect(component.selectedCount()).toBe(0);
  });

  it('batch changes visibility to private', async () => {
    const profiles = [
      { ...mockProfile, id: 'p1', template: 'classic', public: true },
      { ...mockProfile, id: 'p2', template: 'classic', public: true, label: 'CV 2' },
    ];
    component.profiles.set(profiles);
    fixture.detectChanges();
    component.toggleSelectAll();

    pocketBaseService.setPublicForCurrentUserCvProfile.mockResolvedValue({ ...mockProfile, id: 'p1', public: false });

    await component.batchChangeVisibility(false);

    expect(pocketBaseService.setPublicForCurrentUserCvProfile).toHaveBeenCalledWith('p1', false);
    expect(component.selectedCount()).toBe(0);
  });

  it('skips visibility change for profiles without template', async () => {
    const profileNoTemplate = { ...mockProfile, id: 'p1', template: undefined };
    component.profiles.set([profileNoTemplate]);
    fixture.detectChanges();
    component.toggleSelection('p1', new MouseEvent('click'));

    await component.batchChangeVisibility(true);

    expect(pocketBaseService.setPublicForCurrentUserCvProfile).not.toHaveBeenCalled();
  });

  // ===== Batch template =====

  it('batch changes template', async () => {
    const profiles = [
      { ...mockProfile, id: 'p1', template: 'classic' },
      { ...mockProfile, id: 'p2', template: 'classic', label: 'CV 2' },
    ];
    component.profiles.set(profiles);
    fixture.detectChanges();
    component.toggleSelectAll();

    pocketBaseService.setTemplateForCurrentUserCvProfile.mockResolvedValue({ ...mockProfile, id: 'p1', template: 'modern' });

    await component.batchChangeTemplate('modern');

    expect(pocketBaseService.setTemplateForCurrentUserCvProfile).toHaveBeenCalledWith('p1', 'modern', true);
    expect(component.selectedCount()).toBe(0);
  });

  it('ignores batch template change with empty template id', async () => {
    component.toggleSelectAll();
    await component.batchChangeTemplate('');
    expect(pocketBaseService.setTemplateForCurrentUserCvProfile).not.toHaveBeenCalled();
  });

  // ===== Batch status =====

  it('batch changes status', async () => {
    const profiles = [
      { ...mockProfile, id: 'p1' },
      { ...mockProfile, id: 'p2', label: 'CV 2' },
    ];
    component.profiles.set(profiles);
    fixture.detectChanges();
    component.toggleSelectAll();

    pocketBaseService.setStatusForCvProfile.mockResolvedValue({ ...mockProfile, id: 'p1', status: 'sent' });

    await component.batchChangeStatus('sent');

    expect(pocketBaseService.setStatusForCvProfile).toHaveBeenCalledWith('p1', 'sent');
    expect(component.selectedCount()).toBe(0);
  });

  it('ignores batch status change with empty status', async () => {
    component.toggleSelectAll();
    await component.batchChangeStatus('');
    expect(pocketBaseService.setStatusForCvProfile).not.toHaveBeenCalled();
  });

  // ===== No row navigation from checkbox =====

  it('checkbox clicks do not trigger row navigation', () => {
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    mockWideScreen(true);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: checkbox });

    component.openProfileFromRow(mockProfile, event);

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
