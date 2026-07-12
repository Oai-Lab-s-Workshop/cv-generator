import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PocketBaseService } from '../../../core/services/pocketbase.service';

import { ClassicCvPage } from './classic-cv-page';

describe('ClassicCvPage', () => {
  let component: ClassicCvPage;
  let fixture: ComponentFixture<ClassicCvPage>;
  let pocketBaseService: { toDate: jest.Mock; getCvDataByProfileId: jest.Mock };

  beforeEach(async () => {
    jest.restoreAllMocks();
    pocketBaseService = {
      toDate: jest.fn((value?: string | null) => {
        if (!value) return undefined;
        const isoValue = value.replace(' ', 'T');
        const date = new Date(isoValue);
        return Number.isNaN(date.getTime()) ? undefined : date;
      }),
      getCvDataByProfileId: jest.fn().mockResolvedValue({}),
    };

    await TestBed.configureTestingModule({
      imports: [ClassicCvPage],
      providers: [
        { provide: PocketBaseService, useValue: pocketBaseService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassicCvPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- groupJobsByCompany ---
  it('groups jobs by company', () => {
    const jobs = [
      { id: '1', company: 'ACME', label: 'Dev', position: 'Dev', startDate: '2020-01-01', type: 'work project' },
      { id: '2', company: 'ACME', label: 'Lead', position: 'Lead', startDate: '2021-01-01', type: 'work project' },
      { id: '3', company: 'Globex', label: 'Architect', position: 'Architect', startDate: '2022-01-01', type: 'work project' },
    ] as never[];
    const groups = component['groupJobsByCompany'](jobs);
    expect(groups.length).toBe(2);
    expect(groups[0].jobs.length).toBe(2);
    expect(groups[1].jobs.length).toBe(1);
  });

  it('returns empty for null/undefined/empty jobs', () => {
    expect(component['groupJobsByCompany'](null as never)).toEqual([]);
    expect(component['groupJobsByCompany'](undefined as never)).toEqual([]);
    expect(component['groupJobsByCompany']([])).toEqual([]);
  });

  it('handles company with whitespace', () => {
    const jobs = [
      { id: '1', company: '  ', label: 'Dev', position: 'Dev', startDate: '2020-01-01', type: 'work project' },
    ] as never[];
    const groups = component['groupJobsByCompany'](jobs);
    expect(groups.length).toBe(1);
    expect(groups[0].company).toBe('Unknown company');
  });

  // --- getDuration ---
  it('returns duration for multi-year span', () => {
    pocketBaseService.toDate = jest.fn((v?: string | null) => v ? new Date(v + 'T00:00:00') : undefined);
    const result = component['getDuration']('2020-01-01', '2022-06-01');
    expect(result).toContain('yr');
    expect(result).toContain('mo');
  });

  it('returns duration for single month', () => {
    pocketBaseService.toDate = jest.fn((v?: string | null) => v ? new Date(v + 'T00:00:00') : undefined);
    const result = component['getDuration']('2022-01-01', '2022-01-15');
    expect(result).toBe('Less than 1 month');
  });

  it('returns empty for invalid start date', () => {
    pocketBaseService.toDate = jest.fn(() => undefined);
    expect(component['getDuration'](null)).toBe('');
  });

  it('returns empty for end date before start', () => {
    pocketBaseService.toDate = jest.fn((v?: string | null) => v ? new Date(v + 'T00:00:00') : undefined);
    expect(component['getDuration']('2022-01-01', '2020-01-01')).toBe('');
  });

  it('returns empty for NaN end date', () => {
    pocketBaseService.toDate = jest.fn((v?: string | null) => {
      if (!v) return undefined;
      return new Date('invalid');
    });
    expect(component['getDuration']('2020-01-01', 'invalid')).toBe('');
  });

  it('returns 1 year exactly', () => {
    pocketBaseService.toDate = jest.fn((v?: string | null) => v ? new Date(v + 'T00:00:00') : undefined);
    expect(component['getDuration']('2020-01-01', '2021-01-01')).toBe('1 yr');
  });

  // --- getDate ---
  it('returns formatted date', () => {
    pocketBaseService.toDate = jest.fn(() => new Date('2024-01-15'));
    const result = component['getDate']('2024-01-15');
    expect(result).toContain('2024');
    expect(result).toContain('Jan');
  });

  it('returns empty for null date', () => {
    pocketBaseService.toDate = jest.fn(() => undefined);
    expect(component['getDate'](null)).toBe('');
  });

  it('returns empty for NaN date', () => {
    pocketBaseService.toDate = jest.fn(() => new Date('invalid'));
    expect(component['getDate']('invalid')).toBe('');
  });

  // --- loadCvData (private, called via effect) ---
  it('loads CV data on init with cvProfileId', async () => {
    pocketBaseService.getCvDataByProfileId.mockResolvedValue({
      profile: { id: 'profile-1' },
      jobs: [],
      projects: [],
      skills: [],
      degrees: [],
      achievements: [],
      hobbies: [],
    });

    fixture = TestBed.createComponent(ClassicCvPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cvProfileId', 'profile-1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.cvData()?.profile?.id).toBe('profile-1');
    expect(component.isLoading()).toBe(false);
  });

  it('sets cvData to previewData when provided', async () => {
    const previewData = { profile: { id: 'preview' }, jobs: [], projects: [], skills: [], degrees: [], achievements: [], hobbies: [] } as never;
    fixture = TestBed.createComponent(ClassicCvPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('previewData', previewData);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.cvData()?.profile?.id).toBe('preview');
    expect(component.isLoading()).toBe(false);
  });

  it('sets cvData to null when cvProfileId is null', async () => {
    fixture = TestBed.createComponent(ClassicCvPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cvProfileId', null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.cvData()).toBeNull();
  });

  it('handles loadCvData error', async () => {
    pocketBaseService.getCvDataByProfileId.mockRejectedValue(new Error('API error'));

    fixture = TestBed.createComponent(ClassicCvPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cvProfileId', 'profile-1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('API error');
    expect(component.cvData()).toBeNull();
  });

  it('ignores stale cvProfileId requests', async () => {
    let resolveFirst!: (v: unknown) => void;
    let callCount = 0;
    pocketBaseService.getCvDataByProfileId.mockImplementation(() => {
      callCount++;
      return new Promise((r) => {
        if (callCount === 1) {
          resolveFirst = r;
        }
      });
    });

    // Create fresh component (no cvProfileId set yet)
    fixture = TestBed.createComponent(ClassicCvPage);
    component = fixture.componentInstance;

    // Set cvProfileId which triggers effect, which calls loadCvData (requestId=1, pending)
    fixture.componentRef.setInput('cvProfileId', 'profile-1');
    fixture.detectChanges();

    // Change to profile-2, triggers effect again, calls loadCvData (requestId=2, pending)
    fixture.componentRef.setInput('cvProfileId', 'profile-2');
    fixture.detectChanges();

    // Resolve the FIRST pending request (profile-1)
    resolveFirst!({ profile: { id: 'stale' } });
    await fixture.whenStable();

    // Stale data should have been discarded
    expect(component.cvData()).toBeNull();
  });
});
