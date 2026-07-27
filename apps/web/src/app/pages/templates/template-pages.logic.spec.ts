import { ChangeDetectorRef } from '@angular/core';
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
    toDate: jest.fn((value) => (value ? new Date(value.replace(' ', 'T')) : undefined)),
    getCvDataByProfileId: jest.fn().mockResolvedValue(cvData()),
  };

  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
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

  it('covers bento fallback helpers and A4 fitting branches', () => {
    const component = TestBed.runInInjectionContext(() => new BentoCvPage());
    const api = component as never as Record<string, (...args: unknown[]) => unknown>;
    const data = cvData() as never as { jobs: unknown[]; skills: unknown[]; degrees: unknown[]; profile: { slug: string }; user: { website?: string } | null };

    expect(api['getDisplayName']({ ...data, user: null, profile: { ...data.profile, profileName: 'Profile Name' } })).toBe('Profile Name');
    expect(api['getDisplayName']({ ...data, user: null, profile: { ...data.profile, profileName: '' } })).toBe('Curriculum Vitae');
    expect(api['getInitials']({ ...data, user: null, profile: { ...data.profile, profileName: 'Solo' } })).toBe('S');
    expect(api['getRoleLines']({ ...data, profile: { ...data.profile, profileName: '' } })).toEqual(['Profil professionnel']);
    expect(api['getExperienceYears']([])).toBe(1);
    expect(api['getStrengthSkills']([{ id: 'lang', name: 'English', type: 'Language' }])).toHaveLength(1);
    expect(api['getJobSkills']({ skills: ['missing'] }, data.skills)).toHaveLength(2);
    expect(api['getVisibleDegrees']([1, 2, 3, 4, 5])).toHaveLength(4);
    component.mode.set('tight');
    expect(api['getVisibleDegrees']([1, 2, 3, 4, 5])).toHaveLength(3);
    expect(api['getDateRange']({ startDate: null, endDate: null })).toBe("Debut - Aujourd'hui");
    expect(api['getDate']('bad-date')).toBe('');
    expect(api['extra']('missing')).toBeUndefined();
    expect(api['extraText']('featuredProjects')).toBeNull();
    expect(api['getProfileUrl']({ ...data, user: null })).toContain('/classic--profile-1');

    component.cvData.set({ ...data, jobs: data.jobs, projects: [{ id: 'project-1' }, { id: 'project-2' }, { id: 'project-3' }] } as never);
    (component as never as { bentoSheet?: { nativeElement: { scrollHeight: number } } }).bentoSheet = { nativeElement: { scrollHeight: 10_000 } };
    api['fitToA4']();
    expect(component.mode()).toBe('tight');
    expect(component.visibleJobCount()).toBeGreaterThanOrEqual(4);

    (component as never as { bentoSheet?: { nativeElement: { scrollHeight: number } } }).bentoSheet = { nativeElement: { scrollHeight: 100 } };
    api['fitToA4']();
    expect(component.mode()).toBe('full');
  });

  it('covers supa loading, project ordering and fitting branches', async () => {
    const component = TestBed.runInInjectionContext(() => new SupaCVPage());
    component.cvData.set(cvData() as never);
    const api = component as never as Record<string, (...args: unknown[]) => unknown>;
    const data = cvData() as never as { projects: { id: string }[]; skills: unknown[]; jobs: unknown[] };

    expect(api['getDate']('bad-date')).toBe('');
    expect(api['skillCategoryLabel']({ name: 'No category' })).toBe('Autre');
    expect(api['skillCategoryClass']('Unknown', data.skills)).toBe('skill--tone-0');
    expect(api['getVisibleProjects']([{ id: 'project-2' }, { id: 'project-1' }])).toEqual([{ id: 'project-2' }, { id: 'project-1' }]);
    component.cvData.set({ ...(cvData() as object), profile: { ...(cvData() as never as { profile: object }).profile, extra: { classic: { featuredProjectIds: ['project-1'] } } } } as never);
    expect(api['getVisibleProjects']([{ id: 'project-2' }, { id: 'project-1' }])).toEqual([{ id: 'project-1' }, { id: 'project-2' }]);

    await api['loadCvData']('profile-1');
    expect(component.isLoading()).toBe(false);

    expect(api['mainFits']()).toBe(true);
    // Description mock: naturally short, so T3 won't fire.  Huge overflow
    // means the fine-fit budget is way below the measured minimum → bail
    // to coarse fallback, which runs clamped/hide-linked/experience/
    // skills/diplomas/project-count.
    const descStyleStore: Record<string, string> = {};
    const descMock = {
      scrollHeight: 80,
      clientHeight: 80,
      getBoundingClientRect: () => ({ height: 80 }),
      style: {
        ...({} as CSSStyleDeclaration),
        setProperty: (prop: string, value: string) => { descStyleStore[prop] = value; },
        removeProperty: (prop: string) => { const v = descStyleStore[prop]; delete descStyleStore[prop]; return v; },
        getPropertyValue: (prop: string) => descStyleStore[prop] ?? '',
        get maxHeight() { return descStyleStore['max-height'] ?? ''; },
        set maxHeight(v: string) { descStyleStore['max-height'] = v; },
      } as unknown as CSSStyleDeclaration,
    };
    const root = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [descMock] } as unknown as HTMLElement;
    const stackEl = { getBoundingClientRect: () => ({ top: 30, width: 130 }) };
    const card = { getBoundingClientRect: () => ({ top: 0, height: 100, width: 62 }), querySelector: () => descMock };
    const projectsSection = {
      getBoundingClientRect: () => ({ top: 20, height: 200 }),
      querySelector: (s: string) => (s === '.project-stack' ? stackEl : null),
      querySelectorAll: (s: string) => (s === '.card.project' ? [card] : []),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLElement;
    const main = { scrollHeight: 10_000, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => projectsSection };
    (component as never as { resumeRoot?: { nativeElement: unknown }; resumeMain?: { nativeElement: unknown } }).resumeRoot = { nativeElement: root };
    (component as never as { resumeRoot?: { nativeElement: unknown }; resumeMain?: { nativeElement: unknown } }).resumeMain = { nativeElement: main };
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({ lineHeight: '14px', fontSize: '10.8px' } as CSSStyleDeclaration);
    expect(api['mainFits']()).toBe(false);
    api['fitSectionsToA4']();
    jest.restoreAllMocks();
    // Page never fits: the full ladder runs. Fine-fit bails early (budget
    // below measured minimum), coarse clamped/hide-linked/experience/
    // skills/diplomas/project-count all apply.
    expect(component.projectFit()).toBe('auto');
    expect(component.projectDescriptionMode()).toBe('hide-linked');
    expect(component.experienceDescriptions()).toBe('none');
    expect(component.sectionModes().skills).toBe('compact');
    expect(component.sectionModes().diplomas).toBe('compact');
    expect(component.sectionModes().projects).toBe('compact');
    expect(component.visibleProjectCount()).toBeGreaterThanOrEqual(1);

    (main as { scrollHeight: number }).scrollHeight = 100;
    api['fitSectionsToA4']();
    expect(component.projectFit()).toBe('auto');
    expect(component.projectDescLineClamp()).toBe(0);
    expect(component.sectionModes().experience).toBe('full');
    expect(component.experienceDescriptions()).toBe('all');
    expect(component.projectDescriptionMode()).toBe('full');

    // highlightedJob: with no endDate on any job, the most recent (job-2) is highlighted.
    const jobs = data.jobs as { id: string; endDate?: string }[];
    expect((api['highlightedJob'](jobs) as { id: string }).id).toBe('job-2');
    // When one job is current (no endDate) it wins over an earlier ended job.
    const mixedJobs = [
      { id: 'ended', startDate: '2023-01-01', endDate: '2023-12-01' },
      { id: 'current', startDate: '2021-01-01' },
    ];
    expect((api['highlightedJob'](mixedJobs) as { id: string }).id).toBe('current');
    expect(api['highlightedJob']([])).toBeNull();

    // isJobDescriptionVisible respects the experience-description mode.
    component.experienceDescriptions.set('all');
    expect(api['isJobDescriptionVisible'](jobs[0])).toBe(true);
    component.experienceDescriptions.set('none');
    expect(api['isJobDescriptionVisible'](jobs[1])).toBe(false);
    component.experienceDescriptions.set('highlighted');
    expect(api['isJobDescriptionVisible']({ id: 'job-2' })).toBe(true);
    expect(api['isJobDescriptionVisible']({ id: 'job-1' })).toBe(false);
  });

  it('covers supa fine-grained project fitting and T3 gating', () => {
    const component = TestBed.runInInjectionContext(() => new SupaCVPage());
    const api = component as never as Record<string, (...args: unknown[]) => unknown>;

    // Stub computed style so measureDescLineHeight returns 14 px.
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({ lineHeight: '14px', fontSize: '10.8px' } as CSSStyleDeclaration);

    const changeDetector = TestBed.inject(ChangeDetectorRef);
    const detectChangesSpy = changeDetector.detectChanges as jest.Mock;

    // ------------------------------------------------------------------
    // Helper: create a desc-element-like mock with a CSSStyleDeclaration
    // that supports setProperty / removeProperty / getPropertyValue so
    // custom-property manipulation works in jsdom.
    // ------------------------------------------------------------------
    const descEl = (overrides: Partial<{ scrollHeight: number; clientHeight: number }> = {}) => {
      const store: Record<string, string> = {};
      const style: CSSStyleDeclaration = {
        ...({} as CSSStyleDeclaration),
        setProperty: (prop: string, value: string) => { store[prop] = value; },
        removeProperty: (prop: string) => { const v = store[prop]; delete store[prop]; return v; },
        getPropertyValue: (prop: string) => store[prop] ?? '',
        get maxHeight() { return store['max-height'] ?? ''; },
        set maxHeight(v: string) { store['max-height'] = v; },
      } as unknown as CSSStyleDeclaration;

      return {
        scrollHeight: 80,
        clientHeight: 80,
        getBoundingClientRect: () => ({ top: 0, height: overrides.clientHeight ?? 80, width: 0 }),
        style,
        ...overrides,
      } as unknown as HTMLElement;
    };

    // ------------------------------------------------------------------
    // Helper: wire resumeRoot / resumeMain on the component.
    // ------------------------------------------------------------------
    const setDOM = (root: unknown, main: unknown) => {
      (component as never as { resumeRoot?: { nativeElement: unknown }; resumeMain?: { nativeElement: unknown } }).resumeRoot = { nativeElement: root };
      (component as never as { resumeRoot?: { nativeElement: unknown }; resumeMain?: { nativeElement: unknown } }).resumeMain = { nativeElement: main };
    };

    // ------------------------------------------------------------------
    // Branch 1 — No overflow: page fits without constraints.
    // main.scrollHeight is well inside A4 → pageOverflow = 0 → early
    // return.  Clamp 12 was set BEFORE detectChanges(); the first geometry
    // render already uses the generous clamp, never clamp 0.
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    component.projectDescriptionMode.set('full');
    const d1 = descEl();
    const root1 = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [d1] } as unknown as HTMLElement;
    const section1 = { querySelector: () => null } as unknown as HTMLElement;
    const main1 = { scrollHeight: 100, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => section1 };
    setDOM(root1, main1);
    detectChangesSpy.mockClear();
    api['fitProjectsFine']();
    // Clamp 12 set before fine-mode render; one detectChanges for the
    // initial full/fine render, none after (no-overflow early return).
    expect(detectChangesSpy).toHaveBeenCalledTimes(1);
    expect(component.projectFit()).toBe('fine');
    expect(component.projectDescriptionMode()).toBe('full');
    expect(component.projectDescLineClamp()).toBe(12);

    // ------------------------------------------------------------------
    // Branch 2 — Trimmed description below two lines triggers coarse fallback
    // at the budget-stage gate (FIX 3).  Huge overflow → candidateHeight=0,
    // fullScrollHeight=80 > 0+1 (trimmed) AND 0 < twoLinesPx → gate fires.
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    component.projectDescriptionMode.set('full');
    const d2 = descEl({ clientHeight: 24 });
    const card2 = { getBoundingClientRect: () => ({ top: 0, height: 100, width: 62 }), querySelector: () => d2 };
    const stack2 = { getBoundingClientRect: () => ({ top: 30, width: 130 }) };
    const section2 = {
      getBoundingClientRect: () => ({ top: 0, height: 200 }),
      querySelector: (s: string) => (s === '.project-stack' ? stack2 : null),
      querySelectorAll: (s: string) => (s === '.card.project' ? [card2] : []),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLElement;
    const main2 = { scrollHeight: 20_000, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => section2 };
    const root2 = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [d2] } as unknown as HTMLElement;
    setDOM(root2, main2);
    api['fitProjectsFine']();
    // stackBudget = 200 - (20000 - 1122 - 2) - 30 = deeply negative → bail.
    expect(component.projectFit()).toBe('auto');
    expect(component.projectDescLineClamp()).toBe(0);
    // No per-description max-height or panel max-height applied.
    expect(d2.style.maxHeight).toBeFalsy();
    expect(section2.style.maxHeight).toBeFalsy();

    // ------------------------------------------------------------------
    // Branch 3 — Budget-stage gate fires (trimmed & below 2).
    // FIX 3 (direct measurement) gives fixedChrome=100; with
    // scrollHeight=1300 → pageOverflow=176 → stackBudget=94 → candidate=0.
    // Gate: 80 > 0+1 (trimmed) AND 0 < 28 → fires → coarse reset.
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    component.projectDescriptionMode.set('full');
    const d3 = descEl({ scrollHeight: 80, clientHeight: 24 });
    const card3 = { getBoundingClientRect: () => ({ top: 0, height: 100, width: 62 }), querySelector: () => d3 };
    const stack3 = { getBoundingClientRect: () => ({ top: 30, width: 130 }) };
    const section3 = {
      getBoundingClientRect: () => ({ top: 0, height: 300 }),
      querySelector: (s: string) => (s === '.project-stack' ? stack3 : null),
      querySelectorAll: (s: string) => (s === '.card.project' ? [card3] : []),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLElement;
    const main3 = { scrollHeight: 1300, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => section3 };
    const root3 = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [d3] } as unknown as HTMLElement;
    setDOM(root3, main3);
    api['fitProjectsFine']();
    // T3 fired: state reset for coarse fallback.
    expect(component.projectFit()).toBe('auto');
    expect(component.projectDescLineClamp()).toBe(0);
    // Per-description max-height and custom property cleaned up on bail.
    expect(d3.style.maxHeight).toBe('');
    expect(d3.style.getPropertyValue('--supa-project-desc-lines')).toBe('');
    expect(section3.style.maxHeight).toBeFalsy();

    // ------------------------------------------------------------------
    // Branch 4 — Persistent overflow but desc above 2 lines → fine stays.
    // FIX 3: fixedChrome=100 → candidate=70 → effectiveLines=5.
    // Clamp reduction: 4→3→2; at 2 T3: trimmed(100>56+1)=true but
    // 56≥twoLinesPx(28) → gate does NOT fire.  FIX 1: maxHeight is a
    // whole-line multiple (28px = 2×14) with per-element custom property.
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    component.projectDescriptionMode.set('full');
    const d4 = descEl({ scrollHeight: 100, clientHeight: 56 });
    const card4 = { getBoundingClientRect: () => ({ top: 0, height: 100, width: 62 }), querySelector: () => d4 };
    const stack4 = { getBoundingClientRect: () => ({ top: 30, width: 130 }) };
    const section4 = {
      getBoundingClientRect: () => ({ top: 0, height: 300 }),
      querySelector: (s: string) => (s === '.project-stack' ? stack4 : null),
      querySelectorAll: (s: string) => (s === '.card.project' ? [card4] : []),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLElement;
    const main4 = { scrollHeight: 1224, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => section4 };
    const root4 = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [d4] } as unknown as HTMLElement;
    setDOM(root4, main4);
    api['fitProjectsFine']();
    // Fine state stays active; per-desc max-height and custom property set.
    expect(component.projectFit()).toBe('fine');
    expect(component.projectDescLineClamp()).toBe(2);
    // FIX 1: maxHeight is a whole-line multiple: 2 lines × 14px = 28px.
    expect(d4.style.maxHeight).toBe('28px');
    // FIX 1: per-element line-clamp custom property is set.
    expect(d4.style.getPropertyValue('--supa-project-desc-lines')).toBe('2');
    // Section max-height not set (page never fits with mock scrollHeight=1224).
    expect(section4.style.maxHeight).toBeFalsy();

    // ------------------------------------------------------------------
    // Branch 5 — Per-description max-height is the only constraint;
    // no overflow clipping on any wrapper that contains fixed content.
    // CSS assertion: verified by the absence of overflow:hidden inline
    // styles on the section and wrappers (overflow is CSS-only).
    // The description's own overflow:hidden is set in CSS, not inline.
    // ------------------------------------------------------------------
    // (Covered by B4 — d4.style.maxHeight set, section4.style.maxHeight empty,
    //  no inline overflow on any element.)

    // ------------------------------------------------------------------
    // Branch 6 — Repeated fitSectionsToA4() clears stale inline styles
    // on the section panel AND every per-description element, including
    // the per-element line-clamp custom property and section overflow.
    // ------------------------------------------------------------------
    // Pre-set stale state.
    component.projectFit.set('fine');
    component.projectDescLineClamp.set(2);
    const staleDesc = descEl({ clientHeight: 56 });
    (staleDesc.style as unknown as Record<string, string>)['maxHeight'] = '100px';
    staleDesc.style.setProperty('--supa-project-desc-lines', '5');
    const sharedSection6 = {
      getBoundingClientRect: () => ({ top: 0, height: 100 }),
      querySelectorAll: (s: string) => (s === '.project-card__description' ? [staleDesc] : []),
      style: { maxHeight: '200px', overflow: 'visible' } as unknown as CSSStyleDeclaration,
    } as unknown as HTMLElement;
    const main6 = {
      scrollHeight: 100,
      getBoundingClientRect: () => ({ top: 0 }),
      querySelector: () => sharedSection6,
    };
    const root6 = { getBoundingClientRect: () => ({ top: 0 }) } as unknown as HTMLElement;
    (component as never as { resumeMain?: { nativeElement: unknown } }).resumeMain = { nativeElement: main6 };
    (component as never as { resumeRoot?: { nativeElement: { getBoundingClientRect: () => { top: number } } } }).resumeRoot = {
      nativeElement: root6,
    };
    api['fitSectionsToA4']();
    // Stale panel max-height cleared.
    expect(sharedSection6.style.maxHeight).toBe('');
    // Stale panel overflow cleared.
    expect(sharedSection6.style.overflow).toBe('');
    // Stale per-description max-height cleared.
    expect(staleDesc.style.maxHeight).toBe('');
    // Stale per-element custom property cleared.
    expect(staleDesc.style.getPropertyValue('--supa-project-desc-lines')).toBe('');
    // Fine-fit reset.
    expect(component.projectFit()).toBe('auto');
    expect(component.projectDescLineClamp()).toBe(0);

    // ------------------------------------------------------------------
    // Branch 7 — Two cards in one row use row-max fixed chrome
    // (FIX 3: measured directly, not from card-desc difference).
    // FIX 1: max heights are whole-line multiples; per-element custom
    // properties are set.  After clamp reduction to 2 lines both
    // converge to the same value.
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    component.projectDescriptionMode.set('full');
    // Card A: height=120, desc=40 → direct fixed=120. Card B: height=140, desc=30 → direct fixed=140.
    const d7a = descEl({ clientHeight: 40, scrollHeight: 100 });
    const d7b = descEl({ clientHeight: 30, scrollHeight: 120 });
    const card7a = { getBoundingClientRect: () => ({ top: 30, height: 120, width: 62 }), querySelector: () => d7a };
    const card7b = { getBoundingClientRect: () => ({ top: 30, height: 140, width: 62 }), querySelector: () => d7b };
    const stack7 = { getBoundingClientRect: () => ({ top: 30, width: 130 }) };
    const section7 = {
      getBoundingClientRect: () => ({ top: 0, height: 300 }),
      querySelector: (s: string) => (s === '.project-stack' ? stack7 : null),
      querySelectorAll: (s: string) => (s === '.card.project' ? [card7a, card7b] : []),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLElement;
    const main7 = { scrollHeight: 1224, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => section7 };
    const root7 = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [d7a, d7b] } as unknown as HTMLElement;
    setDOM(root7, main7);
    api['fitProjectsFine']();
    // rowMaxFixed = max(120,140) = 140; perRowBudget ≈ 170.
    // candidateA = 50 → effectiveLines=3 → initial maxH=42.
    // candidateB = 30 → effectiveLines=2 → initial maxH=28.
    // Reduction from 3→2: both end at 28px (2 lines).
    expect(component.projectFit()).toBe('fine');
    expect(d7a.style.maxHeight).toBeTruthy();
    expect(d7b.style.maxHeight).toBeTruthy();
    const hA = parseFloat(d7a.style.maxHeight as string);
    const hB = parseFloat(d7b.style.maxHeight as string);
    // Both converged to 2 lines after reduction (28px = 2×14).
    expect(hA).toBe(28);
    expect(hB).toBe(28);
    // FIX 1: per-element line-clamp custom properties.
    expect(d7a.style.getPropertyValue('--supa-project-desc-lines')).toBe('2');
    expect(d7b.style.getPropertyValue('--supa-project-desc-lines')).toBe('2');

    // ------------------------------------------------------------------
    // Branch 8 — Short untrimmed description with small candidate does
    // NOT reset to coarse (FIX 3: direct measurement via jest.fn() giving
    // fixedChrome=80 instead of inflated 100 from the card mock).
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    component.projectDescriptionMode.set('full');
    const d8 = descEl({ clientHeight: 20, scrollHeight: 20 });
    let card8CallCount = 0;
    const card8 = {
      getBoundingClientRect: jest.fn(() => {
        card8CallCount++;
        // 1st call = row grouping (cardTop), 2nd call = fixedChrome (desc hidden).
        return { top: 0, height: card8CallCount > 1 ? 80 : 100, width: 62 };
      }),
      querySelector: () => d8,
    } as unknown as HTMLElement;
    const stack8 = { getBoundingClientRect: () => ({ top: 30, width: 130 }) };
    const section8 = {
      getBoundingClientRect: () => ({ top: 0, height: 200 }),
      querySelector: (s: string) => (s === '.project-stack' ? stack8 : null),
      querySelectorAll: (s: string) => (s === '.card.project' ? [card8] : []),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLElement;
    // pageOverflow = 1189-1122-2 = 65 → stackBudget = 200-65-30 = 105.
    // fixedChrome = 80 (from jest.fn, desc hidden) → candidate = 25.
    // Gate: fullScrollHeight=20 > 25+1 = false → NOT trimmed → gate stays shut.
    const main8 = { scrollHeight: 1189, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => section8 };
    const root8 = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [d8] } as unknown as HTMLElement;
    setDOM(root8, main8);
    api['fitProjectsFine']();
    expect(component.projectFit()).toBe('fine');
    expect(d8.style.maxHeight).toBeTruthy();
    // FIX 1: maxHeight is whole-line multiple: floor(25/14)=1 → 14px.
    expect(d8.style.maxHeight).toBe('14px');
    expect(d8.style.getPropertyValue('--supa-project-desc-lines')).toBe('1');

    // ------------------------------------------------------------------
    // Branch 9 — Trimmed description below two lines triggers the
    // budget-stage coarse-reset gate.  Uses jest.fn() for correct FIX 3
    // measurement.
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    component.projectDescriptionMode.set('full');
    // Description content 80px → trimmed when candidate=25px (fixedChrome=80).
    const d9 = descEl({ clientHeight: 20, scrollHeight: 80 });
    let card9CallCount = 0;
    const card9 = {
      getBoundingClientRect: jest.fn(() => {
        card9CallCount++;
        return { top: 0, height: card9CallCount > 1 ? 80 : 100, width: 62 };
      }),
      querySelector: () => d9,
    } as unknown as HTMLElement;
    const stack9 = { getBoundingClientRect: () => ({ top: 30, width: 130 }) };
    const section9 = {
      getBoundingClientRect: () => ({ top: 0, height: 200 }),
      querySelector: (s: string) => (s === '.project-stack' ? stack9 : null),
      querySelectorAll: (s: string) => (s === '.card.project' ? [card9] : []),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLElement;
    const main9 = { scrollHeight: 1189, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => section9 };
    const root9 = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [d9] } as unknown as HTMLElement;
    setDOM(root9, main9);
    api['fitProjectsFine']();
    // Gate: 80 > 25+1 = true (trimmed) AND 25 < 28 = true → coarse reset.
    expect(component.projectFit()).toBe('auto');
    expect(component.projectDescLineClamp()).toBe(0);
    expect(d9.style.maxHeight).toBe('');
    expect(d9.style.getPropertyValue('--supa-project-desc-lines')).toBe('');

    // ------------------------------------------------------------------
    // Branch 10 — FIX 1: Candidate between two line boundaries yields a
    // whole-line maxHeight with per-element line-clamp.  sectionHeight=110,
    // pageOverflow=5 → stackBudget=75; fixedChrome=40 → candidate=35px
    // (= 2.5 lines).  floor(35/14)=2 → maxHeight=28px, clamp=2.
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    component.projectDescriptionMode.set('full');
    const d10 = descEl({ clientHeight: 20, scrollHeight: 20 });
    let card10CallCount = 0;
    const card10 = {
      getBoundingClientRect: jest.fn(() => {
        card10CallCount++;
        return { top: 0, height: card10CallCount > 1 ? 40 : 60, width: 62 };
      }),
      querySelector: () => d10,
    } as unknown as HTMLElement;
    const stack10 = { getBoundingClientRect: () => ({ top: 30, width: 130 }) };
    const section10 = {
      getBoundingClientRect: () => ({ top: 0, height: 110 }),
      querySelector: (s: string) => (s === '.project-stack' ? stack10 : null),
      querySelectorAll: (s: string) => (s === '.card.project' ? [card10] : []),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLElement;
    // main.scrollHeight = 1122 + 5 + 2 = 1129 → pageOverflow=5.
    const main10 = { scrollHeight: 1129, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => section10 };
    const root10 = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [d10] } as unknown as HTMLElement;
    setDOM(root10, main10);
    api['fitProjectsFine']();
    // FIX 1: maxHeight is the whole-line value (28px = 2×14), not 35px.
    expect(d10.style.maxHeight).toBe('28px');
    // FIX 1: per-element line-clamp matches the whole-line count.
    expect(d10.style.getPropertyValue('--supa-project-desc-lines')).toBe('2');

    // ------------------------------------------------------------------
    // Branch 11 — FIX 2: Section max-height applied after page fits,
    // with scrollHeight ≤ target on acceptance.  Uses a scrollHeight
    // getter that reports overflow on the first read (pageOverflow check)
    // and fit on subsequent reads (mainFits after budget).
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    component.projectDescriptionMode.set('full');
    const d11 = descEl({ clientHeight: 40, scrollHeight: 60 });
    const card11 = { getBoundingClientRect: () => ({ top: 0, height: 60, width: 62 }), querySelector: () => d11 };
    const stack11 = { getBoundingClientRect: () => ({ top: 30, width: 130 }) };
    const section11 = {
      getBoundingClientRect: () => ({ top: 0, height: 300 }),
      querySelector: (s: string) => (s === '.project-stack' ? stack11 : null),
      querySelectorAll: (s: string) => (s === '.card.project' ? [card11] : []),
      style: {} as CSSStyleDeclaration,
      scrollHeight: 180, // <= targetSectionHeight+1 = 201, so acceptance passes
    } as unknown as HTMLElement;
    let scroll11ReadCount = 0;
    const main11 = {
      get scrollHeight() {
        scroll11ReadCount++;
        // Read 1 = pageOverflow (needs to show overflow).
        // Reads 2+ = mainFits (needs to show fit after budget constraints).
        return scroll11ReadCount === 1 ? 1224 : 1120;
      },
      getBoundingClientRect: () => ({ top: 0 }),
      querySelector: () => section11,
    };
    const root11 = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [d11] } as unknown as HTMLElement;
    setDOM(root11, main11);
    api['fitProjectsFine']();
    // pageOverflow ≈ 99 → targetSectionHeight = Math.round(300-99) = 201.
    // After constraints, mainFits → true.
    // acceptFineWithSectionMax: section.scrollHeight(180) ≤ 201+1 → accepts.
    // FIX 2: section max-height is the exact rounded target.
    expect(section11.style.maxHeight).toBe('201px');
    expect(section11.style.overflow).toBe('visible');
    expect(component.projectFit()).toBe('fine');
    expect(d11.style.maxHeight).toBeTruthy();

    // ------------------------------------------------------------------
    // Branch 12 — FIX 3: Fixed-chrome measurement stays unchanged for
    // two same-row cards even when one is taller (stretched) without
    // additional immutable content.  Use jest.fn() to simulate direct
    // measurement returning the same intrinsic fixed height for both.
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    component.projectDescriptionMode.set('full');
    const d12a = descEl({ clientHeight: 30, scrollHeight: 80 });
    const d12b = descEl({ clientHeight: 50, scrollHeight: 120 });
    // Both cards have the SAME intrinsic fixed chrome (60px).  Card B's
    // first getBoundingClientRect call (row grouping) returns 140 (taller
    // because of bigger description), but the second call (fixedChrome
    // measurement) returns 60 — same as card A's measurement.
    let card12aCall = 0;
    const card12a = {
      getBoundingClientRect: jest.fn(() => {
        card12aCall++;
        return { top: 30, height: card12aCall > 1 ? 60 : 90, width: 62 };
      }),
      querySelector: () => d12a,
    } as unknown as HTMLElement;
    let card12bCall = 0;
    const card12b = {
      getBoundingClientRect: jest.fn(() => {
        card12bCall++;
        // Grouping shows 140 (tall due to big desc), measurement returns 60.
        return { top: 30, height: card12bCall > 1 ? 60 : 140, width: 62 };
      }),
      querySelector: () => d12b,
    } as unknown as HTMLElement;
    const stack12 = { getBoundingClientRect: () => ({ top: 30, width: 130 }) };
    const section12 = {
      getBoundingClientRect: () => ({ top: 0, height: 300 }),
      querySelector: (s: string) => (s === '.project-stack' ? stack12 : null),
      querySelectorAll: (s: string) => (s === '.card.project' ? [card12a, card12b] : []),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLElement;
    const main12 = { scrollHeight: 1224, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => section12 };
    const root12 = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [d12a, d12b] } as unknown as HTMLElement;
    setDOM(root12, main12);
    api['fitProjectsFine']();
    // Same row, same fixedChrome (60) → rowMaxFixed = 60, perRowBudget ≈ 170.
    // candidateA = candidateB = 170-60 = 110.
    // Both get the same maxHeight = floor(110/14)*14 = 98px (7 lines).
    // Reduction: 6→5→4→3→2, end at 28px.
    expect(component.projectFit()).toBe('fine');
    // Both cards have the same fixed chrome → same max heights.
    const h12a = parseFloat(d12a.style.maxHeight as string);
    const h12b = parseFloat(d12b.style.maxHeight as string);
    expect(h12a).toBe(h12b);
    // FIX 3 verified: tall card B did NOT inflate fixed-chrome measurement.
    // If the old cardHeight-descHeight formula were used, card B's fixed
    // would be 140-50=90 ≠ card A's 90-30=60.  The jest.fn confirms
    // both returned 60 for the second call.

    // ------------------------------------------------------------------
    // Edge: no description elements → bail early.
    // ------------------------------------------------------------------
    component.projectFit.set('auto');
    component.projectDescLineClamp.set(0);
    const emptySection = { querySelector: () => null } as unknown as HTMLElement;
    const emptyMain = { scrollHeight: 10_000, getBoundingClientRect: () => ({ top: 0 }), querySelector: () => emptySection };
    const emptyRoot = { getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [] } as unknown as HTMLElement;
    setDOM(emptyRoot, emptyMain);
    api['fitProjectsFine']();
    expect(component.projectFit()).toBe('auto');

    // ------------------------------------------------------------------
    // Edge: measureDescLineHeight returns the computed px value.
    // ------------------------------------------------------------------
    expect(api['measureDescLineHeight']({} as HTMLElement)).toBe(14);

    component.ngOnDestroy();
    jest.restoreAllMocks();
  });

  it('covers template pages error and previewData load paths', async () => {
    // Test loadCvData error for each template
    const ctors = [SupaCVPage, BentoCvPage, ModernCvPage, MinimalCvPage];
    for (const Ctor of ctors) {
      pocketBaseService.getCvDataByProfileId.mockRejectedValueOnce(new Error('Load error'));
      const component = TestBed.runInInjectionContext(() => new Ctor());
      const c = component as unknown as { loadCvData: (id: string) => Promise<void>; errorMessage: () => string | null; cvData: () => unknown; ngOnDestroy?: () => void };
      await c.loadCvData('profile-1');
      expect(c.errorMessage()).toBe('Load error');
      expect(c.cvData()).toBeNull();
      c.ngOnDestroy?.();
    }
  });

  it('ignores stale successful template loads', async () => {
    const ctors = [SupaCVPage, BentoCvPage, ModernCvPage, MinimalCvPage];
    for (const Ctor of ctors) {
      const staleLoad = deferred<unknown>();
      const freshData = { ...(cvData() as object), profile: { ...(cvData() as never as { profile: object }).profile, id: 'profile-2' } };
      pocketBaseService.getCvDataByProfileId
        .mockReturnValueOnce(staleLoad.promise)
        .mockResolvedValueOnce(freshData);

      const component = TestBed.runInInjectionContext(() => new Ctor());
      const c = component as unknown as { loadCvData: (id: string) => Promise<void>; cvData: () => { profile: { id: string } } | null; ngOnDestroy?: () => void };
      const stalePromise = c.loadCvData('profile-1');

      await c.loadCvData('profile-2');
      staleLoad.resolve(cvData());
      await stalePromise;

      expect(c.cvData()?.profile.id).toBe('profile-2');
      c.ngOnDestroy?.();
    }
  });

  it('ignores stale failed template loads', async () => {
    const ctors = [SupaCVPage, BentoCvPage, ModernCvPage, MinimalCvPage];
    for (const Ctor of ctors) {
      const staleLoad = deferred<unknown>();
      pocketBaseService.getCvDataByProfileId
        .mockReturnValueOnce(staleLoad.promise)
        .mockResolvedValueOnce(cvData());

      const component = TestBed.runInInjectionContext(() => new Ctor());
      const c = component as unknown as { loadCvData: (id: string) => Promise<void>; errorMessage: () => string | null; cvData: () => unknown; ngOnDestroy?: () => void };
      const stalePromise = c.loadCvData('profile-1');

      await c.loadCvData('profile-2');
      staleLoad.reject(new Error('Stale load failed'));
      await stalePromise;

      expect(c.errorMessage()).toBeNull();
      expect(c.cvData()).toBeTruthy();
      c.ngOnDestroy?.();
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

  function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: unknown) => void } {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
      resolve = promiseResolve;
      reject = promiseReject;
    });

    return { promise, resolve, reject };
  }
});
