import { ChangeDetectorRef, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CvProfileExtraService } from '../../core/services/cv-profile-extra.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { BentoCvPage } from './bento-cv-page/bento-cv-page';
import { MinimalCvPage } from './minimal-cv-page/minimal-cv-page';
import { ModernCvPage } from './modern-cv-page/modern-cv-page';
import { SupaCVPage } from './supa-cv-page/supa-cv-page';

jest.mock('qrcode', () => ({
  __esModule: true,
  default: { toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,qr') },
}));

describe('CV template page logic', () => {
  const pocketBaseService = {
    toDate: jest.fn((value?: string | null) => (value ? new Date(value.replace(' ', 'T')) : undefined)),
    getCvDataByProfileId: jest.fn().mockResolvedValue(cvData()),
  };

  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      imports: [MinimalCvPage, ModernCvPage, SupaCVPage, BentoCvPage],
      providers: [
        CvProfileExtraService,
        { provide: PocketBaseService, useValue: pocketBaseService },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jest.fn(), markForCheck: jest.fn() } },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('covers minimal template formatting helpers and load states', async () => {
    const component = TestBed.runInInjectionContext(() => new MinimalCvPage());
    const api = component as unknown as {
      getDate: (value?: string | null) => string;
      stripUrlProtocol: (value?: string | null) => string;
      loadCvData: (id: string) => Promise<void>;
    };

    expect(api.getDate('2024-01-02')).toContain('2024');
    expect(api.getDate(null)).toBe('');
    expect(api.stripUrlProtocol('https://example.test/path')).toBe('example.test/path');
    expect(api.stripUrlProtocol(null)).toBe('');

    await api.loadCvData('profile-1');
    expect(component.cvData()?.profile.id).toBe('profile-1');
    expect(component.isLoading()).toBe(false);

    pocketBaseService.getCvDataByProfileId.mockRejectedValueOnce(new Error('Broken minimal'));
    await api.loadCvData('profile-1');
    expect(component.errorMessage()).toBe('Broken minimal');
  });

  it('covers modern template extra helpers and load states', async () => {
    const component = TestBed.runInInjectionContext(() => new ModernCvPage());
    const api = component as unknown as {
      getDate: (value?: string | null) => string;
      extra: (key: string) => unknown;
      extraText: (key: string) => string | null;
      loadCvData: (id: string) => Promise<void>;
    };

    component.cvData.set(cvData() as never);
    expect(api.getDate('2024-01-02')).toContain('2024');
    expect(api.getDate(undefined)).toBe('');
    expect(api.extra('hero')).toBe('Hero text');
    expect(api.extraText('hero')).toBe('Hero text');
    expect(api.extraText('featuredProjects')).toBeNull();

    await api.loadCvData('profile-1');
    expect(component.cvData()?.profile.id).toBe('profile-1');
  });

  it('covers supa template grouping, classes and source calculations', () => {
    const component = TestBed.runInInjectionContext(() => new SupaCVPage());
    component.cvData.set(cvData() as never);
    const api = component as never as Record<string, (...args: unknown[]) => unknown>;
    const data = cvData() as never as { skills: unknown[]; jobs: unknown[] };

    expect(api['getDate']('2024-01-02')).toContain('2024');
    expect(api['extraBoolean']('visible')).toBe(true);
    expect(api['extraStringArray']('featuredProjects')).toEqual(['project-1']);
    expect(api['visibleSkills'](data.skills)).toHaveLength(2);
    expect(api['skillCategories'](data.skills)).toEqual(['Frontend', 'Tooling']);
    expect(api['skillCategoryLabel'](data.skills[0])).toBe('Frontend');
    expect(api['skillCategoryClass'](data.skills[0], data.skills)).toBe('skill--tone-0');
    expect((api['chronologicalJobs'](data.jobs) as { id: string }[]).map((job) => job.id)).toEqual(['job-1', 'job-2']);

    component.ngOnDestroy();
  });

  it('covers bento template display, role and experience helpers', () => {
    const component = TestBed.runInInjectionContext(() => new BentoCvPage());
    component.cvData.set(cvData() as never);
    const api = component as never as Record<string, (...args: unknown[]) => unknown>;
    const data = cvData() as never as { jobs: unknown[]; skills: unknown[] };

    expect(api['getDisplayName'](data)).toBe('Jane Doe');
    expect(api['getInitials'](data)).toBe('JD');
    expect(api['getRoleLines'](data)).toEqual(['Senior Engineer', 'Architect']);
    expect(api['getExperienceYears'](data.jobs)).toBeGreaterThan(0);
    expect(api['getStrengthSkills'](data.skills)).toHaveLength(2);
    expect(api['getExperienceItems'](data)).toHaveLength(3);
    expect(api['getVisibleExperienceItems'](data)).toHaveLength(3);

    component.ngOnDestroy();
  });

  it('renders template pages with preview data through Angular inputs', async () => {
    for (const TemplatePage of [MinimalCvPage, ModernCvPage, SupaCVPage, BentoCvPage] as Type<unknown>[]) {
      const fixture = TestBed.createComponent(TemplatePage);
      fixture.componentRef.setInput('previewData', cvData());
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Jane');
      fixture.destroy();
    }
  });

  function cvData(): unknown {
    return {
      profile: {
        id: 'profile-1',
        user: 'user-1',
        profileName: 'Senior Engineer / Architect',
        template: 'classic',
        slug: 'classic--profile-1',
        extra: { classic: { hero: 'Hero text', visible: true, featuredProjects: ['project-1'] } },
      },
      user: {
        id: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        github: 'https://github.test/jane',
        website: 'https://jane.test',
      },
      jobs: [
        { id: 'job-1', label: 'Developer', company: 'ACME', position: 'Developer', type: 'work project', startDate: '2020-01-01', sortOrder: 1, skills: ['skill-1'] },
        { id: 'job-2', label: 'Lead', company: 'Globex', position: 'Lead', type: 'freelance', startDate: '2022-01-01', sortOrder: 2, skills: ['skill-2'] },
      ],
      projects: [{ id: 'project-1', name: 'Project One', type: 'sideproject', date: '2024-01-01', description: 'Project', url: 'https://project.test' }],
      skills: [
        { id: 'skill-1', name: 'Angular', type: 'Framework', expand: { category: { id: 'cat-1', name: 'Frontend' } } },
        { id: 'skill-2', name: 'Bun', type: 'Tooling' },
        { id: 'skill-3', name: 'English', type: 'Language' },
      ],
      degrees: [{ id: 'degree-1', title: 'Master', school: 'School', year: '2020' }],
      achievements: [{ id: 'achievement-1', title: 'Award', description: 'Won' }],
      hobbies: [{ id: 'hobby-1', name: 'Music' }],
    } as never;
  }
});
